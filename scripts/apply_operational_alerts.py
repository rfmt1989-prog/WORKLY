from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    content = target.read_text(encoding="utf-8")
    if old not in content:
        raise SystemExit(f"Pattern not found in {path}: {old[:120]!r}")
    target.write_text(content.replace(old, new, 1), encoding="utf-8")


# Backend: stored message state is scoped and can be marked read.
replace_once(
    "backend/app/main.py",
    '''@app.get(f"{API_PREFIX}/dashboard", tags=["Dashboard"])\ndef dashboard(\n''',
    '''@app.get(f"{API_PREFIX}/notifications", tags=["Notifications"])\ndef list_notifications(\n    user: Annotated[dict[str, Any], Depends(get_current_user)],\n) -> list[dict[str, Any]]:\n    target_id = str(\n        user["sub"] if user["role"] == "worker" else user.get("company_id") or ""\n    )\n    with _state_lock:\n        return [\n            deepcopy(item) for item in _state.get("notifications", [])\n            if item.get("target_id") == target_id\n        ]\n\n\n@app.post(f"{API_PREFIX}/notifications/read-all", tags=["Notifications"])\ndef mark_all_notifications_read(\n    user: Annotated[dict[str, Any], Depends(get_current_user)],\n) -> dict[str, int]:\n    target_id = str(\n        user["sub"] if user["role"] == "worker" else user.get("company_id") or ""\n    )\n    updated = 0\n    with _state_lock:\n        for item in _state.get("notifications", []):\n            if item.get("target_id") != target_id or item.get("read"):\n                continue\n            item["read"] = True\n            updated += 1\n    return {"updated": updated}\n\n\n@app.get(f"{API_PREFIX}/dashboard", tags=["Dashboard"])\ndef dashboard(\n''',
)

# Frontend: global bell in the top bar.
replace_once(
    "frontend/src/components/workspace/ImmersiveWorkspaceShell.tsx",
    '''import { OperationsMapView } from "./OperationsMapView";\n''',
    '''import { OperationsMapView } from "./OperationsMapView";\nimport { NotificationCenter } from "./NotificationCenter";\n''',
)
replace_once(
    "frontend/src/components/workspace/ImmersiveWorkspaceShell.tsx",
    '''        <View style={styles.topActions}>\n          <LanguageSelector\n''',
    '''        <View style={styles.topActions}>\n          <NotificationCenter />\n          <LanguageSelector\n''',
)

print("Operational alerts integration applied")
