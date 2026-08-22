"""Attendance timesheet approval tests."""


def _completed_record(client, worker_auth):
    check_in = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={"project_id": "project-1", "location_mode": "demo"},
    )
    assert check_in.status_code == 200, check_in.text
    check_out = client.post(
        "/api/attendance/check-out",
        headers=worker_auth["headers"],
        json={"location_mode": "demo"},
    )
    assert check_out.status_code == 200, check_out.text
    return check_out.json()


def test_checkout_creates_pending_timesheet(client, worker_auth):
    record = _completed_record(client, worker_auth)
    assert record["approval_status"] == "pending"
    assert record["approved_by"] is None
    assert record["approved_at"] is None


def test_company_can_approve_completed_timesheet(client, worker_auth, company_auth):
    record = _completed_record(client, worker_auth)

    response = client.patch(
        f"/api/attendance/{record['id']}/approval",
        headers=company_auth["headers"],
        json={"status": "approved", "note": "Horas confirmadas"},
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["approval_status"] == "approved"
    assert payload["approved_by"] == company_auth["user"]["id"]
    assert payload["approved_at"]
    assert payload["approval_note"] == "Horas confirmadas"


def test_company_can_reject_completed_timesheet(client, worker_auth, company_auth):
    record = _completed_record(client, worker_auth)

    response = client.patch(
        f"/api/attendance/{record['id']}/approval",
        headers=company_auth["headers"],
        json={"status": "rejected", "note": "Rever hora de saída"},
    )

    assert response.status_code == 200, response.text
    assert response.json()["approval_status"] == "rejected"


def test_company_cannot_approve_active_attendance(client, worker_auth, company_auth):
    check_in = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={"project_id": "project-1", "location_mode": "demo"},
    )
    assert check_in.status_code == 200, check_in.text

    response = client.patch(
        f"/api/attendance/{check_in.json()['id']}/approval",
        headers=company_auth["headers"],
        json={"status": "approved"},
    )
    assert response.status_code == 409
