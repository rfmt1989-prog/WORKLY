"""One professional passport, with site eligibility and post-registration work."""
from datetime import date, datetime, timezone
from typing import Any
from .compliance import DEFAULT_DOCUMENT_REQUIREMENTS, evaluate_worker_compliance, project_requirements


def _instant(value: Any) -> datetime | None:
    try:
        result = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        return result.replace(tzinfo=timezone.utc) if result.tzinfo is None else result
    except (TypeError, ValueError):
        return None


def wallet_attendance(worker: dict[str, Any], attendance: list[dict[str, Any]]) -> list[dict[str, Any]]:
    enrolled = _instant(worker.get("registered_at"))
    return [item for item in attendance if (
        item.get("worker_id") == worker.get("id") and (start := _instant(item.get("check_in"))) is not None
        and (enrolled is None or start >= enrolled)
    )]


def _hours(record: dict[str, Any]) -> float:
    start, end = _instant(record.get("check_in")), _instant(record.get("check_out"))
    if not start or not end or end <= start:
        return 0
    return min(16, (end - start).total_seconds() / 3600)


def wallet_project_compliance(worker: dict[str, Any], project: dict[str, Any], *, today: date | None = None) -> dict[str, Any]:
    configured = project_requirements(project)
    effective = {**project, "compliance_requirements": {
        "documents": list(dict.fromkeys([*DEFAULT_DOCUMENT_REQUIREMENTS, *configured["documents"]])),
        "certificates": configured["certificates"],
    }}
    result = evaluate_worker_compliance(worker, effective, today=today)
    if worker.get("work_eligibility_status") == "not_eligible":
        result["fit_for_check_in"] = False
        result["status"] = "blocked"
        result["issues"].append({"kind": "eligibility", "requirement": "eligibility", "label": "Aptidão não autorizada", "code": "rejected", "severity": "blocked"})
    if project.get("status") != "active":
        result["fit_for_check_in"] = False
        result["status"] = "blocked"
        result["issues"].append({"kind": "project", "requirement": "active_project", "label": "Obra ainda não ativa", "code": "site_inactive", "severity": "blocked"})
    return result


def professional_wallet(worker: dict[str, Any], projects: list[dict[str, Any]], attendance: list[dict[str, Any]], *, today: date | None = None) -> dict[str, Any]:
    records = wallet_attendance(worker, attendance)
    assigned = [item for item in projects if worker.get("id") in item.get("worker_ids", [])]
    active = next((item for item in records if not item.get("check_out")), None)
    current_id = active.get("project_id") if active else worker.get("current_project_id")
    current = next((item for item in assigned if item["id"] == current_id), None)
    current = current or next((item for item in assigned if item.get("status") == "active"), None)
    current = current or next((item for item in assigned if item.get("status") == "planned"), None)
    base = evaluate_worker_compliance(worker, {"compliance_requirements": {"documents": DEFAULT_DOCUMENT_REQUIREMENTS, "certificates": []}}, today=today)
    site = wallet_project_compliance(worker, current, today=today) if current else base
    rows = site["items"]
    blockers = [item for item in rows if item["status"] not in {"verified", "expiring"}]
    severe = any(item["status"] in {"expired", "rejected", "invalid", "unfit", "conditional"} for item in blockers)
    status = "blocked" if severe or worker.get("work_eligibility_status") == "not_eligible" else "pending" if blockers else "ready" if not current else "fit" if site["fit_for_check_in"] else "pending"
    approved = [item for item in records if item.get("approval_status") == "approved" and _hours(item) > 0]
    finished_ids = {item["project_id"] for item in approved}
    return {
        "status": status, "eligibility_status": "eligible" if status == "fit" else "not_eligible" if status == "blocked" else "pending",
        "scope": "project" if current else "base", "project_id": current["id"] if current else None,
        "fit_for_check_in": bool(current and site["fit_for_check_in"]), "requirements": rows,
        "valid_count": site["valid_count"], "total_count": site["total_count"], "registered_at": worker.get("registered_at"),
        "verified_hours": round(sum(_hours(item) for item in approved), 1),
        "pending_hours": round(sum(_hours(item) for item in records if item.get("approval_status", "pending") == "pending"), 1),
        "check_in_count": len(records), "completed_projects": sum(item.get("status") == "completed" and item["id"] in finished_ids for item in assigned),
        "active_attendance_id": active.get("id") if active else None, "check_in_at": active.get("check_in") if active else None,
        "site_evaluations": [{"project_id": item["id"], **wallet_project_compliance(worker, item, today=today)} for item in assigned],
    }
