from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration, loaded from environment variables / .env.

    GROQ_API_KEY is intentionally optional: this service must be able to boot
    and respond (in a clearly-degraded way) without it, since the frontend
    treats a down/unconfigured AI service as a non-fatal condition.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str | None = None
    # llama-3.3-70b-versatile was removed from Groq's lineup (as of 2026-08-24, calling it 404s
    # with model_not_found) — openai/gpt-oss-120b is the current closest capability-tier model.
    groq_model: str = "openai/gpt-oss-120b"

    allowed_origins: str = "http://localhost:5173"

    host: str = "0.0.0.0"
    port: int = 8000

    log_level: str = "INFO"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def is_groq_configured(self) -> bool:
        return bool(self.groq_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()
