# Nexora AI Service

An isolated FastAPI service providing Nexora's server-side AI features: conversational AI (chat,
explain, summarize, help) via Groq, and ML-based demand forecasting (XGBoost / Random Forest) via
scikit-learn/xgboost. This is intentionally **separate** from the future Spring Boot application
backend — it has its own lifecycle, its own dependencies, and can be run, deployed, or replaced
independently.

The frontend never calls Groq (or the forecast models) directly. It always calls this service's
`/api/ai/*` and `/api/forecast/*` endpoints (see
`frontend/src/services/ai/adapters/httpAIAdapter.ts` and
`frontend/src/services/forecast/adapters/httpForecastAdapter.ts`), which in turn is the only place
that holds the Groq API key.

## Setup

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate    # macOS/Linux
pip install -r requirements.txt
copy .env.example .env         # Windows — then fill in GROQ_API_KEY
```

Get a Groq API key at https://console.groq.com. Without a key set, chat/explain/summarize/help
still boot and respond — every AI endpoint returns a `503 ai_provider_unavailable` instead of a
live answer, which the frontend already treats as a soft failure (friendly fallback message, no
crash). Forecasting doesn't need a key at all — it trains its own models on startup.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

On first boot, watch the logs for forecast model training (one line per category, then a summary
"Forecast models ready (6/6)"). Training runs in a background thread so the server starts
accepting requests immediately; `/health` and `/api/forecast/status` report readiness in the
meantime, and `/api/forecast/predict` returns a `503` until a category's model is ready.

Then point the frontend at it by setting, in `frontend/.env`:

```
VITE_USE_MOCK_AI=false
VITE_USE_MOCK_FORECAST=false
VITE_AI_SERVICE_URL=http://localhost:8000
```

## Endpoints

| Method | Path                  | Purpose                                             |
| ------ | --------------------- | ---------------------------------------------------- |
| POST   | `/api/ai/chat`         | Conversational chat. Pass `"stream": true` for a `text/plain` streamed response. |
| POST   | `/api/ai/explain`      | Plain-English explanation of a subject + data payload. |
| POST   | `/api/ai/summarize`    | Short narrative summary of a data payload.           |
| POST   | `/api/ai/help`         | Contextual help for a given app section.              |
| POST   | `/api/ai/bom-suggest`  | Suggests Bill of Materials lines, constrained to the caller's real raw-material catalog. |
| POST   | `/api/ai/material-classify` | Classifies a raw material into a category + reference commodity for Market Intelligence routing. |
| POST   | `/api/ai/price-indicator` | Qualitative trend estimate (rising/stable/falling) for a material with no real price feed — never a fabricated price. |
| POST   | `/api/forecast/predict`| Demand forecast for one product — see below.          |
| GET    | `/api/forecast/status` | Per-category model training readiness.                |
| GET    | `/health`              | Liveness, Groq config, and forecast readiness.         |

Interactive API docs are available at `http://localhost:8000/docs` once running.

### `/api/forecast/predict` example

```bash
curl -X POST http://localhost:8000/api/forecast/predict \
  -H "Content-Type: application/json" \
  -d '{"productId":"prod-1","productName":"Classic White Sandwich Bread","category":"Bakery","unitPrice":48,"avgDailyUsage":42,"granularity":"week","horizon":4}'
```

Returns 4 weekly `points` (predicted units + lower/upper bound), which of the two candidate models
(`xgboost` or `random_forest`) won on validation MAE for that category, and a `confidence` figure.

## Architecture

- `app/core/config.py` — environment-driven settings (`GROQ_API_KEY`, `GROQ_MODEL`, CORS origins).
- `app/core/errors.py` — centralized exception handlers. `AIProviderUnavailableError` and
  `ForecastModelUnavailableError` both map to a `503` everywhere instead of leaking raw exceptions.
- `app/core/logging.py` — structured stdout logging, one format across uvicorn and app loggers.
- `app/services/groq_client.py` — the only file that imports the `groq` SDK.
- `app/services/forecast_service.py` — request orchestration for forecasting: category resolution,
  product-level scaling, delegates the actual rollout/aggregation to `app/ml/predict.py`.
- `app/ml/` — the forecasting "modeling SDK", independent of any web-framework concerns:
  - `constants.py` — fixed training-window anchor, category list, per-category baseline/growth.
  - `data_generator.py` — deterministic synthetic daily sales history per category (training fuel
    only — there's no real sales history in this project yet, see note below).
  - `features.py` — date + lag/rolling feature engineering, shared by training and inference.
  - `train.py` — trains both `XGBRegressor` and `RandomForestRegressor` per category on a
    time-based train/validation split, picks the lower-MAE model.
  - `predict.py` — recursive day-by-day rollout past the training window, aggregated into the
    requested daily/weekly/monthly/quarterly granularity.
  - `model_store.py` — trains-or-loads all category models at startup, in-memory cache, disk
    persistence via `joblib` to `app/ml/artifacts/` (gitignored).
- `app/schemas/ai.py`, `app/schemas/forecast.py` — Pydantic request/response models, kept in sync
  with the frontend's `services/ai/types.ts` / `services/forecast/types.ts`.
- `app/api/routes/ai.py`, `app/api/routes/forecast.py` — thin route handlers; all logic lives in
  the `services/`/`ml/` layers, not the routes.

## Honest data disclosure

There is no real historical sales data anywhere in this project — it's a demo/academic build.
`ml/data_generator.py` generates ~2 years of deterministic synthetic daily sales per category
(trend + weekly seasonality + festive-season bump + noise) purely to have something real to train
on. The models themselves are genuinely trained and validated (not canned output) — the *data*
they learn from is synthetic, and every `/api/forecast/predict` response says so explicitly via
`isSynthetic: true`. Swapping in real historical sales data later (once a real backend/database
exists) means replacing `data_generator.py`'s source, not the modeling or serving code.
