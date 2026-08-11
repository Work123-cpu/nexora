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
