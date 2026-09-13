from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    content = target.read_text(encoding="utf-8")
    if old not in content:
        raise SystemExit(f"Pattern not found in {path}: {old[:100]!r}")
    target.write_text(content.replace(old, new, 1), encoding="utf-8")


# Backend model + compatibility defaults.
replace_once(
    "backend/app/main.py",
    '''    documents: list[dict[str, Any]] = Field(default_factory=list)\n    compliance_requirements: dict[str, list[str]] = Field(default_factory=dict)\n''',
    '''    documents: list[dict[str, Any]] = Field(default_factory=list)\n    compliance_requirements: dict[str, list[str]] = Field(default_factory=dict)\n    tasks: list[dict[str, Any]] = Field(default_factory=list)\n    safety_items: list[dict[str, Any]] = Field(default_factory=list)\n    costs: dict[str, float] = Field(default_factory=lambda: {\n        "budget": 0.0, "committed": 0.0, "labour": 0.0, "materials": 0.0\n    })\n''',
)

replace_once(
    "backend/app/main.py",
    '''_state, _registered_users = _persistence.load(fresh_demo_state())\n''',
    '''_state, _registered_users = _persistence.load(fresh_demo_state())\nfor _project in _state.get("projects", []):\n    _project.setdefault("tasks", [])\n    _project.setdefault("safety_items", [])\n    _project.setdefault(\n        "costs",\n        {"budget": 0.0, "committed": 0.0, "labour": 0.0, "materials": 0.0},\n    )\n''',
)

replace_once(
    "backend/app/main.py",
    '''        "documents",\n        "compliance_requirements",\n    }\n''',
    '''        "documents",\n        "compliance_requirements",\n        "tasks",\n        "safety_items",\n        "costs",\n    }\n''',
)

replace_once(
    "backend/app/main.py",
    '''        project.update(\n            {key: value for key, value in patch.data.items() if key in allowed}\n        )\n''',
    '''        if "tasks" in patch.data:\n            raw_tasks = patch.data["tasks"]\n            if not isinstance(raw_tasks, list) or len(raw_tasks) > 250:\n                raise HTTPException(status_code=422, detail="Planeamento inválido.")\n            clean_tasks = []\n            for raw_task in raw_tasks:\n                if not isinstance(raw_task, dict):\n                    raise HTTPException(status_code=422, detail="Tarefa inválida.")\n                title = str(raw_task.get("title") or "").strip()\n                task_status = str(raw_task.get("status") or "todo")\n                if not title or len(title) > 180 or task_status not in {"todo", "in_progress", "done", "blocked"}:\n                    raise HTTPException(status_code=422, detail="Tarefa inválida.")\n                try:\n                    task_progress = int(raw_task.get("progress") or 0)\n                except (TypeError, ValueError) as exc:\n                    raise HTTPException(status_code=422, detail="Progresso de tarefa inválido.") from exc\n                clean_tasks.append({\n                    "id": str(raw_task.get("id") or f"task-{uuid.uuid4().hex[:10]}")[:80],\n                    "title": title,\n                    "phase": str(raw_task.get("phase") or "")[:120],\n                    "due_date": str(raw_task.get("due_date") or "")[:20],\n                    "assignee_id": str(raw_task.get("assignee_id"))[:80] if raw_task.get("assignee_id") else None,\n                    "status": task_status,\n                    "progress": max(0, min(100, task_progress)),\n                })\n            patch.data["tasks"] = clean_tasks\n\n        if "safety_items" in patch.data:\n            raw_items = patch.data["safety_items"]\n            if not isinstance(raw_items, list) or len(raw_items) > 250:\n                raise HTTPException(status_code=422, detail="Registos de segurança inválidos.")\n            clean_items = []\n            for raw_item in raw_items:\n                if not isinstance(raw_item, dict):\n                    raise HTTPException(status_code=422, detail="Registo de segurança inválido.")\n                title = str(raw_item.get("title") or "").strip()\n                kind = str(raw_item.get("kind") or "briefing")\n                severity = str(raw_item.get("severity") or "low")\n                item_status = str(raw_item.get("status") or "open")\n                if (\n                    not title\n                    or len(title) > 180\n                    or kind not in {"briefing", "inspection", "incident", "near_miss"}\n                    or severity not in {"low", "medium", "high"}\n                    or item_status not in {"open", "resolved"}\n                ):\n                    raise HTTPException(status_code=422, detail="Registo de segurança inválido.")\n                clean_items.append({\n                    "id": str(raw_item.get("id") or f"safety-{uuid.uuid4().hex[:10]}")[:80],\n                    "kind": kind,\n                    "title": title,\n                    "severity": severity,\n                    "status": item_status,\n                    "created_at": str(raw_item.get("created_at") or _now_iso())[:40],\n                    "owner_id": str(raw_item.get("owner_id"))[:80] if raw_item.get("owner_id") else None,\n                    "note": str(raw_item.get("note") or "")[:1000],\n                })\n            patch.data["safety_items"] = clean_items\n\n        if "costs" in patch.data:\n            raw_costs = patch.data["costs"]\n            if not isinstance(raw_costs, dict):\n                raise HTTPException(status_code=422, detail="Custos inválidos.")\n            clean_costs: dict[str, float] = {}\n            for cost_key in ("budget", "committed", "labour", "materials"):\n                try:\n                    value = float(raw_costs.get(cost_key, 0) or 0)\n                except (TypeError, ValueError) as exc:\n                    raise HTTPException(status_code=422, detail="Valor de custo inválido.") from exc\n                if value < 0 or value > 1_000_000_000:\n                    raise HTTPException(status_code=422, detail="Valor de custo fora do intervalo permitido.")\n                clean_costs[cost_key] = round(value, 2)\n            patch.data["costs"] = clean_costs\n\n        project.update(\n            {key: value for key, value in patch.data.items() if key in allowed}\n        )\n''',
)

