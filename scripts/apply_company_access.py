from __future__ import annotations

from pathlib import Path
import re


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"Missing patch anchor: {label}")
    return text.replace(old, new, 1)


def replace_function(text: str, name: str, replacement: str) -> str:
    pattern = re.compile(
        rf'@app\.(?:get|post|patch|delete)\(.*?\)\ndef {name}\(.*?(?=\n\n@app\.)',
        re.S,
    )
    match = pattern.search(text)
    if not match:
        raise SystemExit(f"Could not locate function {name}")
    return text[: match.start()] + replacement.rstrip() + text[match.end() :]


main_path = Path("backend/app/main.py")
text = main_path.read_text()

text = replace_once(
    text,
    "import uuid\nfrom copy import deepcopy",
    "import uuid\nfrom copy import deepcopy\nfrom datetime import datetime, timedelta, timezone",
    "datetime imports",
)
text = replace_once(
    text,
    "from .persistence import PersistenceStore\n",
    "from .access_control import (\n"
    "    COMPANY_ACCESS_ROLES,\n"
    "    normalize_company_access_role,\n"
    "    permissions_for_role,\n"
    "    role_has_permission,\n"
    ")\n"
    "from .persistence import PersistenceStore\n",
    "access imports",
)
text = replace_once(
    text,
    "class RegisterInput(BaseModel):\n"
    "    name: str = Field(min_length=2, max_length=100)\n"
    "    email: EmailStr\n"
    "    password: str = Field(min_length=6, max_length=128)\n"
    "    user_type: str | None = None\n"
    "    role: str | None = None\n",
    "class RegisterInput(BaseModel):\n"
    "    name: str = Field(min_length=2, max_length=100)\n"
    "    email: EmailStr\n"
    "    password: str = Field(min_length=6, max_length=128)\n"
    "    user_type: str | None = None\n"
    "    role: str | None = None\n"
    "    invite_token: str | None = Field(default=None, max_length=120)\n",
    "register invite token",
)
text = replace_once(
    text,
    "class ContractSignInput(BaseModel):\n"
    "    signature: str = Field(min_length=2, max_length=120)\n",
    "class ContractSignInput(BaseModel):\n"
    "    signature: str = Field(min_length=2, max_length=120)\n\n\n"
    "class CompanyInvitationInput(BaseModel):\n"
    "    name: str = Field(min_length=2, max_length=100)\n"
    "    email: EmailStr\n"
    "    access_role: str = Field(default=\"manager\", max_length=30)\n\n\n"
    "class CompanyMemberPatch(BaseModel):\n"
    "    access_role: str = Field(max_length=30)\n",
    "company access models",
)
text = replace_once(
    text,
    '        "company_id": user.get("company_id"),\n'
    '        "exp": int(time.time()) + TOKEN_TTL_SECONDS,',
    '        "company_id": user.get("company_id"),\n'
    '        "company_role": user.get("company_role"),\n'
    '        "exp": int(time.time()) + TOKEN_TTL_SECONDS,',
    "token company role",
)
text = replace_once(
    text,
    "def _login_response(user: dict[str, Any]) -> dict[str, Any]:\n"
    "    public_user = _public_auth_user(user)\n",
    "def _login_response(user: dict[str, Any]) -> dict[str, Any]:\n"
    "    public_user = _enrich_auth_user(user)\n",
    "enriched login",
)
text = replace_once(
    text,
    '        "company_id": public_user.get("company_id"),\n'
    '        "user": public_user,',
    '        "company_id": public_user.get("company_id"),\n'
    '        "company_role": public_user.get("company_role"),\n'
    '        "permissions": public_user.get("permissions", []),\n'
    '        "user": public_user,',
    "login access response",
)

