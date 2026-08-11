from fastapi import APIRouter, Depends

from app.ml import model_store
from app.schemas.forecast import ForecastRequest, ForecastResponse, ForecastStatusResponse
from app.services.forecast_service import ForecastService, get_forecast_service

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.post("/predict", response_model=ForecastResponse)
async def predict(req: ForecastRequest, svc: ForecastService = Depends(get_forecast_service)) -> ForecastResponse:
    return svc.predict(req)


@router.get("/status", response_model=ForecastStatusResponse)
async def status() -> ForecastStatusResponse:
    return ForecastStatusResponse(
        ready=model_store.all_ready(),
        categories=model_store.readiness_by_category(),
        trainedAt=model_store.latest_trained_at(),
    )
