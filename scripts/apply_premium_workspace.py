from pathlib import Path

root = Path(__file__).resolve().parents[1]

# --- types: allow bootstrap to carry authoritative current user ---
types_path = root / "frontend/src/demo/types.ts"
types = types_path.read_text()
types = types.replace(
    "export type WorklyState = {\n  version: number;",
    "export type WorklyState = {\n  current_user?: AuthUser;\n  version: number;",
)
types_path.write_text(types)

# --- WorklyDataContext: reconcile user permissions from bootstrap ---
ctx_path = root / "frontend/src/context/WorklyDataContext.tsx"
ctx = ctx_path.read_text()
ctx = ctx.replace(
    "  const stateSnapshotRef = useRef(\"\");\n  const syncInFlightRef = useRef(false);",
    "  const stateSnapshotRef = useRef(\"\");\n  const authSnapshotRef = useRef(\"\");\n  const syncInFlightRef = useRef(false);",
)
ctx = ctx.replace(
    "        const remote = await api.get<WorklyState>(\"/bootstrap\");\n        const serializedRemote = JSON.stringify(remote);",
    "        const remote = await api.get<WorklyState>(\"/bootstrap\");\n        if (remote.current_user) {\n          const serializedUser = JSON.stringify(remote.current_user);\n          if (serializedUser !== authSnapshotRef.current) {\n            authSnapshotRef.current = serializedUser;\n            setUser(remote.current_user);\n          }\n        }\n        const serializedRemote = JSON.stringify(remote);",
)
ctx = ctx.replace(
    "      stateSnapshotRef.current = \"\";\n      return;",
    "      stateSnapshotRef.current = \"\";\n      authSnapshotRef.current = \"\";\n      return;",
)
ctx = ctx.replace(
    "    [language, token, userId],\n  );",
    "    [language, setUser, token, userId],\n  );",
    1,
)
ctx_path.write_text(ctx)

# --- Shell: premium nav + focused dashboard + more menu ---
shell_path = root / "frontend/src/components/workspace/ImmersiveWorkspaceShell.tsx"
shell = shell_path.read_text()
shell = shell.replace(
    'import { DashboardView } from "./DashboardView";\n',
    'import { PremiumDashboardView } from "./PremiumDashboardView";\n',
)
shell = shell.replace(
    'import { WorkersView } from "./WorkersView";\n',
    'import { WorkersView } from "./WorkersView";\nimport { WorkspaceMoreMenu } from "./WorkspaceMoreMenu";\n',
)
shell = shell.replace(
    '  const [resetBusy, setResetBusy] = useState(false);\n',
    '  const [resetBusy, setResetBusy] = useState(false);\n  const [moreOpen, setMoreOpen] = useState(false);\n',
)
old_filter = '''  const navItems = allNavItems.filter(\n    (item) =>\n      (!item.companyOnly || role === "company") &&\n      (!item.workerOnly || role === "worker") &&\n      (role !== "company" || !item.permission || user.permissions?.includes(item.permission)),\n  );\n'''
new_filter = '''  const visibleNavItems = allNavItems.filter(\n    (item) =>\n      (!item.companyOnly || role === "company") &&\n      (!item.workerOnly || role === "worker") &&\n      (role !== "company" || !item.permission || user.permissions?.includes(item.permission)),\n  );\n  const primaryIds: WorkspaceSection[] =\n    role === "company"\n      ? ["dashboard", "operations", "workers", "projects", "compliance"]\n      : ["dashboard", "attendance", "compliance", "documents", "profile"];\n  const primaryNavItems = primaryIds\n    .map((id) => visibleNavItems.find((item) => item.id === id))\n    .filter((item): item is NavItem => Boolean(item));\n  const secondaryNavItems = visibleNavItems.filter(\n    (item) => !primaryIds.includes(item.id),\n  );\n  const secondaryActive = secondaryNavItems.some((item) => item.id === activeSection);\n'''
if old_filter not in shell:
    raise SystemExit("nav filter block not found")