helpers = r'''

def _membership_id(company_id: str, user_id: str) -> str:
    return f"membership-{company_id}-{user_id}"


def _ensure_company_membership(user: dict[str, Any]) -> dict[str, Any] | None:
    if user.get("role") != "company":
        return None
    company_id = str(user.get("company_id") or user.get("id") or user.get("sub") or "")
    user_id = str(user.get("id") or user.get("sub") or "")
    if not company_id or not user_id:
        return None
    existing = _persistence.get_membership(company_id, user_id)
    if existing:
        return existing
    if user.get("access_revoked"):
        return None
    role = normalize_company_access_role(user.get("company_role"), "admin")
    return _persistence.upsert_membership(
        {
            "id": _membership_id(company_id, user_id),
            "company_id": company_id,
            "user_id": user_id,
            "email": str(user.get("email") or "").lower(),
            "name": str(user.get("name") or "WORKLY"),
            "access_role": role,
            "status": "active",
        }
    )


def _company_access_role(user: dict[str, Any]) -> str:
    if user.get("role") != "company":
        raise HTTPException(status_code=403, detail="Acesso reservado à empresa.")
    membership = _ensure_company_membership(user)
    if not membership or membership.get("status") != "active":
        raise HTTPException(status_code=403, detail="Acesso à empresa desativado.")
    return normalize_company_access_role(str(membership.get("access_role") or "admin"))


def _require_company_permission(user: dict[str, Any], permission: str) -> None:
    role = _company_access_role(user)
    if not role_has_permission(role, permission):
        raise HTTPException(status_code=403, detail="Sem permissão para esta operação.")


def _enrich_auth_user(user: dict[str, Any]) -> dict[str, Any]:
    public = _public_auth_user(user)
    if public.get("role") == "company":
        membership = _ensure_company_membership(public)
        if not membership or membership.get("status") != "active":
            raise HTTPException(status_code=403, detail="Acesso à empresa desativado.")
        public["company_id"] = membership["company_id"]
        public["company_role"] = membership["access_role"]
        public["permissions"] = permissions_for_role(membership["access_role"])
    else:
        public["permissions"] = []
    return public


def _company_worker_ids(company_id: str) -> set[str]:
    worker_ids = {
        str(item["id"])
        for item in _state["workers"]
        if item.get("company_id") == company_id
    }
    for project in _state["projects"]:
        if project.get("company_id") == company_id:
            worker_ids.update(str(item) for item in project.get("worker_ids", []))
    for team in _state["teams"]:
        if team.get("company_id") == company_id:
            worker_ids.update(str(item) for item in team.get("member_ids", []))
    for contract in _state["contracts"]:
        if contract.get("company_id") == company_id and contract.get("worker_id"):
            worker_ids.add(str(contract["worker_id"]))
    return worker_ids


def _company_ids_for_worker(worker_id: str) -> set[str]:
    company_ids = {
        str(item.get("company_id"))
        for item in _state["workers"]
        if item.get("id") == worker_id and item.get("company_id")
    }
    for project in _state["projects"]:
        if worker_id in project.get("worker_ids", []):
            company_ids.add(str(project["company_id"]))
    for contract in _state["contracts"]:
        if contract.get("worker_id") == worker_id:
            company_ids.add(str(contract["company_id"]))
    return company_ids


def _assert_worker_visible(user: dict[str, Any], worker_id: str) -> None:
    if user["role"] == "worker":
        if user["sub"] != worker_id:
            raise HTTPException(status_code=403, detail="Trabalhador não autorizado.")
        return
    _require_company_permission(user, "workers.read")
    if worker_id not in _company_worker_ids(str(user.get("company_id") or "")):
        raise HTTPException(status_code=403, detail="Trabalhador de outra empresa.")


def _assert_project_visible(user: dict[str, Any], project: dict[str, Any]) -> None:
    if user["role"] == "worker":
        if user["sub"] not in project.get("worker_ids", []):
            raise HTTPException(status_code=403, detail="Obra não autorizada.")
        return
    _require_company_permission(user, "projects.read")
    if project.get("company_id") != user.get("company_id"):
        raise HTTPException(status_code=403, detail="Obra de outra empresa.")


def _invitation_expired(invitation: dict[str, Any]) -> bool:
    raw = invitation.get("expires_at")
    if not raw:
        return True
    try:
        expires = datetime.fromisoformat(str(raw).replace("Z", "+00:00"))
    except ValueError:
        return True
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    return expires <= datetime.now(timezone.utc)


def _company_route_permission(method: str, path: str) -> str | None:
    method = method.upper()
    if path.startswith(f"{API_PREFIX}/company/"):
        return "access.manage" if method in {"POST", "PATCH", "DELETE"} else None
    if path.startswith(f"{API_PREFIX}/teams"):
        return "teams.manage" if method in {"POST", "PATCH", "DELETE"} else "teams.read"
    if path.startswith(f"{API_PREFIX}/projects"):
        return "projects.manage" if method in {"POST", "PATCH", "DELETE"} else "projects.read"
    if path.startswith(f"{API_PREFIX}/workers"):
        return "workers.manage" if method in {"PATCH", "POST", "DELETE"} else "workers.read"
    if path.startswith(f"{API_PREFIX}/attendance"):
        return "attendance.read" if method == "GET" else None
    if path.startswith(f"{API_PREFIX}/documents") or path.startswith(f"{API_PREFIX}/certificates"):
        return "documents.manage" if method in {"POST", "PATCH", "DELETE"} else "documents.read"
    if path.startswith(f"{API_PREFIX}/contracts"):
        return "documents.manage" if method in {"POST", "PATCH", "DELETE"} else "documents.read"
    if path.startswith(f"{API_PREFIX}/dashboard"):
        return "operations.read"
    if path.startswith(f"{API_PREFIX}/search"):
        return "workers.read"
    if path.startswith(f"{API_PREFIX}/companies") and method in {"PATCH", "POST", "DELETE"}:
        return "company.manage"
    return None
'''
text = replace_once(text, "def get_current_user(\n", helpers + "\n\ndef get_current_user(\n", "helper insertion")

