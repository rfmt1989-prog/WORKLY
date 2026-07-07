"""WORKLY backend API tests - covers auth, dashboard, search, messages,
contracts, checkin/out, career, notifications, availability, protection."""
import uuid
import pytest


# ---- Health & seed ----
def test_root(http, api):
    r = http.get(f"{api}/")
    assert r.status_code == 200
    assert "message" in r.json()


# ---- Auth ----
class TestAuth:
    def test_login_worker(self, worker_auth):
        u = worker_auth["user"]
        assert u["email"] == "worker@workly.com"
        assert u["role"] == "worker"
        assert "password_hash" not in u
        assert "_id" not in u
        assert worker_auth["token"]

    def test_login_company(self, company_auth):
        u = company_auth["user"]
        assert u["email"] == "company@workly.com"
        assert u["role"] == "company"
        assert "password_hash" not in u

    def test_login_wrong_password(self, http, api):
        r = http.post(f"{api}/auth/login", json={"email": "worker@workly.com", "password": "wrong"})
        assert r.status_code == 400

    def test_register_new_user(self, http, api):
        email = f"test_{uuid.uuid4().hex[:8]}@workly.com"
        r = http.post(f"{api}/auth/register", json={
            "name": "TEST User", "email": email, "password": "pass1234", "role": "worker"
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "token" in d
        assert d["user"]["email"] == email.lower()
        assert d["user"]["role"] == "worker"
        assert "password_hash" not in d["user"]

        # verify via /auth/me
        me = http.get(f"{api}/auth/me", headers={"Authorization": f"Bearer {d['token']}"})
        assert me.status_code == 200
        assert me.json()["email"] == email

    def test_register_duplicate(self, http, api):
        r = http.post(f"{api}/auth/register", json={
            "name": "Dup", "email": "worker@workly.com", "password": "pass1234", "role": "worker"
        })
        assert r.status_code == 400

    def test_register_bad_role(self, http, api):
        r = http.post(f"{api}/auth/register", json={
            "name": "X", "email": f"TEST_{uuid.uuid4().hex[:6]}@w.com", "password": "pass1234", "role": "admin"
        })
        assert r.status_code == 400

    def test_me(self, http, api, worker_auth):
        r = http.get(f"{api}/auth/me", headers=worker_auth["headers"])
        assert r.status_code == 200
        assert r.json()["email"] == "worker@workly.com"


# ---- Auth Protection ----
class TestProtection:
    endpoints = [
        ("GET", "/auth/me"),
        ("GET", "/dashboard"),
        ("GET", "/search"),
        ("GET", "/conversations"),
        ("GET", "/contracts"),
        ("GET", "/career"),
        ("GET", "/notifications"),
        ("POST", "/checkin"),
        ("POST", "/checkout"),
        ("POST", "/availability"),
        ("POST", "/notifications/read"),
    ]

    @pytest.mark.parametrize("method,path", endpoints)
    def test_requires_auth(self, http, api, method, path):
        r = http.request(method, f"{api}{path}", json={} if method == "POST" else None)
        assert r.status_code == 401, f"{method} {path} returned {r.status_code}"

    def test_invalid_token(self, http, api):
        r = http.get(f"{api}/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
        assert r.status_code == 401


# ---- Dashboard ----
class TestDashboard:
    def test_worker_dashboard(self, http, api, worker_auth):
        r = http.get(f"{api}/dashboard", headers=worker_auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "worker"
        assert isinstance(d["trust_score"], (int, float))
        assert isinstance(d["todays_jobs"], list)
        assert len(d["todays_jobs"]) >= 1
        assert "stats" in d

    def test_company_dashboard(self, http, api, company_auth):
        r = http.get(f"{api}/dashboard", headers=company_auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "company"
        assert "spend_month" in d
        assert isinstance(d["projects"], list)
        assert len(d["projects"]) >= 1


# ---- Check in/out ----
class TestCheckin:
    def test_checkin_dashboard_checkout(self, http, api, worker_auth):
        h = worker_auth["headers"]
        # ensure no leftover
        http.post(f"{api}/checkout", headers=h)
        r = http.post(f"{api}/checkin", headers=h)
        assert r.status_code == 200, r.text
        rec = r.json()
        assert rec["checkout_at"] is None
        assert "_id" not in rec

        # dashboard should reflect active_checkin
        d = http.get(f"{api}/dashboard", headers=h).json()
        assert d["active_checkin"] is not None
        assert d["active_checkin"]["id"] == rec["id"]

        # double checkin -> 400
        r2 = http.post(f"{api}/checkin", headers=h)
        assert r2.status_code == 400

        # checkout
        r3 = http.post(f"{api}/checkout", headers=h)
        assert r3.status_code == 200
        assert r3.json()["ok"] is True

        # dashboard no active_checkin
        d2 = http.get(f"{api}/dashboard", headers=h).json()
        assert d2["active_checkin"] is None

        # double checkout -> 400
        r4 = http.post(f"{api}/checkout", headers=h)
        assert r4.status_code == 400


# ---- Search ----
class TestSearch:
    def test_search_company_returns_workers(self, http, api, company_auth):
        r = http.get(f"{api}/search", headers=company_auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "workers"
        assert len(d["results"]) >= 1
        assert all(w["role"] == "worker" for w in d["results"])

    def test_search_company_with_query(self, http, api, company_auth):
        r = http.get(f"{api}/search", headers=company_auth["headers"], params={"q": "Electrician"})
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "workers"
        # João Silva has title Certified Electrician
        assert any("Electrician" in (w.get("title") or "") for w in d["results"])

    def test_search_worker_returns_jobs(self, http, api, worker_auth):
        r = http.get(f"{api}/search", headers=worker_auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert d["type"] == "jobs"
        assert len(d["results"]) >= 1

    def test_search_worker_query(self, http, api, worker_auth):
        r = http.get(f"{api}/search", headers=worker_auth["headers"], params={"q": "Porto"})
        assert r.status_code == 200
        d = r.json()
        assert any("Porto" in (j.get("location") or "") for j in d["results"])


# ---- Conversations & Messages ----
class TestConversations:
    def test_list_conversations(self, http, api, worker_auth):
        r = http.get(f"{api}/conversations", headers=worker_auth["headers"])
        assert r.status_code == 200
        convs = r.json()
        assert isinstance(convs, list)
        assert len(convs) >= 1
        assert "other" in convs[0]
        pytest.conv_id = convs[0]["id"]

    def test_get_conversation(self, http, api, worker_auth):
        r = http.get(f"{api}/conversations/{pytest.conv_id}", headers=worker_auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert "conversation" in d
        assert "messages" in d
        assert len(d["messages"]) >= 1

    def test_get_conv_forbidden(self, http, api, worker_auth):
        r = http.get(f"{api}/conversations/nonexistent-id", headers=worker_auth["headers"])
        assert r.status_code == 404

    def test_send_text_message(self, http, api, worker_auth):
        r = http.post(f"{api}/conversations/{pytest.conv_id}/messages",
                      headers=worker_auth["headers"],
                      json={"text": "TEST hello", "type": "text"})
        assert r.status_code == 200
        m = r.json()
        assert m["text"] == "TEST hello"
        assert m["type"] == "text"
        assert "_id" not in m

    def test_send_voice_message(self, http, api, worker_auth):
        r = http.post(f"{api}/conversations/{pytest.conv_id}/messages",
                      headers=worker_auth["headers"],
                      json={"type": "voice", "meta": {"duration": "0:05"}})
        assert r.status_code == 200
        m = r.json()
        assert m["type"] == "voice"

    def test_send_document_message(self, http, api, worker_auth):
        r = http.post(f"{api}/conversations/{pytest.conv_id}/messages",
                      headers=worker_auth["headers"],
                      json={"type": "document", "meta": {"filename": "report.pdf"}})
        assert r.status_code == 200
        assert r.json()["type"] == "document"

    def test_conversation_last_message_updated(self, http, api, worker_auth):
        # send one more and then check listing
        http.post(f"{api}/conversations/{pytest.conv_id}/messages",
                  headers=worker_auth["headers"],
                  json={"text": "TEST last preview check", "type": "text"})
        r = http.get(f"{api}/conversations", headers=worker_auth["headers"])
        convs = r.json()
        c = next(c for c in convs if c["id"] == pytest.conv_id)
        assert c["last_message"] == "TEST last preview check"


# ---- Contracts ----
class TestContracts:
    def test_list_contracts_worker(self, http, api, worker_auth):
        r = http.get(f"{api}/contracts", headers=worker_auth["headers"])
        assert r.status_code == 200
        contracts = r.json()
        assert isinstance(contracts, list)
        assert len(contracts) >= 1
        pending = next((c for c in contracts if c["status"] == "pending"), None)
        assert pending is not None
        pytest.pending_contract_id = pending["id"]

    def test_list_contracts_company(self, http, api, company_auth):
        r = http.get(f"{api}/contracts", headers=company_auth["headers"])
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_get_contract(self, http, api, worker_auth):
        r = http.get(f"{api}/contracts/{pytest.pending_contract_id}", headers=worker_auth["headers"])
        assert r.status_code == 200
        c = r.json()
        assert c["id"] == pytest.pending_contract_id
        assert "_id" not in c

    def test_sign_contract(self, http, api, worker_auth):
        r = http.post(f"{api}/contracts/{pytest.pending_contract_id}/sign",
                      headers=worker_auth["headers"],
                      json={"signature": "TEST João Silva"})
        assert r.status_code == 200
        updated = r.json()
        assert updated["status"] == "active"
        assert updated["signed_worker"] is True
        assert updated["signature"] == "TEST João Silva"
        # timeline appended
        assert any("Assinado" in (t.get("label") or "") for t in updated["timeline"])

        # verify persistence
        g = http.get(f"{api}/contracts/{pytest.pending_contract_id}", headers=worker_auth["headers"])
        assert g.status_code == 200
        assert g.json()["status"] == "active"

    def test_get_contract_404(self, http, api, worker_auth):
        r = http.get(f"{api}/contracts/nonexistent", headers=worker_auth["headers"])
        assert r.status_code == 404


# ---- Career ----
class TestCareer:
    def test_career_worker(self, http, api, worker_auth):
        r = http.get(f"{api}/career", headers=worker_auth["headers"])
        assert r.status_code == 200
        d = r.json()
        assert isinstance(d["timeline"], list) and len(d["timeline"]) >= 1
        assert isinstance(d["achievements"], list) and len(d["achievements"]) >= 1
        assert isinstance(d["training"], list) and len(d["training"]) >= 1
        assert isinstance(d["skills"], list)


# ---- Notifications ----
class TestNotifications:
    def test_list_notifications(self, http, api, worker_auth):
        r = http.get(f"{api}/notifications", headers=worker_auth["headers"])
        assert r.status_code == 200
        notes = r.json()
        assert len(notes) >= 1
        assert any(n.get("read") is False for n in notes)

    def test_mark_read(self, http, api, worker_auth):
        r = http.post(f"{api}/notifications/read", headers=worker_auth["headers"])
        assert r.status_code == 200
        assert r.json()["ok"] is True

        # verify
        notes = http.get(f"{api}/notifications", headers=worker_auth["headers"]).json()
        assert all(n["read"] is True for n in notes)


# ---- Availability ----
class TestAvailability:
    def test_toggle_availability(self, http, api, worker_auth):
        r = http.post(f"{api}/availability", headers=worker_auth["headers"], json={"available": False})
        assert r.status_code == 200
        assert r.json()["available"] is False
        # verify persisted via /auth/me
        me = http.get(f"{api}/auth/me", headers=worker_auth["headers"]).json()
        assert me["available"] is False
        # toggle back
        r2 = http.post(f"{api}/availability", headers=worker_auth["headers"], json={"available": True})
        assert r2.status_code == 200
        me2 = http.get(f"{api}/auth/me", headers=worker_auth["headers"]).json()
        assert me2["available"] is True
