"""Evidence-based Workly levels, calculated for one worker's primary trade."""

from __future__ import annotations

import re
import unicodedata
from datetime import date
from typing import Any


PROFESSION_MATCHES = {
    "electromechanics": ("eletromec", "electromech", "manutencao industrial", "maintenance technician"),
    "electrical": ("eletric", "electrician", "electrical"),
    "hvac": ("hvac", "avac", "climat", "refrig", "frigor"),
    "plumbing": ("canal", "plumb", "hidraul"),
    "solar": ("solar", "fotovolt", "photovolta"),
    "welding": ("soldad", "weld", "serralh"),
    "fire": ("incend", "fire", "sprinkler", "detec"),
    "industrial": ("montag", "industrial assembly", "mechanical fitter", "mecanico montador", "equipament"),
}
CERTIFICATE_MATCHES = {
    "electromechanics": ("eletromec", "motor", "variador", "automation", "automacao", "manutencao"),
    "electrical": ("eletric", "electri", "h0b0", "b1v", "b2v", "habilit"),
    "hvac": ("hvac", "avac", "climat", "refrig", "f-gas", "fgas", "fluorado", "vrf"),
    "plumbing": ("canal", "plumb", "hidraul", "agua", "saneamento", "tubagem"),
    "solar": ("solar", "fotovolt", "photovolta"),
    "welding": ("soldad", "weld", "tig", "mig", "mag", "eletrodo"),
    "fire": ("incend", "fire", "sprinkler", "detec", "extinc"),
    "industrial": ("industr", "montag", "alinhamento", "torque", "bolting"),
}
ADDITIONAL_SKILL_MATCHES = ("loto", "altura", "height", "socorr", "first aid", "confin", "andaime", "scaffold", "rigging", "empilhador", "forklift", "ponte rolante")
LEVELS = (
    ("apprentice", "Aprendiz", "Apprentice", 0),
    ("junior", "Júnior", "Junior", 20),
    ("professional", "Profissional", "Professional", 40),
    ("specialist", "Especialista", "Specialist", 65),
    ("master", "Master", "Master", 85),
)


def normalize(value: str) -> str:
    return "".join(char for char in unicodedata.normalize("NFKD", value.lower().strip()) if not unicodedata.combining(char))


def profession_id(profession: str) -> str:
    value = normalize(profession)
    if not value:
        return "unselected"
    for key, matches in PROFESSION_MATCHES.items():
        if any(match in value for match in matches):
            return key
    return "trade-" + (re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "unselected")


def _verified_current(certificate: dict[str, Any], today: date) -> bool:
    if certificate.get("status") != "verified":
        return False
    try:
        issued = certificate.get("issued_at")
        expires = certificate.get("expires_at")
        return (not issued or date.fromisoformat(issued) <= today) and (not expires or date.fromisoformat(expires) >= today)
    except (TypeError, ValueError):
        return False


def _certificate_kind(certificate: dict[str, Any]) -> str:
    if certificate.get("kind") in {"certification", "skill"}:
        return certificate["kind"]
    return "skill" if any(match in normalize(str(certificate.get("name", ""))) for match in ADDITIONAL_SKILL_MATCHES) else "certification"


def professional_identity(worker: dict[str, Any], projects: list[dict[str, Any]], *, today: date | None = None) -> dict[str, Any]:
    """Self-declared experience, skills and portfolio never award verified points."""
    today = today or date.today()
    area = profession_id(str(worker.get("profession", "")))
    certificates: dict[tuple[str, str], dict[str, Any]] = {}
    for item in worker.get("certificates", []):
        if not _verified_current(item, today):
            continue
        explicit_area = item.get("profession_id")
        name = normalize(str(item.get("name", "")))
        relevant = explicit_area == area or (not explicit_area and any(match in name for match in CERTIFICATE_MATCHES.get(area, ())))
        if not relevant:
            continue
        # The same qualification uploaded twice must not award points twice.
        certificates.setdefault((name, normalize(str(item.get("issuer", "")))), item)
    professional_count = sum(_certificate_kind(item) == "certification" for item in certificates.values())
    skills_count = sum(_certificate_kind(item) == "skill" for item in certificates.values())
    completed_ids = {
        str(item["id"]) for item in projects
        if item.get("id") and item.get("status") == "completed"
        and worker["id"] in item.get("worker_ids", [])
        and item.get("profession_id") == area
    }
    completed_ids.update(
        str(item["id"]) for item in worker.get("best_projects", [])
        if item.get("id") and item.get("status") == "verified"
        and item.get("verified_by") and item.get("profession_id") == area
    )
    completed_projects = len(completed_ids)
    components = [
        {"id": "certifications", "label": "Certificações verificadas", "label_en": "Verified certifications", "points": min(professional_count, 5) * 10, "maximum": 50, "count": professional_count, "points_each": 10},
        {"id": "skills", "label": "Competências comprovadas", "label_en": "Proven skills", "points": min(skills_count, 5) * 4, "maximum": 20, "count": skills_count, "points_each": 4},
        {"id": "projects", "label": "Obras confirmadas na área", "label_en": "Confirmed projects in this trade", "points": min(completed_projects, 3) * 10, "maximum": 30, "count": completed_projects, "points_each": 10},
    ]
    score = sum(item["points"] for item in components)
    level_index = max(index for index, item in enumerate(LEVELS) if score >= item[3])
    levels = [{"id": key, "label": label, "label_en": label_en, "minimum": minimum} for key, label, label_en, minimum in LEVELS]
    current = levels[level_index]
    next_level = levels[level_index + 1] if level_index + 1 < len(levels) else None
    span = (next_level["minimum"] if next_level else 100) - current["minimum"]
    return {
        "id": worker["id"], "profession_id": area,
        "score": score, "maximum": 100, "level": current,
        "level_index": level_index, "levels": levels, "next_level": next_level,
        "points_to_next": max(0, next_level["minimum"] - score) if next_level else 0,
        "progress": round((score - current["minimum"]) / span * 100) if next_level else 100,
        "components": components,
        "master_requirements": "85 pontos; exige certificações e obras concluídas na profissão principal.",
    }