middleware_anchor = '''@app.middleware("http")
async def persist_successful_mutations(request, call_next):
    """Persist successful API mutations without changing endpoint contracts."""
    response = await call_next(request)
    if (
        request.url.path.startswith(API_PREFIX)
        and request.method.upper() in {"POST", "PUT", "PATCH", "DELETE"}
        and response.status_code < 400
    ):
        with _state_lock:
            _persistence.save(_state, _registered_users)
    return response
'''
permission_middleware = middleware_anchor + r'''


@app.middleware("http")
async def enforce_company_permissions(request, call_next):
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        try:
            payload = _decode_token(authorization.split(" ", 1)[1].strip())
        except HTTPException:
            payload = None
        if payload and payload.get("role") == "company":
            permission = _company_route_permission(request.method, request.url.path)
            if permission:
                try:
                    _require_company_permission(payload, permission)
                except HTTPException as exc:
                    from fastapi.responses import JSONResponse
                    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return await call_next(request)
'''
text = replace_once(text, middleware_anchor, permission_middleware, "permission middleware")

register_pattern = re.compile(
    r'@app\.post\(f"\{API_PREFIX\}/auth/register".*?(?=\n\n@app\.get\(f"\{API_PREFIX\}/auth/me")',
    re.S,
)
register_replacement = r'''@app.post(f"{API_PREFIX}/auth/register", tags=["Authentication"])
def register(data: RegisterInput) -> dict[str, Any]:
    email = str(data.email).strip().lower()
    invite_token = (data.invite_token or "").strip()
    invitation = _persistence.get_invitation(invite_token) if invite_token else None
    if invitation:
        if invitation.get("status") != "pending" or _invitation_expired(invitation):
            raise HTTPException(status_code=410, detail="Convite expirado ou já utilizado.")
        if str(invitation.get("email") or "").lower() != email:
            raise HTTPException(status_code=403, detail="O convite pertence a outro email.")
        role = "company"
    else:
        role = _role_from_input(data.user_type, data.role)
        if invite_token:
            raise HTTPException(status_code=404, detail="Código de convite inválido.")
    if email in {WORKER_DEMO_EMAIL, COMPANY_DEMO_EMAIL} or email in _registered_users:
        raise HTTPException(status_code=409, detail="Este email já está registado.")

    if invitation:
        user_id = f"company-user-{uuid.uuid4().hex[:10]}"
        company_id = str(invitation["company_id"])
        company_role = normalize_company_access_role(str(invitation["access_role"]))
        display_name = data.name.strip() or str(invitation.get("name") or "WORKLY")
    else:
        user_id = f"{role}-{uuid.uuid4().hex[:10]}"
        company_id = user_id if role == "company" else None
        company_role = "admin" if role == "company" else None
        display_name = data.name.strip()

    user = {
        "id": user_id,
        "name": display_name,
        "email": email,
        "role": role,
        "company_id": company_id,
        "company_role": company_role,
        "avatar": "",
        "title": "Novo trabalhador" if role == "worker" else "Utilizador da empresa",
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
        elif not invitation:
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
    if role == "company":
        _persistence.upsert_membership(
            {
                "id": _membership_id(str(company_id), user_id),
                "company_id": str(company_id),
                "user_id": user_id,
                "email": email,
                "name": display_name,
                "access_role": str(company_role),
                "status": "active",
            }
        )
        if invitation:
            _persistence.consume_invitation(invite_token, user_id)
    return _login_response(user)
'''
text, count = register_pattern.subn(register_replacement, text, count=1)
if count != 1:
    raise SystemExit("Could not replace registration endpoint")

