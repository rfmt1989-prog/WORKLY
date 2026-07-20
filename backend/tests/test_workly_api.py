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


def test_worker_conversation_round_trip(client):
    session = login(client, "worker")
    headers = {"Authorization": f"Bearer {session['token']}"}

    conversation = client.get("/api/conversations/1", headers=headers)
    assert conversation.status_code == 200
    assert conversation.json()["conversation"]["other"]["name"] == "Carlos Ferreira"

    sent = client.post(
        "/api/conversations/1/messages",
        headers=headers,
        json={"text": "Confirmado para as 08:00.", "type": "text"},
    )
    assert sent.status_code == 200
    assert sent.json()["message"]["sender_id"] == "worker-demo"

    document = client.post(
        "/api/conversations/1/messages",
        headers=headers,
        json={"text": None, "type": "document", "meta": {"name": "documento.pdf"}},
    )
    assert document.status_code == 200
    assert document.json()["message"]["meta"]["name"] == "documento.pdf"

    voice = client.post(
        "/api/conversations/1/messages",
        headers=headers,
        json={"text": None, "type": "voice", "meta": {"duration": "0:08"}},
    )
    assert voice.status_code == 200
    assert voice.json()["message"]["type"] == "voice"

    refreshed = client.get("/api/conversations/1", headers=headers)
    assert refreshed.json()["messages"][-3]["text"] == "Confirmado para as 08:00."
    assert refreshed.json()["messages"][-1]["type"] == "voice"


def test_company_conversation_uses_company_contacts(client):
    session = login(client, "company")
    headers = {"Authorization": f"Bearer {session['token']}"}

    conversation = client.get("/api/conversations/1", headers=headers)
    assert conversation.status_code == 200
    assert conversation.json()["conversation"]["other"]["name"] == "Rodolfo Maia"
