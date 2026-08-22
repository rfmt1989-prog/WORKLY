from pathlib import Path

path = Path("backend/app/main.py")
text = path.read_text()

old_permission = '''    if path.startswith(f"{API_PREFIX}/attendance"):\n        return "attendance.read" if method == "GET" else None\n'''
new_permission = '''    if path.startswith(f"{API_PREFIX}/attendance"):\n        return "attendance.read" if method == "GET" else "attendance.manage"\n'''
if old_permission not in text:
    raise SystemExit("attendance permission block not found")
text = text.replace(old_permission, new_permission, 1)

attendance_model = '''class AttendanceInput(BaseModel):\n    project_id: str | None = None\n    latitude: float | None = None\n    longitude: float | None = None\n    location_mode: str = "demo"\n    note: str = ""\n'''
approval_model = attendance_model + '''\n\nclass AttendanceApprovalInput(BaseModel):\n    status: str = Field(max_length=20)\n    note: str = Field(default="", max_length=500)\n'''
if attendance_model not in text:
    raise SystemExit("AttendanceInput block not found")
text = text.replace(attendance_model, approval_model, 1)

checkout_marker = '        active["check_out"] = _now_iso()\n'
checkout_replacement = '''        active["check_out"] = _now_iso()\n        active["approval_status"] = "pending"\n        active["approved_by"] = None\n        active["approved_at"] = None\n        active["approval_note"] = ""\n'''
if checkout_marker not in text:
    raise SystemExit("checkout mutation not found")
text = text.replace(checkout_marker, checkout_replacement, 1)

endpoint_marker = '''@app.post(f"{API_PREFIX}/attendance/check-out", tags=["Attendance"])\n@app.post(f"{API_PREFIX}/checkout", tags=["Attendance"])\ndef check_out(\n'''
endpoint = '''@app.patch(f"{API_PREFIX}/attendance/{attendance_id}/approval", tags=["Attendance"])\ndef approve_attendance_timesheet(\n    attendance_id: str,\n    data: AttendanceApprovalInput,\n    user: Annotated[dict[str, Any], Depends(get_current_user)],\n) -> dict[str, Any]:\n    _require_role(user, "company")\n    _require_company_permission(user, "attendance.manage")\n    approval_status = data.status.strip().lower()\n    if approval_status not in {"approved", "rejected"}:\n        raise HTTPException(status_code=422, detail="Estado de aprovação inválido.")\n\n    with _state_lock:\n        record = _find("attendance", attendance_id)\n        if record.get("company_id") != user.get("company_id"):\n            raise HTTPException(status_code=403, detail="Registo de outra empresa.")\n        if record.get("check_out") is None:\n            raise HTTPException(status_code=409, detail="A presença ainda está ativa.")\n        record["approval_status"] = approval_status\n        record["approved_by"] = user["sub"]\n        record["approved_at"] = _now_iso()\n        record["approval_note"] = data.note.strip()\n        return deepcopy(record)\n\n\n@app.post(f"{API_PREFIX}/attendance/check-out", tags=["Attendance"])\n@app.post(f"{API_PREFIX}/checkout", tags=["Attendance"])\ndef check_out(\n'''
if endpoint_marker not in text:
    raise SystemExit("checkout endpoint marker not found")
text = text.replace(endpoint_marker, endpoint, 1)

path.write_text(text)
