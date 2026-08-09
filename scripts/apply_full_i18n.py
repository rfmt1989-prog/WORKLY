from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    (ROOT / path).write_text(text, encoding="utf-8")


def add_after(text: str, anchor: str, addition: str, path: str) -> str:
    if addition.strip() in text:
        return text
    if anchor not in text:
        raise RuntimeError(f"Missing import anchor in {path}: {anchor}")
    return text.replace(anchor, anchor + addition, 1)


def must_replace(text: str, old: str, new: str, path: str) -> str:
    if old not in text:
        raise RuntimeError(f"Expected snippet not found in {path}: {old[:120]!r}")
    return text.replace(old, new)


def simple_language_ternaries(text: str) -> str:
    pattern = re.compile(
        r'language === "pt"\s*\?\s*"((?:[^"\\]|\\.)*)"\s*:\s*"((?:[^"\\]|\\.)*)"'
    )
    return pattern.sub(lambda m: f'uiText(language, "{m.group(1)}", "{m.group(2)}")', text)


# --- Dashboard -------------------------------------------------------------
path = "frontend/src/components/workspace/DashboardView.tsx"
text = read(path)
text = add_after(
    text,
    'import { copy } from "@/src/demo/i18n";\n',
    'import { localeForLanguage, uiText } from "@/src/demo/fullUi";\nimport { localizeDemoText } from "@/src/demo/localizedData";\n',
    path,
)
text = text.replace('language === "pt" ? "pt-PT" : "en-GB"', 'localeForLanguage(language)')
if "function nextShiftDate(" not in text:
    marker = 'type Props = {\n  onNavigate: (section: WorkspaceSection) => void;\n};\n\n'
    helper = '''function nextShiftDate(language: import("@/src/demo/types").LanguageCode) {\n  const date = new Date();\n  date.setDate(date.getDate() + 1);\n  return {\n    day: String(date.getDate()).padStart(2, "0"),\n    month: date\n      .toLocaleDateString(localeForLanguage(language), { month: "short" })\n      .replace(".", "")\n      .toUpperCase(),\n  };\n}\n\n'''
    text = must_replace(text, marker, marker + helper, path)
text = must_replace(
    text,
    '  const completedHours = workerAttendance.reduce((total, item) => {',
    '  const shiftDate = nextShiftDate(language);\n  const completedHours = workerAttendance.reduce((total, item) => {',
    path,
)
text = text.replace('>{worker?.profession ?? user.title} · {worker?.location ?? "Portugal"}', '>{localizeDemoText(language, worker?.profession ?? user.title)} · {worker?.location ?? "Portugal"}')
text = text.replace('<Text style={styles.itemTitle}>{skill.name}</Text>', '<Text style={styles.itemTitle}>{localizeDemoText(language, skill.name)}</Text>')
text = text.replace('>30</Text>\n              <Text style={styles.shiftDayMonth}>JUL</Text>', '>{shiftDate.day}</Text>\n              <Text style={styles.shiftDayMonth}>{shiftDate.month}</Text>')
text = simple_language_ternaries(text)
write(path, text)


