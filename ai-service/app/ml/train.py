from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from xgboost import XGBRegressor

from app.core.logging import logger
from app.ml.constants import CATEGORY_BASELINE_UNITS, VALIDATION_DAYS
from app.ml.data_generator import generate_category_history
from app.ml.features import FEATURE_COLUMNS, build_training_frame


@dataclass
class TrainedCategoryModel:
    category: str
    model: Any
    chosen_model: str  # "xgboost" | "random_forest"
    xgboost_mae: float
    random_forest_mae: float
    feature_columns: list[str]
    category_reference_baseline: float
    trained_at: str


def _fit_and_score(model, X_train, y_train, X_val, y_val) -> tuple[Any, float]:
    model.fit(X_train, y_train)
    preds = model.predict(X_val)
    mae = float(mean_absolute_error(y_val, preds))
    return model, mae


def train_category_model(category: str, seed: int = 42) -> TrainedCategoryModel:
    """Generates synthetic history, trains XGBoost + Random Forest on a time-based split,
    compares validation MAE, and returns the winner (both MAE figures kept for transparency).
    """
    history = generate_category_history(category)
    frame = build_training_frame(history)

    split_idx = len(frame) - VALIDATION_DAYS
    train_df, val_df = frame.iloc[:split_idx], frame.iloc[split_idx:]

    X_train, y_train = train_df[FEATURE_COLUMNS], train_df["units_sold"]
    X_val, y_val = val_df[FEATURE_COLUMNS], val_df["units_sold"]

    xgb = XGBRegressor(
        n_estimators=300, max_depth=5, learning_rate=0.05, subsample=0.8, colsample_bytree=0.8, random_state=seed
    )
    rf = RandomForestRegressor(n_estimators=300, max_depth=10, random_state=seed, n_jobs=-1)

    xgb_fitted, xgb_mae = _fit_and_score(xgb, X_train, y_train, X_val, y_val)
    rf_fitted, rf_mae = _fit_and_score(rf, X_train, y_train, X_val, y_val)

    if xgb_mae <= rf_mae:
        chosen_model, winner = "xgboost", xgb_fitted
    else:
        chosen_model, winner = "random_forest", rf_fitted

    logger.info(
        "Forecast model trained category=%s chosen=%s xgb_mae=%.2f rf_mae=%.2f",
        category,
        chosen_model,
        xgb_mae,
        rf_mae,
    )

    # Refit the winner on the FULL history (train+validation) so the deployed model benefits from
    # every available synthetic day, now that model selection is already decided on the held-out
    # split above.
    X_full, y_full = frame[FEATURE_COLUMNS], frame["units_sold"]
    winner.fit(X_full, y_full)

    return TrainedCategoryModel(
        category=category,
        model=winner,
        chosen_model=chosen_model,
        xgboost_mae=round(xgb_mae, 3),
        random_forest_mae=round(rf_mae, 3),
        feature_columns=FEATURE_COLUMNS,
        category_reference_baseline=CATEGORY_BASELINE_UNITS.get(category, CATEGORY_BASELINE_UNITS["General"]),
        trained_at=datetime.now(timezone.utc).isoformat(),
    )
