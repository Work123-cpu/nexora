from collections.abc import AsyncIterator

from groq import AsyncGroq

from app.core.config import get_settings
from app.core.errors import AIProviderUnavailableError
from app.core.logging import logger

SYSTEM_PROMPT = (
    "You are Nexora, a virtual procurement manager and business assistant embedded in the "
    "Nexora Smart Procurement & Inventory Management platform. You explain screens, answer "
    "questions about inventory, procurement, suppliers, forecasting, and reports in plain English. "
    "You never claim to execute business actions yourself — creating purchase orders, deleting "
    "records, or approving anything always requires explicit human confirmation in the product UI. "
    "\n\n"
    "You do not have a live connection to this company's actual data. You cannot see their real "
    "inventory levels, stock counts, purchase orders, vendors, or any other live figures unless "
    "specific numbers are explicitly given to you earlier in this conversation. Never invent "
    "specific product names, quantities, dates, or table rows and present them as if they were "
    "real data from the platform — that is a serious trust violation, worse than an honest vague "
    "answer. If asked about real, current figures you have not been given, say plainly that you "
    "don't have live access to their data, briefly explain what that page or feature generally "
    "shows, and tell them which page to check for the real numbers. "
    "\n\n"
    "When you HAVE been given specific real numbers or context earlier in this conversation, cite "
    "them concretely — the numbers, thresholds, or trends behind a recommendation — rather than "
    "giving vague advice. Keep responses concise."
)


class GroqClientWrapper:
    """Thin wrapper around the Groq SDK. Every method raises
    AIProviderUnavailableError (never a raw SDK exception) when the key is
    missing or the upstream call fails, so route handlers have one error
    shape to deal with.
    """

    def __init__(self) -> None:
        self._settings = get_settings()
        self._client: AsyncGroq | None = AsyncGroq(api_key=self._settings.groq_api_key) if self._settings.is_groq_configured else None

    def _require_client(self) -> AsyncGroq:
        if self._client is None:
            raise AIProviderUnavailableError("GROQ_API_KEY is not set. Add it to ai-service/.env to enable live AI responses.")
        return self._client

    async def complete(self, messages: list[dict[str, str]], *, temperature: float = 0.4) -> str:
        client = self._require_client()
        try:
            response = await client.chat.completions.create(
                model=self._settings.groq_model,
                messages=[{"role": "system", "content": SYSTEM_PROMPT}, *messages],
                temperature=temperature,
            )
            return response.choices[0].message.content or ""
        except Exception as exc:  # noqa: BLE001 — deliberately broad: any SDK/network failure degrades the same way
            logger.error("Groq completion failed: %s", exc)
            raise AIProviderUnavailableError("The AI provider request failed. Please try again shortly.") from exc

    async def stream(self, messages: list[dict[str, str]], *, temperature: float = 0.4) -> AsyncIterator[str]:
        client = self._require_client()
        try:
            stream = await client.chat.completions.create(
                model=self._settings.groq_model,
                messages=[{"role": "system", "content": SYSTEM_PROMPT}, *messages],
                temperature=temperature,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield delta
        except Exception as exc:  # noqa: BLE001
            logger.error("Groq streaming failed: %s", exc)
            raise AIProviderUnavailableError("The AI provider stream failed. Please try again shortly.") from exc


_groq_client_singleton: GroqClientWrapper | None = None


def get_groq_client() -> GroqClientWrapper:
    global _groq_client_singleton
    if _groq_client_singleton is None:
        _groq_client_singleton = GroqClientWrapper()
    return _groq_client_singleton
