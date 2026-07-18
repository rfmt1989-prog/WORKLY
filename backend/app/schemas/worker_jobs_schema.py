from typing import Literal

from pydantic import BaseModel


JobStatus = Literal[
    "completed",
    "in_progress",
    "cancelled",
]

PaymentStatus = Literal[
    "paid",
    "pending",
    "overdue",
]


class WorkerJobResponse(BaseModel):
    id: int
    project_name: str
    company: str
    location: str
    start_date: str
    end_date: str
    hours_worked: float
    amount: float
    rating: float | None = None
    status: JobStatus
    payment_status: PaymentStatus


class WorkerJobsSummaryResponse(BaseModel):
    total_jobs: int
    completed_jobs: int
    total_hours: float
    total_earnings: float
    average_rating: float


class WorkerJobsResponse(BaseModel):
    summary: WorkerJobsSummaryResponse
    jobs: list[WorkerJobResponse]