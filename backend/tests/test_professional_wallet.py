"""Professional-wallet boundaries: real files, company review and site access."""
import base64
from datetime import date

import pytest

from backend.app.professional_wallet import professional_wallet, wallet_project_compliance
from backend.app.professional_identity import professional_identity

TODAY = date(2026, 10, 12)


def worker_with_documents():
    return {
        "id": "w", "registered_at": "2026-10-01T00:00:00Z", "profession": "Eletricista",
        "documents": [
            {"id": category, "category": category, "status": "verified", "expires_at": "2030-01-01", "fitness_decision": "fit"}
            for category in ["identity", "insurance", "medical"]
        ], "certificates": [],
    }


def project(**extra):
    return {"id": "p", "worker_ids": ["w"], "status": "active", "compliance_requirements": {"certificates": []}, **extra}


def test_empty_wallet_never_claims_eligibility_or_experience():
    wallet = professional_wallet({"id": "w", "documents": [], "certificates": []}, [], [], today=TODAY)
    assert wallet["status"] == "pending"
    assert wallet["eligibility_status"] == "pending"
    assert wallet["valid_count"] == 0
    assert wallet["total_count"] == 3
    assert wallet["verified_hours"] == wallet["completed_projects"] == wallet["check_in_count"] == 0
    assert wallet["fit_for_check_in"] is False


def test_base_documents_are_distinct_from_authorisation_for_a_site():
    wallet = professional_wallet(worker_with_documents(), [], [], today=TODAY)
    assert wallet["status"] == "ready"
    assert wallet["eligibility_status"] == "pending"
    assert wallet["fit_for_check_in"] is False
    assert wallet["valid_count"] == 3


def test_eligibility_is_specific_to_each_project():
    site_b = project(id="other", compliance_requirements={"certificates": ["Site induction"]})
    wallet = professional_wallet(worker_with_documents(), [project(), site_b], [], today=TODAY)
    assert wallet["eligibility_status"] == "eligible"
    assert wallet["project_id"] == "p"
    assert wallet["site_evaluations"][0]["fit_for_check_in"] is True
    assert wallet["site_evaluations"][1]["fit_for_check_in"] is False
    assert wallet["site_evaluations"][1]["items"][-1]["status"] == "missing"


def test_site_configuration_cannot_bypass_the_wallet_baseline():
    site = project(compliance_requirements={"documents": [], "certificates": []})
    result = wallet_project_compliance({"id": "w", "documents": []}, site, today=TODAY)
    assert result["fit_for_check_in"] is False
    assert result["requirements"]["documents"] == ["identity", "insurance", "medical"]


@pytest.mark.parametrize("status,expiry,fitness,expected", [
    ("pending", "2030-01-01", "fit", "pending"),
    ("valid", "2030-01-01", "fit", "pending"),
    ("verified", "2020-01-01", "fit", "expired"),
    ("verified", "invalid", "fit", "invalid"),
    ("rejected", "2030-01-01", "fit", "rejected"),
    ("verified", "2030-01-01", "conditional", "conditional"),
    ("verified", "2030-01-01", "unfit", "unfit"),
    ("verified", "2030-01-01", None, "pending"),
])
def test_unconfirmed_invalid_or_restricted_medical_document_blocks_access(status, expiry, fitness, expected):
    worker = worker_with_documents()
    worker["documents"][-1].update(status=status, expires_at=expiry, fitness_decision=fitness)
    result = wallet_project_compliance(worker, project(), today=TODAY)
    assert result["fit_for_check_in"] is False
    assert result["items"][-1]["status"] == expected


def test_current_confirmation_survives_a_pending_replacement():
    worker = worker_with_documents()
    worker["documents"].insert(0, {"id": "new", "category": "insurance", "status": "pending", "updated_at": "2026-10-12"})
    wallet = professional_wallet(worker, [project()], [], today=TODAY)
    assert wallet["eligibility_status"] == "eligible"
    assert next(item for item in wallet["requirements"] if item["requirement"] == "insurance")["document_id"] == "insurance"


def test_future_or_empty_certificates_cannot_satisfy_a_requirement():
    worker = worker_with_documents()
    worker["certificates"] = [{"name": "", "status": "verified"}, {"name": "Site induction", "status": "verified", "issued_at": "2030-01-01"}]
    result = wallet_project_compliance(worker, project(compliance_requirements={"certificates": ["Site induction"]}), today=TODAY)
    assert result["items"][-1]["status"] == "pending"
    assert result["fit_for_check_in"] is False


def test_expiring_confirmation_is_usable_and_visible():
    worker = worker_with_documents()
    worker["documents"][0]["expires_at"] = "2026-11-01"
    result = wallet_project_compliance(worker, project(), today=TODAY)
    assert result["status"] == "attention"
    assert result["items"][0]["status"] == "expiring"
    assert result["fit_for_check_in"] is True