# --- Attendance ------------------------------------------------------------
path = "frontend/src/components/workspace/AttendanceView.tsx"
text = read(path)
text = add_after(
    text,
    'import { copy } from "@/src/demo/i18n";\n',
    'import { localeForLanguage, uiFormat, uiText } from "@/src/demo/fullUi";\n',
    path,
)
text = text.replace('language === "pt" ? "pt-PT" : "en-GB"', 'localeForLanguage(language)')
text = must_replace(
    text,
    '''          language === "pt"\n            ? `Check-in bloqueado: estás a ${Math.round(validation.distance ?? 0)} m da obra. Aproxima-te até ${radius} m.`\n            : `Check-in blocked: you are ${Math.round(validation.distance ?? 0)} m from the site. Move within ${radius} m.`,''',
    '''          uiFormat(\n            language,\n            "Check-in bloqueado: estás a {distance} m da obra. Aproxima-te até {radius} m.",\n            "Check-in blocked: you are {distance} m from the site. Move within {radius} m.",\n            { distance: Math.round(validation.distance ?? 0), radius },\n          ),''',
    path,
)
for old, new in [
    (
        '''language === "pt"\n                        ? `GPS validado · ${Math.round(visibleLocation.distance)} m do centro da obra`\n                        : `GPS validated · ${Math.round(visibleLocation.distance)} m from site centre`''',
        '''uiFormat(\n                        language,\n                        "GPS validado · {distance} m do centro da obra",\n                        "GPS validated · {distance} m from site centre",\n                        { distance: Math.round(visibleLocation.distance) },\n                      )''',
    ),
    (
        '''language === "pt"\n                        ? `Fora da zona · ${Math.round(visibleLocation.distance)} m do centro da obra`\n                        : `Outside zone · ${Math.round(visibleLocation.distance)} m from site centre`''',
        '''uiFormat(\n                        language,\n                        "Fora da zona · {distance} m do centro da obra",\n                        "Outside zone · {distance} m from site centre",\n                        { distance: Math.round(visibleLocation.distance) },\n                      )''',
    ),
    (
        '''language === "pt"\n                      ? `Zona autorizada: raio de ${projectRadius(currentProject)} m`\n                      : `Authorised zone: ${projectRadius(currentProject)} m radius`''',
        '''uiFormat(\n                      language,\n                      "Zona autorizada: raio de {radius} m",\n                      "Authorised zone: {radius} m radius",\n                      { radius: projectRadius(currentProject) },\n                    )''',
    ),
    (
        '''language === "pt"\n                ? `O check-in GPS só é aceite até ${projectRadius(currentProject)} m do centro da obra. Se o GPS não estiver disponível, a demonstração continua identificada como DEMO.`\n                : `GPS check-in is accepted only within ${projectRadius(currentProject)} m of the site centre. If GPS is unavailable, the demo continues clearly marked as DEMO.`''',
        '''uiFormat(\n                language,\n                "O check-in GPS só é aceite até {radius} m do centro da obra. Se o GPS não estiver disponível, a demonstração continua identificada como DEMO.",\n                "GPS check-in is accepted only within {radius} m of the site centre. If GPS is unavailable, the demo continues clearly marked as DEMO.",\n                { radius: projectRadius(currentProject) },\n              )''',
    ),
    (
        '''language === "pt"\n        ? `FORA ${Math.round(geofence.distance ?? 0)}m`\n        : `OUT ${Math.round(geofence.distance ?? 0)}m`''',
        '''uiFormat(\n        language,\n        "FORA {distance}m",\n        "OUT {distance}m",\n        { distance: Math.round(geofence.distance ?? 0) },\n      )''',
    ),
]:
    text = must_replace(text, old, new, path)
text = text.replace('? "FORA"\n                      : `${projectRadius(currentProject)}M`', '? uiText(language, "FORA", "OUT")\n                      : `${projectRadius(currentProject)}M`')
text = simple_language_ternaries(text)
write(path, text)


# --- Teams -----------------------------------------------------------------
path = "frontend/src/components/workspace/TeamsView.tsx"
text = read(path)
text = add_after(
    text,
    'import { copy } from "@/src/demo/i18n";\n',
    'import { uiText } from "@/src/demo/fullUi";\nimport { localizeDemoText } from "@/src/demo/localizedData";\n',
    path,
)
text = text.replace('{team.specialty}', '{localizeDemoText(language, team.specialty)}')
text = text.replace('{team.description}', '{localizeDemoText(language, team.description)}')
text = text.replace('{worker.profession}', '{localizeDemoText(language, worker.profession)}')
text = simple_language_ternaries(text)
write(path, text)


