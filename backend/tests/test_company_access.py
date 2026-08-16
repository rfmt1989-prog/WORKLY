"""Company tenancy and role-based access tests."""


def test_demo_company_is_admin(client, company_auth):
    response = client.get("/api/company/access", headers=company_auth["headers"])
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["current_role"] == "admin"
    assert "access.manage" in payload["permissions"]
    assert any(item["user_id"] == company_auth["user"]["id"] for item in payload["members"])


def test_invited_staff_joins_existing_company(client, company_auth):
    invitation = client.post(
        "/api/company/invitations",
        headers=company_auth["headers"],
        json={"name": "Maria Costa", "email": "maria.access@worklyapp.com", "access_role": "hr"},
    )
    assert invitation.status_code == 200, invitation.text
    registered = client.post(
        "/api/auth/register",
        json={
            "name": "Maria Costa",
            "email": "maria.access@worklyapp.com",
            "password": "StrongPass123!",
            "user_type": "company",
            "invite_token": invitation.json()["token"],
        },
    )
    assert registered.status_code == 200, registered.text
    user = registered.json()["user"]
    assert user["company_id"] == company_auth["user"]["company_id"]
    assert user["company_role"] == "hr"
    assert "workers.manage" in user["permissions"]
    assert "projects.manage" not in user["permissions"]


def test_hr_cannot_create_project(client, company_auth):
    invitation = client.post(
        "/api/company/invitations",
        headers=company_auth["headers"],
        json={"name": "RH", "email": "rh.access@worklyapp.com", "access_role": "hr"},
    ).json()
    registered = client.post(
        "/api/auth/register",
        json={
            "name": "RH",
            "email": "rh.access@worklyapp.com",
            "password": "StrongPass123!",
            "user_type": "company",
            "invite_token": invitation["token"],
        },
    ).json()
    headers = {"Authorization": f"Bearer {registered['access_token']}"}
    response = client.post(
        "/api/projects",
        headers=headers,
        json={
            "name": "Blocked",
            "location": "Porto",
            "start_date": "2026-08-01",
            "end_date": "2026-09-01",
        },
    )
    assert response.status_code == 403


def test_foreign_project_is_hidden(client, company_auth):
    from backend.app import main
    with main._state_lock:
        foreign = dict(main._state["projects"][0])
        foreign["id"] = "project-foreign"
        foreign["company_id"] = "company-other"
        main._state["projects"].append(foreign)
    response = client.get("/api/projects/project-foreign", headers=company_auth["headers"])
    assert response.status_code == 403


def test_foreign_worker_is_hidden(client, company_auth):
    from backend.app import main
    with main._state_lock:
        foreign = dict(main._state["workers"][0])
        foreign["id"] = "worker-foreign"
        foreign["company_id"] = "company-other"
        main._state["workers"].append(foreign)
    response = client.get("/api/workers/worker-foreign", headers=company_auth["headers"])
    assert response.status_code == 403
