from pydantic import BaseModel


class WorkerDashboardStats(BaseModel):
    jobs_today: int
    hours_this_week: float
    documents_pending: int
    unread_messages: int


class WorkerCurrentProject(BaseModel):
    project_id: int
    name: str
    company: str
    location: str
    start_time: str
    end_time: str
    team_leader: str
    can_check_in: bool


class WorkerDashboardResponse(BaseModel):
    worker_id: int
    name: str
    role: str
    pulse: int
    status: str
    stats: WorkerDashboardStats
    current_project: WorkerCurrentProject | None = None