# --- Profile ---------------------------------------------------------------
path = "frontend/src/components/workspace/ProfileView.tsx"
text = read(path)
text = add_after(
    text,
    'import { copy } from "@/src/demo/i18n";\n',
    'import { uiText } from "@/src/demo/fullUi";\nimport { localizeDemoText } from "@/src/demo/localizedData";\n',
    path,
)
text = text.replace('<Text style={styles.entitySubtitle}>{entitySubtitle}</Text>', '<Text style={styles.entitySubtitle}>{localizeDemoText(language, entitySubtitle)}</Text>')
text = text.replace('{worker.bio}</Text>', '{localizeDemoText(language, worker.bio)}</Text>')
text = text.replace('{skill.name}</Text>', '{localizeDemoText(language, skill.name)}</Text>')
text = text.replace('{company.description}\n        </Text>', '{localizeDemoText(language, company.description)}\n        </Text>')
text = text.replace('{role === "worker" ? "WORKLY WORKER" : "WORKLY COMPANY"}', '`WORKLY ${uiText(language, role === "worker" ? "TRABALHADOR" : "EMPRESA", role === "worker" ? "WORKER" : "COMPANY")}`')
text = simple_language_ternaries(text)
write(path, text)


# --- Shell -----------------------------------------------------------------
path = "frontend/src/components/workspace/ImmersiveWorkspaceShell.tsx"
text = read(path)
text = add_after(
    text,
    'import { copy } from "@/src/demo/i18n";\n',
    'import { uiText } from "@/src/demo/fullUi";\n',
    path,
)
text = text.replace('{role === "worker" ? "WORKER" : "COMPANY"}', '{uiText(language, role === "worker" ? "TRABALHADOR" : "EMPRESA", role === "worker" ? "WORKER" : "COMPANY")}')
write(path, text)


# --- Data context toasts/errors -------------------------------------------
path = "frontend/src/context/WorklyDataContext.tsx"
text = read(path)
text = add_after(
    text,
    'import { ApiError, api } from "@/src/api/client";\n',
    'import { localizeApiError } from "@/src/demo/apiErrorI18n";\nimport { uiText } from "@/src/demo/fullUi";\n',
    path,
)
text = text.replace(': "Não foi possível carregar os dados.";', ': uiText(language, "Não foi possível carregar os dados.", "Could not load the data.");')
text = text.replace(': "Reset failed.";', ': uiText(language, "Falha ao repor os dados.", "Reset failed.");')
text = text.replace('notify(error.message, "error");\n          throw error;', 'notify(localizeApiError(language, error.message), "error");\n          throw error;')
text = simple_language_ternaries(text)
write(path, text)


# --- Existing translated modules: localize descriptive demo data ----------
path = "frontend/src/components/workspace/WorkersView.tsx"
text = read(path)
text = add_after(text, 'import { copy } from "@/src/demo/i18n";\n', 'import { localizeDemoText } from "@/src/demo/localizedData";\n', path)
text = text.replace('{worker.profession}</Text>', '{localizeDemoText(language, worker.profession)}</Text>')
text = text.replace('{worker.bio}</Text>', '{localizeDemoText(language, worker.bio)}</Text>')
text = text.replace('{skill.name}</Text>', '{localizeDemoText(language, skill.name)}</Text>')
text = text.replace('{certificate.name}</Text>', '{localizeDemoText(language, certificate.name)}</Text>')
text = text.replace('{document?.title}</Text>', '{localizeDemoText(language, document?.title)}</Text>')
text = text.replace('{document?.demo_content}</Text>', '{localizeDemoText(language, document?.demo_content)}</Text>')
text = text.replace('accessibilityLabel={`${worker.name}, ${worker.profession}`}', 'accessibilityLabel={`${worker.name}, ${localizeDemoText(language, worker.profession)}`}')
write(path, text)

path = "frontend/src/components/workspace/ProjectsView.tsx"
text = read(path)
text = add_after(text, 'import { copy } from "@/src/demo/i18n";\n', 'import { localizeDemoText } from "@/src/demo/localizedData";\n', path)
text = text.replace('{project.description}</Text>', '{localizeDemoText(language, project.description)}</Text>')
text = text.replace('{worker.profession}\n                  </Text>', '{localizeDemoText(language, worker.profession)}\n                  </Text>')
text = text.replace('accessibilityLabel={`${worker.name}, ${worker.profession}`}', 'accessibilityLabel={`${worker.name}, ${localizeDemoText(language, worker.profession)}`}')
write(path, text)

