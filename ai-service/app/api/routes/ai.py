import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from app.core.logging import logger
from app.schemas.ai import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    ExplainRequest,
    ExplainResponse,
    HelpRequest,
    HelpResponse,
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
