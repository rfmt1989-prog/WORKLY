from app.schemas.worker_jobs_schema import (
    WorkerJobResponse,
    WorkerJobsResponse,
    WorkerJobsSummaryResponse,
)


class WorkerJobsService:
    def get_jobs(self, worker_id: int) -> WorkerJobsResponse:
        jobs = [
            WorkerJobResponse(
                id=101,
                project_name="Hospital Lisboa",
                company="Workly Demo Company",
                location="Lisboa",
                start_date="2025-07-01",
                end_date="2025-07-10",
                hours_worked=72,
                amount=1080,
                rating=5,
                status="completed",
                payment_status="paid",
            ),
            WorkerJobResponse(
                id=102,
                project_name="Hotel Porto",
                company="Construções Norte",
                location="Porto",
                start_date="2025-06-14",
                end_date="2025-06-20",
                hours_worked=48,
                amount=720,
                rating=4.5,
                status="completed",
                payment_status="paid",
            ),
            WorkerJobResponse(
                id=103,
                project_name="Centro Comercial Braga",
                company="BuildTech",
                location="Braga",
                start_date="2025-07-15",
                end_date="2025-07-25",
                hours_worked=18,
                amount=270,
                rating=None,
                status="in_progress",
                payment_status="pending",
            ),
        ]

        summary = WorkerJobsSummaryResponse(
            total_jobs=len(jobs),
            completed_jobs=2,
            total_hours=138,
            total_earnings=2070,
            average_rating=4.75,
        )

        return WorkerJobsResponse(
            summary=summary,
            jobs=jobs,
        )