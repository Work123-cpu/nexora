from datetime import date
from pathlib import Path

# Fixed anchor — NEVER datetime.now(). Anchoring the synthetic training window to a constant date
# is what makes the generated series byte-identical across restarts without persisting the raw
# data itself: regenerating "tomorrow" produces the exact same rows because neither the RNG seed
# nor the date range ever moves.
EPOCH_DATE = date(2024, 1, 1)

HISTORY_DAYS = 730
VALIDATION_DAYS = 90

# "General" is a fallback bucket so any category string the frontend sends that isn't one of the
# five known product categories (e.g. a raw-material category, or a future product category)
# still resolves to a trained model instead of a hard failure.
CATEGORIES = ["Bakery", "Beverages", "Snacks", "Dairy", "Condiments", "General"]

# Reference daily unit-volume baseline per category, hand-authored to mirror the real economics in
# frontend/src/mocks/seed/products.seed.ts (Bakery/Snacks/Beverages = high volume, low unit price;
# Dairy/Condiments = lower volume, higher unit price). ai-service is an isolated Python process
# with no import access to the TS seed files, so this table is an independently-authored mirror,
# not a generated one — keep it roughly in sync if products.seed.ts price bands change materially.
CATEGORY_BASELINE_UNITS = {
    "Bakery": 140.0,
    "Beverages": 160.0,
    "Snacks": 130.0,
    "Dairy": 70.0,
    "Condiments": 55.0,
    "General": 90.0,
}

# Annual growth/decline rate applied as a slow linear trend, per category.
CATEGORY_GROWTH_RATE = {
    "Bakery": 0.06,
    "Beverages": 0.14,
    "Snacks": 0.10,
    "Dairy": -0.03,
    "Condiments": 0.02,
    "General": 0.05,
}

# Resolved relative to this file, not the process cwd, so training/loading works regardless of
# where `uvicorn` is launched from.
ARTIFACTS_DIR = Path(__file__).parent / "artifacts"
