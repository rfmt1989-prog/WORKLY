from pydantic import BaseModel


class CompanyStats(BaseModel):
    active_workers: int
    active_projects: int
    monthly_cost: float
    unread_messages: int


class CompanyNextTask(BaseModel):
    project_name: str
    client: str
    start_time: str
    workers_required: int


class CompanyDashboardResponse(BaseModel):
    company_id: int
    company_name: str
    plan: str
    pulse: int
    stats: CompanyStats
    next_task: CompanyNextTask
