from app.schemas.worker_profile_schema import WorkerProfileResponse


class WorkerProfileService:
    def get_profile(self, worker_id: int) -> WorkerProfileResponse:
        return WorkerProfileResponse(
            worker_id=worker_id,
            name="Demo Worker",
            email="demo@workly.pt",
            role="Eletricista",
            location="Lisboa",
            pulse=92,
            rating=4.8,
            jobs_completed=32,
            phone="+351 910 000 000",
            language="Português",
        )