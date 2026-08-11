"""Pre-bake forecast model artifacts without starting the HTTP server.

Useful before a deploy so the service's first boot is a pure disk-load (fast) instead of paying
the training cost on cold start. Run from the ai-service/ directory:

    python scripts/train_forecast_models.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.logging import configure_logging  # noqa: E402
from app.ml import model_store  # noqa: E402

if __name__ == "__main__":
    configure_logging()
    model_store.train_or_load_all(force=True)
    print(f"Done. Readiness: {model_store.readiness_by_category()}")
