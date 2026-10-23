"""The same sign-in accepts account IDs and emails for both workspaces."""

import pytest


@pytest.mark.parametrize(
    ("payload", "expected_id", "expected_role"),
    [
        ({"identifier": "worker-1"}, "worker-1", "worker"),
        ({"identifier": " COMPANY-1 "}, "company-1", "company"),
        ({"identifier": " WORKER.DEMO@WORKLY.APP "}, "worker-1", "worker"),
        ({"identifier": "company.demo@workly.app"}, "company-1", "company"),
        ({"email": "worker.demo@workly.app"}, "worker-1", "worker"),
        ({"email": "company.demo@workly.app"}, "company-1", "company"),
    ],
)
def test_sign_in_recovers_the_account_role(client, payload, expected_id, expected_role):
    response = client.post(
        "/api/auth/login", json={**payload, "password": "WorklyDemo!"},
    )
    assert response.status_code == 200, response.text
    session = response.json()
    assert session["user"]["id"] == expected_id
    assert session["user"]["role"] == expected_role
    assert "password_record" not in session["user"]
    recovered = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {session['access_token']}"},
    )
    assert recovered.status_code == 200
    assert recovered.json()["id"] == expected_id
    assert recovered.json()["role"] == expected_role


@pytest.mark.parametrize("role", ["worker", "company"])
def test_new_account_can_sign_in_with_its_own_id_and_email(client, role):
    email = f"new-{role}@example.com"
    created = client.post(
        "/api/auth/register",
        json={"name": "Test Account", "email": email, "password": "AccountPass123!", "user_type": role},
    )
    assert created.status_code == 200, created.text
    account_id = created.json()["user"]["id"]
    for identifier in (account_id.upper(), email):
        response = client.post(
            "/api/auth/login", json={"identifier": identifier, "password": "AccountPass123!"},
        )
        assert response.status_code == 200, response.text
        assert response.json()["user"]["id"] == account_id
        assert response.json()["user"]["role"] == role


def test_staff_signs_in_with_personal_id_and_keeps_company_permissions(client, company_auth):
    email = "staff.unified@example.com"
    invitation = client.post(
        "/api/company/invitations",
        headers=company_auth["headers"],
        json={"name": "Staff Account", "email": email, "access_role": "hr"},
    )
    assert invitation.status_code == 200, invitation.text
    registered = client.post(
        "/api/auth/register",
        json={
            "name": "Staff Account", "email": email, "password": "StaffPass123!",
            "user_type": "company", "invite_token": invitation.json()["token"],
        },
    )
    assert registered.status_code == 200, registered.text
    staff_id = registered.json()["user"]["id"]
    signed_in = client.post(
        "/api/auth/login", json={"identifier": staff_id, "password": "StaffPass123!"},
    )
    assert signed_in.status_code == 200, signed_in.text
    user = signed_in.json()["user"]
    assert user["company_id"] == company_auth["user"]["company_id"]
    assert user["company_role"] == "hr"
    assert "workers.manage" in user["permissions"]
    assert "projects.manage" not in user["permissions"]
    # A shared company ID must never authenticate this staff member as its admin.
    shared_id = client.post(
        "/api/auth/login", json={"identifier": user["company_id"], "password": "StaffPass123!"},
    )
    assert shared_id.status_code == 401


@pytest.mark.parametrize(
    ("identifier", "password"),
    [("worker-1", "WrongPass!"), ("company-1", "WrongPass!"), ("worker-2", "WorklyDemo!"), ("unknown-account", "WorklyDemo!")],
)
def test_an_id_never_replaces_password_authentication(client, identifier, password):
    response = client.post("/api/auth/login", json={"identifier": identifier, "password": password})
    assert response.status_code == 401
    assert response.json() == {"detail": "ID, email ou password incorretos."}


def test_explicit_legacy_role_is_still_checked(client):
    response = client.post(
        "/api/auth/login",
        json={"identifier": "worker-1", "password": "WorklyDemo!", "user_type": "company"},
    )
    assert response.status_code == 403


@pytest.mark.parametrize("fields", [{}, {"identifier": "   "}, {"identifier": "worker-1", "email": "company.demo@workly.app"}])
def test_missing_or_ambiguous_identity_is_rejected(client, fields):
    response = client.post("/api/auth/login", json={**fields, "password": "WorklyDemo!"})
    assert response.status_code == 422
