from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.core.logging import logger


class AIProviderUnavailableError(Exception):
    """Raised when Groq is not configured or the upstream call fails.

    Deliberately distinct from a generic 500 — the frontend's httpAIAdapter
    treats this as a soft failure and shows a friendly message rather than
    an error state.
    """

    def __init__(self, detail: str = "The AI provider is not configured or unavailable."):
        self.detail = detail
        super().__init__(detail)


class ForecastModelUnavailableError(Exception):
    """Raised when a category's forecast model hasn't finished training yet, or failed to train.

    Same shape/intent as AIProviderUnavailableError — the frontend's httpForecastAdapter treats
    this as a soft failure and falls back to a naive projection rather than showing an error state.
    """

    def __init__(self, detail: str = "Forecast models are still warming up or failed to train. Please retry shortly."):
        self.detail = detail
        super().__init__(detail)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AIProviderUnavailableError)
    async def handle_ai_provider_unavailable(request: Request, exc: AIProviderUnavailableError) -> JSONResponse:
        logger.warning("AI provider unavailable for %s %s: %s", request.method, request.url.path, exc.detail)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "ai_provider_unavailable", "detail": exc.detail},
        )

    @app.exception_handler(ForecastModelUnavailableError)
    async def handle_forecast_model_unavailable(request: Request, exc: ForecastModelUnavailableError) -> JSONResponse:
        logger.warning("Forecast model unavailable for %s %s: %s", request.method, request.url.path, exc.detail)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "forecast_model_unavailable", "detail": exc.detail},
        )

    @app.exception_handler(RequestValidationError)
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        logger.info("Validation error for %s %s: %s", request.method, request.url.path, exc.errors())
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": "validation_error", "detail": exc.errors()},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error for %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "internal_error", "detail": "An unexpected error occurred. This has been logged."},
        )
