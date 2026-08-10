"""End-to-end API coverage for the WORKLY web demonstration."""

from uuid import uuid4

from fastapi.testclient import TestClient


def test_health_and_cors(client: TestClient) -> None:
    health = client.get("/api/health")
    assert health.status_code == 200
    payload = health.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "WORKLY API"
    assert payload["version"] == "1.0.0-demo"
    assert payload["data_version"] == 1
    assert payload["persistence"] == {
        "mode": "memory",
        "configured": False,
        "connected": False,
        "status": "not_configured",
    }

    preflight = client.options(
        "/api/health",
        headers={
            "Origin": "https://workly-demo.vercel.app",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert preflight.status_code == 200
    assert (
        preflight.headers["access-control-allow-origin"]
        == "https://workly-demo.vercel.app"
    )


def test_demo_logins_and_session_recovery(
    client: TestClient,
    worker_auth: dict,
    company_auth: dict,
) -> None:
    assert worker_auth["user"]["id"] == "worker-1"
    assert worker_auth["user"]["role"] == "worker"
    assert company_auth["user"]["id"] == "company-1"
    assert company_auth["user"]["role"] == "company"

    worker_me = client.get("/api/auth/me", headers=worker_auth["headers"])
    company_me = client.get("/api/auth/me", headers=company_auth["headers"])
    assert worker_me.status_code == 200
    assert worker_me.json()["email"] == "worker.demo@workly.app"
    assert company_me.status_code == 200
    assert company_me.json()["company_id"] == "company-1"


def test_login_rejects_wrong_password_and_role(client: TestClient) -> None:
    wrong_password = client.post(
        "/api/auth/login",
        json={
            "email": "worker.demo@workly.app",
            "password": "not-the-demo-password",
            "user_type": "worker",
        },
    )
    wrong_role = client.post(
        "/api/auth/login",
        json={
            "email": "worker.demo@workly.app",
            "password": "WorklyDemo!",
            "user_type": "company",
        },
    )
    assert wrong_password.status_code == 401
    assert wrong_role.status_code == 403


def test_register_login_and_profile_creation(client: TestClient) -> None:
    email = f"worker-{uuid4().hex[:8]}@example.com"
    registered = client.post(
        "/api/auth/register",
        json={
            "name": "Demo Registration",
            "email": email,
            "password": "registration-demo",
            "user_type": "worker",
        },
    )
    assert registered.status_code == 200, registered.text
    payload = registered.json()
    assert payload["user"]["role"] == "worker"
    assert "password_record" not in payload["user"]

    headers = {"Authorization": f"Bearer {payload['access_token']}"}
    me = client.get("/api/auth/me", headers=headers)
    bootstrap = client.get("/api/bootstrap", headers=headers)
    assert me.status_code == 200
    assert me.json()["email"] == email
    assert any(
        worker["id"] == payload["user"]["id"]
        for worker in bootstrap.json()["workers"]
    )


def test_bootstrap_has_complete_demo_seed(
    client: TestClient,
    company_auth: dict,
) -> None:
    response = client.get("/api/bootstrap", headers=company_auth["headers"])
    assert response.status_code == 200
    state = response.json()

    assert len(state["workers"]) == 8
    assert len(state["companies"]) == 2
    assert len(state["projects"]) == 3
    assert len(state["teams"]) == 2
    assert len(state["attendance"]) >= 3
    professions = {worker["profession"].lower() for worker in state["workers"]}
    assert any("eletricista" in value for value in professions)
    assert any("canalizador" in value for value in professions)
    assert any("soldador" in value for value in professions)
    assert any("avac" in value for value in professions)
    assert any("estruturas" in value for value in professions)
    assert any("ipaf" in value for value in professions)
    assert any("máquinas" in value for value in professions)
    assert any("encarregado" in value for value in professions)
    assert all(worker["documents"] for worker in state["workers"])
    assert all(worker["certificates"] for worker in state["workers"])
    assert all(worker["best_projects"] for worker in state["workers"])


def test_worker_search_details_and_profile_edit(
    client: TestClient,
    company_auth: dict,
    worker_auth: dict,
) -> None:
    searched = client.get(
        "/api/workers",
        params={"q": "IPAF"},
        headers=company_auth["headers"],
    )
    assert searched.status_code == 200
    assert [item["id"] for item in searched.json()] == ["worker-1"]

    detail = client.get("/api/workers/worker-1", headers=company_auth["headers"])
    assert detail.status_code == 200
    assert detail.json()["trust_score"] == 9.3

    edited = client.patch(
        "/api/workers/worker-1",
        json={"data": {"phone": "+351 911 222 333", "bio": "Perfil atualizado."}},
        headers=worker_auth["headers"],
    )
    assert edited.status_code == 200
    assert edited.json()["phone"] == "+351 911 222 333"


def test_company_profile_edit(client: TestClient, company_auth: dict) -> None:
    edited = client.patch(
        "/api/companies/company-1",
        json={"data": {"description": "Operação atualizada pela demonstração."}},
        headers=company_auth["headers"],
    )
    assert edited.status_code == 200
    assert "atualizada" in edited.json()["description"]


def test_team_crud_members_and_leader(
    client: TestClient,
    company_auth: dict,
) -> None:
    headers = company_auth["headers"]
    created = client.post(
        "/api/teams",
        headers=headers,
        json={
            "name": "Equipa Demo Teste",
            "specialty": "Instalação",
            "description": "Equipa criada durante o teste.",
            "status": "available",
            "member_ids": [],
        },
    )
    assert created.status_code == 200
    team_id = created.json()["id"]

    added = client.post(
        f"/api/teams/{team_id}/members",
        headers=headers,
        json={"worker_id": "worker-3"},
    )
    assert added.status_code == 200
    assert "worker-3" in added.json()["member_ids"]

    leader = client.post(
        f"/api/teams/{team_id}/leader",
        headers=headers,
        json={"worker_id": "worker-4"},
    )
    assert leader.status_code == 200
    assert leader.json()["leader_id"] == "worker-4"
    assert "worker-4" in leader.json()["member_ids"]

    removed = client.delete(
        f"/api/teams/{team_id}/members/worker-3",
        headers=headers,
    )
    assert removed.status_code == 200
    assert "worker-3" not in removed.json()["member_ids"]

    edited = client.patch(
        f"/api/teams/{team_id}",
        headers=headers,
        json={"data": {"name": "Equipa Demo Editada"}},
    )
    assert edited.status_code == 200
    assert edited.json()["name"] == "Equipa Demo Editada"

    deleted = client.delete(f"/api/teams/{team_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True


def test_project_crud_and_assignments(
    client: TestClient,
    company_auth: dict,
) -> None:
    headers = company_auth["headers"]
    created = client.post(
        "/api/projects",
        headers=headers,
        json={
            "name": "Obra Demo Teste",
            "client": "Cliente Teste",
            "description": "Fluxo CRUD da obra.",
            "location": "Lisboa, Portugal",
            "status": "planned",
            "progress": 5,
            "start_date": "2026-09-01",
            "end_date": "2026-12-15",
            "schedule": "08:00–17:00",
            "team_ids": [],
            "worker_ids": [],
        },
    )
    assert created.status_code == 200, created.text
    project_id = created.json()["id"]

    assigned_worker = client.post(
        f"/api/projects/{project_id}/assign",
        headers=headers,
        json={"worker_id": "worker-7"},
    )
    assigned_team = client.post(
        f"/api/projects/{project_id}/assign",
        headers=headers,
        json={"team_id": "team-2"},
    )
    assert "worker-7" in assigned_worker.json()["worker_ids"]
    assert "team-2" in assigned_team.json()["team_ids"]

    edited = client.patch(
        f"/api/projects/{project_id}",
        headers=headers,
        json={"data": {"status": "active", "progress": 28}},
    )
    assert edited.status_code == 200
    assert edited.json()["status"] == "active"
    assert edited.json()["progress"] == 28

    deleted = client.delete(f"/api/projects/{project_id}", headers=headers)
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True


def test_checkin_updates_company_monitoring_then_checkout(
    client: TestClient,
    worker_auth: dict,
    company_auth: dict,
) -> None:
    checked_in = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={
            "project_id": "project-1",
            "latitude": 40.2033,
            "longitude": -8.4103,
            "location_mode": "demo",
        },
    )
    assert checked_in.status_code == 200, checked_in.text
    record = checked_in.json()
    assert record["check_out"] is None
    assert record["worker_id"] == "worker-1"

    company_dashboard = client.get(
        "/api/dashboard",
        headers=company_auth["headers"],
    )
    assert company_dashboard.status_code == 200
    assert any(
        item["id"] == record["id"]
        for item in company_dashboard.json()["active_attendance"]
    )

    checked_out = client.post(
        "/api/attendance/check-out",
        headers=worker_auth["headers"],
        json={"location_mode": "demo"},
    )
    assert checked_out.status_code == 200
    assert checked_out.json()["check_out"] is not None

    refreshed_dashboard = client.get(
        "/api/dashboard",
        headers=company_auth["headers"],
    )
    assert all(
        item["id"] != record["id"]
        for item in refreshed_dashboard.json()["active_attendance"]
    )


def test_documents_contracts_certificates_and_best_projects(
    client: TestClient,
    worker_auth: dict,
) -> None:
    headers = worker_auth["headers"]
    documents = client.get("/api/documents", headers=headers)
    contracts = client.get("/api/contracts", headers=headers)
    certificates = client.get("/api/certificates", headers=headers)
    projects = client.get("/api/best-projects", headers=headers)

    assert documents.status_code == 200 and len(documents.json()) >= 3
    assert contracts.status_code == 200 and len(contracts.json()) >= 1
    assert certificates.status_code == 200 and len(certificates.json()) >= 1
    assert projects.status_code == 200 and len(projects.json()) >= 1
    assert all("demo_content" in item for item in documents.json())


def test_role_permissions_are_enforced(
    client: TestClient,
    worker_auth: dict,
) -> None:
    create_team = client.post(
        "/api/teams",
        headers=worker_auth["headers"],
        json={"name": "Não autorizada"},
    )
    edit_other_worker = client.patch(
        "/api/workers/worker-2",
        headers=worker_auth["headers"],
        json={"data": {"name": "Tentativa"}},
    )
    assert create_team.status_code == 403
    assert edit_other_worker.status_code == 403


def test_api_requires_authentication(client: TestClient) -> None:
    for path in (
        "/api/auth/me",
        "/api/bootstrap",
        "/api/workers",
        "/api/teams",
        "/api/projects",
        "/api/attendance",
        "/api/documents",
        "/api/dashboard",
    ):
        response = client.get(path)
        assert response.status_code == 401, f"{path}: {response.text}"
