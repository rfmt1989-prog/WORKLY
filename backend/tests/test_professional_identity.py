from copy import deepcopy
from datetime import date
import base64

from backend.app.professional_identity import professional_identity


def _patch(client, auth, data, worker_id="worker-1"):
    return client.patch(f"/api/workers/{worker_id}", headers=auth["headers"], json={"data": data})


def _certificate(name="Instalações elétricas", **extra):
    return {"id": f"cert-{name}", "name": name, "issuer": "Centro de formação", "status": "verified", "profession_id": "electrical", "kind": "certification", "issued_at": "2025-01-01", "expires_at": "2028-01-01", **extra}


def test_one_identity_survives_edits_and_duplicate_registration(client):
    registration = {"name": "Worker Único", "email": "one.profile@example.com", "password": "secure-password", "user_type": "worker"}
    created = client.post("/api/auth/register", json=registration).json()
    worker_id = created["user"]["id"]
    auth = {"headers": {"Authorization": f"Bearer {created['access_token']}"}}
    changed = _patch(client, auth, {"name": "Nome atualizado", "profession": "Eletricista", "experience_years": 12}, worker_id)
    assert changed.status_code == 200
    assert changed.json()["professional_identity"]["id"] == worker_id
    assert changed.json()["professional_identity"]["score"] == 0
    duplicate = client.post("/api/auth/register", json={**registration, "email": "ONE.PROFILE@example.com"})
    assert duplicate.status_code == 409
    assert len(client.get("/api/workers", headers=auth["headers"]).json()) == 1
    login = client.post("/api/auth/login", json=registration).json()
    assert login["user"]["id"] == worker_id
    assert login["user"]["name"] == "Nome atualizado"
    assert login["user"]["profession"] == "Eletricista"


def test_unconfirmed_or_unrelated_evidence_does_not_inflate_level():
    certificate = _certificate()
    worker = {"id": "w", "profession": "Eletricista", "experience_years": 80, "skills": [{"name": "Especialista", "level": 100}], "best_projects": [{"id": "p", "title": "Obra declarada"}], "certificates": [
        {**certificate, "status": "pending"},
        _certificate("Expirado", expires_at="2020-01-01"),
        _certificate("Futuro", issued_at="2030-01-01"),
        _certificate("Outra área", profession_id="hvac"),
        _certificate("Data inválida", expires_at="invalid"),
    ]}
    result = professional_identity(worker, [], today=date(2026, 10, 7))
    assert result["score"] == 0
    assert result["level"]["id"] == "apprentice"


def test_master_requires_projects_and_duplicate_certificates_do_not_add_points():
    certificates = [_certificate(f"Certificado {index}") for index in range(5)]
    skills = [_certificate(f"Skill {index}", kind="skill") for index in range(5)]
    worker = {"id": "w", "profession": "Eletricista", "certificates": [*certificates, *skills, {**certificates[0], "id": "duplicate"}], "best_projects": []}
    result = professional_identity(worker, [], today=date(2026, 10, 7))
    assert result["score"] == 70
    assert result["level"]["id"] == "specialist"
    worker["best_projects"] = [{"id": f"p{index}", "status": "verified", "profession_id": "electrical", "verified_by": "company-1"} for index in range(3)]
    result = professional_identity(worker, [], today=date(2026, 10, 7))
    assert result["score"] == 100
    assert result["level"]["id"] == "master"
    assert result["next_level"] is None
    worker["profession"] = "Canalizador"
    assert professional_identity(worker, [], today=date(2026, 10, 7))["score"] == 0


def test_company_confirmation_updates_score_and_edit_invalidates_confirmation(client, worker_auth, company_auth):
    _patch(client, worker_auth, {"profession": "Eletricista"})
    uploaded = client.post("/api/files", headers=worker_auth["headers"], json={
        "owner_type": "worker", "owner_id": "worker-1", "title": "Formação elétrica", "category": "technical", "file_name": "formacao.pdf", "content_type": "application/pdf", "content_base64": base64.b64encode(b"%PDF-1.4\ncertificate evidence\n%%EOF").decode(),
    })
    assert uploaded.status_code == 200, uploaded.text
    proof = uploaded.json()["document"]
    certificate = _certificate(file_id=proof["file_id"], file_name=proof["file_name"], status="pending")
    recorded = _patch(client, worker_auth, {"certificates": [certificate]})
    assert recorded.status_code == 200, recorded.text
    assert recorded.json()["professional_identity"]["score"] == 0
    self_verified = _patch(client, worker_auth, {"certificates": [{**certificate, "status": "verified"}]})
    assert self_verified.json()["certificates"][0]["status"] == "pending"
    confirmed = _patch(client, company_auth, {"certificates": [{**certificate, "status": "verified"}]})
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["professional_identity"]["score"] == 10
    bootstrap = client.get("/api/bootstrap", headers=worker_auth["headers"]).json()
    assert next(item for item in bootstrap["workers"] if item["id"] == "worker-1")["professional_identity"]["score"] == 10
    changed = deepcopy(confirmed.json()["certificates"])
    changed[0]["issuer"] = "Outro emissor"
    edited = _patch(client, worker_auth, {"certificates": changed})
    assert edited.json()["certificates"][0]["status"] == "pending"
    assert edited.json()["professional_identity"]["score"] == 0


def test_workers_cannot_award_their_own_score_or_portfolio_confirmation(client, worker_auth):
    assert _patch(client, worker_auth, {"professional_identity": {"score": 100}}).status_code == 422
    assert _patch(client, worker_auth, {"trust_score": 10}).status_code == 403
    assert _patch(client, worker_auth, {"certificates": [_certificate()]}).status_code == 403
    assert _patch(client, worker_auth, {"best_projects": [{"id": "fake", "title": "Obra", "status": "verified", "verified_by": "company-1"}]}).status_code == 403


def test_portfolio_confirmation_is_tied_to_the_same_profession(client, worker_auth, company_auth):
    _patch(client, worker_auth, {"profession": "Eletricista", "best_projects": [{"id": "portfolio-1", "title": "Instalação elétrica", "location": "Portugal", "year": 2025, "summary": "Quadro e cablagem."}]})
    confirmed = _patch(client, company_auth, {"best_projects": [{"id": "portfolio-1", "title": "Instalação elétrica", "location": "Portugal", "year": 2025, "summary": "Quadro e cablagem.", "status": "verified"}]})
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["professional_identity"]["score"] == 10
    changed = _patch(client, worker_auth, {"profession": "Canalizador"})
    assert changed.json()["professional_identity"]["score"] == 0
    assert changed.json()["id"] == "worker-1"