path = "frontend/src/components/workspace/DocumentsView.tsx"
text = read(path)
text = add_after(text, 'import { copy } from "@/src/demo/i18n";\n', 'import { localizeDemoText } from "@/src/demo/localizedData";\n', path)
text = text.replace('title: document.title,', 'title: localizeDemoText(language, document.title),')
text = text.replace('content: document.demo_content,', 'content: localizeDemoText(language, document.demo_content),')
text = text.replace('title={document.title}', 'title={localizeDemoText(language, document.title)}')
text = text.replace('title={contract.title}', 'title={localizeDemoText(language, contract.title)}')
text = text.replace('title: contract.title,', 'title: localizeDemoText(language, contract.title),')
text = text.replace('content: contract.demo_content,', 'content: localizeDemoText(language, contract.demo_content),')
text = text.replace('title={certificate.name}', 'title={localizeDemoText(language, certificate.name)}')
text = text.replace('title: certificate.name,', 'title: localizeDemoText(language, certificate.name),')
text = text.replace('content: project.summary,', 'content: localizeDemoText(language, project.summary),')
write(path, text)


# --- Notifications route ---------------------------------------------------
path = "frontend/app/notifications.tsx"
text = read(path)
text = add_after(text, 'import { api } from "@/src/api/client";\n', 'import { useWorklyData } from "@/src/context/WorklyDataContext";\nimport { uiText } from "@/src/demo/fullUi";\nimport { localizeDemoText } from "@/src/demo/localizedData";\n', path)
text = text.replace('  const router = useRouter();\n', '  const router = useRouter();\n  const { language } = useWorklyData();\n')
text = text.replace('>Notificações</Text>', '>{uiText(language, "Notificações", "Notifications")}</Text>')
text = text.replace('>Sem notificações</Text>', '>{uiText(language, "Sem notificações", "No notifications")}</Text>')
text = text.replace('>{item.title}</Text>', '>{localizeDemoText(language, item.title)}</Text>')
text = text.replace('>{item.body}</Text>', '>{localizeDemoText(language, item.body ?? item.message)}</Text>')
write(path, text)


# --- Make demo-value localization reversible across language switches ------
path = "frontend/src/demo/localizedData.ts"
text = read(path)
old = '''function exact(language: LanguageCode, value: string) {\n  if (language === "pt") return value;\n  const translated = terms[value];\n  return translated ? translated[index[language]] : value;\n}\n'''
new = '''function exact(language: LanguageCode, value: string) {\n  let source = value;\n  let translated = terms[source];\n  if (!translated) {\n    for (const [candidate, values] of Object.entries(terms)) {\n      if (values.includes(value)) {\n        source = candidate;\n        translated = values;\n        break;\n      }\n    }\n  }\n  if (language === "pt") return source;\n  return translated ? translated[index[language]] : value;\n}\n'''
text = must_replace(text, old, new, path)
write(path, text)


# Critical audit: the remaining active workspace should no longer use the old
# Portuguese-vs-English branch pattern. Existing fully-localized modules were
# already migrated in PR #26.
audit = [
    "frontend/src/components/workspace/DashboardView.tsx",
    "frontend/src/components/workspace/AttendanceView.tsx",
    "frontend/src/components/workspace/TeamsView.tsx",
    "frontend/src/components/workspace/ProfileView.tsx",
    "frontend/src/context/WorklyDataContext.tsx",
]
for target in audit:
    body = read(target)
    if 'language === "pt"' in body:
        lines = [str(i + 1) for i, line in enumerate(body.splitlines()) if 'language === "pt"' in line]
        raise RuntimeError(f"Legacy PT/EN language switch remains in {target} at lines {', '.join(lines)}")

print("Full i18n migration applied successfully.")
