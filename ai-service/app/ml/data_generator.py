import zlib
from datetime import timedelta

import numpy as np
import pandas as pd

from app.ml.constants import (
    CATEGORY_BASELINE_UNITS,
    CATEGORY_GROWTH_RATE,
    EPOCH_DATE,
    HISTORY_DAYS,
)


def _category_seed(category: str) -> int:
    """Deterministic per-category seed — same category name always reproduces the same series."""
    return zlib.crc32(category.encode("utf-8")) & 0xFFFFFFFF


def generate_category_history(category: str) -> pd.DataFrame:
    """Synthetic daily sales history for one category, purely for model training.

    Never persisted to disk — cheap and fully deterministic to regenerate, so only the trained
    model artifact needs to survive a restart. Composition: baseline x trend x weekly seasonality
    x festive-season bump + Gaussian noise, floored at 0.
    """
    rng = np.random.default_rng(_category_seed(category))
    baseline = CATEGORY_BASELINE_UNITS.get(category, CATEGORY_BASELINE_UNITS["General"])
    growth_rate = CATEGORY_GROWTH_RATE.get(category, CATEGORY_GROWTH_RATE["General"])

    # Weekly seasonality: a 7-length multiplier vector (Mon..Sun via Python's date.weekday()),
    # drawn once per category so e.g. Beverages/Snacks skew toward weekend spikes while Bakery
    # stays flatter, without hardcoding which category gets which shape.
    weekly_factors = rng.uniform(0.85, 1.25, size=7)
    weekly_factors = weekly_factors / weekly_factors.mean()  # normalize so the week averages to 1x

    festive_magnitude = rng.uniform(1.25, 1.6)

    dates = [EPOCH_DATE + timedelta(days=i) for i in range(HISTORY_DAYS)]
    rows = []
    for i, d in enumerate(dates):
        trend_factor = 1.0 + growth_rate * (i / 365.0)
        weekly_factor = weekly_factors[d.weekday()]
        festive_factor = festive_magnitude if d.month in (10, 11) else (1.15 if d.month == 12 else 1.0)
        noise = rng.normal(0, baseline * 0.08)

        units = baseline * trend_factor * weekly_factor * festive_factor + noise
        rows.append({"date": d, "units_sold": max(0.0, round(units, 1))})

    return pd.DataFrame(rows)
