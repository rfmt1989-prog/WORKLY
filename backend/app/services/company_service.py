from app.schemas.company_schema import (
    CompanyDashboardResponse,
    CompanyNextTask,
    CompanyStats,
)


class CompanyService:
    def dashboard(self) -> CompanyDashboardResponse:
        stats = CompanyStats(
            active_workers=18,
            active_projects=4,
            monthly_cost=42350,
            unread_messages=7,
        )

        return CompanyDashboardResponse(
            company_id=10,
            company_name="Workly Demo Company",
            plan="Enterprise",
            pulse=96,
            stats=stats,
            next_task=CompanyNextTask(
                project_name="Hospital Lisboa",
                client="Hospital Central",
                start_time="08:00",
                workers_required=6,
            ),
        )