me_pattern = re.compile(
    r'@app\.get\(f"\{API_PREFIX\}/auth/me".*?(?=\n\n@app\.get\(f"\{API_PREFIX\}/bootstrap")',
    re.S,
)
me_and_access = r'''@app.get(f"{API_PREFIX}/auth/me", tags=["Authentication"])
def me(user: Annotated[dict[str, Any], Depends(get_current_user)]) -> dict[str, Any]:
    current = _demo_auth_user(user["email"])
    if current:
        if current["role"] == "company":
            current["company_id"] = current["id"]
        return _enrich_auth_user(current)
    registered = _registered_users.get(user["email"])
    return _enrich_auth_user(registered or user)


@app.get(f"{API_PREFIX}/company/access", tags=["Company Access"])
def company_access(user: Annotated[dict[str, Any], Depends(get_current_user)]) -> dict[str, Any]:
    role = _company_access_role(user)
    company_id = str(user.get("company_id") or "")
    members = [
        item for item in _persistence.list_memberships(company_id)
        if item.get("status") == "active"
    ]
    return {
        "current_role": role,
        "permissions": permissions_for_role(role),
        "members": members,
        "invitations": _persistence.list_invitations(company_id),
        "role_catalog": {item: permissions_for_role(item) for item in COMPANY_ACCESS_ROLES},
    }


@app.post(f"{API_PREFIX}/company/invitations", tags=["Company Access"])
def create_company_invitation(
    data: CompanyInvitationInput,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_company_permission(user, "access.manage")
    access_role = normalize_company_access_role(data.access_role)
    if access_role == "admin":
        raise HTTPException(status_code=422, detail="Crie o acesso e promova-o depois a Admin.")
    email = str(data.email).strip().lower()
    if email in {WORKER_DEMO_EMAIL, COMPANY_DEMO_EMAIL} or email in _registered_users:
        raise HTTPException(status_code=409, detail="Este email já possui uma conta WORKLY.")
    invitation = {
        "token": f"WLY-{uuid.uuid4().hex[:12].upper()}",
        "company_id": str(user.get("company_id") or ""),
        "email": email,
        "name": data.name.strip(),
        "access_role": access_role,
        "status": "pending",
        "invited_by": str(user["sub"]),
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
    }
    return _persistence.create_invitation(invitation)


@app.patch(f"{API_PREFIX}/company/members/{member_id}", tags=["Company Access"])
def update_company_member(
    member_id: str,
    patch: CompanyMemberPatch,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    _require_company_permission(user, "access.manage")
    if member_id == user["sub"]:
        raise HTTPException(status_code=409, detail="Não pode alterar a sua própria função.")
    company_id = str(user.get("company_id") or "")
    membership = _persistence.get_membership(company_id, member_id)
    if not membership or membership.get("status") != "active":
        raise HTTPException(status_code=404, detail="Membro não encontrado.")
    access_role = normalize_company_access_role(patch.access_role)
    membership["access_role"] = access_role
    updated = _persistence.upsert_membership(membership)
    for registered in _registered_users.values():
        if registered.get("id") == member_id:
            registered["company_role"] = access_role
    return updated


@app.delete(f"{API_PREFIX}/company/members/{member_id}", tags=["Company Access"])
def remove_company_member(
    member_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, bool]:
    _require_company_permission(user, "access.manage")
    if member_id == user["sub"]:
        raise HTTPException(status_code=409, detail="Não pode remover o seu próprio acesso.")
    company_id = str(user.get("company_id") or "")
    membership = _persistence.get_membership(company_id, member_id)
    if not membership or membership.get("status") != "active":
        raise HTTPException(status_code=404, detail="Membro não encontrado.")
    membership["status"] = "revoked"
    _persistence.upsert_membership(membership)
    for registered in _registered_users.values():
        if registered.get("id") == member_id:
            registered["access_revoked"] = True
    return {"ok": True}
'''
text, count = me_pattern.subn(me_and_access, text, count=1)
if count != 1:
    raise SystemExit("Could not replace /auth/me block")

