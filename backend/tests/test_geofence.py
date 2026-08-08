"""Authoritative geofence coverage for WORKLY attendance."""

from fastapi.testclient import TestClient


def test_gps_checkin_inside_site_geofence_is_accepted(
    client: TestClient,
    worker_auth: dict,
) -> None:
    response = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={
            "project_id": "project-1",
            "latitude": 40.2034,
            "longitude": -8.4102,
            "location_mode": "gps",
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["within_geofence"] is True
    assert 0 <= payload["distance_m"] <= 250


def test_gps_checkin_outside_site_geofence_is_rejected(
    client: TestClient,
    worker_auth: dict,
) -> None:
    response = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={
            "project_id": "project-1",
            "latitude": 40.2150,
            "longitude": -8.4103,
            "location_mode": "gps",
        },
    )

    assert response.status_code == 422
    assert "zona autorizada" in response.json()["detail"].lower()


def test_demo_checkin_remains_available_for_presentations(
    client: TestClient,
    worker_auth: dict,
) -> None:
    response = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={
            "project_id": "project-1",
            "latitude": 38.7223,
            "longitude": -9.1393,
            "location_mode": "demo",
        },
    )

    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["location_mode"] == "demo"
    assert payload["within_geofence"] is None
    assert payload["distance_m"] is None


def test_project_specific_geofence_radius_is_enforced(
    client: TestClient,
    worker_auth: dict,
    company_auth: dict,
) -> None:
    updated = client.patch(
        "/api/projects/project-1",
        headers=company_auth["headers"],
        json={"data": {"geofence_radius_m": 50}},
    )
    assert updated.status_code == 200, updated.text
    assert updated.json()["geofence_radius_m"] == 50

    response = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={
            "project_id": "project-1",
            "latitude": 40.2040,
            "longitude": -8.4103,
            "location_mode": "gps",
        },
    )
    assert response.status_code == 422
    assert "máximo 50 m" in response.json()["detail"]


def test_gps_checkin_requires_project_coordinates(
    client: TestClient,
    worker_auth: dict,
    company_auth: dict,
) -> None:
    updated = client.patch(
        "/api/projects/project-1",
        headers=company_auth["headers"],
        json={"data": {"latitude": None, "longitude": None}},
    )
    assert updated.status_code == 200, updated.text

    response = client.post(
        "/api/attendance/check-in",
        headers=worker_auth["headers"],
        json={
            "project_id": "project-1",
            "latitude": 40.2034,
            "longitude": -8.4102,
            "location_mode": "gps",
        },
    )
    assert response.status_code == 422
    assert "coordenadas gps" in response.json()["detail"].lower()
