import json
import re
import threading

import joblib

from app.core.logging import logger
from app.ml.constants import ARTIFACTS_DIR, CATEGORIES
from app.ml.train import TrainedCategoryModel, train_category_model

_lock = threading.Lock()
_MODELS: dict[str, TrainedCategoryModel] = {}
_FAILED: set[str] = set()


def _slug(category: str) -> str:
    return re.sub(r"[^a-z0-9_]+", "_", category.lower()).strip("_")


def _artifact_paths(category: str) -> tuple[str, str]:
    slug = _slug(category)
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    return str(ARTIFACTS_DIR / f"{slug}.joblib"), str(ARTIFACTS_DIR / f"{slug}.meta.json")


def _load_from_disk(category: str) -> TrainedCategoryModel | None:
    model_path, meta_path = _artifact_paths(category)
    try:
        with open(meta_path, encoding="utf-8") as f:
            meta = json.load(f)
        model = joblib.load(model_path)
        return TrainedCategoryModel(category=category, model=model, **{k: v for k, v in meta.items() if k != "category"})
    except FileNotFoundError:
        return None
    except Exception as exc:  # noqa: BLE001 — any corrupt/stale artifact should trigger a retrain, not a crash
        logger.warning("Failed to load cached forecast model for %s, will retrain: %s", category, exc)
        return None


def _persist_to_disk(trained: TrainedCategoryModel) -> None:
    model_path, meta_path = _artifact_paths(trained.category)
    joblib.dump(trained.model, model_path)
    meta = {
        "chosen_model": trained.chosen_model,
        "xgboost_mae": trained.xgboost_mae,
        "random_forest_mae": trained.random_forest_mae,
        "feature_columns": trained.feature_columns,
        "category_reference_baseline": trained.category_reference_baseline,
        "trained_at": trained.trained_at,
    }
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f)


def train_or_load_all(force: bool = False) -> None:
    """Loads cached artifacts where available, trains the rest. Each category is isolated in its
    own try/except so one failure never blocks the others or crashes the caller — this runs in a
    background thread from the FastAPI lifespan, so a raised exception here would otherwise be
    silently swallowed by asyncio anyway; the per-category guard makes the partial-failure mode
    explicit and observable instead.
    """
    for category in CATEGORIES:
        try:
            if not force:
                cached = _load_from_disk(category)
                if cached is not None:
                    with _lock:
                        _MODELS[category] = cached
                        _FAILED.discard(category)
                    logger.info("Loaded cached forecast model for category=%s (chosen=%s)", category, cached.chosen_model)
                    continue

            trained = train_category_model(category)
            _persist_to_disk(trained)
            with _lock:
                _MODELS[category] = trained
                _FAILED.discard(category)
        except Exception:  # noqa: BLE001 — deliberately broad: isolate per-category failures
            logger.exception("Forecast model training failed for category=%s", category)
            with _lock:
                _FAILED.add(category)

    ready_count = len(_MODELS)
    logger.info("Forecast models ready (%d/%d)", ready_count, len(CATEGORIES))


def get_model(category: str) -> TrainedCategoryModel | None:
    with _lock:
        if category in _MODELS:
            return _MODELS[category]
    return None


def is_ready(category: str) -> bool:
    with _lock:
        return category in _MODELS


def all_ready() -> bool:
    with _lock:
        return len(_MODELS) == len(CATEGORIES)


def readiness_by_category() -> dict[str, bool]:
    with _lock:
        return {c: c in _MODELS for c in CATEGORIES}


def latest_trained_at() -> str | None:
    with _lock:
        if not _MODELS:
            return None
        return max(m.trained_at for m in _MODELS.values())
