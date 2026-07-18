from pydantic import BaseModel


class WorkerCheckStatusResponse(BaseModel):
    checked_in: bool
    project: str
    company: str
    location: str
    check_in_time: str | None = None