"""Shared fixtures for the self-contained WORKLY API."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from backend.app import main
from backend.app.demo_data import fresh_demo_state


@pytest.fixture(autouse=True)
def deterministic_demo() -> Iterator[None]:
    """Every test starts from the same demonstrable state."""

    with main._state_lock:
        main._state = fresh_demo_state()
        main._registered_users.clear()
    yield


@pytest.fixture()
def client() -> Iterator[TestClient]:
    with TestClient(main.app, raise_server_exceptions=True) as test_client:
        yield test_client


def _login(client: TestClient, email: str, role: str) -> dict:
    response = client.post(
        "/api/auth/login",
        json={
            "email": email,
            "password": "WorklyDemo!",
            "user_type": role,
        },
    )
    assert response.status_code == 200, response.text
    payload = response.json()
    return {
        "token": payload["access_token"],
        "user": payload["user"],
        "headers": {"Authorization": f"Bearer {payload['access_token']}"},
    }


@pytest.fixture()
def worker_auth(client: TestClient) -> dict:
    return _login(client, "worker.demo@workly.app", "worker")


@pytest.fixture()
def company_auth(client: TestClient) -> dict:
    return _login(client, "company.demo@workly.app", "company")
