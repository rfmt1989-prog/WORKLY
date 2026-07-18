from fastapi import APIRouter

from app.schemas.company_schema import CompanyDashboardResponse
from app.services.company_service import CompanyService


router = APIRouter(
    prefix="/company",
    tags=["Company"],
)

service = CompanyService()


@router.get(
    "/dashboard",
    response_model=CompanyDashboardResponse,
)
async def company_dashboard():
    return service.dashboard()