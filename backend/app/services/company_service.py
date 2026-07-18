from app.schemas.company_schema import (
    CompanyDashboardResponse,
    CompanyProjectSummary,
    CompanyRecentCheckin,
    CompanyStats,
)


class CompanyService:
    def dashboard(self) -> CompanyDashboardResponse:
        stats = CompanyStats(
            active_workers=18,
            active_projects=4,
            total_documents=43,
            monthly_revenue=42350,
            unread_messages=7,
        )

        projects = [
            CompanyProjectSummary(
                project_id=101,
                name="Hospital Lisboa",
                location="Lisboa",
                progress=78,
                workers=6,
                status="active",
            ),
            CompanyProjectSummary(
                project_id=102,
                name="Hotel Porto",
                location="Porto",
                progress=45,
                workers=4,
                status="active",
            ),
            CompanyProjectSummary(
                project_id=103,
                name="Centro Comercial Braga",
                location="Braga",
                progress=22,
                workers=8,
                status="planning",
            ),
        ]

        recent_checkins = [
            CompanyRecentCheckin(
                worker_id=1,
                worker_name="João Silva",
                time="08:01",
                project_name="Hospital Lisboa",
            ),
            CompanyRecentCheckin(
                worker_id=2,
                worker_name="Ana Costa",
                time="08:04",
                project_name="Hospital Lisboa",
            ),
            CompanyRecentCheckin(
                worker_id=3,
                worker_name="Pedro Gomes",
                time="08:06",
                project_name="Hotel Porto",
            ),
        ]

        return CompanyDashboardResponse(
            company_id=10,
            company_name="Workly Demo Company",
            plan="Enterprise",
            pulse=96,
            verified=True,
            stats=stats,
            projects=projects,
            recent_checkins=recent_checkins,
        )