text = replace_once(
    text,
    '    current = _demo_auth_user(user["email"]) or _registered_users.get(user["email"]) or user\n'
    '    payload["current_user"] = _public_auth_user(current)',
    '    current = _demo_auth_user(user["email"]) or _registered_users.get(user["email"]) or user\n'
    '    payload["current_user"] = _enrich_auth_user(current)',
    "bootstrap access data",
)

list_workers = r'''@app.get(f"{API_PREFIX}/workers", tags=["Workers"])
def list_workers(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    q: str = Query(default="", max_length=80),
    status_filter: str | None = Query(default=None, alias="status"),
) -> list[dict[str, Any]]:
    query = q.strip().lower()
    with _state_lock:
        workers = deepcopy(_state["workers"])
        if user["role"] == "company":
            visible = _company_worker_ids(str(user.get("company_id") or ""))
            workers = [item for item in workers if item["id"] in visible]
        else:
            workers = [item for item in workers if item["id"] == user["sub"]]
    if query:
        workers = [
            item for item in workers
            if query in " ".join([
                item.get("name", ""),
                item.get("profession", ""),
                item.get("country", ""),
                item.get("location", ""),
                " ".join(skill["name"] for skill in item.get("skills", [])),
            ]).lower()
        ]
    if status_filter:
        workers = [item for item in workers if item.get("status") == status_filter]
    return workers
'''
text = replace_function(text, "list_workers", list_workers)

get_worker = r'''@app.get(f"{API_PREFIX}/workers/{worker_id}", tags=["Workers"])
def get_worker(
    worker_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    with _state_lock:
        _assert_worker_visible(user, worker_id)
        return deepcopy(_find("workers", worker_id))
'''
text = replace_function(text, "get_worker", get_worker)

text = replace_once(
    text,
    '    if user["role"] == "worker" and user["sub"] != worker_id:\n'
    '        raise HTTPException(status_code=403, detail="Só pode editar o seu perfil.")',
    '    if user["role"] == "worker":\n'
    '        if user["sub"] != worker_id:\n'
    '            raise HTTPException(status_code=403, detail="Só pode editar o seu perfil.")\n'
    '    else:\n'
    '        _assert_worker_visible(user, worker_id)',
    "worker update tenant guard",
)

list_companies = r'''@app.get(f"{API_PREFIX}/companies", tags=["Companies"])
def list_companies(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> list[dict[str, Any]]:
    with _state_lock:
        companies = deepcopy(_state["companies"])
        if user["role"] == "company":
            own_id = str(user.get("company_id") or "")
            return [item for item in companies if item["id"] == own_id]
        visible = _company_ids_for_worker(str(user["sub"]))
        return [item for item in companies if item["id"] in visible]
'''
text = replace_function(text, "list_companies", list_companies)

get_company = r'''@app.get(f"{API_PREFIX}/companies/{company_id}", tags=["Companies"])
def get_company(
    company_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    with _state_lock:
        if user["role"] == "company":
            if company_id != user.get("company_id"):
                raise HTTPException(status_code=403, detail="Empresa não autorizada.")
        elif company_id not in _company_ids_for_worker(str(user["sub"])):
            raise HTTPException(status_code=403, detail="Empresa não autorizada.")
        return deepcopy(_find("companies", company_id))
'''
text = replace_function(text, "get_company", get_company)

get_project = r'''@app.get(f"{API_PREFIX}/projects/{project_id}", tags=["Projects"])
def get_project(
    project_id: str,
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    with _state_lock:
        project = _find("projects", project_id)
        _assert_project_visible(user, project)
        return deepcopy(project)
'''
text = replace_function(text, "get_project", get_project)

list_documents = r'''@app.get(f"{API_PREFIX}/documents", tags=["Documents"])
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
    if user["role"] == "worker":
        target = owner_id or str(user["sub"])
        if target != user["sub"]:
            raise HTTPException(status_code=403, detail="Documentos não autorizados.")
        return [item for item in documents if item.get("owner_id") == target]
    company_id = str(user.get("company_id") or "")
    worker_ids = _company_worker_ids(company_id)
    if owner_id and owner_id != company_id and owner_id not in worker_ids:
        raise HTTPException(status_code=403, detail="Documentos de outra empresa.")
    return [
        item for item in documents
        if (not owner_id and (item.get("owner_id") == company_id or item.get("owner_id") in worker_ids))
        or (owner_id and item.get("owner_id") == owner_id)
    ]
'''
text = replace_function(text, "list_documents", list_documents)

