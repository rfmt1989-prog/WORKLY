from fastapi import APIRouter

from app.schemas.worker_messages_schema import (
    WorkerMessagesResponse,
)
from app.services.worker_messages_service import (
    WorkerMessagesService,
)

router = APIRouter(
    prefix="/worker",
    tags=["Worker"],
)

service = WorkerMessagesService()


@router.get(
    "/messages",
    response_model=WorkerMessagesResponse,
)
async def get_messages():
    return service.get_messages(
        worker_id=1
    )