def login(client, role="worker"):
    email = "demo@workly.pt" if role == "worker" else "company@workly.pt"
    response = client.post(
        "/api/auth/login",
        json={"email": email, "password": "123456", "user_type": role},
    )
    assert response.status_code == 200
    return response.json()


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_worker_login_and_session(client):
    session = login(client)
    assert session["user"]["role"] == "worker"
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {session['token']}"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == "demo@workly.pt"


def test_company_login_and_dashboard(client):
    session = login(client, "company")
    assert session["user"]["role"] == "company"
    response = client.get("/api/company/dashboard")
    assert response.status_code == 200
    assert response.json()["stats"]["active_workers"] == 18


def test_register(client):
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Ana Demo",
            "email": "ana.demo@workly.pt",
            "password": "segredo123",
            "role": "worker",
        },
    )
    assert response.status_code == 201
    assert response.json()["user"]["name"] == "Ana Demo"


def test_worker_dashboard_and_checkin(client):
    dashboard = client.get("/api/worker/dashboard")
    assert dashboard.status_code == 200
    assert dashboard.json()["current_project"]["name"] == "Hospital Lisboa"

    checked_in = client.post("/api/worker/checkin")
    assert checked_in.status_code == 200
    assert checked_in.json()["checked_in"] is True

    checked_out = client.post("/api/worker/checkout")
    assert checked_out.status_code == 200
    assert checked_out.json()["checked_in"] is False


def test_worker_supporting_pages(client):
    for path in ("documents", "jobs", "messages", "profile"):
        response = client.get(f"/api/worker/{path}")
        assert response.status_code == 200, path
