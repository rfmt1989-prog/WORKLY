"""Company access-control policy for WORKLY multi-tenant operations."""

from __future__ import annotations

from typing import Final


COMPANY_ACCESS_ROLES: Final[tuple[str, ...]] = (
    "admin",
    "manager",
    "hr",
    "supervisor",
)

PERMISSIONS_BY_ROLE: Final[dict[str, frozenset[str]]] = {
    "admin": frozenset(
        {
            "access.manage",
            "company.manage",
            "workers.read",
            "workers.manage",
            "teams.read",
            "teams.manage",
            "projects.read",
            "projects.manage",
            "attendance.read",
            "attendance.manage",
            "documents.read",
            "documents.manage",
            "operations.read",
        }
    ),
    "manager": frozenset(
        {
            "company.manage",
            "workers.read",
            "workers.manage",
            "teams.read",
            "teams.manage",
            "projects.read",
            "projects.manage",
            "attendance.read",
            "attendance.manage",
            "documents.read",
            "documents.manage",
            "operations.read",
        }
    ),
    "hr": frozenset(
        {
            "workers.read",
            "workers.manage",
            "projects.read",
            "attendance.read",
            "attendance.manage",
            "documents.read",
            "documents.manage",
            "operations.read",
        }
    ),
    "supervisor": frozenset(
        {
            "workers.read",
            "teams.read",
            "teams.manage",
            "projects.read",
            "attendance.read",
            "attendance.manage",
            "documents.read",
            "operations.read",
        }
    ),
}

ROLE_LABEL_KEYS: Final[dict[str, str]] = {
    "admin": "admin",
    "manager": "manager",
    "hr": "hr",
    "supervisor": "supervisor",
}


def normalize_company_access_role(value: str | None, default: str = "admin") -> str:
    role = (value or default).strip().lower()
    if role not in COMPANY_ACCESS_ROLES:
        raise ValueError(f"Unsupported company access role: {role}")
    return role


def permissions_for_role(role: str | None) -> list[str]:
    normalized = normalize_company_access_role(role)
    return sorted(PERMISSIONS_BY_ROLE[normalized])


def role_has_permission(role: str | None, permission: str) -> bool:
    normalized = normalize_company_access_role(role)
    return permission in PERMISSIONS_BY_ROLE[normalized]
