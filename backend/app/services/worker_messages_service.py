from app.schemas.worker_messages_schema import (
    WorkerMessageResponse,
    WorkerMessagesResponse,
)


class WorkerMessagesService:
    def get_messages(
        self,
        worker_id: int,
    ) -> WorkerMessagesResponse:

        messages = [
            WorkerMessageResponse(
                id=1,
                sender="Carlos Ferreira",
                role="Chefe de equipa",
                preview="Amanhã começamos às 08:00.",
                time="09:42",
                unread=2,
                online=True,
            ),
            WorkerMessageResponse(
                id=2,
                sender="Workly Demo Company",
                role="Empresa",
                preview="O contrato foi aprovado.",
                time="Ontem",
                unread=1,
                online=True,
            ),
            WorkerMessageResponse(
                id=3,
                sender="Suporte WORKLY",
                role="Suporte",
                preview="Obrigado pelo contacto.",
                time="Seg",
                unread=0,
                online=False,
            ),
        ]

        unread_total = sum(
            message.unread
            for message in messages
        )

        return WorkerMessagesResponse(
            unread_total=unread_total,
            messages=messages,
        )