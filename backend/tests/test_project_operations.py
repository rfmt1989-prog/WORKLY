"""Project planning, safety and cost controls."""


def test_company_updates_project_operations(client, company_auth):
    response = client.patch(
        "/api/projects/project-1",
        headers=company_auth["headers"],
        json={
            "data": {
                "tasks": [
                    {
                        "id": "task-test",
                        "title": "Fechar cobertura",
                        "phase": "Cobertura",
                        "due_date": "2026-09-30",
                        "assignee_id": "worker-1",
                        "status": "in_progress",
                        "progress": 45,
                    }
                ],
                "safety_items": [
                    {
                        "id": "safety-test",
                        "kind": "inspection",
                        "title": "Inspeção de andaimes",
                        "severity": "high",
                        "status": "open",
                        "created_at": "2026-09-13T07:00:00Z",
                        "owner_id": "worker-8",
                        "note": "Rever guarda-corpos.",
                    }
                ],
                "costs": {
                    "budget": 500000,
                    "committed": 90000,
                    "labour": 110000,
                    "materials": 150000,
                },
            }
        },
    )
    assert response.status_code == 200, response.text
    project = response.json()
    assert project["tasks"][0]["status"] == "in_progress"
    assert project["safety_items"][0]["severity"] == "high"
    assert project["costs"]["budget"] == 500000.0


def test_project_operations_reject_malformed_task(client, company_auth):
    response = client.patch(
        "/api/projects/project-1",
        headers=company_auth["headers"],
        json={"data": {"tasks": [{"id": "bad", "title": "", "status": "unknown"}]}},
    )
    assert response.status_code == 422


def test_worker_cannot_edit_project_operations(client, worker_auth):
    response = client.patch(
        "/api/projects/project-1",
        headers=worker_auth["headers"],
        json={"data": {"costs": {"budget": 1}}},
    )
    assert response.status_code == 403
