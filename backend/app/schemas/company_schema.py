from pydantic import BaseModel


class CompanyStats(BaseModel):
    active_workers: int
    active_projects: int
    total_documents: int
    monthly_revenue: float
    unread_messages: int


class CompanyProjectSummary(BaseModel):
    project_id: int
    name: str
    location: str
    progress: int
    workers: int
    status: str


class CompanyRecentCheckin(BaseModel):
    worker_id: int
    worker_name: str
    time: str
    project_name: str


class CompanyDashboardResponse(BaseModel):
    company_id: int
    company_name: str
    plan: str
    pulse: int
    verified: bool
    stats: CompanyStats
    projects: list[CompanyProjectSummary]
    recent_checkins: list[CompanyRecentCheckin]