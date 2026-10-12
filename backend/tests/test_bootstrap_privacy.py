"""The first client snapshot must obey the same tenancy as individual routes."""
from copy import deepcopy

from backend.app import main


def seed_private_accounts():
    own = main._state["workers"][0]
    own["company_id"] = "company-1"
    foreign = deepcopy(own)
    foreign.update(id="worker-private", name="Private worker", company_id="company-private")
    foreign["documents"] = [{"id": "private-medical", "category": "medical", "fitness_decision": "unfit", "title": "PRIVATE_MEDICAL_DATA"}]
    main._state["workers"].append(foreign)
    main._state["companies"].append({"id": "company-private", "documents": [{"title": "PRIVATE_COMPANY_DATA"}]})
    for suffix, worker_id, company_id in [("own", own["id"], "company-1"), ("private", foreign["id"], "company-private")]:
        main._state["projects"].append({"id": "project-" + suffix, "name": suffix, "company_id": company_id, "status": "planned", "worker_ids": [worker_id]})
        main._state["teams"].append({"id": "team-" + suffix, "company_id": company_id, "member_ids": [worker_id]})
        main._state["attendance"].append({"id": "attendance-" + suffix, "company_id": company_id, "worker_id": worker_id, "project_id": "project-" + suffix, "check_in": "2026-10-12T08:00:00Z", "check_out": None})
        main._state["contracts"].append({"id": "contract-" + suffix, "company_id": company_id, "worker_id": worker_id})
        main._state["notifications"].append({"id": "notification-" + suffix, "target_id": worker_id, "title": suffix})


def test_worker_bootstrap_contains_only_own_identity_and_work(client, worker_auth):
    seed_private_accounts()
    response = client.get("/api/bootstrap", headers=worker_auth["headers"])
    assert response.status_code == 200
    payload = response.json()
    assert [worker["id"] for worker in payload["workers"]] == ["worker-1"]
    for collection in ("projects", "teams", "attendance", "contracts", "notifications"):
        assert [item["id"] for item in payload[collection]] == [collection[:-1] + "-own" if collection != "attendance" else "attendance-own"]
    assert "PRIVATE_MEDICAL_DATA" not in response.text
    assert "PRIVATE_COMPANY_DATA" not in response.text
    assert "worker-private" not in response.text


def test_company_bootstrap_contains_only_linked_workers_and_company_work(client, company_auth):
    seed_private_accounts()
    response = client.get("/api/bootstrap", headers=company_auth["headers"])
    assert response.status_code == 200
    payload = response.json()
    assert [worker["id"] for worker in payload["workers"]] == ["worker-1"]
    assert [company["id"] for company in payload["companies"]] == ["company-1"]
    assert [project["id"] for project in payload["projects"]] == ["project-own"]
    assert payload["notifications"] == []
    assert "PRIVATE_MEDICAL_DATA" not in response.text
    assert "company-private" not in response.text


def test_worker_does_not_receive_company_document_archive(client, worker_auth):
    seed_private_accounts()
    main._state["companies"][0]["documents"] = [{"title": "COMPANY_FINANCIAL_FILE"}]
    response = client.get("/api/bootstrap", headers=worker_auth["headers"])
    assert response.status_code == 200
    assert response.json()["companies"][0]["documents"] == []
    assert "COMPANY_FINANCIAL_FILE" not in response.text


def test_generation_upgrade_preserves_existing_people_and_documents():
    seed_private_accounts()
    before = deepcopy(main._state)
    main._state["demo_generation"] = "old-generation"
    users = {"existing@worklyapp.com": {"id": "existing", "registered_at": "2026-01-01"}}
    main._prepare_runtime_state(main._state, users)
    assert main._state["workers"] == before["workers"]
    assert main._state["projects"][1]["id"] == "project-private"
    assert "existing@worklyapp.com" in users


def test_configured_storage_failure_does_not_accept_registration(client, monkeypatch):
    from backend.app.persistence import PersistenceStore, PersistenceUnavailable
    store = PersistenceStore("postgresql://unavailable")
    def unavailable(default):
        raise PersistenceUnavailable("offline")
    monkeypatch.setattr(store, "begin_request", unavailable)
    monkeypatch.setattr(main, "_persistence", store)
    response = client.post("/api/auth/register", json={"name": "Unavailable Company", "email": "offline@worklyapp.com", "password": "StrongPass123!", "user_type": "company"})
    assert response.status_code == 503
    assert "offline@worklyapp.com" not in main._registered_users
