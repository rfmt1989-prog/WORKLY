"""Operational notification scope and read-state tests."""


def test_worker_lists_only_own_notifications(client, worker_auth):
    response = client.get("/api/notifications", headers=worker_auth["headers"])
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload
    assert all(item["target_id"] == worker_auth["user"]["id"] for item in payload)


def test_company_lists_only_company_notifications(client, company_auth):
    response = client.get("/api/notifications", headers=company_auth["headers"])
    assert response.status_code == 200, response.text
    payload = response.json()
    company_id = company_auth["user"]["company_id"]
    assert all(item["target_id"] == company_id for item in payload)


def test_read_all_only_changes_current_target(client, worker_auth):
    marked = client.post("/api/notifications/read-all", headers=worker_auth["headers"])
    assert marked.status_code == 200, marked.text
    assert marked.json()["updated"] >= 1

    own = client.get("/api/notifications", headers=worker_auth["headers"]).json()
    assert all(item["read"] for item in own)

    from backend.app import main
    company_message = next(
        item for item in main._state["notifications"] if item["target_id"] == "company-1"
    )
    assert company_message["read"] is False
