from fastapi import APIRouter

from app.schemas.worker_jobs_schema import WorkerJobsResponse
from app.services.worker_jobs_service import WorkerJobsService


router = APIRouter(
    prefix="/worker",
    tags=["Worker"],
)

service = WorkerJobsService()


@router.get(
    "/jobs",
    response_model=WorkerJobsResponse,
)
async def get_worker_jobs():
    return service.get_jobs(worker_id=1)