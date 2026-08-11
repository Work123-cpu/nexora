from datetime import date, timedelta, timezone
from datetime import datetime as dt

from app.core.errors import ForecastModelUnavailableError
from app.ml import model_store
from app.ml.constants import CATEGORIES
from app.ml.predict import DAYS_PER_PERIOD, aggregate, rollout_daily
from app.schemas.forecast import ForecastRequest, ForecastResponse


def _resolve_category(category: str) -> str:
    return category if category in CATEGORIES else "General"


class ForecastService:
    def predict(self, req: ForecastRequest) -> ForecastResponse:
        category = _resolve_category(req.category)
        trained = model_store.get_model(category)
        if trained is None:
            raise ForecastModelUnavailableError(
                f"Forecast model for category '{category}' is still warming up or failed to train."
            )

        num_days = req.horizon * DAYS_PER_PERIOD[req.granularity]
        start_date = date.today() + timedelta(days=1)

        daily = rollout_daily(trained, category, num_days, start_date)

        # Product-level scaling: the category model predicts at its own reference baseline volume;
        # scale by how this specific product's real avg daily usage compares to that baseline so
        # one category model serves every product in it at the right absolute level.
        scale_factor = req.avgDailyUsage / trained.category_reference_baseline
        scaled_daily = [(d, v * scale_factor) for d, v in daily]

        scaled_mae = trained.xgboost_mae if trained.chosen_model == "xgboost" else trained.random_forest_mae
        scaled_mae *= scale_factor

        points = aggregate(scaled_daily, req.granularity, req.horizon, scaled_mae)

        confidence = max(0.0, min(1.0, 1 - (scaled_mae / max(trained.category_reference_baseline * scale_factor, 1e-6))))

        return ForecastResponse(
            productId=req.productId,
            category=category,
            granularity=req.granularity,
            horizon=req.horizon,
            points=[p for p in points],
            modelUsed=trained.chosen_model,
            validationMae=round(scaled_mae, 3),
            confidence=round(confidence, 3),
            generatedAt=dt.now(timezone.utc).isoformat(),
            isSynthetic=True,
        )


_forecast_service_singleton: ForecastService | None = None


def get_forecast_service() -> ForecastService:
    global _forecast_service_singleton
    if _forecast_service_singleton is None:
        _forecast_service_singleton = ForecastService()
    return _forecast_service_singleton