list_certificates = r'''@app.get(f"{API_PREFIX}/certificates", tags=["Documents"])
def list_certificates(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    worker_id: str | None = None,
) -> list[dict[str, Any]]:
    target_id = worker_id or (user["sub"] if user["role"] == "worker" else None)
    with _state_lock:
        workers = deepcopy(_state["workers"])
        if target_id:
            _assert_worker_visible(user, str(target_id))
            worker = next((item for item in workers if item["id"] == target_id), None)
            if not worker:
                raise HTTPException(status_code=404, detail="Trabalhador não encontrado.")
            return worker.get("certificates", [])
        visible = _company_worker_ids(str(user.get("company_id") or ""))
        certificates: list[dict[str, Any]] = []
        for worker in workers:
            if worker["id"] not in visible:
                continue
            for certificate in worker.get("certificates", []):
                certificates.append({**certificate, "worker_id": worker["id"]})
        return certificates
'''
text = replace_function(text, "list_certificates", list_certificates)

list_best_projects = r'''@app.get(f"{API_PREFIX}/best-projects", tags=["Workers"])
def list_best_projects(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    worker_id: str | None = None,
) -> list[dict[str, Any]]:
    target_id = worker_id or (user["sub"] if user["role"] == "worker" else None)
    if not target_id:
        return []
    with _state_lock:
        _assert_worker_visible(user, str(target_id))
        return deepcopy(_find("workers", str(target_id)).get("best_projects", []))
'''
text = replace_function(text, "list_best_projects", list_best_projects)

search_block = r'''@app.get(f"{API_PREFIX}/search", tags=["Search"])
def search(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
    q: str = "",
) -> dict[str, Any]:
    query = q.strip().lower()
    with _state_lock:
        if user["role"] == "company":
            visible = _company_worker_ids(str(user.get("company_id") or ""))
            results = [deepcopy(item) for item in _state["workers"] if item["id"] in visible]
            if query:
                results = [item for item in results if query in f"{item['name']} {item['profession']} {item['location']}".lower()]
            return {"type": "workers", "results": results}
        results = [deepcopy(item) for item in _state["projects"] if user["sub"] in item.get("worker_ids", [])]
        if query:
            results = [item for item in results if query in f"{item['name']} {item['client']} {item['location']}".lower()]
        return {"type": "jobs", "results": results}
'''
text = replace_function(text, "search", search_block)

main_path.write_text(text)

# Frontend auth contract.
auth_api = Path("frontend/src/api/auth.ts")
text = auth_api.read_text()
text = replace_once(
    text,
    "export type RegisterPayload = LoginPayload & {\n  name: string;\n};",
    "export type RegisterPayload = LoginPayload & {\n  name: string;\n  invite_token?: string;\n};",
    "register payload invite",
)
text = replace_once(
    text,
    "  company_id: string | null;\n  user: AuthUser;",
    "  company_id: string | null;\n  company_role?: AuthUser[\"company_role\"];\n  permissions?: AuthUser[\"permissions\"];\n  user: AuthUser;",
    "auth response access",
)
auth_api.write_text(text)

auth_context = Path("frontend/src/context/AuthContext.tsx")
text = auth_context.read_text()
text = replace_once(
    text,
    "    role: UserRole,\n  ) => Promise<User>;",
    "    role: UserRole,\n    inviteToken?: string,\n  ) => Promise<User>;",
    "auth register type",
)
text = replace_once(
    text,
    "      role: UserRole,\n    ): Promise<User> => {",
    "      role: UserRole,\n      inviteToken?: string,\n    ): Promise<User> => {",
    "auth register callback",
)
# Only replace register payload occurrence, not login.
needle = "        name: name.trim(),\n        email: email.trim().toLowerCase(),\n        password,\n        user_type: role,\n      });"
replacement = "        name: name.trim(),\n        email: email.trim().toLowerCase(),\n        password,\n        user_type: role,\n        invite_token: inviteToken?.trim() || undefined,\n      });"
text = replace_once(text, needle, replacement, "register invite request")
auth_context.write_text(text)

