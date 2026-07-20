from fastapi import APIRouter, Header, HTTPException

from app.schemas.conversation_schema import (
    ConversationResponse,
    SendMessageRequest,
    SendMessageResponse,
)
from app.services.auth_service import auth_service
from app.services.conversation_service import conversation_service


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


def authenticated_user(authorization: str | None):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Sessão inválida.")

    user = auth_service.get_user_from_token(authorization.removeprefix("Bearer "))
    if user is None:
        raise HTTPException(status_code=401, detail="Sessão expirada.")
    return user


@router.get("/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    authorization: str | None = Header(default=None),
):
    user = authenticated_user(authorization)
    return conversation_service.get_conversation(
        role=user["role"],
        conversation_id=conversation_id,
    )


@router.post("/{conversation_id}/messages", response_model=SendMessageResponse)
async def send_message(
    conversation_id: str,
    data: SendMessageRequest,
    authorization: str | None = Header(default=None),
):
    user = authenticated_user(authorization)

    if data.type == "text" and not (data.text and data.text.strip()):
        raise HTTPException(status_code=422, detail="A mensagem não pode estar vazia.")

    message = conversation_service.send_message(
        user_id=user["id"],
        role=user["role"],
        conversation_id=conversation_id,
        data=data,
    )
    return SendMessageResponse(message=message)
