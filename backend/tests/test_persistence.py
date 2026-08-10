from __future__ import annotations

from copy import deepcopy

from backend.app.persistence import PersistenceStore, resolve_database_url


def test_persistence_disabled_without_database_url(monkeypatch):
    for key in ("DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL", "NEON_POSTGRES_URL"):
        monkeypatch.delenv(key, raising=False)
    store = PersistenceStore()
    state = {"version": 1, "workers": []}
    loaded, users = store.load(state)
    assert store.enabled is False
    assert store.mode == "memory"
    assert loaded == state
    assert loaded is not state
    assert users == {}
    assert store.health()["status"] == "not_configured"


def test_database_url_resolution_priority(monkeypatch):
    for key in ("DATABASE_URL", "POSTGRES_URL", "NEON_DATABASE_URL", "NEON_POSTGRES_URL"):
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setenv("POSTGRES_URL", "postgresql://secondary")
    monkeypatch.setenv("DATABASE_URL", "postgresql://primary")
    assert resolve_database_url() == "postgresql://primary"


def test_failed_database_connection_falls_back_without_mutating_input(monkeypatch):
    state = {"version": 7, "workers": [{"id": "worker-1"}]}
    original = deepcopy(state)
    store = PersistenceStore("postgresql://127.0.0.1:1/workly")
    loaded, users = store.load(state)
    assert loaded == original
    assert state == original
    assert users == {}
    assert store.connected is False
    assert store.health()["status"] == "degraded"
