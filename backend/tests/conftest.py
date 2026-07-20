"""Shared fixtures for WORKLY backend tests."""

import os
import time
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv


# Load the public API URL used by the frontend. Keep support for the legacy
# variable while the repository still contains both backend implementations.
load_dotenv(Path(__file__).parent.parent.parent / "frontend" / ".env")

configured_url = (
    os.environ.get("WORKLY_TEST_API_URL")
    or os.environ.get("EXPO_PUBLIC_API_URL")
    or os.environ.get("EXPO_PUBLIC_BACKEND_URL")
    or ""
).rstrip("/")

if not configured_url:
    raise RuntimeError(
        "Set WORKLY_TEST_API_URL or EXPO_PUBLIC_API_URL in frontend/.env"
    )

# EXPO_PUBLIC_API_URL already includes /api in the current frontend setup.
API = (
    configured_url
    if configured_url.endswith("/api")
    else f"{configured_url}/api"
)


@pytest.fixture(scope="session")
def api():
    return API


@pytest.fixture(scope="session")
def http():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="session", autouse=True)
def seeded(http):
    """Seed DB once for the whole session."""
    response = http.post(f"{API}/seed", timeout=30)
    assert response.status_code == 200, (
        f"Seed failed: {response.status_code} {response.text}"
    )
    data = response.json()
    assert data.get("ok") is True
    time.sleep(0.3)
    return data


@pytest.fixture(scope="session")
def worker_auth(http):
    response = http.post(
        f"{API}/auth/login",
        json={
            "email": "worker@workly.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "headers": {
            "Authorization": f"Bearer {data['token']}"
        },
    }


@pytest.fixture(scope="session")
def company_auth(http):
    response = http.post(
        f"{API}/auth/login",
        json={
            "email": "company@workly.com",
            "password": "password123",
        },
    )
    assert response.status_code == 200, response.text
    data = response.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "headers": {
            "Authorization": f"Bearer {data['token']}"
        },
    }