# Seed useful demo operations data.
replace_once(
    "backend/app/demo_data.py",
    '''            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": ["Trabalho em altura"],\n            },\n            "team_ids": ["team-1"],\n''',
    '''            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": ["Trabalho em altura"],\n            },\n            "tasks": [\n                {"id": "task-p1-1", "title": "Preparação e marcação da estrutura", "phase": "Estrutura", "due_date": "2026-08-28", "assignee_id": "worker-8", "status": "done", "progress": 100},\n                {"id": "task-p1-2", "title": "Montagem de pilares e travamentos", "phase": "Estrutura", "due_date": "2026-09-16", "assignee_id": "worker-1", "status": "in_progress", "progress": 65},\n                {"id": "task-p1-3", "title": "Plataformas técnicas", "phase": "Montagem", "due_date": "2026-09-20", "assignee_id": "worker-6", "status": "todo", "progress": 0},\n            ],\n            "safety_items": [\n                {"id": "safety-p1-1", "kind": "briefing", "title": "Toolbox trabalho em altura", "severity": "low", "status": "resolved", "created_at": "2026-09-01T07:30:00Z", "owner_id": "worker-8", "note": "Briefing concluído antes do arranque da fase."},\n                {"id": "safety-p1-2", "kind": "inspection", "title": "Verificar linhas de vida da cobertura", "severity": "medium", "status": "open", "created_at": "2026-09-12T15:00:00Z", "owner_id": "worker-8", "note": "Fechar antes do início dos trabalhos de cobertura."},\n            ],\n            "costs": {"budget": 450000.0, "committed": 72000.0, "labour": 98000.0, "materials": 145000.0},\n            "team_ids": ["team-1"],\n''',
)

replace_once(
    "backend/app/demo_data.py",
    '''            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": ["Heavy Equipment Operator"],\n            },\n            "team_ids": ["team-2"],\n''',
    '''            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": ["Heavy Equipment Operator"],\n            },\n            "tasks": [\n                {"id": "task-p2-1", "title": "Preparação de equipamentos e acessos", "phase": "Mobilização", "due_date": "2026-09-25", "assignee_id": "worker-7", "status": "in_progress", "progress": 35},\n            ],\n            "safety_items": [],\n            "costs": {"budget": 280000.0, "committed": 41000.0, "labour": 22000.0, "materials": 51000.0},\n            "team_ids": ["team-2"],\n''',
)

replace_once(
    "backend/app/demo_data.py",
    '''            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": [],\n            },\n            "team_ids": [],\n''',
    '''            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": [],\n            },\n            "tasks": [],\n            "safety_items": [],\n            "costs": {"budget": 360000.0, "committed": 65000.0, "labour": 74000.0, "materials": 88000.0},\n            "team_ids": [],\n''',
)

# Integrate the project operations panel into the existing project detail.
replace_once(
    "frontend/src/components/workspace/ProjectsView.tsx",
    '''import {\n  Avatar,\n''',
    '''import { ProjectOperationsPanel } from "./ProjectOperationsPanel";\n\nimport {\n  Avatar,\n''',
)

replace_once(
    "frontend/src/components/workspace/ProjectsView.tsx",
    '''      <Card>\n        <SectionTitle title={`${t.teams} · ${assignedTeams.length}`} />\n''',
    '''      <ProjectOperationsPanel project={project} />\n\n      <Card>\n        <SectionTitle title={`${t.teams} · ${assignedTeams.length}`} />\n''',
)

print("V1 project operations integration applied")
