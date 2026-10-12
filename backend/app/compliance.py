from __future__ import annotations

from datetime import date, datetime
from typing import Any

# Baseline document checklist; employers configure additional site requirements.
DEFAULT_DOCUMENT_REQUIREMENTS = ["identity", "insurance", "medical"]
DEMO_CERTIFICATE_REQUIREMENTS = {"project-1": ["Trabalho em altura"], "project-2": ["Heavy Equipment Operator"]}
WARNING_DAYS = 60
CRITICAL_DAYS = 30
CONFIRMED_STATUSES = {"verified"}


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).strip().replace("Z", "+00:00")).date()
    except (ValueError, TypeError):
        return None


def _normalise(value: Any) -> str:
    return " ".join(str(value or "").strip().lower().split())


def project_requirements(project: dict[str, Any]) -> dict[str, list[str]]:
    configured = project.get("compliance_requirements") or {}
    documents = configured.get("documents", DEFAULT_DOCUMENT_REQUIREMENTS)
    certificates = configured.get("certificates", DEMO_CERTIFICATE_REQUIREMENTS.get(str(project.get("id") or ""), []))
    return {
        "documents": list(dict.fromkeys(str(item) for item in (documents or []) if str(item).strip())),
        "certificates": list(dict.fromkeys(str(item) for item in (certificates or []) if str(item).strip())),
    }


def _item_status(item: dict[str, Any], kind: str, today: date) -> str:
    status = _normalise(item.get("status"))
    if status in {"rejected", "invalid", "missing", "expired"}:
        return status
    expiry, issued = _parse_date(item.get("expires_at")), _parse_date(item.get("issued_at"))
    if (item.get("expires_at") and expiry is None) or (item.get("issued_at") and issued is None):
        return "invalid"
    if expiry and expiry < today:
        return "expired"
    if issued and issued > today:
        return "pending"
    if status not in ({"verified"} if kind == "certificate" else CONFIRMED_STATUSES):
        return "pending"
    if kind == "document" and item.get("category") == "medical":
        if item.get("fitness_decision") not in {"fit", "conditional", "unfit"}:
            return "pending"
        if item.get("fitness_decision") == "unfit":
            return "unfit"
        if item.get("fitness_decision") == "conditional":
            return "conditional"
    return "expiring" if expiry and (expiry - today).days <= WARNING_DAYS else "verified"


def evaluate_worker_compliance(worker: dict[str, Any], project: dict[str, Any], *, today: date | None = None) -> dict[str, Any]:
    current_date = today or date.today()
    requirements = project_requirements(project)
    items, issues = [], []
    for kind, required_values, collection in (
        ("document", requirements["documents"], worker.get("documents") or []),
        ("certificate", requirements["certificates"], worker.get("certificates") or []),
    ):
        for requirement in required_values:
            required = _normalise(requirement)
            candidates = [item for item in collection if (
                _normalise(item.get("category")) == required if kind == "document" else
                bool(_normalise(item.get("name"))) and (required in _normalise(item.get("name")) or _normalise(item.get("name")) in required)
            )]
            # A new unreviewed upload cannot hide a current confirmed document.
            candidate = max(candidates, key=lambda item: (
                _item_status(item, kind, current_date) in {"verified", "expiring"},
                str(item.get("updated_at") or item.get("issued_at") or ""),
            ), default=None)
            status = _item_status(candidate, kind, current_date) if candidate else "missing"
            expiry = _parse_date(candidate.get("expires_at")) if candidate else None
            days = (expiry - current_date).days if expiry else None
            row = {
                "kind": kind, "requirement": requirement,
                "label": (candidate.get("title") or candidate.get("name")) if candidate else requirement,
                "status": status, "document_id": candidate.get("id") if candidate else None,
                "file_id": candidate.get("file_id") if candidate else None,
                "file_name": candidate.get("file_name") if candidate else None,
                "expires_at": expiry.isoformat() if expiry else None, "days_remaining": days,
            }
            items.append(row)
            if status != "verified":
                severity = ("critical" if days is not None and days <= CRITICAL_DAYS else "warning") if status == "expiring" else "blocked"
                issues.append({**row, "code": status, "severity": severity})
    valid_items = sum(item["status"] in {"verified", "expiring"} for item in items)
    blocked = any(item["severity"] == "blocked" for item in issues)
    return {
        "worker_id": worker.get("id"), "project_id": project.get("id"),
        "status": "blocked" if blocked else "attention" if issues else "fit",
        "fit_for_check_in": not blocked, "score": round(valid_items / len(items) * 100) if items else 100,
        "valid_count": valid_items, "total_count": len(items),
        "requirements": requirements, "items": items, "issues": issues,
    }
