"""Shared fixtures for WORKLY backend tests."""
import os
import time
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

# Load frontend .env to fetch public backend URL used by the app
load_dotenv(Path(__file__).parent.parent.parent / "frontend" / ".env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    raise RuntimeError("EXPO_PUBLIC_BACKEND_URL not set in frontend/.env")

API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def api():
    return API


@pytest.fixture(scope="session")
def http():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session", autouse=True)
def seeded(http):
    """Seed DB once for the whole session."""
    r = http.post(f"{API}/seed", timeout=30)
    assert r.status_code == 200, f"Seed failed: {r.status_code} {r.text}"
    data = r.json()
    assert data.get("ok") is True
    # brief pause for consistency
    time.sleep(0.3)
    return data


@pytest.fixture(scope="session")
def worker_auth(http):
    r = http.post(f"{API}/auth/login", json={"email": "worker@workly.com", "password": "password123"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"], "headers": {"Authorization": f"Bearer {d['token']}"}}


@pytest.fixture(scope="session")
def company_auth(http):
    r = http.post(f"{API}/auth/login", json={"email": "company@workly.com", "password": "password123"})
    assert r.status_code == 200, r.text
    d = r.json()
    return {"token": d["token"], "user": d["user"], "headers": {"Authorization": f"Bearer {d['token']}"}}
