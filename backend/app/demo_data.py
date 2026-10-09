"""Blank deterministic demonstration data for the WORKLY profile builder."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone

DEMO_PASSWORD = "WorklyDemo!"
WORKER_DEMO_EMAIL = "worker.demo@workly.app"
COMPANY_DEMO_EMAIL = "company.demo@workly.app"
DEMO_GENERATION = "blank-worker-profile-v1"


def build_demo_state() -> dict:
    worker = {
        "id": "worker-1",
        "name": "",
        "email": WORKER_DEMO_EMAIL,
        "role": "worker",
        "avatar": "",
        "avatar_color": "#1B6CFF",
        "age": 0,
        "country": "",
        "flag": "",
        "profession": "",
        "title": "",
        "experience_years": 0,
        "work_experience": [],
        "location": "",
        "phone": "",
        "bio": "",
        "skills": [],
        "specialties": [],
        "certificates": [],
        "availability": False,
        "status": "available",
        "trust_score": 0.0,
        "productivity_score": 0.0,
        "rating": 0.0,
        "best_projects": [],
        "documents": [],
        "languages": [],
        "company_id": None,
        "current_project_id": None,
        "schedule": "",
    }

    company = {
        "id": "company-1",
        "name": "Company Demo",
        "email": COMPANY_DEMO_EMAIL,
        "role": "company",
        "avatar": "",
        "avatar_color": "#FF3B30",
        "industry": "",
        "description": "",
        "location": "",
        "phone": "",
        "website": "",
        "tax_id": "",
        "trust_score": 0.0,
        "productivity_score": 0.0,
        "documents": [],
    }

    return {
        "version": 1,
        "demo_generation": DEMO_GENERATION,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "workers": [worker],
        "companies": [company],
        "teams": [],
        "projects": [],
        "attendance": [],
        "contracts": [],
        "notifications": [],
    }


def fresh_demo_state() -> dict:
    return deepcopy(build_demo_state())
