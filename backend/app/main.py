"""WORKLY demonstration API.

The API is intentionally self-contained: it runs locally with Uvicorn and as a
Vercel FastAPI function. Demo mutations live for the lifetime of the process;
the Expo client also keeps a versioned local snapshot so browser refreshes keep
the demonstration state.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import math
import os
import threading
import time
import uuid
from copy import deepcopy
from typing import Annotated, Any

from fastapi import Depends, FastAPI, Header, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field

from .demo_data import (
    COMPANY_DEMO_EMAIL,
    DEMO_PASSWORD,
    WORKER_DEMO_EMAIL,
    fresh_demo_state,
)


API_PREFIX = "/api"
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14
GEOFENCE_RADIUS_M = 250.0
TOKEN_SECRET = os.getenv(
    "WORKLY_TOKEN_SECRET",
    "workly-demo-signing-key-not-for-production",
).encode("utf-8")

app = FastAPI(
    title="WORKLY API",
    version="1.0.0-demo",
    description="API funcional da demonstração WORKLY.",
)

configured_origins = [
    value.strip()
    for value in os.getenv(
        "WORKLY_CORS_ORIGINS",
        "http://localhost:8081,http://127.0.0.1:8081,"
        "http://localhost:19006,http://127.0.0.1:19006",
    ).split(",")
    if value.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=configured_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

_state_lock = threading.RLock()
_state = fresh_demo_state()
_registered_users: dict[str, dict[str, Any]] = {}


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    user_type: str | None = None
    role: str | None = None


class RegisterInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    user_type: str | None = None
    role: str | None = None


class EntityPatch(BaseModel):
    data: dict[str, Any]


class TeamInput(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    specialty: str = ""
    description: str = ""
    status: str = "available"
    leader_id: str | None = None
    member_ids: list[str] = Field(default_factory=list)
    project_id: str | None = None


class ProjectInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    client: str = ""
    description: str = ""
    location: str
    status: str = "planned"
    progress: int = Field(default=0, ge=0, le=100)
    start_date: str
    end_date: str
    schedule: str = "08:00–17:00"
    team_ids: list[str] = Field(default_factory=list)
    worker_ids: list[str] = Field(default_factory=list)


class AssignmentInput(BaseModel):
    worker_id: str | None = None
    team_id: str | None = None


class AttendanceInput(BaseModel):
    project_id: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    location_mode: str = "demo"
    note: str = ""


class ContractSignInput(BaseModel):
    signature: str = Field(min_length=2, max_length=120)


def _b64encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64decode(raw: str) -> bytes:
    return base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4))


def _issue_token(user: dict[str, Any]) -> str:
    payload = {
        "sub": user["id"],
        "name": user["name"],
        "email": user["email"],
        "role": user["role"],
        "company_id": user.get("company_id"),
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    encoded = _b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    signature = _b64encode(
        hmac.new(TOKEN_SECRET, encoded.encode("ascii"), hashlib.sha256).digest()
    )
    return f"{encoded}.{signature}"


def _decode_token(token: str) -> dict[str, Any]:
    try:
        encoded, supplied_signature = token.split(".", 1)
        expected_signature = _b64encode(
            hmac.new(TOKEN_SECRET, encoded.encode("ascii"), hashlib.sha256).digest()
        )
        if not hmac.compare_digest(supplied_signature, expected_signature):
            raise ValueError("signature")
        payload = json.loads(_b64decode(encoded))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("expired")
        if payload.get("role") not in {"worker", "company"}:
            raise ValueError("role")
        return payload
    except (ValueError, TypeError, json.JSONDecodeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sessão inválida ou expirada.",
        ) from exc


def _password_record(password: str) -> dict[str, str]:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 180_000)
    return {"salt": _b64encode(salt), "digest": _b64encode(digest)}


def _password_matches(password: str, record: dict[str, str]) -> bool:
    salt = _b64decode(record["salt"])
    expected = _b64decode(record["digest"])
    supplied = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, 180_000
    )
    return hmac.compare_digest(supplied, expected)


def _public_auth_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        key: value
        for key, value in user.items()
        if key not in {"password_record"}
    }


def _login_response(user: dict[str, Any]) -> dict[str, Any]:
    public_user = _public_auth_user(user)
    return {
        "access_token": _issue_token(public_user),
        "token_type": "bearer",
        "user_id": public_user["id"],
        "name": public_user["name"],
        "email": public_user["email"],
        "user_type": public_user["role"],
        "company_id": public_user.get("company_id"),
        "user": public_user,
    }


def _demo_auth_user(email: str) -> dict[str, Any] | None:
    with _state_lock:
        if email == WORKER_DEMO_EMAIL:
            worker = next(
                item for item in _state["workers"] if item["id"] == "worker-1"
            )
            return deepcopy(worker)
        if email == COMPANY_DEMO_EMAIL:
            company = next(
                item for item in _state["companies"] if item["id"] == "company-1"
            )
            user = deepcopy(company)
            user["company_id"] = company["id"]
            return user
    return None


def _role_from_input(user_type: str | None, role: str | None) -> str:
    resolved = (user_type or role or "").strip().lower()
    if resolved not in {"worker", "company"}:
        raise HTTPException(status_code=422, detail="Escolha Worker ou Company.")
    return resolved


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inicie sessão para continuar.",
        )
    return _decode_token(authorization.split(" ", 1)[1].strip())


def _require_role(user: dict[str, Any], role: str) -> None:
    if user["role"] != role:
        raise HTTPException(status_code=403, detail="Ação não autorizada para este perfil.")


def _find(collection: str, entity_id: str) -> dict[str, Any]:
    try:
        return next(item for item in _state[collection] if item["id"] == entity_id)
    except StopIteration as exc:
        raise HTTPException(status_code=404, detail="Registo não encontrado.") from exc


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _distance_meters(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    earth_radius = 6_371_000.0
    latitude_delta = math.radians(latitude_b - latitude_a)
    longitude_delta = math.radians(longitude_b - longitude_a)
    value = (
        math.sin(latitude_delta / 2) ** 2
        + math.cos(math.radians(latitude_a))
        * math.cos(math.radians(latitude_b))
        * math.sin(longitude_delta / 2) ** 2
    )
    return earth_radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def _company_id_for_worker(worker_id: str, project_id: str | None) -> str | None:
    if project_id:
        project = next(
            (item for item in _state["projects"] if item["id"] == project_id),
            None,
        )
        if project:
            return project["company_id"]
    worker = _find("workers", worker_id)
    return worker.get("company_id")


@app.get(f"{API_PREFIX}/health", tags=["System"])
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "WORKLY API",
        "version": "1.0.0-demo",
        "data_version": _state["version"],
    }


@app.post(f"{API_PREFIX}/auth/login", tags=["Authentication"])
def login(data: LoginInput) -> dict[str, Any]:
    email = str(data.email).strip().lower()
    requested_role = _role_from_input(data.user_type, data.role)
    demo_user = _demo_auth_user(email)
    if demo_user:
        if data.password != DEMO_PASSWORD:
            raise HTTPException(status_code=401, detail="Email ou password incorretos.")
        if demo_user["role"] != requested_role:
            raise HTTPException(status_code=403, detail="A conta não pertence a esse perfil.")
        return _login_response(demo_user)

    registered = _registered_users.get(email)
    if not registered or not _password_matches(data.password, registered["password_record"]):
        raise HTTPException(status_code=401, detail="Email ou password incorretos.")
    if registered["role"] != requested_role:
        raise HTTPException(status_code=403, detail="A conta não pertence a esse perfil.")
    return _login_response(registered)


@app.post(f"{API_PREFIX}/auth/register", tags=["Authentication"])
def register(data: RegisterInput) -> dict[str, Any]:
    email = str(data.email).strip().lower()
    role = _role_from_input(data.user_type, data.role)
    if email in {WORKER_DEMO_EMAIL, COMPANY_DEMO_EMAIL} or email in _registered_users:
        raise HTTPException(status_code=409, detail="Este email já está registado.")
    user_id = f"{role}-{uuid.uuid4().hex[:10]}"
    user = {
        "id": user_id,
        "name": data.name.strip(),
        "email": email,
        "role": role,
        "company_id": user_id if role == "company" else None,
        "avatar": "",
        "title": "Novo trabalhador" if role == "worker" else "Nova empresa",
        "trust_score": 5.0,
        "productivity_score": 5.0,
        "password_record": _password_record(data.password),
    }
    _registered_users[email] = user
    with _state_lock:
        if role == "worker":
            _state["workers"].append(
                {
                    **_public_auth_user(user),
                    "avatar_color": "#1B6CFF",
                    "age": 18,
                    "country": "Portugal",
                    "flag": "🇵🇹",
                    "profession": "Novo trabalhador",
                    "experience_years": 0,
                    "location": "Portugal",
                    "phone": "",
                    "bio": "Perfil criado na demonstração WORKLY.",
                    "skills": [],
                    "certificates": [],
                    "availability": True,
                    "status": "available",
                    "rating": 5.0,
                    "best_projects": [],
                    "documents": [],
                    "languages": ["Português"],
                    "current_project_id": None,
                    "schedule": "08:00–17:00",
                }
            )
        else:
            _state["companies"].append(
                {
                    **_public_auth_user(user),
                    "avatar_color": "#FF3B30",
                    "industry": "Nova empresa",
                    "description": "Perfil criado na demonstração WORKLY.",
                    "location": "Portugal",
                    "phone": "",
                    "website": "",
                    "tax_id": "",
                    "documents": [],
                }
            )
    return _login_response(user)


@app.get(f"{API_PREFIX}/auth/me", tags=["Authentication"])
def me(user: Annotated[dict[str, Any], Depends(get_current_user)]) -> dict[str, Any]:
    current = _demo_auth_user(user["email"])
    if current:
        if current["role"] == "company":
            current["company_id"] = current["id"]
        return current
    registered = _registered_users.get(user["email"])
    return _public_auth_user(registered or user)


@app.get(f"{API_PREFIX}/bootstrap", tags=["Demo"])
def bootstrap(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    with _state_lock:
        payload = deepcopy(_state)
    current = _demo_auth_user(user["email"]) or _registered_users.get(user["email"]) or user
    payload["current_user"] = _public_auth_user(current)
    payload["demo"] = {
        "worker_email": WORKER_DEMO_EMAIL,
        "company_email": COMPANY_DEMO_EMAIL,
        "password": DEMO_PASSWORD,
        "persistence": "client_snapshot",
    }
    return payload


@app.post(f"{API_PREFIX}/seed", tags=["Demo"])
@app.post(f"{API_PREFIX}/demo/reset", tags=["Demo"])
def reset_demo(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    del user
    global _state
    with _state_lock:
        _state = fresh_demo_state()
    return {"ok": True, "version": _state["version"], "state": deepcopy(_state)}


@app.get(f"{API_PREFIX}/workers", tags=["Workers"])
def list_workers(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    q: str = Query(default="", max_length=80),
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[dict[str, Any]]:
    del user
    query = q.strip().lower()
    with _state_lock:
        workers = deepcopy(_state["workers"])
    if query:
        workers = [
            item
            for item in workers
            if query
            in " ".join(
                [
                    item.get("name", ""),
                    item.get("profession", ""),
                    item.get("country", ""),
                    item.get("location", ""),
                    " ".join(skill["name"] for skill in item.get("skills", [])),
                ]
            ).lower()
        ]
    if status_filter:
        workers = [item for item in workers if item.get("status") == status_filter]
    return workers


@app.get(f"{API_PREFIX}/workers/{{worker_id}}", tags=["Workers"])
def get_worker(
    worker_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    del user
    with _state_lock:
        return deepcopy(_find("workers", worker_id))


@app.patch(f"{API_PREFIX}/workers/{{worker_id}}", tags=["Workers"])
def update_worker(
    worker_id: str,
    patch: EntityPatch,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    if user["role"] == "worker" and user["sub"] != worker_id:
        raise HTTPException(status_code=403, detail="Só pode editar o seu perfil.")
    allowed = {
        "name",
        "age",
        "country",
        "profession",
        "title",
        "experience_years",
        "location",
        "phone",
        "bio",
        "skills",
        "availability",
        "status",
        "trust_score",
        "productivity_score",
        "best_projects",
        "certificates",
        "languages",
    }
    clean_patch = {key: value for key, value in patch.data.items() if key in allowed}
    with _state_lock:
        worker = _find("workers", worker_id)
        worker.update(clean_patch)
        return deepcopy(worker)


@app.get(f"{API_PREFIX}/companies", tags=["Companies"])
def list_companies(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    del user
    with _state_lock:
        return deepcopy(_state["companies"])


@app.get(f"{API_PREFIX}/companies/{{company_id}}", tags=["Companies"])
def get_company(
    company_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    del user
    with _state_lock:
        return deepcopy(_find("companies", company_id))


@app.patch(f"{API_PREFIX}/companies/{{company_id}}", tags=["Companies"])
def update_company(
    company_id: str,
    patch: EntityPatch,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    if user.get("company_id") != company_id:
        raise HTTPException(status_code=403, detail="Só pode editar a sua empresa.")
    allowed = {
        "name",
        "industry",
        "description",
        "location",
        "phone",
        "website",
        "tax_id",
    }
    clean_patch = {key: value for key, value in patch.data.items() if key in allowed}
    with _state_lock:
        company = _find("companies", company_id)
        company.update(clean_patch)
        return deepcopy(company)


@app.get(f"{API_PREFIX}/teams", tags=["Teams"])
def list_teams(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    with _state_lock:
        teams = deepcopy(_state["teams"])
    if user["role"] == "company":
        return [item for item in teams if item["company_id"] == user.get("company_id")]
    return [item for item in teams if user["sub"] in item.get("member_ids", [])]


@app.post(f"{API_PREFIX}/teams", tags=["Teams"])
def create_team(
    data: TeamInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    team = {
        "id": f"team-{uuid.uuid4().hex[:8]}",
        "company_id": user["company_id"],
        **data.model_dump(),
    }
    if team["leader_id"] and team["leader_id"] not in team["member_ids"]:
        team["member_ids"].insert(0, team["leader_id"])
    with _state_lock:
        _state["teams"].append(team)
    return deepcopy(team)


@app.patch(f"{API_PREFIX}/teams/{{team_id}}", tags=["Teams"])
def update_team(
    team_id: str,
    patch: EntityPatch,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    allowed = {
        "name",
        "specialty",
        "description",
        "status",
        "leader_id",
        "member_ids",
        "project_id",
    }
    with _state_lock:
        team = _find("teams", team_id)
        if team["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Equipa de outra empresa.")
        team.update({key: value for key, value in patch.data.items() if key in allowed})
        if team.get("leader_id") and team["leader_id"] not in team["member_ids"]:
            team["member_ids"].insert(0, team["leader_id"])
        return deepcopy(team)


@app.delete(f"{API_PREFIX}/teams/{{team_id}}", tags=["Teams"])
def delete_team(
    team_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, bool]:
    _require_role(user, "company")
    with _state_lock:
        team = _find("teams", team_id)
        if team["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Equipa de outra empresa.")
        _state["teams"] = [item for item in _state["teams"] if item["id"] != team_id]
        for project in _state["projects"]:
            project["team_ids"] = [
                item for item in project.get("team_ids", []) if item != team_id
            ]
    return {"ok": True}


@app.post(f"{API_PREFIX}/teams/{{team_id}}/members", tags=["Teams"])
def add_team_member(
    team_id: str,
    data: AssignmentInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    if not data.worker_id:
        raise HTTPException(status_code=422, detail="Escolha um trabalhador.")
    with _state_lock:
        _find("workers", data.worker_id)
        team = _find("teams", team_id)
        if team["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Equipa de outra empresa.")
        if data.worker_id not in team["member_ids"]:
            team["member_ids"].append(data.worker_id)
        return deepcopy(team)


@app.delete(
    f"{API_PREFIX}/teams/{{team_id}}/members/{{worker_id}}",
    tags=["Teams"],
)
def remove_team_member(
    team_id: str,
    worker_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    with _state_lock:
        team = _find("teams", team_id)
        if team["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Equipa de outra empresa.")
        team["member_ids"] = [
            item for item in team["member_ids"] if item != worker_id
        ]
        if team.get("leader_id") == worker_id:
            team["leader_id"] = team["member_ids"][0] if team["member_ids"] else None
        return deepcopy(team)


@app.post(f"{API_PREFIX}/teams/{{team_id}}/leader", tags=["Teams"])
def set_team_leader(
    team_id: str,
    data: AssignmentInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    if not data.worker_id:
        raise HTTPException(status_code=422, detail="Escolha um líder.")
    with _state_lock:
        _find("workers", data.worker_id)
        team = _find("teams", team_id)
        if team["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Equipa de outra empresa.")
        if data.worker_id not in team["member_ids"]:
            team["member_ids"].append(data.worker_id)
        team["leader_id"] = data.worker_id
        return deepcopy(team)


@app.get(f"{API_PREFIX}/projects", tags=["Projects"])
def list_projects(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    with _state_lock:
        projects = deepcopy(_state["projects"])
    if user["role"] == "company":
        return [
            item for item in projects if item["company_id"] == user.get("company_id")
        ]
    return [item for item in projects if user["sub"] in item.get("worker_ids", [])]


@app.get(f"{API_PREFIX}/projects/{{project_id}}", tags=["Projects"])
def get_project(
    project_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    del user
    with _state_lock:
        return deepcopy(_find("projects", project_id))


@app.post(f"{API_PREFIX}/projects", tags=["Projects"])
def create_project(
    data: ProjectInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    project = {
        "id": f"project-{uuid.uuid4().hex[:8]}",
        "company_id": user["company_id"],
        "latitude": None,
        "longitude": None,
        **data.model_dump(),
    }
    with _state_lock:
        _state["projects"].append(project)
    return deepcopy(project)


@app.patch(f"{API_PREFIX}/projects/{{project_id}}", tags=["Projects"])
def update_project(
    project_id: str,
    patch: EntityPatch,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    allowed = {
        "name",
        "client",
        "description",
        "location",
        "status",
        "progress",
        "start_date",
        "end_date",
        "schedule",
        "team_ids",
        "worker_ids",
    }
    with _state_lock:
        project = _find("projects", project_id)
        if project["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Obra de outra empresa.")
        project.update(
            {key: value for key, value in patch.data.items() if key in allowed}
        )
        return deepcopy(project)


@app.delete(f"{API_PREFIX}/projects/{{project_id}}", tags=["Projects"])
def delete_project(
    project_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, bool]:
    _require_role(user, "company")
    with _state_lock:
        project = _find("projects", project_id)
        if project["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Obra de outra empresa.")
        _state["projects"] = [
            item for item in _state["projects"] if item["id"] != project_id
        ]
        for team in _state["teams"]:
            if team.get("project_id") == project_id:
                team["project_id"] = None
                team["status"] = "available"
    return {"ok": True}


@app.post(f"{API_PREFIX}/projects/{{project_id}}/assign", tags=["Projects"])
def assign_to_project(
    project_id: str,
    data: AssignmentInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "company")
    if not data.worker_id and not data.team_id:
        raise HTTPException(status_code=422, detail="Escolha uma equipa ou trabalhador.")
    with _state_lock:
        project = _find("projects", project_id)
        if project["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Obra de outra empresa.")
        if data.worker_id:
            _find("workers", data.worker_id)
            if data.worker_id not in project["worker_ids"]:
                project["worker_ids"].append(data.worker_id)
        if data.team_id:
            team = _find("teams", data.team_id)
            if team["company_id"] != user["company_id"]:
                raise HTTPException(status_code=403, detail="Equipa de outra empresa.")
            if data.team_id not in project["team_ids"]:
                project["team_ids"].append(data.team_id)
            team["project_id"] = project_id
            team["status"] = "on_site" if project["status"] == "active" else "assigned"
        return deepcopy(project)


@app.get(f"{API_PREFIX}/attendance", tags=["Attendance"])
def list_attendance(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    with _state_lock:
        records = deepcopy(_state["attendance"])
    if user["role"] == "worker":
        return [item for item in records if item["worker_id"] == user["sub"]]
    return [
        item for item in records if item.get("company_id") == user.get("company_id")
    ]


@app.post(f"{API_PREFIX}/attendance/check-in", tags=["Attendance"])
@app.post(f"{API_PREFIX}/checkin", tags=["Attendance"])
def check_in(
    data: AttendanceInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "worker")
    with _state_lock:
        active = next(
            (
                item
                for item in _state["attendance"]
                if item["worker_id"] == user["sub"] and item["check_out"] is None
            ),
            None,
        )
        if active:
            raise HTTPException(status_code=409, detail="Já existe uma entrada ativa.")
        worker = _find("workers", user["sub"])
        project_id = data.project_id or worker.get("current_project_id")
        if not project_id:
            assigned = next(
                (
                    item
                    for item in _state["projects"]
                    if user["sub"] in item.get("worker_ids", [])
                ),
                None,
            )
            project_id = assigned["id"] if assigned else None
        if not project_id:
            raise HTTPException(status_code=422, detail="Não existe obra atribuída.")
        project = _find("projects", project_id)
        distance_m: float | None = None
        within_geofence: bool | None = None
        if data.location_mode == "gps":
            if data.latitude is None or data.longitude is None:
                raise HTTPException(
                    status_code=422,
                    detail="Localização GPS incompleta para validar a entrada.",
                )
            project_latitude = project.get("latitude")
            project_longitude = project.get("longitude")
            if project_latitude is not None and project_longitude is not None:
                distance_m = _distance_meters(
                    data.latitude,
                    data.longitude,
                    float(project_latitude),
                    float(project_longitude),
                )
                within_geofence = distance_m <= GEOFENCE_RADIUS_M
                if not within_geofence:
                    raise HTTPException(
                        status_code=422,
                        detail=(
                            "Check-in fora da zona autorizada da obra "
                            f"({round(distance_m)} m; máximo {round(GEOFENCE_RADIUS_M)} m)."
                        ),
                    )
        record = {
            "id": f"attendance-{uuid.uuid4().hex[:10]}",
            "worker_id": user["sub"],
            "company_id": _company_id_for_worker(user["sub"], project_id),
            "project_id": project_id,
            "check_in": _now_iso(),
            "check_out": None,
            "location_mode": data.location_mode,
            "latitude": data.latitude
            if data.latitude is not None
            else project.get("latitude"),
            "longitude": data.longitude
            if data.longitude is not None
            else project.get("longitude"),
            "distance_m": distance_m,
            "within_geofence": within_geofence,
            "note": data.note or "Entrada registada na demonstração.",
        }
        _state["attendance"].insert(0, record)
        worker["status"] = "on_site"
        worker["availability"] = False
        worker["current_project_id"] = project_id
        return deepcopy(record)


@app.post(f"{API_PREFIX}/attendance/check-out", tags=["Attendance"])
@app.post(f"{API_PREFIX}/checkout", tags=["Attendance"])
def check_out(
    data: AttendanceInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_role(user, "worker")
    del data
    with _state_lock:
        active = next(
            (
                item
                for item in _state["attendance"]
                if item["worker_id"] == user["sub"] and item["check_out"] is None
            ),
            None,
        )
        if not active:
            raise HTTPException(status_code=409, detail="Não existe entrada ativa.")
        active["check_out"] = _now_iso()
        worker = _find("workers", user["sub"])
        worker["status"] = "contracted" if worker.get("company_id") else "available"
        return deepcopy(active)


@app.get(f"{API_PREFIX}/contracts", tags=["Contracts"])
def list_contracts(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    with _state_lock:
        contracts = deepcopy(_state["contracts"])
    key = "worker_id" if user["role"] == "worker" else "company_id"
    target = user["sub"] if user["role"] == "worker" else user.get("company_id")
    return [item for item in contracts if item.get(key) == target]


@app.get(f"{API_PREFIX}/contracts/{{contract_id}}", tags=["Contracts"])
def get_contract(
    contract_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    with _state_lock:
        contract = _find("contracts", contract_id)
        allowed = (
            contract["worker_id"] == user["sub"]
            if user["role"] == "worker"
            else contract["company_id"] == user.get("company_id")
        )
        if not allowed:
            raise HTTPException(status_code=403, detail="Contrato não autorizado.")
        return deepcopy(contract)


@app.post(f"{API_PREFIX}/contracts/{{contract_id}}/sign", tags=["Contracts"])
def sign_contract(
    contract_id: str,
    data: ContractSignInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    with _state_lock:
        contract = _find("contracts", contract_id)
        if user["role"] == "worker":
            if contract["worker_id"] != user["sub"]:
                raise HTTPException(status_code=403, detail="Contrato não autorizado.")
            contract["signed_worker"] = True
        else:
            if contract["company_id"] != user.get("company_id"):
                raise HTTPException(status_code=403, detail="Contrato não autorizado.")
            contract["signed_company"] = True
        contract["signature"] = data.signature
        if contract["signed_worker"] and contract["signed_company"]:
            contract["status"] = "active"
        return deepcopy(contract)


@app.get(f"{API_PREFIX}/documents", tags=["Documents"])
def list_documents(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    owner_id: str | None = None,
) -> list[dict[str, Any]]:
    with _state_lock:
        documents: list[dict[str, Any]] = []
        for worker in _state["workers"]:
            documents.extend(deepcopy(worker.get("documents", [])))
        for company in _state["companies"]:
            documents.extend(deepcopy(company.get("documents", [])))
    if owner_id:
        return [item for item in documents if item.get("owner_id") == owner_id]
    if user["role"] == "worker":
        return [item for item in documents if item.get("owner_id") == user["sub"]]
    own_company_id = user.get("company_id")
    associated_worker_ids = {
        item["id"]
        for item in _state["workers"]
        if item.get("company_id") == own_company_id
    }
    return [
        item
        for item in documents
        if item.get("owner_id") == own_company_id
        or item.get("owner_id") in associated_worker_ids
    ]


@app.get(f"{API_PREFIX}/certificates", tags=["Documents"])
def list_certificates(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    worker_id: str | None = None,
) -> list[dict[str, Any]]:
    target_id = worker_id or (user["sub"] if user["role"] == "worker" else None)
    with _state_lock:
        workers = deepcopy(_state["workers"])
    if target_id:
        worker = next((item for item in workers if item["id"] == target_id), None)
        if not worker:
            raise HTTPException(status_code=404, detail="Trabalhador não encontrado.")
        return worker.get("certificates", [])
    certificates: list[dict[str, Any]] = []
    for worker in workers:
        for certificate in worker.get("certificates", []):
            certificates.append({**certificate, "worker_id": worker["id"]})
    return certificates


@app.get(f"{API_PREFIX}/best-projects", tags=["Workers"])
def list_best_projects(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    worker_id: str | None = None,
) -> list[dict[str, Any]]:
    target_id = worker_id or (user["sub"] if user["role"] == "worker" else None)
    if not target_id:
        return []
    with _state_lock:
        return deepcopy(_find("workers", target_id).get("best_projects", []))


@app.get(f"{API_PREFIX}/dashboard", tags=["Dashboard"])
def dashboard(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    with _state_lock:
        if user["role"] == "worker":
            worker = deepcopy(_find("workers", user["sub"]))
            projects = [
                deepcopy(item)
                for item in _state["projects"]
                if user["sub"] in item.get("worker_ids", [])
            ]
            attendance = [
                deepcopy(item)
                for item in _state["attendance"]
                if item["worker_id"] == user["sub"]
            ]
            return {
                "role": "worker",
                "profile": worker,
                "projects": projects,
                "attendance": attendance,
                "active_checkin": next(
                    (item for item in attendance if item["check_out"] is None),
                    None,
                ),
            }
        company_id = user.get("company_id")
        projects = [
            deepcopy(item)
            for item in _state["projects"]
            if item["company_id"] == company_id
        ]
        workers = [
            deepcopy(item)
            for item in _state["workers"]
            if item.get("company_id") == company_id
        ]
        attendance = [
            deepcopy(item)
            for item in _state["attendance"]
            if item.get("company_id") == company_id
        ]
        return {
            "role": "company",
            "company": deepcopy(_find("companies", company_id)),
            "projects": projects,
            "workers": workers,
            "attendance": attendance,
            "active_attendance": [
                item for item in attendance if item["check_out"] is None
            ],
        }


@app.get(f"{API_PREFIX}/search", tags=["Search"])
def search(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    q: str = "",
) -> dict[str, Any]:
    query = q.strip().lower()
    with _state_lock:
        if user["role"] == "company":
            results = deepcopy(_state["workers"])
            if query:
                results = [
                    item
                    for item in results
                    if query
                    in f"{item['name']} {item['profession']} {item['location']}".lower()
                ]
            return {"type": "workers", "results": results}
        results = deepcopy(_state["projects"])
        if query:
            results = [
                item
                for item in results
                if query
                in f"{item['name']} {item['client']} {item['location']}".lower()
            ]
        return {"type": "jobs", "results": results}


@app.get("/", include_in_schema=False)
def root() -> RedirectResponse:
    return RedirectResponse("/index.html", status_code=307)


@app.get("/{path:path}", include_in_schema=False)
def web_fallback(path: str) -> RedirectResponse:
    if path.startswith("api/"):
        raise HTTPException(status_code=404, detail="Endpoint não encontrado.")
    return RedirectResponse("/index.html", status_code=307)
