import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import ValidationError

from app.core.errors import AIProviderUnavailableError
from app.core.logging import logger
from app.schemas.ai import (
    BomSuggestLine,
    BomSuggestRequest,
    BomSuggestResponse,
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    HelpRequest,
    HelpResponse,
    MaterialClassifyRequest,
    MaterialClassifyResponse,
    PriceIndicatorRequest,
    PriceIndicatorResponse,
    SummarizeRequest,
    SummarizeResponse,
)
from app.services.groq_client import GroqClientWrapper, get_groq_client

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _to_groq_messages(messages: list[ChatMessage]) -> list[dict[str, str]]:
    return [{"role": m.role, "content": m.content} for m in messages]


HELP_TOPICS = {
    "command-center": "The Command Center is the home page — it surfaces business health, priorities, alerts, and AI recommendations in one screen.",
    "inventory": "Inventory tracks stock across warehouses. Safety stock is your buffer against demand spikes; the reorder point is the level that should trigger a new purchase order.",
    "procurement": "Procurement recommendations compare inventory, demand, and supplier lead time — a purchase is suggested only when waiting risks a stockout.",
    "general": "I can help explain any screen in Nexora — ask about inventory, procurement, BOM, suppliers, or reports.",
}


@router.post("/chat", response_model=None)
async def chat(req: ChatRequest, client: GroqClientWrapper = Depends(get_groq_client)):
    """Returns a ChatResponse, or a text/event-stream of raw text chunks when req.stream is true."""
    groq_messages = _to_groq_messages(req.messages)

    if req.stream:
        async def event_stream():
            async for chunk in client.stream(groq_messages):
                yield chunk

        return StreamingResponse(event_stream(), media_type="text/plain")

    content = await client.complete(groq_messages)
    logger.info("Chat completion served (%d input messages)", len(req.messages))

    return ChatResponse(
        message=ChatMessage(id=str(uuid.uuid4()), role="assistant", content=content, createdAt=_now_iso()),
        suggestedFollowUps=[
            "What should I reorder this week?",
            "Which supplier has the best lead time?",
            "Explain my business health score",
        ],
    )


@router.post("/explain", response_model=ExplainResponse)
async def explain(req: ExplainRequest, client: GroqClientWrapper = Depends(get_groq_client)) -> ExplainResponse:
    prompt = (
        f"Explain the following in plain English for a business user, referencing the data provided.\n\n"
        f"Subject: {req.subject}\nData: {req.data}"
    )
    content = await client.complete([{"role": "user", "content": prompt}])
    return ExplainResponse(explanation=content)


@router.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest, client: GroqClientWrapper = Depends(get_groq_client)) -> SummarizeResponse:
    prompt = (
        f"Write a short, plain-English narrative summary (2-3 sentences) of the following business data. "
        f"Call out what needs attention first.\n\nSubject: {req.subject}\nData: {req.data}"
    )
    content = await client.complete([{"role": "user", "content": prompt}])
    return SummarizeResponse(summary=content)


@router.post("/help", response_model=HelpResponse)
async def help_endpoint(req: HelpRequest, client: GroqClientWrapper = Depends(get_groq_client)) -> HelpResponse:
    context = HELP_TOPICS.get(req.section.lower(), HELP_TOPICS["general"])
    question_part = f"\n\nUser question: {req.question}" if req.question else ""
    prompt = f"Context about this screen: {context}{question_part}\n\nAnswer helpfully and concisely."
    content = await client.complete([{"role": "user", "content": prompt}])
    return HelpResponse(
        answer=content,
        relatedArticles=["Getting Started with Nexora", "Understanding Reorder Points", "How AI Recommendations Work"],
    )


def _build_bom_suggest_prompt(req: BomSuggestRequest) -> str:
    catalog_lines = "\n".join(f"- id={m.id} | name={m.name} | category={m.category} | unit={m.unit}" for m in req.availableRawMaterials)
    examples_part = ""
    if req.fewShotExamples:
        example_blocks = []
        for ex in req.fewShotExamples[:3]:
            lines = "\n".join(f"  - {m.rawMaterialId}: {m.quantityPerUnit} {m.unit} (scrap {m.scrapPct}%)" for m in ex.materials)
            example_blocks.append(f'"{ex.productName}":\n{lines}')
        examples_part = "\n\nExisting BOMs for similar products, as a reference for realistic quantities:\n" + "\n\n".join(example_blocks)

    return (
        f"Suggest a bill of materials (recipe) for manufacturing one unit of this product:\n"
        f'Product: "{req.productName}"\n'
        f"Category: {req.productCategory or 'unknown'}\n"
        f"Description: {req.productDescription or 'none'}\n"
        f"Unit of measure: {req.unitOfMeasure or 'unit'}\n\n"
        f"Choose ONLY from this raw material catalog — do not invent materials or ids not listed here:\n"
        f"{catalog_lines}"
        f"{examples_part}\n\n"
        f"Respond with ONLY a JSON object, no prose, no markdown code fences, matching exactly this shape:\n"
        f'{{"materials": [{{"rawMaterialId": "<id from the catalog above>", "quantityPerUnit": <number>, "scrapPct": <number>}}], '
        f'"notes": "<optional short note>"}}\n'
        f"Pick 2-8 materials that plausibly belong in this recipe. quantityPerUnit must be a realistic positive amount "
        f"per single unit of the product, in the material's own unit. scrapPct is typical production waste, 0-50."
    )


