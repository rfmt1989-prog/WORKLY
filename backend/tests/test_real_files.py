"""Authenticated real document storage tests."""

import base64


PDF_BYTES = b"%PDF-1.4\nWORKLY\n%%EOF"


def _payload(owner_type: str, owner_id: str) -> dict:
    return {
        "owner_type": owner_type,
        "owner_id": owner_id,
        "title": "Documento WORKLY",
        "category": "technical" if owner_type == "project" else "identity",
        "expires_at": "2027-12-31",
        "file_name": "documento.pdf",
        "content_type": "application/pdf",
        "content_base64": base64.b64encode(PDF_BYTES).decode("ascii"),
    }


def test_worker_uploads_and_reads_own_file(client, worker_auth):
    upload = client.post(
        "/api/files",
        headers=worker_auth["headers"],
        json=_payload("worker", worker_auth["user"]["id"]),
    )
    assert upload.status_code == 200, upload.text
    document = upload.json()["document"]
    assert document["file_id"].startswith("file-")
    assert document["size_bytes"] == len(PDF_BYTES)

    content = client.get(
        f"/api/files/{document['file_id']}/content",
        headers=worker_auth["headers"],
    )
    assert content.status_code == 200, content.text
    decoded = base64.b64decode(content.json()["content_base64"])
    assert decoded == PDF_BYTES


def test_worker_cannot_upload_to_project_or_other_owner(client, worker_auth):
    project = client.post(
        "/api/files",
        headers=worker_auth["headers"],
        json=_payload("project", "project-1"),
    )
    assert project.status_code == 403

    other = client.post(
        "/api/files",
        headers=worker_auth["headers"],
        json=_payload("worker", "worker-6"),
    )
    assert other.status_code == 403


def test_company_uploads_project_file_and_deletes_it(client, company_auth):
    upload = client.post(
        "/api/files",
        headers=company_auth["headers"],
        json=_payload("project", "project-1"),
    )
    assert upload.status_code == 200, upload.text
    file_id = upload.json()["document"]["file_id"]

    bootstrap = client.get("/api/bootstrap", headers=company_auth["headers"])
    project = next(item for item in bootstrap.json()["projects"] if item["id"] == "project-1")
    assert any(item.get("file_id") == file_id for item in project["documents"])

    deleted = client.delete(f"/api/files/{file_id}", headers=company_auth["headers"])
    assert deleted.status_code == 200, deleted.text
    missing = client.get(f"/api/files/{file_id}/content", headers=company_auth["headers"])
    assert missing.status_code == 404


def test_company_cannot_upload_to_foreign_project(client, company_auth):
    response = client.post(
        "/api/files",
        headers=company_auth["headers"],
        json=_payload("project", "project-3"),
    )
    assert response.status_code == 403


def test_upload_rejects_unsupported_type(client, worker_auth):
    payload = _payload("worker", worker_auth["user"]["id"])
    payload["content_type"] = "application/x-msdownload"
    response = client.post("/api/files", headers=worker_auth["headers"], json=payload)
    assert response.status_code == 415
