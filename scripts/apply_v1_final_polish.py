from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Pattern not found in {path}: {old!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "frontend/src/components/workspace/NotificationCenter.tsx",
    "  }, [user?.id]);\n",
    "  }, [user]);\n",
)

replace_once(
    "frontend/src/components/workspace/OperationsMapView.tsx",
    "  const accent = roleAccent(role);\n  const t = copy[language];\n  const [selectedProjectId",
    "  const accent = roleAccent(role);\n  const [selectedProjectId",
)

replace_once(
    "frontend/src/components/workspace/PremiumDashboardView.tsx",
    "  ActivityIndicator,\n",
    "",
)
replace_once(
    "frontend/src/components/workspace/PremiumDashboardView.tsx",
    '''type CompliancePayload = {\n  summary: { total: number; fit: number; attention: number; blocked: number };\n  rows: Array<{\n    worker_id: string;\n    project_id: string;\n    project_name: string;\n    status: "fit" | "attention" | "blocked";\n    fit_for_check_in: boolean;\n    issues: Array<{ label: string; code: string }>;\n  }>;\n};\n''',
    '''type CompliancePayload = {\n  summary: { total: number; fit: number; attention: number; blocked: number };\n  rows: {\n    worker_id: string;\n    project_id: string;\n    project_name: string;\n    status: "fit" | "attention" | "blocked";\n    fit_for_check_in: boolean;\n    issues: { label: string; code: string }[];\n  }[];\n};\n''',
)

for path in (
    "frontend/src/components/workspace/ProjectsView.tsx",
    "frontend/src/components/workspace/WorkersView.tsx",
):
    replace_once(path, 'import { uiFormat, uiText } from "@/src/demo/localizedUi";\n', 'import { uiText } from "@/src/demo/localizedUi";\n')

replace_once(
    "frontend/src/demo/i18n.ts",
    '''export const languageOptions: Array<{\n  code: LanguageCode;\n  label: string;\n  nativeName: string;\n}> = [\n''',
    '''export const languageOptions: {\n  code: LanguageCode;\n  label: string;\n  nativeName: string;\n}[] = [\n''',
)

print("V1 final polish applied")
