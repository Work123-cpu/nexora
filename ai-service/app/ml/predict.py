"""Recursive multi-step rollout + granularity aggregation for a single trained category model.

Kept separate from services/forecast_service.py so the ml/ package stays the "pure modeling SDK"
layer (mirrors how services/groq_client.py is the only file that imports the groq SDK) while
services/forecast_service.py stays the request-orchestration layer.
"""

import math
from datetime import date, timedelta

import pandas as pd

from app.ml.data_generator import generate_category_history
from app.ml.features import FEATURE_COLUMNS, MIN_HISTORY_WINDOW, build_inference_row
from app.ml.train import TrainedCategoryModel

DAYS_PER_PERIOD = {"day": 1, "week": 7, "month": 30, "quarter": 91}


def _seed_buffer(category: str) -> list[float]:
    """Trailing recent-sales window used to seed lag/rolling features for the rollout.

    Sourced from the tail of the same deterministic synthetic history the model trained on —
    conceptually "the most recent known sales figures," which is all lag/rolling features need;
    their exact calendar alignment doesn't matter, only recency and ordering.
    """
    history = generate_category_history(category)
    return history["units_sold"].tail(MIN_HISTORY_WINDOW).tolist()


def rollout_daily(
    trained: TrainedCategoryModel,
    category: str,
    num_days: int,
    start_date: date,
    real_history: list[float] | None = None,
) -> list[tuple[date, float]]:
    """Predicts `num_days` consecutive real calendar days starting at `start_date`.

    When `real_history` has at least MIN_HISTORY_WINDOW trailing daily sales figures for the
    actual product being forecast, it seeds the lag/rolling-mean features instead of the
    synthetic category buffer — the rollout still runs through the same trained tree ensemble
    (so the model's learned seasonality/trend shape is unchanged), but the recent-momentum
    features it starts from reflect this specific product's real recent sales rather than a
    generic category pattern. Too little real history (a genuinely new product) falls back to
    the synthetic buffer rather than seeding from a short, misleadingly-precise real window.

    Note: since the model was trained on a fixed synthetic window (see ml/constants.py
    EPOCH_DATE/HISTORY_DAYS), a `start_date` far in the future produces a `trend_index` feature
    outside anything the tree ensemble saw during training. Tree-based regressors don't
    extrapolate trends past their training range (they clamp to the nearest leaf) — day-of-week /
    month / festive seasonality still apply normally, but long-run growth flattens out beyond the
    training horizon. That's an honest, expected limitation of tree models for time series, not a
    bug — the confidence/MAE figures returned alongside these predictions reflect that.
    """
    if real_history is not None and len(real_history) >= MIN_HISTORY_WINDOW:
        buffer = list(real_history[-MIN_HISTORY_WINDOW:])
    else:
        buffer = list(_seed_buffer(category))
    results: list[tuple[date, float]] = []

    for i in range(num_days):
        target_date = start_date + timedelta(days=i)
        row = build_inference_row(target_date, buffer)
        X = pd.DataFrame([row])[FEATURE_COLUMNS]
        pred = max(0.0, float(trained.model.predict(X)[0]))
        results.append((target_date, pred))
        buffer.append(pred)

    return results


def aggregate(daily: list[tuple[date, float]], granularity: str, horizon: int, validation_mae: float) -> list[dict]:
    """Groups consecutive daily predictions into the requested granularity and attaches an
    uncertainty band derived from the model's validation MAE, scaled by sqrt(period length) — a
    standard approximation for aggregated i.i.d.-ish daily error (errors partially cancel when
    summed, rather than growing linearly).
    """
    period_days = DAYS_PER_PERIOD[granularity]
    points = []

    for period_idx in range(horizon):
        chunk = daily[period_idx * period_days : (period_idx + 1) * period_days]
        if not chunk:
            break
        period_start = chunk[0][0]
        total_units = round(sum(v for _, v in chunk), 1)
        band = validation_mae * math.sqrt(len(chunk))

        points.append(
            {
                "periodLabel": _label(period_start, granularity),
                "periodStart": period_start.isoformat(),
                "predictedUnits": total_units,
                "lowerBound": round(max(0.0, total_units - band), 1),
                "upperBound": round(total_units + band, 1),
            }
        )

    return points


def _format_day(d: date) -> str:
    # %-d (no leading zero) is a glibc/BSD strftime extension not supported by Windows' C
    # runtime — build the "Mon D, YYYY" label manually so this works cross-platform.
    return f"{d.strftime('%b')} {d.day}, {d.year}"


def _label(period_start: date, granularity: str) -> str:
    if granularity == "day":
        return _format_day(period_start)
    if granularity == "week":
        return f"Week of {_format_day(period_start)}"
    if granularity == "month":
        return period_start.strftime("%b %Y")
    if granularity == "quarter":
        q = (period_start.month - 1) // 3 + 1
        return f"Q{q} {period_start.year}"
    return period_start.isoformat()
