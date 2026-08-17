from __future__ import annotations

from datetime import date, datetime
from typing import Any


DEFAULT_DOCUMENT_REQUIREMENTS = ["identity", "insurance", "medical"]
WARNING_DAYS = 60
CRITICAL_DAYS = 30


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    raw = str(value).strip()
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return date.fromisoformat(raw[:10])
        except ValueError:
            return None


def _normalise(value: Any) -> str:
    return " ".join(str(value or "").strip().lower().split())


def project_requirements(project: dict[str, Any]) -> dict[str, list[str]]:
    configured = project.get("compliance_requirements") or {}
    documents = configured.get("documents") or DEFAULT_DOCUMENT_REQUIREMENTS
    certificates = configured.get("certificates") or []
    return {
        "documents": [str(item) for item in documents],
        "certificates": [str(item) for item in certificates],
    }


def evaluate_worker_compliance(
    worker: dict[str, Any],
    project: dict[str, Any],
    *,
    today: date | None = None,
) -> dict[str, Any]:
    current_date = today or date.today()
    requirements = project_requirements(project)
    issues: list[dict[str, Any]] = []
    valid_items = 0
    total_items = len(requirements["documents"]) + len(requirements["certificates"])

    documents = worker.get("documents") or []
    for category in requirements["documents"]:
        document = next(
            (
                item
                for item in documents
                if _normalise(item.get("category")) == _normalise(category)
            ),
            None,
        )
        if not document:
            issues.append(
                {
                    "kind": "document",
                    "code": "missing",
                    "severity": "blocked",
                    "requirement": category,
                    "label": category,
                    "expires_at": None,
                    "days_remaining": None,
                }
            )
            continue
        status = _normalise(document.get("status"))
        if status in {"expired", "rejected", "invalid", "missing"}:
            issues.append(
                {
                    "kind": "document",
                    "code": status or "invalid",
                    "severity": "blocked",
                    "requirement": category,
                    "label": document.get("title") or category,
                    "expires_at": document.get("expires_at"),
                    "days_remaining": None,
                }
            )
            continue
        expiry = _parse_date(document.get("expires_at"))
        if expiry:
            days_remaining = (expiry - current_date).days
            if days_remaining < 0:
                issues.append(
                    {
                        "kind": "document",
                        "code": "expired",
                        "severity": "blocked",
                        "requirement": category,
                        "label": document.get("title") or category,
                        "expires_at": expiry.isoformat(),
                        "days_remaining": days_remaining,
                    }
                )
                continue
            if days_remaining <= WARNING_DAYS:
                issues.append(
                    {
                        "kind": "document",
                        "code": "expiring",
                        "severity": "critical" if days_remaining <= CRITICAL_DAYS else "warning",
                        "requirement": category,
                        "label": document.get("title") or category,
                        "expires_at": expiry.isoformat(),
                        "days_remaining": days_remaining,
                    }
                )
        valid_items += 1

    certificates = worker.get("certificates") or []
    for required_name in requirements["certificates"]:
        required = _normalise(required_name)
        certificate = next(
            (
                item
                for item in certificates
                if required in _normalise(item.get("name"))
                or _normalise(item.get("name")) in required
            ),
            None,
        )
        if not certificate:
            issues.append(
                {
                    "kind": "certificate",
                    "code": "missing",
                    "severity": "blocked",
                    "requirement": required_name,
                    "label": required_name,
                    "expires_at": None,
                    "days_remaining": None,
                }
            )
            continue
        status = _normalise(certificate.get("status"))
        expiry = _parse_date(certificate.get("expires_at"))
        if status in {"expired", "rejected", "invalid"} or (expiry and expiry < current_date):
            issues.append(
                {
                    "kind": "certificate",
                    "code": "expired" if expiry and expiry < current_date else status,
                    "severity": "blocked",
                    "requirement": required_name,
                    "label": certificate.get("name") or required_name,
                    "expires_at": expiry.isoformat() if expiry else certificate.get("expires_at"),
                    "days_remaining": (expiry - current_date).days if expiry else None,
                }
            )
            continue
        if expiry:
            days_remaining = (expiry - current_date).days
            if days_remaining <= WARNING_DAYS:
                issues.append(
                    {
                        "kind": "certificate",
                        "code": "expiring",
                        "severity": "critical" if days_remaining <= CRITICAL_DAYS else "warning",
                        "requirement": required_name,
                        "label": certificate.get("name") or required_name,
                        "expires_at": expiry.isoformat(),
                        "days_remaining": days_remaining,
                    }
                )
        valid_items += 1

    blocked = any(item["severity"] == "blocked" for item in issues)
    attention = any(item["severity"] in {"warning", "critical"} for item in issues)
    status = "blocked" if blocked else "attention" if attention else "fit"
    score = 100 if total_items == 0 else round((valid_items / total_items) * 100)

    return {
        "worker_id": worker.get("id"),
        "project_id": project.get("id"),
        "status": status,
        "fit_for_check_in": not blocked,
        "score": score,
        "requirements": requirements,
        "issues": issues,
    }
