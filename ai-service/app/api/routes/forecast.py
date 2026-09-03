from fastapi import APIRouter, Depends

from app.schemas.forecast import ForecastRequest, ForecastResponse
from app.services.forecast_service import ForecastService, get_forecast_service

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.post("/predict", response_model=ForecastResponse)
async def predict(req: ForecastRequest, svc: ForecastService = Depends(get_forecast_service)) -> ForecastResponse:
    return svc.predict(req)
