from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise SystemExit(f"Missing anchor: {label}")
    return text.replace(old, new, 1)


main_path = Path("backend/app/main.py")
main = main_path.read_text()
main = replace_once(
    main,
    "from .persistence import PersistenceStore\n",
    "from .compliance import evaluate_worker_compliance\nfrom .persistence import PersistenceStore\n",
    "backend compliance import",
)
main = replace_once(
    main,
    "    documents: list[dict[str, Any]] = Field(default_factory=list)\n",
    "    documents: list[dict[str, Any]] = Field(default_factory=list)\n    compliance_requirements: dict[str, list[str]] = Field(default_factory=dict)\n",
    "project compliance input",
)
main = replace_once(
    main,
    '    if path.startswith(f"{API_PREFIX}/attendance"):\n        return "attendance.read" if method == "GET" else None\n',
    '    if path.startswith(f"{API_PREFIX}/compliance"):\n        return "documents.read"\n    if path.startswith(f"{API_PREFIX}/attendance"):\n        return "attendance.read" if method == "GET" else None\n',
    "compliance permission",
)
main = replace_once(
    main,
    '        "documents",\n    }\n',
    '        "documents",\n        "compliance_requirements",\n    }\n',
    "project update requirements",
)
endpoint = '''@app.get(f"{API_PREFIX}/compliance", tags=["Compliance"])
def compliance_center(
    user: Annotated[dict[str, Any], Depends(get_current_user)],
) -> dict[str, Any]:
    if user["role"] == "company":
        _require_company_permission(user, "documents.read")
        projects = [
            item for item in _state["projects"]
            if item.get("company_id") == user.get("company_id")
        ]
    else:
        projects = [
            item for item in _state["projects"]
            if user["sub"] in item.get("worker_ids", [])
        ]

    rows: list[dict[str, Any]] = []
    with _state_lock:
        for project in projects:
            worker_ids = (
                project.get("worker_ids", [])
                if user["role"] == "company"
                else [user["sub"]]
            )
            for worker_id in worker_ids:
                worker = next(
                    (item for item in _state["workers"] if item.get("id") == worker_id),
                    None,
                )
                if not worker:
                    continue
                evaluation = evaluate_worker_compliance(worker, project)
                rows.append(
                    {
                        **evaluation,
                        "worker_name": worker.get("name", "WORKLY"),
                        "worker_profession": worker.get("profession", ""),
                        "worker_avatar": worker.get("avatar", ""),
                        "project_name": project.get("name", ""),
                    }
                )

    summary = {
        "total": len(rows),
        "fit": sum(1 for item in rows if item["status"] == "fit"),
        "attention": sum(1 for item in rows if item["status"] == "attention"),
        "blocked": sum(1 for item in rows if item["status"] == "blocked"),
    }
    return {"summary": summary, "rows": rows}


'''
main = replace_once(
    main,
    '@app.get(f"{API_PREFIX}/attendance", tags=["Attendance"])\n',
    endpoint + '@app.get(f"{API_PREFIX}/attendance", tags=["Attendance"])\n',
    "compliance endpoint",
)
main = replace_once(
    main,
    '        project = _find("projects", project_id)\n        geofence_radius_m = float(project.get("geofence_radius_m") or GEOFENCE_RADIUS_M)\n',
    '        project = _find("projects", project_id)\n        if user["sub"] not in project.get("worker_ids", []):\n            raise HTTPException(status_code=403, detail="Trabalhador não atribuído a esta obra.")\n        compliance = evaluate_worker_compliance(worker, project)\n        if not compliance["fit_for_check_in"]:\n            issue = next(\n                (item for item in compliance["issues"] if item["severity"] == "blocked"),\n                None,\n            )\n            label = issue.get("label") if issue else "requisito obrigatório"\n            raise HTTPException(\n                status_code=403,\n                detail=f"Conformidade bloqueada: {label}. Regularize antes do check-in.",\n            )\n        geofence_radius_m = float(project.get("geofence_radius_m") or GEOFENCE_RADIUS_M)\n',
    "check-in compliance enforcement",
)
main_path.write_text(main)


demo_path = Path("backend/app/demo_data.py")
demo = demo_path.read_text()
demo = replace_once(
    demo,
    '_certificate("Trabalho em altura", "Sicurezza+", "2027-07-12"),',
    '_certificate("Trabalho em altura", "Sicurezza+", "2026-09-20"),',
    "attention demo certificate",
)
demo = replace_once(
    demo,
    '            "schedule": "08:00–17:00",\n            "team_ids": ["team-1"],\n',
    '            "schedule": "08:00–17:00",\n            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": ["Trabalho em altura"],\n            },\n            "team_ids": ["team-1"],\n',
    "project 1 requirements",
)
demo = replace_once(
    demo,
    '            "schedule": "07:30–16:30",\n            "team_ids": ["team-2"],\n',
    '            "schedule": "07:30–16:30",\n            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": ["Heavy Equipment Operator"],\n            },\n            "team_ids": ["team-2"],\n',
    "project 2 requirements",
)
demo = replace_once(
    demo,
    '            "schedule": "08:00–17:00",\n            "team_ids": [],\n',
    '            "schedule": "08:00–17:00",\n            "compliance_requirements": {\n                "documents": ["identity", "insurance", "medical"],\n                "certificates": [],\n            },\n            "team_ids": [],\n',
    "project 3 requirements",
)
demo_path.write_text(demo)


shell_path = Path("frontend/src/components/workspace/ImmersiveWorkspaceShell.tsx")
shell = shell_path.read_text()
shell = replace_once(
    shell,
    'import { AttendanceView } from "./AttendanceView";\n',
    'import { AttendanceView } from "./AttendanceView";\nimport { ComplianceView, complianceNavLabel } from "./ComplianceView";\n',
    "compliance view import",
)
shell = replace_once(
    shell,
    '    { id: "attendance", label: t.attendance, icon: "radio-outline", permission: "attendance.read" },\n    { id: "documents", label: t.documents, icon: "folder-open-outline", permission: "documents.read" },\n',
    '    { id: "attendance", label: t.attendance, icon: "radio-outline", permission: "attendance.read" },\n    { id: "compliance", label: complianceNavLabel(language), icon: "shield-checkmark-outline", permission: "documents.read" },\n    { id: "documents", label: t.documents, icon: "folder-open-outline", permission: "documents.read" },\n',
    "compliance navigation",
)
shell = replace_once(
    shell,
    '      case "attendance":\n        return <AttendanceView />;\n      case "documents":\n',
    '      case "attendance":\n        return <AttendanceView />;\n      case "compliance":\n        return <ComplianceView />;\n      case "documents":\n',
    "compliance switch",
)
shell_path.write_text(shell)


types_path = Path("frontend/src/demo/types.ts")
types = types_path.read_text()
types = replace_once(
    types,
    "  documents?: DemoDocument[];\n};\n\nexport type Attendance = {\n",
    "  documents?: DemoDocument[];\n  compliance_requirements?: { documents: string[]; certificates: string[] };\n};\n\nexport type Attendance = {\n",
    "project compliance type",
)
types_path.write_text(types)
