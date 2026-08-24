from typing import Literal

from pydantic import BaseModel, Field

Granularity = Literal["day", "week", "month", "quarter"]
ModelName = Literal["xgboost", "random_forest"]


class ForecastRequest(BaseModel):
    productId: str
    productName: str
    category: str
    unitPrice: float
    avgDailyUsage: float = Field(..., gt=0)
    granularity: Granularity = "day"
    horizon: int = Field(7, gt=0, le=52)
    # Trailing daily units-sold for this exact product, chronological, most-recent-last, real
    # zeros allowed for no-sales days. Computed client-side from real bill history — see
    # frontend/src/features/reports/lib/computeSalesHistory.ts. None (or too short) means this
    # product doesn't have enough real history yet, and the forecast honestly falls back to a
    # category-level estimate (see ForecastResponse.isSynthetic).
    recentSalesHistory: list[float] | None = None


class ForecastPoint(BaseModel):
    periodLabel: str
    periodStart: str
    predictedUnits: float
    lowerBound: float
    upperBound: float


class ForecastResponse(BaseModel):
    productId: str
    category: str
    granularity: Granularity
    horizon: int
    points: list[ForecastPoint]
    modelUsed: ModelName
    validationMae: float
    confidence: float
    generatedAt: str
    isSynthetic: bool = True


class ForecastStatusResponse(BaseModel):
    ready: bool
    categories: dict[str, bool]
    trainedAt: str | None
