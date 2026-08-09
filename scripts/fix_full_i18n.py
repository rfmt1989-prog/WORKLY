from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return (ROOT / path).read_text(encoding="utf-8")


def save(path, text):
    (ROOT / path).write_text(text, encoding="utf-8")


def replace(text, old, new, path):
    if old not in text:
        raise RuntimeError(f"Missing expected text in {path}: {old[:120]!r}")
    return text.replace(old, new)

# Dashboard: profession is descriptive data, while name/location stay unchanged.
p = "frontend/src/components/workspace/DashboardView.tsx"
t = load(p)
t = replace(t, '{worker?.profession ?? user.title} · {worker?.location ?? "Portugal"}', '{localizeDemoText(language, worker?.profession ?? user.title)} · {worker?.location ?? "Portugal"}', p)
save(p, t)

# Worker directory: localize every descriptive field, including document titles.
p = "frontend/src/components/workspace/WorkersView.tsx"
t = load(p)
t = replace(t, 'title={document?.title ?? t.demoDocument}', 'title={localizeDemoText(language, document?.title) || t.demoDocument}', p)
t = replace(t, '{worker.profession}\n          </Text>', '{localizeDemoText(language, worker.profession)}\n          </Text>', p)
t = replace(t, 'accessibilityLabel={item.title}', 'accessibilityLabel={localizeDemoText(language, item.title)}', p)
t = replace(t, '<Text style={styles.detailLabel}>{item.title}</Text>', '<Text style={styles.detailLabel}>{localizeDemoText(language, item.title)}</Text>', p)
t = replace(t, 'value={form.profession}\n        onChangeText', 'value={localizeDemoText(language, form.profession)}\n        onChangeText', p)
t = replace(t, 'value={form.bio}\n        multiline', 'value={localizeDemoText(language, form.bio)}\n        multiline', p)
save(p, t)

# Documents: worker professions are descriptive; worker names and locations remain.
p = "frontend/src/components/workspace/DocumentsView.tsx"
t = load(p)
t = replace(t, '{worker.profession}\n                              </Text>', '{localizeDemoText(language, worker.profession)}\n                              </Text>', p)
t = replace(t, 'subtitle={`${activeWorker.profession} · ${activeWorker.location}`}', 'subtitle={`${localizeDemoText(language, activeWorker.profession)} · ${activeWorker.location}`}', p)
save(p, t)

# Teams editor: translate built-in specialty/description values without touching the team name.
p = "frontend/src/components/workspace/TeamsView.tsx"
t = load(p)
t = replace(t, 'value={form.specialty}\n        onChangeText', 'value={localizeDemoText(language, form.specialty)}\n        onChangeText', p)
t = replace(t, 'value={form.description}\n        multiline', 'value={localizeDemoText(language, form.description)}\n        multiline', p)
save(p, t)

# Project editor: project name/client/location are proper data; description is translated.
p = "frontend/src/components/workspace/ProjectsView.tsx"
t = load(p)
t = replace(t, 'value={form.description}\n        multiline', 'value={localizeDemoText(language, form.description)}\n        multiline', p)
save(p, t)

# Profile: fix role label rendering and localize built-in editable descriptive values.
p = "frontend/src/components/workspace/ProfileView.tsx"
t = load(p)
t = replace(
    t,
    '''            <Text style={sharedStyles.label}>\n              `WORKLY ${uiText(language, role === "worker" ? "TRABALHADOR" : "EMPRESA", role === "worker" ? "WORKER" : "COMPANY")}`\n            </Text>''',
    '''            <Text style={sharedStyles.label}>\n              {`WORKLY ${uiText(language, role === "worker" ? "TRABALHADOR" : "EMPRESA", role === "worker" ? "WORKER" : "COMPANY")}`}\n            </Text>''',
    p,
)
t = t.replace('label="Email"', 'label={uiText(language, "Email", "Email")}')
t = t.replace('label="Website"', 'label={uiText(language, "Website", "Website")}')
t = replace(t, 'value={form.profession}\n            onChangeText', 'value={localizeDemoText(language, form.profession)}\n            onChangeText', p)
t = replace(t, 'value={form.bio}\n          multiline', 'value={localizeDemoText(language, form.bio)}\n          multiline', p)
# Skills are a multi-line Name:Level field; translate only the skill name portion.
t = replace(t, 'value={form.skills}\n          multiline', 'value={localizeSkillsText(language, form.skills)}\n          multiline', p)
t = replace(t, 'value={form.industry}\n            onChangeText', 'value={localizeDemoText(language, form.industry)}\n            onChangeText', p)
t = replace(t, 'value={form.description}\n          multiline', 'value={localizeDemoText(language, form.description)}\n          multiline', p)
if 'localizeSkillsText' not in t.split('\n', 25)[0:25]:
    t = t.replace('import { localizeDemoText } from "@/src/demo/localizedData";', 'import { localizeDemoText, localizeSkillsText } from "@/src/demo/localizedData";')
save(p, t)

# Add helper for profile skill-editor content.
p = "frontend/src/demo/localizedData.ts"
t = load(p)
if "export function localizeSkillsText" not in t:
    t += '''\nexport function localizeSkillsText(language: LanguageCode, value: string) {\n  return value\n    .split("\\n")\n    .map((line) => {\n      const separator = line.lastIndexOf(":");\n      if (separator < 0) return localizeDemoText(language, line);\n      const name = line.slice(0, separator);\n      const level = line.slice(separator + 1);\n      return `${localizeDemoText(language, name)}:${level}`;\n    })\n    .join("\\n");\n}\n'''
