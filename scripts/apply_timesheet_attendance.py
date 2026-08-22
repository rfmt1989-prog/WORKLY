from pathlib import Path

path = Path("frontend/src/components/workspace/AttendanceView.tsx")
text = path.read_text()

text = text.replace(
    '} from "./primitives";\n',
    '} from "./primitives";\nimport { TimesheetStatus, timesheetStatus } from "./TimesheetStatus";\n',
    1,
)

old = '  const { state, language, checkIn, checkOut, notify } = useWorklyData();\n'
new = '  const { state, language, checkIn, checkOut, notify, reload } = useWorklyData();\n'
if old not in text:
    raise SystemExit("WorklyData destructuring not found")
text = text.replace(old, new, 1)

old_duration = '''function duration(record: Attendance) {\n  if (!record.check_out) return "—";\n  const milliseconds =\n    new Date(record.check_out).getTime() - new Date(record.check_in).getTime();\n  const minutes = Math.max(0, Math.round(milliseconds / 60_000));\n  const hours = Math.floor(minutes / 60);\n  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;\n}\n'''
new_duration = old_duration + '''\nfunction durationHours(record: Attendance) {\n  if (!record.check_out) return 0;\n  const milliseconds = new Date(record.check_out).getTime() - new Date(record.check_in).getTime();\n  return Math.max(0, milliseconds / 3_600_000);\n}\n'''
if old_duration not in text:
    raise SystemExit("duration helper not found")
text = text.replace(old_duration, new_duration, 1)

old_hours = '''    const totalHours = completed.reduce((sum, item) => {\n      const value =\n        new Date(item.check_out as string).getTime() -\n        new Date(item.check_in).getTime();\n      return sum + Math.max(0, value / 3_600_000);\n    }, 0);\n'''
new_hours = '''    const pendingApprovals = completed.filter(\n      (item) => timesheetStatus(item) === "pending",\n    ).length;\n    const approvedHours = completed\n      .filter((item) => timesheetStatus(item) === "approved")\n      .reduce((sum, item) => sum + durationHours(item), 0);\n    const canManageTimesheets = Boolean(user.permissions?.includes("attendance.manage"));\n'''
if old_hours not in text:
    raise SystemExit("company totalHours block not found")
text = text.replace(old_hours, new_hours, 1)

old_metrics = '''        <View style={styles.metrics}>\n          <MetricCard\n            icon="radio-outline"\n            label={uiText(language, "Em obra agora", "On site now")}\n            value={active.length}\n            detail={uiText(language, "Sessões ativas", "Active sessions")}\n            accent={workspaceColors.green}\n          />\n          <MetricCard\n            icon="shield-checkmark-outline"\n            label={uiText(language, "Dentro da zona", "Inside geofence")}\n            value={`${activeInside}/${active.length}`}\n            detail={uiText(language, "Raio definido por obra", "Radius set per site")}\n            accent={workspaceColors.green}\n          />\n          <MetricCard\n            icon="time-outline"\n            label={uiText(language, "Horas registadas", "Recorded hours")}\n            value={totalHours.toFixed(1)}\n            detail={uiText(language, "Registos concluídos", "Completed records")}\n            accent={accent}\n          />\n          <MetricCard\n            icon="navigate-outline"\n            label="GPS / Demo"\n            value={`${records.filter((item) => item.location_mode === "gps").length}/${records.filter((item) => item.location_mode === "demo").length}`}\n            detail={uiText(language, "Origem da localização", "Location source")}\n            accent={workspaceColors.yellow}\n          />\n        </View>\n'''
new_metrics = '''        <View style={styles.metrics}>\n          <MetricCard\n            icon="radio-outline"\n            label={uiText(language, "Em obra agora", "On site now")}\n            value={active.length}\n            detail={uiText(language, "Sessões ativas", "Active sessions")}\n            accent={workspaceColors.green}\n          />\n          <MetricCard\n            icon="hourglass-outline"\n            label={uiText(language, "Por aprovar", "Pending approval")}\n            value={pendingApprovals}\n            detail={uiText(language, "Horas aguardam validação", "Hours awaiting validation")}\n            accent={workspaceColors.yellow}\n          />\n          <MetricCard\n            icon="checkmark-done-outline"\n            label={uiText(language, "Horas aprovadas", "Approved hours")}\n            value={approvedHours.toFixed(1)}\n            detail={uiText(language, "Prontas para processamento", "Ready for processing")}\n            accent={accent}\n          />\n          <MetricCard\n            icon="shield-checkmark-outline"\n            label={uiText(language, "Dentro da zona", "Inside geofence")}\n            value={`${activeInside}/${active.length}`}\n            detail={uiText(language, "Raio definido por obra", "Radius set per site")}\n            accent={workspaceColors.green}\n          />\n        </View>\n'''
if old_metrics not in text:
    raise SystemExit("company metrics block not found")