@router.post("/bom-suggest", response_model=BomSuggestResponse)
async def bom_suggest(req: BomSuggestRequest, client: GroqClientWrapper = Depends(get_groq_client)) -> BomSuggestResponse:
    prompt = _build_bom_suggest_prompt(req)
    content = await client.complete([{"role": "user", "content": prompt}], temperature=0.2)

    try:
        raw = json.loads(content)
        raw_materials = raw["materials"]
    except (json.JSONDecodeError, KeyError, TypeError) as exc:
        logger.warning("bom-suggest: model returned unparseable content: %s", content[:500])
        raise AIProviderUnavailableError("The AI returned an unreadable response. Please try again.") from exc

    valid_ids = {m.id for m in req.availableRawMaterials}
    materials: list[BomSuggestLine] = []
    dropped = 0
    for line in raw_materials:
        try:
            raw_material_id = line["rawMaterialId"]
            quantity_per_unit = float(line["quantityPerUnit"])
            scrap_pct = float(line.get("scrapPct", 0))
        except (KeyError, TypeError, ValueError):
            dropped += 1
            continue
        if raw_material_id not in valid_ids or quantity_per_unit <= 0:
            dropped += 1
            continue
        scrap_pct = max(0.0, min(50.0, scrap_pct))
        materials.append(BomSuggestLine(rawMaterialId=raw_material_id, quantityPerUnit=quantity_per_unit, scrapPct=scrap_pct))

    if dropped:
        logger.warning("bom-suggest: dropped %d invalid/hallucinated suggestion(s) for product %s", dropped, req.productName)

    notes = raw.get("notes") if isinstance(raw, dict) else None
    return BomSuggestResponse(materials=materials, notes=notes)


def _build_material_classify_prompt(req: MaterialClassifyRequest) -> str:
    return (
        f"Classify this raw material used in manufacturing/procurement into exactly one category, "
        f"and name the closest underlying commodity it's derived from or tracked against, if any.\n\n"
        f'Material: "{req.materialName}"\n'
        f"User-entered category (hint, may be generic or wrong): {req.materialCategory or 'none'}\n"
        f"Unit: {req.unit or 'unknown'}\n\n"
        f"Categories (choose exactly one):\n"
        f"- agricultural: crops, grains, produce, spices, agri-derived raw foods\n"
        f"- metal: base/precious metals and simple metal alloys\n"
        f"- mineral: mined minerals, ores, non-metal geological materials\n"
        f"- chemical: industrial/laboratory chemical compounds\n"
        f"- industrial: manufactured industrial inputs not better described by the above\n"
        f"- specialty: specialty/fine chemicals, niche formulated materials\n\n"
        f"Respond with ONLY a JSON object, no prose, no markdown code fences, matching exactly this shape:\n"
        f'{{"category": "<one of the categories above>", "referenceCommodity": "<name of a simpler '
        f'underlying commodity this is derived from or priced against, or null if none>"}}\n\n'
        f'Examples: "Bismuth Oxide" -> category=chemical, referenceCommodity="Bismuth". '
        f'"Wheat Flour" -> category=agricultural, referenceCommodity="Wheat". '
        f'"Copper Wire" -> category=metal, referenceCommodity="Copper".'
    )


@router.post("/material-classify", response_model=MaterialClassifyResponse)
async def material_classify(req: MaterialClassifyRequest, client: GroqClientWrapper = Depends(get_groq_client)) -> MaterialClassifyResponse:
    prompt = _build_material_classify_prompt(req)
    content = await client.complete([{"role": "user", "content": prompt}], temperature=0.2)

    try:
        raw = json.loads(content)
        return MaterialClassifyResponse(**raw)
    except (json.JSONDecodeError, KeyError, TypeError, ValidationError) as exc:
        logger.warning("material-classify: model returned unparseable/invalid content: %s", content[:500])
        raise AIProviderUnavailableError("The AI returned an unreadable response. Please try again.") from exc


def _build_price_indicator_prompt(req: PriceIndicatorRequest) -> str:
    return (
        f"You are estimating today's likely price direction for a raw material that has NO "
        f"standardized daily price feed available. Do not invent a specific price or number — only "
        f"reason about the probable trend direction from general knowledge of the underlying "
        f"commodity and typical market conditions.\n\n"
        f'Material: "{req.materialName}"\n'
        f"Category: {req.category}\n"
        f"Underlying reference commodity: {req.referenceCommodity or 'none known'}\n\n"
        f"Respond with ONLY a JSON object, no prose, no markdown code fences, matching exactly this shape:\n"
        f'{{"trend": "rising"|"stable"|"falling", "confidence": "low"|"medium", "reasoning": "<one short sentence>"}}\n\n'
        f'Never respond with "high" confidence — this is an estimate, not a real price feed. Default to '
        f'"stable"/"low" if you are not reasonably sure of a direction.'
    )


@router.post("/price-indicator", response_model=PriceIndicatorResponse)
async def price_indicator(req: PriceIndicatorRequest, client: GroqClientWrapper = Depends(get_groq_client)) -> PriceIndicatorResponse:
    prompt = _build_price_indicator_prompt(req)
    content = await client.complete([{"role": "user", "content": prompt}], temperature=0.2)

    try:
        raw = json.loads(content)
        # Defense-in-depth clamp even though the Literal type already excludes "high" — a wrong
        # confidence label is low-stakes, so clamp-and-continue beats failing the whole request.
        if isinstance(raw, dict) and raw.get("confidence") == "high":
            raw["confidence"] = "medium"
        return PriceIndicatorResponse(**raw)
    except (json.JSONDecodeError, KeyError, TypeError, ValidationError) as exc:
        logger.warning("price-indicator: model returned unparseable/invalid content: %s", content[:500])
        raise AIProviderUnavailableError("The AI returned an unreadable response. Please try again.") from exc