save(p, t)

# Supplement less common global labels/messages not covered by previous module catalogs.
p = "frontend/src/demo/fullUi.ts"
t = load(p)
if "const supplement" not in t:
    marker = "export function uiText(language: LanguageCode, portuguese: string, english: string) {"
    supplement = '''const supplement: Record<SecondaryLanguage, Record<string, string>> = {\n  fr: { "Could not load the data.": "Impossible de charger les données.", "Reset failed.": "Échec de la réinitialisation.", Email: "E-mail", Website: "Site web", Notifications: "Notifications", "No notifications": "Aucune notification", Home: "Accueil", Search: "Rechercher", Messages: "Messages", "OUT {distance}m": "HORS ZONE {distance}m" },\n  es: { "Could not load the data.": "No se pudieron cargar los datos.", "Reset failed.": "Error al restablecer los datos.", Email: "Correo electrónico", Website: "Sitio web", Notifications: "Notificaciones", "No notifications": "Sin notificaciones", Home: "Inicio", Search: "Buscar", Messages: "Mensajes", "OUT {distance}m": "FUERA {distance}m" },\n  ro: { "Could not load the data.": "Datele nu au putut fi încărcate.", "Reset failed.": "Resetarea datelor a eșuat.", Email: "E-mail", Website: "Site web", Notifications: "Notificări", "No notifications": "Nicio notificare", Home: "Acasă", Search: "Caută", Messages: "Mesaje", "OUT {distance}m": "AFARĂ {distance}m" },\n  de: { "Could not load the data.": "Die Daten konnten nicht geladen werden.", "Reset failed.": "Zurücksetzen fehlgeschlagen.", Email: "E-Mail", Website: "Website", Notifications: "Benachrichtigungen", "No notifications": "Keine Benachrichtigungen", Home: "Start", Search: "Suchen", Messages: "Nachrichten", "OUT {distance}m": "AUSSERHALB {distance}m" },\n  nl: { "Could not load the data.": "De gegevens konden niet worden geladen.", "Reset failed.": "Resetten is mislukt.", Email: "E-mail", Website: "Website", Notifications: "Meldingen", "No notifications": "Geen meldingen", Home: "Start", Search: "Zoeken", Messages: "Berichten", "OUT {distance}m": "BUITEN {distance}m" },\n};\n\n'''
    t = replace(t, marker, supplement + marker, p)
    t = replace(t, '  return extra[language][english] ?? baseUiText(language, portuguese, english);', '  return supplement[language][english] ?? extra[language][english] ?? baseUiText(language, portuguese, english);', p)
    t = replace(t, '  const template = extra[language][english] ?? baseUiText(language, portuguese, english);', '  const template = supplement[language][english] ?? extra[language][english] ?? baseUiText(language, portuguese, english);', p)
save(p, t)

# Legacy tab labels are still a valid mobile deep-link surface; make their navigation labels follow language too.
p = "frontend/app/(tabs)/_layout.tsx"
t = load(p)
if 'useWorklyData' not in t:
    t = t.replace('import { useColors } from "@/src/theme/theme";', 'import { useColors } from "@/src/theme/theme";\nimport { useWorklyData } from "@/src/context/WorklyDataContext";\nimport { copy } from "@/src/demo/i18n";\nimport { uiText } from "@/src/demo/fullUi";')
    t = t.replace('  const c = useColors();\n', '  const c = useColors();\n  const { language } = useWorklyData();\n  const t = copy[language];\n')
    t = t.replace('<Tabs.Screen name="index" options={{ title: "Home",', '<Tabs.Screen name="index" options={{ title: uiText(language, "Início", "Home"),')
    t = t.replace('<Tabs.Screen name="search" options={{ title: "Search",', '<Tabs.Screen name="search" options={{ title: t.search,')
    t = t.replace('<Tabs.Screen name="messages" options={{ title: "Messages",', '<Tabs.Screen name="messages" options={{ title: uiText(language, "Mensagens", "Messages"),')
    t = t.replace('<Tabs.Screen name="contracts" options={{ title: "Contracts",', '<Tabs.Screen name="contracts" options={{ title: t.contracts,')
    t = t.replace('<Tabs.Screen name="profile" options={{ title: "Profile",', '<Tabs.Screen name="profile" options={{ title: t.profile,')
save(p, t)

# Visual guardrails on the current workspace.
checks = {
    "frontend/src/components/workspace/DashboardView.tsx": ["{worker?.profession ?? user.title}"],
    "frontend/src/components/workspace/WorkersView.tsx": [">{worker.profession}</Text>", ">{item.title}</Text>"],
    "frontend/src/components/workspace/DocumentsView.tsx": [">{worker.profession}</Text>", "${activeWorker.profession}"],
    "frontend/src/components/workspace/ProfileView.tsx": ["`WORKLY ${uiText"],
}
for path, forbidden in checks.items():
    body = load(path)
    for item in forbidden:
        if item in body:
            raise RuntimeError(f"Unlocalized visual field remains in {path}: {item}")

print("Visual i18n correction pass complete.")
