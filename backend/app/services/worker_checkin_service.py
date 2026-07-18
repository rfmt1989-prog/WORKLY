from app.schemas.worker_checkin_schema import (
    WorkerCheckStatusResponse,
)


class WorkerCheckinService:

    def __init__(self):
        self.checked_in = False

    def status(self):
        return WorkerCheckStatusResponse(
            checked_in=self.checked_in,
            project="Hospital Lisboa",
            company="Workly Demo Company",
            location="Lisboa",
            check_in_time="08:00" if self.checked_in else None,
        )

    def checkin(self):
        self.checked_in = True
        return self.status()

    def checkout(self):
        self.checked_in = False
        return self.status()


service = WorkerCheckinService()