text = text.replace(old_metrics, new_metrics, 1)

old_section = '''          <SectionTitle\n            title={t.liveMonitoring}\n            subtitle={\n              uiText(language, "Geofence operacional configurável por obra.", "Configurable operational geofence per site.")\n            }\n          />\n'''
new_section = '''          <SectionTitle\n            title={uiText(language, "Presenças e horas", "Attendance and hours")}\n            subtitle={uiText(\n              language,\n              "Entradas, saídas, GPS e aprovação das horas no mesmo fluxo.",\n              "Check-ins, check-outs, GPS and hour approval in one flow.",\n            )}\n          />\n'''
if old_section not in text:
    raise SystemExit("company section title not found")
text = text.replace(old_section, new_section, 1)

old_call = '''                  language={language}\n                  accent={accent}\n                />\n'''
new_call = '''                  language={language}\n                  accent={accent}\n                  canManage={canManageTimesheets}\n                  onChanged={() => reload(true)}\n                />\n'''
if old_call not in text:
    raise SystemExit("CompanyAttendanceRow call not found")
text = text.replace(old_call, new_call, 1)

old_header = '''function CompanyAttendanceRow({\n  record,\n  worker,\n  project,\n  language,\n  accent,\n}: {\n  record: Attendance;\n  worker?: Worker;\n  project?: Project;\n  language: import("@/src/demo/types").LanguageCode;\n  accent: string;\n}) {\n'''
new_header = '''function CompanyAttendanceRow({\n  record,\n  worker,\n  project,\n  language,\n  accent,\n  canManage,\n  onChanged,\n}: {\n  record: Attendance;\n  worker?: Worker;\n  project?: Project;\n  language: import("@/src/demo/types").LanguageCode;\n  accent: string;\n  canManage: boolean;\n  onChanged: () => Promise<void> | void;\n}) {\n'''
if old_header not in text:
    raise SystemExit("CompanyAttendanceRow header not found")
text = text.replace(old_header, new_header, 1)

old_company_status = '''      <GeofenceBadge geofence={geofence} language={language} />\n      <StatusPill\n        status={active ? "on_site" : "completed"}\n        label={\n          active\n            ? uiText(language, "Em obra", "On site")\n            : uiText(language, "Concluído", "Complete")\n        }\n      />\n'''
new_company_status = '''      <GeofenceBadge geofence={geofence} language={language} />\n      {active ? (\n        <StatusPill\n          status="on_site"\n          label={uiText(language, "Em obra", "On site")}\n        />\n      ) : (\n        <TimesheetStatus\n          record={record}\n          language={language}\n          canManage={canManage}\n          onChanged={onChanged}\n        />\n      )}\n'''
if old_company_status not in text:
    raise SystemExit("CompanyAttendanceRow status block not found")
text = text.replace(old_company_status, new_company_status, 1)

old_worker_status = '''      <GeofenceBadge geofence={geofence} language={language} />\n      <StatusPill\n        status={record.check_out ? "completed" : "on_site"}\n        label={\n          record.check_out\n            ? uiText(language, "Concluído", "Complete")\n            : uiText(language, "Ativo", "Active")\n        }\n      />\n'''
new_worker_status = '''      <GeofenceBadge geofence={geofence} language={language} />\n      {record.check_out ? (\n        <TimesheetStatus record={record} language={language} />\n      ) : (\n        <StatusPill\n          status="on_site"\n          label={uiText(language, "Ativo", "Active")}\n        />\n      )}\n'''
if old_worker_status not in text:
    raise SystemExit("WorkerAttendanceRow status block not found")
text = text.replace(old_worker_status, new_worker_status, 1)

text = text.replace(
    'title={uiText(language, "Histórico de presenças", "Attendance history")}',
    'title={uiText(language, "Presenças e horas", "Attendance and hours")}',
    1,
)

path.write_text(text)