shell = Path("frontend/src/components/workspace/ImmersiveWorkspaceShell.tsx")
text = shell.read_text()
text = replace_once(
    text,
    'import { uiText } from "@/src/demo/fullUi";',
    'import { uiText } from "@/src/demo/fullUi";\nimport type { CompanyPermission } from "@/src/demo/types";',
    "shell permission type",
)
text = replace_once(
    text,
    'import { AttendanceView } from "./AttendanceView";',
    'import { AccessView, accessNavLabel } from "./AccessView";\nimport { AttendanceView } from "./AttendanceView";',
    "access view import",
)
text = replace_once(
    text,
    "  workerOnly?: boolean;\n};",
    "  workerOnly?: boolean;\n  permission?: CompanyPermission;\n};",
    "nav permission field",
)
text = replace_once(
    text,
    '      companyOnly: true,\n    },\n    {\n      id: "workers",',
    '      companyOnly: true,\n      permission: "operations.read",\n    },\n    {\n      id: "workers",',
    "operations permission",
)
text = replace_once(
    text,
    '      companyOnly: true,\n    },\n    {\n      id: "teams",',
    '      companyOnly: true,\n      permission: "workers.read",\n    },\n    {\n      id: "teams",',
    "workers permission",
)
text = replace_once(
    text,
    '      companyOnly: true,\n    },\n    { id: "projects",',
    '      companyOnly: true,\n      permission: "teams.read",\n    },\n    { id: "projects",',
    "teams permission",
)
text = replace_once(
    text,
    '    { id: "projects", label: t.projects, icon: "business-outline" },\n'
    '    { id: "attendance", label: t.attendance, icon: "radio-outline" },\n'
    '    { id: "documents", label: t.documents, icon: "folder-open-outline" },',
    '    { id: "projects", label: t.projects, icon: "business-outline", permission: "projects.read" },\n'
    '    { id: "attendance", label: t.attendance, icon: "radio-outline", permission: "attendance.read" },\n'
    '    { id: "documents", label: t.documents, icon: "folder-open-outline", permission: "documents.read" },\n'
    '    { id: "access", label: accessNavLabel(language), icon: "key-outline", companyOnly: true },',
    "access navigation",
)
text = replace_once(
    text,
    '      (!item.companyOnly || role === "company") &&\n'
    '      (!item.workerOnly || role === "worker"),',
    '      (!item.companyOnly || role === "company") &&\n'
    '      (!item.workerOnly || role === "worker") &&\n'
    '      (role !== "company" || !item.permission || user.permissions?.includes(item.permission)),',
    "permission nav filter",
)
text = replace_once(
    text,
    '      case "documents":\n        return <DocumentsView key="archive" mode="archive" />;',
    '      case "documents":\n        return <DocumentsView key="archive" mode="archive" />;\n'
    '      case "access":\n        return <AccessView />;',
    "access view route",
)
shell.write_text(text)

login = Path("frontend/app/login.tsx")
text = login.read_text()
text = replace_once(
    text,
    'const DEMO_ACCOUNTS: Record<UserRole, string> = {\n'
    '  worker: "worker.demo@workly.app",\n'
    '  company: "company.demo@workly.app",\n'
    '};',
    'const DEMO_ACCOUNTS: Record<UserRole, string> = {\n'
    '  worker: "worker.demo@workly.app",\n'
    '  company: "company.demo@workly.app",\n'
    '};\n\n'
    'const INVITE_CODE_LABEL = {\n'
    '  pt: "Código de convite (opcional)",\n'
    '  en: "Invitation code (optional)",\n'
    '  fr: "Code d’invitation (facultatif)",\n'
    '  es: "Código de invitación (opcional)",\n'
    '  ro: "Cod de invitație (opțional)",\n'
    '  de: "Einladungscode (optional)",\n'
    '  nl: "Uitnodigingscode (optioneel)",\n'
    '} as const;',
    "invite label copy",
)
text = replace_once(
    text,
    '  const [password, setPassword] = useState("");',
    '  const [password, setPassword] = useState("");\n  const [inviteToken, setInviteToken] = useState("");',
    "invite token state",
)
text = replace_once(
    text,
    "        await register(cleanName, cleanEmail, cleanPassword, selectedRole);",
    "        await register(\n"
    "          cleanName,\n"
    "          cleanEmail,\n"
    "          cleanPassword,\n"
    "          selectedRole,\n"
    "          selectedRole === \"company\" ? inviteToken : undefined,\n"
    "        );",
    "register with invite",
)
password_anchor = '''              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>{text.password}</Text>'''
invite_field = '''              {mode === "register" && role === "company" ? (
                <View style={styles.inputWrap}>
                  <Text style={styles.inputLabel}>{INVITE_CODE_LABEL[language]}</Text>
                  <View style={styles.inputShell}>
                    <Ionicons name="key-outline" color={workspaceColors.muted} size={18} />
                    <TextInput
                      accessibilityLabel={INVITE_CODE_LABEL[language]}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      value={inviteToken}
                      onChangeText={setInviteToken}
                      placeholder="WLY-XXXXXXXXXXXX"
                      placeholderTextColor={workspaceColors.muted}
                      style={styles.input}
                    />
                  </View>
                </View>
              ) : null}
'''
text = replace_once(text, password_anchor, invite_field + password_anchor, "invite field")
login.write_text(text)

