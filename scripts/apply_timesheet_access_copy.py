from pathlib import Path

path = Path("frontend/src/components/workspace/AccessView.tsx")
text = path.read_text()

labels = {
    '    "attendance.read": "Ver presenças",\n': '    "attendance.read": "Ver presenças",\n    "attendance.manage": "Gerir e aprovar horas",\n',
    '    "attendance.read": "View attendance",\n': '    "attendance.read": "View attendance",\n    "attendance.manage": "Manage and approve hours",\n',
    '    "attendance.read": "Voir les présences",\n': '    "attendance.read": "Voir les présences",\n    "attendance.manage": "Gérer et approuver les heures",\n',
    '    "attendance.read": "Ver asistencia",\n': '    "attendance.read": "Ver asistencia",\n    "attendance.manage": "Gestionar y aprobar horas",\n',
    '    "attendance.read": "Vezi prezența",\n': '    "attendance.read": "Vezi prezența",\n    "attendance.manage": "Gestionează și aprobă orele",\n',
    '    "attendance.read": "Anwesenheit ansehen",\n': '    "attendance.read": "Anwesenheit ansehen",\n    "attendance.manage": "Stunden verwalten und genehmigen",\n',
    '    "attendance.read": "Aanwezigheid bekijken",\n': '    "attendance.read": "Aanwezigheid bekijken",\n    "attendance.manage": "Uren beheren en goedkeuren",\n',
}

for old, new in labels.items():
    if old not in text:
        raise SystemExit(f"Missing permission label source: {old.strip()}")
    text = text.replace(old, new, 1)

path.write_text(text)
