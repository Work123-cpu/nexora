from datetime import date

import pandas as pd

from app.ml.constants import EPOCH_DATE

FEATURE_COLUMNS = [
    "day_of_week",
    "is_weekend",
    "day_of_month",
    "month",
    "quarter",
    "day_of_year",
    "week_of_year",
    "is_festive_month",
    "trend_index",
    "lag_7",
    "rolling_mean_7",
    "rolling_mean_28",
]

# Real-history gate for unlocking a per-product forecast (vs. the synthetic category fallback).
# Lowered from 28 for local testing so a forecast is reachable after ~10 days of bills instead of
# ~4 weeks. Below 28 real days, rolling_mean_28 (see build_inference_row) is computed over fewer
# days than the trained model saw during training — an accepted accuracy tradeoff for faster
# testing, not something to ship at this value.
MIN_HISTORY_WINDOW = 10


def _date_features(d: date) -> dict:
    return {
        "day_of_week": d.weekday(),
        "is_weekend": 1 if d.weekday() >= 5 else 0,
        "day_of_month": d.day,
        "month": d.month,
        "quarter": (d.month - 1) // 3 + 1,
        "day_of_year": d.timetuple().tm_yday,
        "week_of_year": d.isocalendar()[1],
        "is_festive_month": 1 if d.month in (10, 11) else 0,
        "trend_index": (d - EPOCH_DATE).days,
    }


def build_training_frame(history: pd.DataFrame) -> pd.DataFrame:
    """Adds date + lag/rolling features to a [date, units_sold] history frame.

    Drops the leading rows that don't have a full lag/rolling window yet (fine — with
    HISTORY_DAYS=730 losing the first 28 costs nothing meaningful).
    """
    df = history.copy()
    date_feats = df["date"].apply(_date_features).apply(pd.Series)
    df = pd.concat([df, date_feats], axis=1)

    df["lag_7"] = df["units_sold"].shift(7)
    df["rolling_mean_7"] = df["units_sold"].shift(1).rolling(7).mean()
    df["rolling_mean_28"] = df["units_sold"].shift(1).rolling(28).mean()

    return df.dropna().reset_index(drop=True)


def build_inference_row(target_date: date, recent_units: list[float]) -> dict:
    """Feature dict for one prediction step.

    `recent_units` must be the trailing MIN_HISTORY_WINDOW+ days of actual-or-previously-predicted
    units_sold, ending the day before `target_date` (most recent last).
    """
    feats = _date_features(target_date)
    tail = recent_units[-28:]
    feats["lag_7"] = recent_units[-7] if len(recent_units) >= 7 else tail[-1]
    feats["rolling_mean_7"] = sum(tail[-7:]) / min(7, len(tail))
    feats["rolling_mean_28"] = sum(tail) / len(tail)
    return feats
