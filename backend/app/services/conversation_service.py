from datetime import UTC, datetime, timedelta
from uuid import uuid4

from app.schemas.conversation_schema import (
    ConversationContact,
    ConversationMessage,
    ConversationResponse,
    ConversationSummary,
    SendMessageRequest,
)


COMPANY_CONTACTS = {
    "1": ("Rodolfo Maia", "Eletromecânico"),
    "2": ("Carlos Ferreira", "Chefe de equipa"),
    "3": ("Sofia Martins", "Técnica AVAC"),
    "4": ("Suporte WORKLY", "Suporte"),
    "201": ("Equipa Lisboa", "Canal de equipa"),
    "202": ("Equipa Norte", "Canal de equipa"),
    "203": ("Internacional", "Canal de equipa"),
}

WORKER_CONTACTS = {
    "1": ("Carlos Ferreira", "Chefe de equipa"),
    "2": ("Workly Demo Company", "Empresa"),
    "3": ("Suporte WORKLY", "Suporte"),
}


class ConversationService:
    def __init__(self):
        self.messages: dict[tuple[str, str], list[ConversationMessage]] = {}

    @staticmethod
    def contact_for(role: str, conversation_id: str) -> ConversationContact:
        contacts = WORKER_CONTACTS if role == "worker" else COMPANY_CONTACTS
        name, contact_role = contacts.get(
            conversation_id,
            ("Canal WORKLY", "Operação"),
        )
        return ConversationContact(
            id=f"contact-{conversation_id}",
            name=name,
            role=contact_role,
        )

    def initial_messages(
        self,
        role: str,
        conversation_id: str,
    ) -> list[ConversationMessage]:
        contact = self.contact_for(role, conversation_id)
        return [
            ConversationMessage(
                id=f"welcome-{role}-{conversation_id}",
                sender_id=contact.id,
                text=f"Olá! Este é o canal {contact.name}.",
                type="text",
                created_at=(datetime.now(UTC) - timedelta(minutes=18)).isoformat(),
            )
        ]

    def get_conversation(
        self,
        *,
        role: str,
        conversation_id: str,
    ) -> ConversationResponse:
        key = (role, conversation_id)
        if key not in self.messages:
            self.messages[key] = self.initial_messages(role, conversation_id)

        return ConversationResponse(
            conversation=ConversationSummary(
                id=conversation_id,
                other=self.contact_for(role, conversation_id),
            ),
            messages=self.messages[key],
        )

    def send_message(
        self,
        *,
        user_id: str,
        role: str,
        conversation_id: str,
        data: SendMessageRequest,
    ) -> ConversationMessage:
        key = (role, conversation_id)
        if key not in self.messages:
            self.messages[key] = self.initial_messages(role, conversation_id)

        message = ConversationMessage(
            id=str(uuid4()),
            sender_id=user_id,
            text=data.text.strip() if data.text else None,
            type=data.type,
            meta=data.meta,
            created_at=datetime.now(UTC).isoformat(),
        )
        self.messages[key].append(message)
        return message


conversation_service = ConversationService()
