"""Release safeguards protect accounts even when demo data or hosting changes."""

import os
import subprocess
import sys
from pathlib import Path

import pytest

from backend.app.runtime_security import token_signing_secret


@pytest.mark.parametrize("marker", ["preview", "production", "development"])
@pytest.mark.parametrize("secret", ["", "short-key", " " * 40])
def test_hosted_environments_reject_missing_or_weak_signing_keys(marker, secret):
    with pytest.raises(RuntimeError, match="WORKLY_TOKEN_SECRET"):
        token_signing_secret({"VERCEL_ENV": marker, "WORKLY_TOKEN_SECRET": secret})


def test_vercel_host_marker_also_requires_a_signing_key():
    with pytest.raises(RuntimeError, match="WORKLY_TOKEN_SECRET"):
        token_signing_secret({"VERCEL": "1"})


def test_configured_signing_key_is_preserved_for_existing_sessions():
    key = "a-review-only-test-key-at-least-32-characters"
    assert token_signing_secret({"VERCEL_ENV": "preview", "WORKLY_TOKEN_SECRET": key}) == key.encode()


def test_local_development_remains_available_without_hosted_secrets():
    assert token_signing_secret({})


def test_startup_preserves_accounts_from_an_earlier_seed_generation():
    script = '''
from copy import deepcopy
from backend.app.demo_data import fresh_demo_state
from backend.app.persistence import PersistenceStore
state = fresh_demo_state()
state["demo_generation"] = "an-older-seed-version"
state["workers"].append({"id": "persisted-worker", "name": "Existing Test Profile"})
users = {"existing@example.com": {"id": "persisted-account"}}
PersistenceStore.load = lambda self, seed: (deepcopy(state), deepcopy(users))
def forbid_startup_write(self, *args):
    raise AssertionError("Startup must never overwrite persisted accounts with a seed")
PersistenceStore.save = forbid_startup_write
from backend.app import main
assert main._state == state
assert main._registered_users == users
'''
    environment = {key: value for key, value in os.environ.items() if key not in {"VERCEL", "VERCEL_ENV"}}
    result = subprocess.run(
        [sys.executable, "-c", script], cwd=Path(__file__).resolve().parents[2],
        env=environment, capture_output=True, text=True, timeout=30,
    )
    assert result.returncode == 0, result.stderr
