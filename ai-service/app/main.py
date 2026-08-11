import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.ai import router as ai_router
from app.api.routes.forecast import router as forecast_router
from app.core.config import get_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging, logger
from app.ml import model_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    settings = get_settings()
    if settings.is_groq_configured:
        logger.info("Nexora ai-service starting — Groq provider configured (model=%s)", settings.groq_model)
    else:
        logger.warning("Nexora ai-service starting — GROQ_API_KEY not set, endpoints will return 503 until configured")

    # Training is CPU-bound (sklearn/xgboost .fit()) — run it in the default executor so it never
    # blocks the event loop, meaning uvicorn starts accepting connections immediately instead of
    # waiting for all forecast models to finish training first.
    loop = asyncio.get_running_loop()
    loop.run_in_executor(None, model_store.train_or_load_all)

    yield
    logger.info("Nexora ai-service shutting down")


app = FastAPI(
    title="Nexora AI Service",
    description="Isolated FastAPI service wrapping Groq for Nexora's conversational AI features. "
    "Never called directly from the browser — the frontend always goes through its own API layer.",
    version="0.1.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(ai_router)
app.include_router(forecast_router)


@app.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "groq_configured": settings.is_groq_configured,
        "forecast_models_ready": model_store.all_ready(),
        "forecast_categories": model_store.readiness_by_category(),
    }