conftest = Path("backend/tests/conftest.py")
text = conftest.read_text()
text = replace_once(
    text,
    "        main._registered_users.clear()\n    yield",
    "        main._registered_users.clear()\n        main._persistence.reset_access_cache()\n    yield",
    "reset ACL test state",
)
conftest.write_text(text)

Path("backend/tests/test_company_access.py").write_text(
    '''"""Company tenancy and role-based access tests."""\n\n\ndef test_demo_company_is_admin(client, company_auth):\n    response = client.get("/api/company/access", headers=company_auth["headers"])\n    assert response.status_code == 200, response.text\n    payload = response.json()\n    assert payload["current_role"] == "admin"\n    assert "access.manage" in payload["permissions"]\n    assert any(item["user_id"] == company_auth["user"]["id"] for item in payload["members"])\n\n\ndef test_invited_staff_joins_existing_company(client, company_auth):\n    invitation = client.post(\n        "/api/company/invitations",\n        headers=company_auth["headers"],\n        json={"name": "Maria Costa", "email": "maria@workly.test", "access_role": "hr"},\n    )\n    assert invitation.status_code == 200, invitation.text\n    registered = client.post(\n        "/api/auth/register",\n        json={\n            "name": "Maria Costa",\n            "email": "maria@workly.test",\n            "password": "StrongPass123!",\n            "user_type": "company",\n            "invite_token": invitation.json()["token"],\n        },\n    )\n    assert registered.status_code == 200, registered.text\n    user = registered.json()["user"]\n    assert user["company_id"] == company_auth["user"]["company_id"]\n    assert user["company_role"] == "hr"\n    assert "workers.manage" in user["permissions"]\n    assert "projects.manage" not in user["permissions"]\n\n\ndef test_hr_cannot_create_project(client, company_auth):\n    invitation = client.post(\n        "/api/company/invitations",\n        headers=company_auth["headers"],\n        json={"name": "RH", "email": "rh@workly.test", "access_role": "hr"},\n    ).json()\n    registered = client.post(\n        "/api/auth/register",\n        json={\n            "name": "RH",\n            "email": "rh@workly.test",\n            "password": "StrongPass123!",\n            "user_type": "company",\n            "invite_token": invitation["token"],\n        },\n    ).json()\n    headers = {"Authorization": f"Bearer {registered['access_token']}"}\n    response = client.post(\n        "/api/projects",\n        headers=headers,\n        json={\n            "name": "Blocked",\n            "location": "Porto",\n            "start_date": "2026-08-01",\n            "end_date": "2026-09-01",\n        },\n    )\n    assert response.status_code == 403\n\n\ndef test_foreign_project_is_hidden(client, company_auth):\n    from backend.app import main\n    with main._state_lock:\n        foreign = dict(main._state["projects"][0])\n        foreign["id"] = "project-foreign"\n        foreign["company_id"] = "company-other"\n        main._state["projects"].append(foreign)\n    response = client.get("/api/projects/project-foreign", headers=company_auth["headers"])\n    assert response.status_code == 403\n\n\ndef test_foreign_worker_is_hidden(client, company_auth):\n    from backend.app import main\n    with main._state_lock:\n        foreign = dict(main._state["workers"][0])\n        foreign["id"] = "worker-foreign"\n        foreign["company_id"] = "company-other"\n        main._state["workers"].append(foreign)\n    response = client.get("/api/workers/worker-foreign", headers=company_auth["headers"])\n    assert response.status_code == 403\n'''
)
