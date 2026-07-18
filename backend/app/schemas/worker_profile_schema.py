from pydantic import BaseModel


class WorkerProfileResponse(BaseModel):
    worker_id: int
    name: str
    email: str
    role: str
    location: str
    pulse: int
    rating: float
    jobs_completed: int
    phone: str
    language: str