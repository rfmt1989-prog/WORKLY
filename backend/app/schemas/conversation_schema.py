from typing import Any, Literal

from pydantic import BaseModel, Field


class ConversationContact(BaseModel):
    id: str
    name: str
    role: str
    avatar: str | None = None


class ConversationSummary(BaseModel):
    id: str
    other: ConversationContact


class ConversationMessage(BaseModel):
    id: str
    sender_id: str
    text: str | None = None
    type: Literal["text", "voice", "document"] = "text"
    meta: dict[str, Any] | None = None
    created_at: str


class ConversationResponse(BaseModel):
    conversation: ConversationSummary
    messages: list[ConversationMessage]


class SendMessageRequest(BaseModel):
    text: str | None = Field(default=None, max_length=4000)
    type: Literal["text", "voice", "document"] = "text"
    meta: dict[str, Any] | None = None


class SendMessageResponse(BaseModel):
    message: ConversationMessage
