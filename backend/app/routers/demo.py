from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.demo_store import (
    COMPANIES,
    MESSAGES,
    PROJECTS,
    TEAMS,
    WORKERS,
    new_id,
    team_response,
    worker_by_id,
)


router = APIRouter(tags=["Demo operations"])


class TeamPayload(BaseModel):
    name: str
    description: str | None = None
    specialty: str | None = None
    status: str = "available"
    country: str | None = None
    city: str | None = None
    project_id: str | None = None
    leader_id: str | None = None


class ProjectPayload(BaseModel):
    name: str
    location: str
    status: str = "planning"
    progress: int = 0
    workers: int = 0
    deadline: str | None = None
    budget: float = 0


@router.get("/demo")
async def demo_overview():
    return {
        "workers": len(WORKERS),
        "companies": len(COMPANIES),
        "projects": len(PROJECTS),
        "teams": len(TEAMS),
    }


@router.get("/companies")
async def companies():
    return COMPANIES


@router.get("/company/workers")
async def company_workers(q: str = Query(default="")):
    query = q.strip().lower()
    if not query:
        return WORKERS
    return [
        worker
        for worker in WORKERS
        if query in " ".join(
            [
                worker["name"],
                worker["specialty"],
                worker["country"],
                " ".join(worker["skills"]),
            ]
        ).lower()
    ]


@router.get("/company/projects")
async def company_projects():
    return PROJECTS


@router.post("/company/projects")
async def create_project(payload: ProjectPayload):
    project = {
        "id": new_id("p"),
        "company_id": "c1",
        **payload.model_dump(),
    }
    PROJECTS.append(project)
    return project


@router.post("/company/projects/{project_id}/update")
async def update_project(project_id: str, payload: ProjectPayload):
    project = next((item for item in PROJECTS if item["id"] == project_id), None)
    if not project:
        raise HTTPException(status_code=404, detail="Obra não encontrada.")
    project.update(payload.model_dump())
    return project


@router.post("/company/projects/{project_id}/delete")
async def delete_project(project_id: str):
    index = next(
        (index for index, item in enumerate(PROJECTS) if item["id"] == project_id),
        None,
    )
    if index is None:
        raise HTTPException(status_code=404, detail="Obra não encontrada.")
    PROJECTS.pop(index)
    return {"ok": True}


@router.get("/company/messages")
async def company_messages():
    return MESSAGES


@router.get("/teams")
async def teams():
    return [team_response(team) for team in TEAMS]


@router.get("/teams/available-workers")
async def available_workers(q: str = Query(default="")):
    query = q.strip().lower()
    if not query:
        return WORKERS
    return [
        worker
        for worker in WORKERS
        if query in " ".join(
            [
                worker["name"],
                worker["specialty"],
                worker["country"],
            ]
        ).lower()
    ]


@router.post("/teams")
async def create_team(payload: TeamPayload):
    team = {
        "id": new_id("t"),
        "company_id": "c1",
        "member_ids": [],
        **payload.model_dump(),
    }
    TEAMS.append(team)
    return team_response(team)


def get_team(team_id: str):
    team = next((item for item in TEAMS if item["id"] == team_id), None)
    if not team:
        raise HTTPException(status_code=404, detail="Equipa não encontrada.")
    return team


@router.post("/teams/{team_id}/update")
async def update_team(team_id: str, payload: TeamPayload):
    team = get_team(team_id)
    team.update(payload.model_dump())
    return team_response(team)


@router.post("/teams/{team_id}/delete")
async def delete_team(team_id: str):
    team = get_team(team_id)
    TEAMS.remove(team)
    return {"ok": True}


@router.post("/teams/{team_id}/members/{worker_id}")
async def add_member(team_id: str, worker_id: str):
    team = get_team(team_id)
    if not worker_by_id(worker_id):
        raise HTTPException(status_code=404, detail="Trabalhador não encontrado.")
    if worker_id not in team["member_ids"]:
        team["member_ids"].append(worker_id)
    return team_response(team)


@router.post("/teams/{team_id}/remove-member/{worker_id}")
async def remove_member(team_id: str, worker_id: str):
    team = get_team(team_id)
    if worker_id in team["member_ids"]:
        team["member_ids"].remove(worker_id)
    if team.get("leader_id") == worker_id:
        team["leader_id"] = None
    return team_response(team)


@router.post("/teams/{team_id}/leader/{worker_id}")
async def set_leader(team_id: str, worker_id: str):
    team = get_team(team_id)
    if not worker_by_id(worker_id):
        raise HTTPException(status_code=404, detail="Trabalhador não encontrado.")
    if worker_id not in team["member_ids"]:
        team["member_ids"].append(worker_id)
    team["leader_id"] = worker_id
    return team_response(team)


@router.post("/teams/{team_id}/status/{status}")
async def set_status(team_id: str, status: str):
    if status not in {"available", "in_project", "inactive"}:
        raise HTTPException(status_code=400, detail="Estado inválido.")
    team = get_team(team_id)
    team["status"] = status
    return team_response(team)
