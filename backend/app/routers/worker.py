from fastapi import APIRouter

from app.schemas.worker_schema import WorkerDashboardResponse
from app.services.worker_service import WorkerService


router = APIRouter(
    prefix="/worker",
    tags=["Worker"],
)

service = WorkerService()


@router.get(
    "/dashboard",
    response_model=WorkerDashboardResponse,
)
async def get_worker_dashboard():
    return service.get_dashboard(worker_id=1)