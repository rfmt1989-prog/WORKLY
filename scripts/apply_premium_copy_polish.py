from pathlib import Path

root = Path(__file__).resolve().parents[1]

# Premium dashboard translations
path = root / "frontend/src/components/workspace/PremiumDashboardView.tsx"
text = path.read_text()
text = text.replace('import { uiText } from "@/src/demo/fullUi";\n', '')
text = text.replace('import type { WorkspaceSection } from "./navigation";\n', 'import type { WorkspaceSection } from "./navigation";\nimport { premiumCopy, premiumFormat } from "./premiumCopy";\n')
text = text.replace('  const accent = roleAccent(role);\n', '  const accent = roleAccent(role);\n  const p = premiumCopy[language];\n')
replacements = {
    'uiText(language, `${blocked} trabalhador(es) bloqueado(s)`, `${blocked} blocked worker(s)`)': 'premiumFormat(p.blockedWorkers, { count: blocked })',
    'uiText(language, "Resolver requisitos antes do próximo check-in.", "Resolve requirements before the next check-in.")': 'p.resolveBeforeCheckin',
    'uiText(language, `${attention} requisito(s) a acompanhar`, `${attention} requirement(s) need attention`)': 'premiumFormat(p.requirementsAttention, { count: attention })',
    'uiText(language, "Validades próximas ou pendências não críticas.", "Upcoming expiries or non-critical issues.")': 'p.upcomingExpiries',
    'uiText(language, `${unassignedTeams} equipa(s) sem obra`, `${unassignedTeams} team(s) without a site`)': 'premiumFormat(p.teamsWithoutSite, { count: unassignedTeams })',
    'uiText(language, "Atribuir equipa a uma frente de trabalho.", "Assign the team to a work front.")': 'p.assignTeam',
    'uiText(language, `${atRiskProjects} obra(s) pausada(s)`, `${atRiskProjects} paused site(s)`)': 'premiumFormat(p.pausedSites, { count: atRiskProjects })',
    'uiText(language, "Rever estado e planeamento.", "Review status and planning.")': 'p.reviewPlanning',
    'uiText(language, "CENTRO DE COMANDO", "COMMAND CENTER")': 'p.commandCenter',
    'uiText(language, "O que precisa da tua atenção", "What needs your attention")': 'p.attentionTitle',
    'uiText(language, `${actions.length} prioridade(s) operacional(is) agora.`, `${actions.length} operational priority item(s) now.`)': 'premiumFormat(p.prioritiesNow, { count: actions.length })',
    'uiText(language, "Sem bloqueios críticos. Operação estável.", "No critical blockers. Operations are stable.")': 'p.stableOperation',
    'uiText(language, "em obra", "on site")': 'p.onSite',
    'uiText(language, "Obras ativas", "Active sites")': 'p.activeSites',
    'uiText(language, "Aptos", "Fit")': 'p.fit',
    'uiText(language, "Em obra", "On site")': 'p.onSite',
    'uiText(language, "Prioridades", "Priorities")': 'p.priorities',
    'uiText(language, "Só aparece o que exige decisão.", "Only items requiring a decision appear here.")': 'p.decisionsOnly',
    'uiText(language, "Tudo sob controlo", "All clear")': 'p.allClear',
    'uiText(language, "Não existem ações urgentes neste momento.", "There are no urgent actions right now.")': 'p.noUrgent',
    'uiText(language, "Ações rápidas", "Quick actions")': 'p.quickActions',
    'uiText(language, "Vai diretamente ao módulo certo.", "Go directly to the right module.")': 'p.rightModule',
    'uiText(language, "Operações", "Operations")': 'p.operations',
    'uiText(language, "Trabalhadores", "Workers")': 'p.workers',
    'uiText(language, "Obras", "Projects")': 'p.projects',
    'uiText(language, "Conformidade", "Compliance")': 'p.compliance',
    'uiText(language, "HOJE", "TODAY")': 'p.today',
    'uiText(language, "Sessão de trabalho ativa", "Work session active")': 'p.activeWorkSession',
    'uiText(language, "Pronto para o próximo passo", "Ready for the next step")': 'p.readyNextStep',
    'uiText(language, "Sem obra atribuída", "No assigned site")': 'p.noAssignedSite',
    'uiText(language, "Check-in bloqueado", "Check-in blocked")': 'p.checkinBlocked',
    'uiText(language, "Apto", "Fit")': 'p.fit',
    'uiText(language, "Próxima ação", "Next action")': 'p.nextAction',
    'uiText(language, "Resolve a conformidade antes de entrar em obra.", "Resolve compliance before entering the site.")': 'p.resolveCompliance',
    'uiText(language, "Quando terminares, regista a saída.", "When you finish, check out.")': 'p.checkoutWhenFinish',
    'uiText(language, "Valida a localização e regista a entrada.", "Validate location and check in.")': 'p.validateLocation',
    'uiText(language, "Registar saída", "Check out")': 'p.checkOut',
    'uiText(language, "Registar entrada", "Check in")': 'p.checkIn',
    'uiText(language, "O teu espaço", "Your workspace")': 'p.yourWorkspace',
    'uiText(language, "Sem duplicar informação entre áreas.", "No duplicated information between areas.")': 'p.noDuplicateInfo',
    'uiText(language, "Presenças", "Attendance")': 'p.attendance',
    'uiText(language, "Documentos", "Documents")': 'p.documents',
    'uiText(language, "Perfil", "Profile")': 'p.profile',
}
for old, new in replacements.items():
    text = text.replace(old, new)
