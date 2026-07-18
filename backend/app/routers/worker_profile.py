from fastapi import APIRouter

from app.schemas.worker_profile_schema import WorkerProfileResponse
from app.services.worker_profile_service import WorkerProfileService


router = APIRouter(
    prefix="/worker",
    tags=["Worker"],
)

service = WorkerProfileService()


@router.get(
    "/profile",
    response_model=WorkerProfileResponse,
)
async def get_worker_profile():
    return service.get_profile(worker_id=1)