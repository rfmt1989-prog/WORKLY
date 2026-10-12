"""Optional SQL integration checks; always use an isolated, disposable schema.

Run with WORKLY_TEST_DATABASE_URL pointing to a local PostgreSQL/PGlite server.
No production credentials or data are used by these tests.
"""
import base64
import os
import uuid

import pytest

from backend.app import main
from backend.app.demo_data import fresh_demo_state
from backend.app.persistence import PersistenceStore


@pytest.fixture()
def sql_store(monkeypatch):
    url = os.getenv("WORKLY_TEST_DATABASE_URL")
    if not url:
        pytest.skip("WORKLY_TEST_DATABASE_URL not configured")
    import psycopg
    from psycopg import sql
    schema = "wallet_test_" + uuid.uuid4().hex
    with psycopg.connect(url, prepare_threshold=None) as conn:
        conn.execute(sql.SQL("CREATE SCHEMA {}").format(sql.Identifier(schema)))
    store = PersistenceStore(url)
    def connect():
        conn = psycopg.connect(url, connect_timeout=5, prepare_threshold=None)
        conn.execute(sql.SQL("SET search_path TO {}").format(sql.Identifier(schema)))
        return conn
    monkeypatch.setattr(store, "_connect", connect)
    errors = []
    record_failure = store._record_failure
    def capture_failure(exc):
        errors.append(repr(exc))
        record_failure(exc)
    monkeypatch.setattr(store, "_record_failure", capture_failure)
    store.test_errors = errors
    monkeypatch.setattr(main, "_persistence", store)
    yield store, connect
    with psycopg.connect(url, prepare_threshold=None) as conn:
        conn.execute(sql.SQL("DROP SCHEMA {} CASCADE").format(sql.Identifier(schema)))


def cold_start():
    main._state = fresh_demo_state()
    main._registered_users = {}


def register_worker(client):
    response = client.post("/api/auth/register", json={
        "name": "Wallet test", "email": "wallet.sql@worklyapp.com", "password": "StrongPass123!", "user_type": "worker",
        "nationality": "Portugal", "identity_document_type": "passport", "identity_document_number": "TESTONLY-12345",
    })
    assert response.status_code == 200, response.text
    user = response.json()["user"]
    return user, {"Authorization": "Bearer " + response.json()["access_token"]}


def test_identity_and_private_file_survive_independent_cold_starts(client, sql_store):
    user, headers = register_worker(client)
    cold_start()
    login = client.post("/api/auth/login", json={"email": user["email"], "password": "StrongPass123!", "user_type": "worker"})
    assert login.status_code == 200, login.text
    assert login.json()["user"]["workly_id"] == user["workly_id"]
    raw = b"%PDF-1.4\nlocal test only\n%%EOF"
    upload = client.post("/api/files", headers=headers, json={
        "owner_type": "worker", "owner_id": user["id"], "title": "Identity", "category": "identity",
        "file_name": "identity.pdf", "content_type": "application/pdf", "content_base64": base64.b64encode(raw).decode(),
    })
    assert upload.status_code == 200, (upload.text, sql_store[0].test_errors, sql_store[0].last_error)
    file_id = upload.json()["document"]["file_id"]
    cold_start()
    payload = client.get("/api/bootstrap", headers=headers).json()
    assert len(payload["workers"]) == 1
    assert payload["workers"][0]["workly_id"] == user["workly_id"]
    assert payload["workers"][0]["documents"][0]["status"] == "pending"
    content = client.get(f"/api/files/{file_id}/content", headers=headers)
    assert content.status_code == 200
    assert base64.b64decode(content.json()["content_base64"]) == raw


def test_stale_process_reload_preserves_another_account(client, sql_store):
    register_worker(client)
    cold_start()
    registered = client.post("/api/auth/register", json={"name": "Test company", "email": "company.sql@worklyapp.com", "password": "StrongPass123!", "user_type": "company"})
    assert registered.status_code == 200, registered.text
    cold_start()
    first = client.post("/api/auth/login", json={"email": "wallet.sql@worklyapp.com", "password": "StrongPass123!", "user_type": "worker"})
    assert first.status_code == 200, first.text
    assert set(main._registered_users) == {"wallet.sql@worklyapp.com", "company.sql@worklyapp.com"}


def test_commit_failure_rolls_back_account_and_returns_503(client, sql_store, monkeypatch):
    store, _ = sql_store
    original = store._save_snapshot
    def fail_commit(conn, state, users):
        raise RuntimeError("simulated commit failure")
    monkeypatch.setattr(store, "_save_snapshot", fail_commit)
    response = client.post("/api/auth/register", json={"name": "Rollback test", "email": "rollback.sql@worklyapp.com", "password": "StrongPass123!", "user_type": "company"})
    assert response.status_code == 503
    assert "rollback.sql@worklyapp.com" not in main._registered_users
    monkeypatch.setattr(store, "_save_snapshot", original)
    login = client.post("/api/auth/login", json={"email": "rollback.sql@worklyapp.com", "password": "StrongPass123!", "user_type": "company"})
    assert login.status_code == 401
    assert store.list_memberships(next(iter(main._state["companies"]), {}).get("id", "")) == []


def test_demo_reset_cannot_clear_permanent_identities(client, sql_store):
    user, headers = register_worker(client)
    before = user["workly_id"]
    response = client.post("/api/demo/reset", headers=headers)
    assert response.status_code == 403
    cold_start()
    assert client.get("/api/bootstrap", headers=headers).json()["workers"][0]["workly_id"] == before


def test_file_and_invitation_roll_back_in_same_transaction(sql_store):
    store, _ = sql_store
    conn, state, users = store.begin_request(fresh_demo_state())
    binding = store.bind_request(conn)
    try:
        store.save_file({"id": "rollback-file", "owner_type": "worker", "owner_id": "worker-1", "file_name": "test.pdf", "content_type": "application/pdf", "size_bytes": 3, "created_by": "worker-1"}, b"pdf")
        store.create_invitation({"token": "rollback-invite", "company_id": "company-1", "email": "invited@worklyapp.com", "name": "Test", "access_role": "hr", "invited_by": "company-1", "expires_at": "2030-01-01T00:00:00Z"})
        store.finish_request(conn, state, users, commit=False, changed=True)
    finally:
        store.unbind_request(binding)
    assert store.get_file("rollback-file") is None
    assert store.get_invitation("rollback-invite") is None
