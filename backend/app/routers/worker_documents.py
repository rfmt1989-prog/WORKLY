from fastapi import APIRouter

from app.schemas.worker_documents_schema import (
    WorkerDocumentsResponse,
)
from app.services.worker_documents_service import (
    WorkerDocumentsService,
)


router = APIRouter(
    prefix="/worker",
    tags=["Worker"],
)

service = WorkerDocumentsService()


@router.get(
    "/documents",
    response_model=WorkerDocumentsResponse,
)
async def get_worker_documents():
    return service.get_documents(worker_id=1)