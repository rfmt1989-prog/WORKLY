from fastapi import APIRouter

from app.schemas.worker_checkin_schema import (
    WorkerCheckStatusResponse,
)
from app.services.worker_checkin_service import (
    service,
)

router = APIRouter(
    prefix="/worker",
    tags=["Worker"],
)


@router.get(
    "/check-status",
    response_model=WorkerCheckStatusResponse,
)
async def get_status():
    return service.status()


@router.post(
    "/checkin",
    response_model=WorkerCheckStatusResponse,
)
async def checkin():
    return service.checkin()


@router.post(
    "/checkout",
    response_model=WorkerCheckStatusResponse,
)
async def checkout():
    return service.checkout()