shell = shell.replace(old_filter, new_filter)

shell = shell.replace(
    '        return <DashboardView onNavigate={navigate} />;',
    '        return <PremiumDashboardView onNavigate={navigate} />;',
)

metric_block = '''        {!compact ? (\n          <View style={styles.metricStrip}>\n            <MetricMini\n              icon="people-outline"\n              value={operational.activeWorkers}\n              label={t.onSite}\n              accent={accent}\n            />\n            <MetricMini\n              icon="business-outline"\n              value={operational.activeProjects}\n              label={t.projects}\n              accent={accent}\n            />\n          </View>\n        ) : null}\n\n'''
shell = shell.replace(metric_block, "")

shell = shell.replace(
    '          {navItems.map((item) => {',
    '          {primaryNavItems.map((item) => {',
)
needle = '''          })}\n        </ScrollView>\n      </View>\n\n      {toast ? ('''
replacement = '''          })}\n          {secondaryNavItems.length ? (\n            <Pressable\n              accessibilityRole="button"\n              accessibilityLabel={uiText(language, "Mais", "More")}\n              accessibilityState={{ selected: secondaryActive }}\n              onPress={() => setMoreOpen(true)}\n              style={({ pressed }) => [\n                styles.dockButton,\n                secondaryActive\n                  ? {\n                      borderColor: `${accent}66`,\n                      backgroundColor: `${accent}16`,\n                    }\n                  : null,\n                pressed ? { opacity: 0.7 } : null,\n              ]}\n            >\n              <View\n                style={[\n                  styles.dockIcon,\n                  secondaryActive ? { backgroundColor: `${accent}22` } : null,\n                ]}\n              >\n                <Ionicons\n                  name="ellipsis-horizontal"\n                  size={20}\n                  color={secondaryActive ? accent : workspaceColors.muted}\n                />\n              </View>\n              <Text\n                style={[\n                  styles.dockLabel,\n                  secondaryActive ? { color: workspaceColors.text } : null,\n                ]}\n                numberOfLines={1}\n              >\n                {uiText(language, "Mais", "More")}\n              </Text>\n              {secondaryActive ? (\n                <View style={[styles.activeLine, { backgroundColor: accent }]} />\n              ) : null}\n            </Pressable>\n          ) : null}\n        </ScrollView>\n      </View>\n\n      <WorkspaceMoreMenu\n        visible={moreOpen}\n        onClose={() => setMoreOpen(false)}\n        onNavigate={navigate}\n        items={secondaryNavItems}\n        activeSection={activeSection}\n        accent={accent}\n        language={language}\n      />\n\n      {toast ? ('''
if needle not in shell:
    raise SystemExit("dock insertion point not found")
shell = shell.replace(needle, replacement)

# Remove unused MetricMini component.
start = shell.find("\nfunction MetricMini({")
end = shell.find("\nconst styles = StyleSheet.create({", start)
if start != -1 and end != -1:
    shell = shell[:start] + shell[end:]

# Remove unused metric styles if present.
for block in [
'''  metricStrip: {\n    flexDirection: "row",\n    alignItems: "center",\n    gap: 8,\n  },\n''',
'''  metricMini: {\n    minWidth: 84,\n    minHeight: 40,\n    paddingHorizontal: 10,\n    borderRadius: 12,\n    borderWidth: 1,\n    borderColor: workspaceColors.line,\n    backgroundColor: workspaceColors.panelSoft,\n    flexDirection: "row",\n    alignItems: "center",\n    justifyContent: "center",\n    gap: 5,\n  },\n''',
'''  metricValue: {\n    color: workspaceColors.text,\n    fontSize: 13,\n    fontWeight: "800",\n  },\n''',
'''  metricLabel: {\n    color: workspaceColors.muted,\n    fontSize: 10,\n    fontWeight: "700",\n  },\n''',
]:
    shell = shell.replace(block, "")

shell_path.write_text(shell)