def test_experience_requires_post_registration_approved_completed_work():
    worker = worker_with_documents()
    attendance = [
        {"worker_id": "w", "project_id": "p", "check_in": "2026-09-01T08:00:00Z", "check_out": "2026-09-01T16:00:00Z", "approval_status": "approved"},
        {"worker_id": "w", "project_id": "p", "check_in": "2026-10-10T08:00:00Z", "check_out": "2026-10-10T16:00:00Z", "approval_status": "approved"},
        {"worker_id": "w", "project_id": "p", "check_in": "2026-10-11T08:00:00Z", "check_out": "2026-10-11T16:00:00Z", "approval_status": "pending"},
        {"worker_id": "other", "project_id": "p", "check_in": "2026-10-11T08:00:00Z", "check_out": "2026-10-11T16:00:00Z", "approval_status": "approved"},
    ]
    wallet = professional_wallet(worker, [project(status="completed")], attendance, today=TODAY)
    assert wallet["verified_hours"] == 8
    assert wallet["pending_hours"] == 8
    assert wallet["completed_projects"] == 1
    assert wallet["check_in_count"] == 2
    identity = professional_identity(worker, [project(status="completed")], attendance, today=TODAY)
    assert identity["verified_experience_hours"] == 8


def assign_demo_worker():
    from backend.app import main
    with main._state_lock:
        worker = main._state["workers"][0]
        worker["company_id"] = "company-1"
        worker["registered_at"] = "2026-10-01T00:00:00Z"
        main._state["projects"].append({**project(worker_ids=["worker-1"]), "company_id": "company-1", "name": "Obra da carteira", "location": "Coimbra", "latitude": 40.2, "longitude": -8.4, "geofence_radius_m": 250, "start_date": "2026-10-01"})


def upload(client, auth, category, expiry="2030-01-01"):
    response = client.post("/api/files", headers=auth["headers"], json={"owner_type": "worker", "owner_id": "worker-1", "title": category, "category": category, "expires_at": expiry, "file_name": f"{category}.pdf", "content_type": "application/pdf", "content_base64": base64.b64encode(b"%PDF-1.4\nexample\n%%EOF").decode()})
    assert response.status_code == 200, response.text
    return response.json()["document"]


def test_real_upload_review_and_check_in_flow(client, worker_auth, company_auth):
    assign_demo_worker()
    original_id = client.get("/api/workers/worker-1", headers=worker_auth["headers"]).json()["workly_id"]
    docs = [upload(client, worker_auth, category) for category in ["identity", "insurance", "medical"]]
    assert all(item["status"] == "pending" for item in docs)
    attempt = client.post("/api/attendance/check-in", headers=worker_auth["headers"], json={"project_id": "p", "location_mode": "demo"})
    assert attempt.status_code == 403
    for document in docs:
        own = client.patch(f"/api/files/{document['file_id']}/verification", headers=worker_auth["headers"], json={"status": "verified", "fitness_decision": "fit"})
        assert own.status_code == 403
        verified = client.patch(f"/api/files/{document['file_id']}/verification", headers=company_auth["headers"], json={"status": "verified", "fitness_decision": "fit"})
        assert verified.status_code == 200, verified.text
        assert verified.json()["document"]["verified_by"] == "company-1"
    profile = client.get("/api/workers/worker-1", headers=worker_auth["headers"]).json()
    assert profile["professional_wallet"]["eligibility_status"] == "eligible"
    assert profile["work_eligibility_status"] == "eligible"
    assert profile["workly_id"] == original_id
    checkin = client.post("/api/attendance/check-in", headers=worker_auth["headers"], json={"project_id": "p", "location_mode": "demo"})
    assert checkin.status_code == 200, checkin.text
    active = client.get("/api/workers/worker-1", headers=worker_auth["headers"]).json()["professional_wallet"]
    assert active["active_attendance_id"] == checkin.json()["id"]
    assert active["check_in_count"] == 1
    assert active["verified_hours"] == 0


def test_medical_confirmation_requires_a_doctors_recorded_decision(client, worker_auth, company_auth):
    assign_demo_worker()
    document = upload(client, worker_auth, "medical")
    response = client.patch(f"/api/files/{document['file_id']}/verification", headers=company_auth["headers"], json={"status": "verified"})
    assert response.status_code == 422


def test_other_company_cannot_verify_a_workers_document(client, worker_auth, company_auth):
    document = upload(client, worker_auth, "identity")
    response = client.patch(f"/api/files/{document['file_id']}/verification", headers=company_auth["headers"], json={"status": "verified"})
    assert response.status_code == 403


def test_worker_cannot_forge_wallet_eligibility_or_enrolment(client, worker_auth):
    for data in [{"work_eligibility_status": "eligible"}, {"registered_at": "1900-01-01"}, {"workly_id": "FAKE"}, {"professional_wallet": {"verified_hours": 10000}}]:
        response = client.patch("/api/workers/worker-1", headers=worker_auth["headers"], json={"data": data})
        assert response.status_code == 422


def test_inactive_site_is_blocked_even_with_valid_documents(client, worker_auth):
    from backend.app import main
    assign_demo_worker()
    with main._state_lock:
        main._state["projects"][0]["status"] = "completed"
        main._state["workers"][0]["documents"] = worker_with_documents()["documents"]
    response = client.post("/api/attendance/check-in", headers=worker_auth["headers"], json={"project_id": "p", "location_mode": "demo"})
    assert response.status_code == 422


def test_checkout_stays_available_after_documents_expire(client, worker_auth):
    from backend.app import main
    assign_demo_worker()
    with main._state_lock:
        worker = main._state["workers"][0]
        worker["documents"] = worker_with_documents()["documents"]
    response = client.post("/api/attendance/check-in", headers=worker_auth["headers"], json={"project_id": "p", "location_mode": "demo"})
    assert response.status_code == 200
    with main._state_lock:
        worker["documents"][1]["expires_at"] = "2020-01-01"
    assert client.post("/api/attendance/check-out", headers=worker_auth["headers"], json={}).status_code == 200
