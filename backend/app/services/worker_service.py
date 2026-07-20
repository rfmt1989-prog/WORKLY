from app.schemas.worker_schema import (
    WorkerCurrentProject,
    WorkerDashboardResponse,
    WorkerDashboardStats,
)


class WorkerService:
    def get_dashboard(self, worker_id: int) -> WorkerDashboardResponse:
        stats = WorkerDashboardStats(
            jobs_today=1,
            hours_this_week=32.5,
            documents_pending=2,
            unread_messages=3,
        )

        current_project = WorkerCurrentProject(
            project_id=101,
            name="Hospital Lisboa",
            company="Workly Demo Company",
            location="Lisboa",
            start_time="08:00",
            end_time="17:00",
            team_leader="Carlos Ferreira",
            can_check_in=True,
        )

        return WorkerDashboardResponse(
            worker_id=worker_id,
            name="Rodolfo Maia",
            role="Eletromecânico",
            pulse=92,
            status="available",
            stats=stats,
            current_project=current_project,
        )