if 'uiText(' in text:
    raise SystemExit('Unconverted uiText call remains in PremiumDashboardView')
path.write_text(text)

# More menu translations
path = root / "frontend/src/components/workspace/WorkspaceMoreMenu.tsx"
text = path.read_text()
text = text.replace('import { uiText } from "@/src/demo/fullUi";\n', '')
text = text.replace('import type { WorkspaceSection } from "./navigation";\n', 'import type { WorkspaceSection } from "./navigation";\nimport { premiumCopy } from "./premiumCopy";\n')
text = text.replace('}: Props) {\n  return (', '}: Props) {\n  const p = premiumCopy[language];\n  return (')
text = text.replace('uiText(language, "Mais ferramentas", "More tools")', 'p.moreTools')
text = text.replace('uiText(\n        language,\n        "Funções menos frequentes, sem poluir a navegação principal.",\n        "Less frequent tools without cluttering primary navigation.",\n      )', 'p.moreToolsSubtitle')
text = text.replace('uiText(language, "Área atual", "Current area")', 'p.currentArea')
text = text.replace('uiText(language, "Abrir", "Open")', 'p.open')
if 'uiText(' in text:
    raise SystemExit('Unconverted uiText call remains in WorkspaceMoreMenu')
path.write_text(text)

# Shell: premium labels and permissive first paint while permissions refresh
path = root / "frontend/src/components/workspace/ImmersiveWorkspaceShell.tsx"
text = path.read_text()
text = text.replace('import { WorkspaceMoreMenu } from "./WorkspaceMoreMenu";\n', 'import { WorkspaceMoreMenu } from "./WorkspaceMoreMenu";\nimport { premiumCopy } from "./premiumCopy";\n')
text = text.replace('  const t = copy[language];\n', '  const t = copy[language];\n  const p = premiumCopy[language];\n')
text = text.replace('{ id: "dashboard", label: t.dashboard, icon: "grid-outline" },', '{ id: "dashboard", label: role === "company" ? p.companyHome : p.workerHome, icon: "grid-outline" },')
text = text.replace('(role !== "company" || !item.permission || user.permissions?.includes(item.permission)),', '(role !== "company" || !item.permission || !user.permissions || user.permissions.includes(item.permission)),')
text = text.replace('accessibilityLabel={uiText(language, "Mais", "More")}', 'accessibilityLabel={p.more}')
text = text.replace('{uiText(language, "Mais", "More")}', '{p.more}')
path.write_text(text)

# Keep the document language in sync with the in-app language on web.
path = root / "frontend/src/context/WorklyDataContext.tsx"
text = path.read_text()
text = text.replace('import { AppState } from "react-native";', 'import { AppState, Platform } from "react-native";')
needle = '''  const setLanguage = useCallback((nextLanguage: LanguageCode) => {\n    setLanguageState(nextLanguage);\n    void storage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);\n  }, []);\n'''
replacement = needle + '''\n  useEffect(() => {\n    if (Platform.OS === "web" && typeof document !== "undefined") {\n      document.documentElement.lang = language;\n    }\n  }, [language]);\n'''
if needle not in text:
    raise SystemExit('setLanguage block not found')
text = text.replace(needle, replacement, 1)
path.write_text(text)

# Remove duplicated architecture note created during exploration.
duplicate = root / "docs/01_Product/PREMIUM_PRODUCT_RULES_V2.md"
if duplicate.exists():
    duplicate.unlink()
