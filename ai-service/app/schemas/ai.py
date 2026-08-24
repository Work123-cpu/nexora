from typing import Literal

from pydantic import BaseModel, Field

ChatRole = Literal["user", "assistant", "system"]


class ChatMessage(BaseModel):
    id: str
    role: ChatRole
    content: str
    createdAt: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    context: dict | None = None
    stream: bool = False


class ChatResponse(BaseModel):
    message: ChatMessage
    suggestedFollowUps: list[str] | None = None


class ExplainRequest(BaseModel):
    subject: str
    data: dict = Field(default_factory=dict)


class ExplainResponse(BaseModel):
    explanation: str


class SummarizeRequest(BaseModel):
    subject: str
    data: dict = Field(default_factory=dict)


class SummarizeResponse(BaseModel):
    summary: str


class HelpRequest(BaseModel):
    section: str
    question: str | None = None


class HelpResponse(BaseModel):
    answer: str
    relatedArticles: list[str] | None = None


class BomSuggestRawMaterial(BaseModel):
    id: str
    name: str
    category: str
    unit: str


class BomSuggestExampleLine(BaseModel):
    rawMaterialId: str
    quantityPerUnit: float
    unit: str
    scrapPct: float


class BomSuggestExample(BaseModel):
    productName: str
    materials: list[BomSuggestExampleLine]


class BomSuggestRequest(BaseModel):
    productName: str
    productCategory: str | None = None
    productDescription: str | None = None
    unitOfMeasure: str | None = None
    availableRawMaterials: list[BomSuggestRawMaterial] = Field(..., min_length=1)
    fewShotExamples: list[BomSuggestExample] = Field(default_factory=list)


class BomSuggestLine(BaseModel):
    rawMaterialId: str
    quantityPerUnit: float
    scrapPct: float


class BomSuggestResponse(BaseModel):
    materials: list[BomSuggestLine]
    notes: str | None = None


MaterialCategory = Literal["agricultural", "metal", "mineral", "chemical", "industrial", "specialty"]
PriceTrend = Literal["rising", "stable", "falling"]
# "high" is deliberately excluded — an LLM-only estimate (no real price feed) must never be
# labeled high confidence; Pydantic rejects it at construction, not just by prompt instruction.
IndicatorConfidence = Literal["low", "medium"]


class MaterialClassifyRequest(BaseModel):
    materialName: str
    materialCategory: str | None = None  # the user-typed RawMaterial.category — a hint only
    unit: str | None = None


class MaterialClassifyResponse(BaseModel):
    category: MaterialCategory
    referenceCommodity: str | None = None


class PriceIndicatorRequest(BaseModel):
    materialName: str
    category: MaterialCategory
    referenceCommodity: str | None = None


class PriceIndicatorResponse(BaseModel):
    trend: PriceTrend
    confidence: IndicatorConfidence
    reasoning: str
