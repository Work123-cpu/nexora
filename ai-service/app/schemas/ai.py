from typing import Literal

from pydantic import BaseModel, Field

ChatRole = Literal["user", "assistant", "system"]


class ChatMessage(BaseModel):
    id: str
    role: ChatRole
    content: str
    createdAt: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    context: dict | None = None
    stream: bool = False


class ChatResponse(BaseModel):
    message: ChatMessage
    suggestedFollowUps: list[str] | None = None


class ExplainRequest(BaseModel):
    subject: str
    data: dict = Field(default_factory=dict)


class ExplainResponse(BaseModel):
    explanation: str


class SummarizeRequest(BaseModel):
    subject: str
    data: dict = Field(default_factory=dict)


class SummarizeResponse(BaseModel):
    summary: str


class HelpRequest(BaseModel):
    section: str
    question: str | None = None


class HelpResponse(BaseModel):
    answer: str
    relatedArticles: list[str] | None = None
