from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "frontend/src/components/workspace/primitives.tsx"
text = path.read_text()

for old, new in {
    'background: "#07090E"': 'background: "#06080D"',
    'backgroundElevated: "#0A0D14"': 'backgroundElevated: "#090C12"',
    'panel: "#10141D"': 'panel: "#0E131B"',
    'panelStrong: "#151B26"': 'panelStrong: "#141B25"',
    'panelSoft: "#0C1018"': 'panelSoft: "#0A0F16"',
    'line: "#242C3B"': 'line: "#1D2734"',
    'lineStrong: "#354156"': 'lineStrong: "#303D50"',
    'text: "#F5F8FF"': 'text: "#F7F9FC"',
    'textSoft: "#C8D0E0"': 'textSoft: "#CAD3E2"',
    'muted: "#7F8A9D"': 'muted: "#7D899C"',
}.items():
    text = text.replace(old, new)

old_card = '''  card: {\n    backgroundColor: workspaceColors.panel,\n    borderWidth: 1,\n    borderColor: workspaceColors.line,\n    borderRadius: 18,\n    padding: 16,\n    shadowColor: workspaceColors.shadow,\n    shadowOpacity: Platform.OS === "web" ? 0.22 : 0.12,\n    shadowRadius: 18,\n    shadowOffset: { width: 0, height: 8 },\n  },\n'''
new_card = '''  card: {\n    backgroundColor: workspaceColors.panel,\n    borderWidth: 1,\n    borderColor: workspaceColors.line,\n    borderRadius: 20,\n    padding: 17,\n    shadowColor: workspaceColors.shadow,\n    shadowOpacity: Platform.OS === "web" ? 0.16 : 0.1,\n    shadowRadius: 24,\n    shadowOffset: { width: 0, height: 10 },\n  },\n'''
if old_card not in text:
    raise SystemExit("card style block not found")
text = text.replace(old_card, new_card)

old_button = '''  button: {\n    minHeight: 44,\n    borderRadius: 12,\n    borderWidth: 1,\n    paddingHorizontal: 15,\n    paddingVertical: 10,\n    flexDirection: "row",\n    alignItems: "center",\n    justifyContent: "center",\n    gap: 7,\n    shadowOpacity: 0.25,\n    shadowRadius: 12,\n    shadowOffset: { width: 0, height: 4 },\n  },\n'''
new_button = '''  button: {\n    minHeight: 44,\n    borderRadius: 13,\n    borderWidth: 1,\n    paddingHorizontal: 15,\n    paddingVertical: 10,\n    flexDirection: "row",\n    alignItems: "center",\n    justifyContent: "center",\n    gap: 7,\n    shadowOpacity: 0.18,\n    shadowRadius: 10,\n    shadowOffset: { width: 0, height: 4 },\n  },\n'''
if old_button not in text:
    raise SystemExit("button style block not found")
text = text.replace(old_button, new_button)
text = text.replace('    fontWeight: "700",\n  },\n  iconButton:', '    fontWeight: "800",\n  },\n  iconButton:', 1)

path.write_text(text)

# Keep the static web shell aligned with the refined background token.
html_path = root / "frontend/app/+html.tsx"
html = html_path.read_text().replace("#07090E", "#06080D")
html_path.write_text(html)
