"""Compliance center and check-in enforcement tests."""


def test_company_compliance_summary(client, company_auth):
    response = client.get("/api/compliance", headers=company_auth["headers"])
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["summary"]["total"] >= 1
    assert any(row["worker_id"] == "worker-1" for row in payload["rows"])
    rodolfo = next(row for row in payload["rows"] if row["worker_id"] == "worker-1" and row["project_id"] == "project-1")
    assert rodolfo["status"] == "fit"
    assert rodolfo["fit_for_check_in"] is True


def test_missing_required_certificate_blocks_worker(client, worker_auth):
    from backend.app import main

    with main._state_lock:
        worker = next(item for item in main._state["workers"] if item["id"] == "worker-1")
        worker["certificates"] = [
            item for item in worker["certificates"]
            if "trabalho em altura" not in item["name"].lower()
        ]

    compliance = client.get("/api/compliance", headers=worker_auth["headers"])
    assert compliance.status_code == 200, compliance.text
    row = next(item for item in compliance.json()["rows"] if item["project_id"] == "project-1")
    assert row["status"] == "blocked"
    assert row["fit_for_check_in"] is False

    check_in = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={"project_id": "project-1", "location_mode": "demo"},
    )
    assert check_in.status_code == 403
    assert "Conformidade" in check_in.json()["detail"]
