"""Evidence-based WORKLY professional levels.

The model intentionally separates:
- occupation competences (essential vs optional);
- verified work experience;
- qualifications;
- responsibility/autonomy;
- regulatory/site authorisations.

WORKLY levels are internal product levels. They are not EQF levels and do not
replace national professional regulation or employer/site authorisation.
"""

from __future__ import annotations

import re
import unicodedata
from datetime import date, datetime
from typing import Any


PROFESSION_MATCHES = {
    "electromechanics": (
        "eletromec",
        "electromech",
        "manutencao industrial",
        "maintenance technician",
    ),
    "electrical": ("eletric", "electrician", "electrical"),
    "hvac": ("hvac", "avac", "climat", "refrig", "frigor"),
    "plumbing": ("canal", "plumb", "hidraul"),
    "solar": ("solar", "fotovolt", "photovolta"),
    "welding": ("soldad", "weld", "serralh"),
    "fire": ("incend", "fire", "sprinkler", "detec"),
    "industrial": (
        "montag",
        "industrial assembly",
        "mechanical fitter",
        "mecanico montador",
        "equipament",
    ),
}

# Essential competence evidence nodes. Each node may also recognise legacy IDs
# so existing profiles keep their evidence when the competency model evolves.
CORE_NODE_ALIASES: dict[str, dict[str, tuple[str, ...]]] = {
    "electromechanics": {
        "em-technical-reading": ("course", "em-technical-reading"),
        "em-mechanical-systems": ("em-mechanical", "em-mechanical-systems"),
        "em-electrical-systems": ("em-motors", "em-electrical-systems"),
        "em-maintenance": ("em-maintenance",),
        "em-fault-diagnosis": ("em-diagnostics", "em-fault-diagnosis"),
        "em-safe-isolation": ("loto", "em-safe-isolation"),
    },
    "electrical": {
        "el-technical-reading": ("course", "el-technical-reading"),
        "el-installation": ("el-installation",),
        "el-testing": ("el-testing",),
        "el-maintenance": ("el-maintenance",),
        "el-diagnostics": ("el-diagnostics",),
        "el-isolation": ("loto", "el-isolation"),
    },
    "hvac": {
        "hvac-principles": ("course", "hvac-principles"),
        "hvac-installation": ("hvac-installation",),
        "hvac-refrigeration": ("hvac-refrigeration", "fgas-a1", "fgas-a2"),
        "hvac-electrical": ("hvac-electrical",),
        "hvac-diagnostics": ("hvac-diagnostics",),
        "hvac-commissioning": ("hvac-efficiency", "hvac-commissioning"),
    },
    "plumbing": {
        "pl-reading": ("course", "pl-reading"),
        "pl-water": ("water-networks", "pl-water"),
        "pl-drainage": ("sanitation", "pl-drainage"),
        "pl-joints": ("pl-joints",),
        "pl-testing": ("pipe-testing", "pl-testing"),
        "pl-diagnostics": ("pl-diagnostics",),
    },
    "solar": {
        "pv-principles": ("course", "photovoltaic", "pv-principles"),
        "pv-mounting": ("photovoltaic", "pv-mounting"),
        "pv-dc": ("pv-dc-ac", "pv-dc"),
        "pv-ac": ("pv-dc-ac", "pv-ac"),
        "pv-testing": ("pv-commissioning", "pv-testing"),
        "pv-maintenance": ("solar-maintenance", "pv-maintenance"),
    },
    "welding": {
        "wel-drawings": ("course", "wel-prep", "wel-drawings"),
        "wel-fitup": ("wel-prep", "wel-fitup"),
        "wel-process": ("wel-process",),
        "wel-quality": ("wel-quality",),
        "wel-distortion": ("wel-distortion",),
        "wel-safety": ("wel-safety",),
    },
    "fire": {
        "fire-reading": ("course", "fire-reading"),
        "fire-install": ("fire-install",),
        "fire-detection": ("fire-detection",),
        "fire-suppression": ("fire-suppression",),
        "fire-testing": ("fire-maintenance", "fire-testing"),
        "fire-handover": ("fire-handover",),
    },
    "industrial": {
        "ind-drawings": ("course", "ind-drawings"),
        "ind-assembly": ("ind-assembly",),
        "ind-alignment": ("ind-alignment",),
        "ind-bolting": ("ind-bolting",),
        "ind-quality": ("ind-commission", "ind-quality"),
        "ind-safe-work": ("loto", "ind-safe-work"),
    },
}

RESPONSIBILITY_NODE_ALIASES: dict[str, tuple[str, ...]] = {
    "electromechanics": ("em-safe-isolation", "em-supervision", "em-lead"),
    "electrical": ("el-isolation", "el-supervision"),
    "hvac": ("hvac-commissioning", "hvac-industrial"),
    "plumbing": ("pl-supervision",),
    "solar": ("pv-lead",),
    "welding": ("wel-safety", "wel-lead"),
    "fire": ("fire-handover", "fire-lead"),
    "industrial": ("ind-safe-work", "ind-supervision"),
}

REGULATORY_MATCHES: dict[str, tuple[str, ...]] = {
    "electromechanics": ("h0b0", "b1v", "b2v", "br", "bc", "loto", "vca", "scc", "atex"),
    "electrical": ("h0b0", "b0", "b1", "b2", "br", "bc", "loto"),
    "hvac": ("fgas", "f-gas", "fluor", "co2", "nh3", "amoniaco"),
    "plumbing": (),
    "solar": ("habilit", "b1", "b2", "br", "altura", "height"),
    "welding": (),
    "fire": (),
    "industrial": ("altura", "height", "ipaf", "3a", "3b", "vca", "scc", "atex"),
}

KNOWLEDGE_NODE_IDS = {
    "em-technical-reading",
    "el-technical-reading",
    "hvac-principles",
    "pl-reading",
    "pv-principles",
    "wel-drawings",
    "fire-reading",
    "ind-drawings",
}

AUTHORISATION_TERMS = (
    "ipaf",
    "vca",
    "scc",
    "atex",
    "h0b0",
    "b0",
    "b1",
    "b2",
    "br",
    "bc",
    "loto",
    "altura",
    "height",
    "first aid",
    "socorr",
    "confined",
    "confin",
    "fgas",
    "f-gas",
    "fluor",
)

TECHNICAL_EVIDENCE_TYPES = {
    "work_record",
    "employer_validation",
    "technical_assessment",
}

LEVELS = (
    {
        "id": "apprentice",
        "label": "Aprendiz",
        "label_en": "Apprentice",
        "minimum": 0,
        "core_coverage": 0,
        "verified_projects": 0,
        "verified_experience_hours": 0,
        "responsibility_evidence": 0,
    },
    {
        "id": "junior",
        "label": "Júnior",
        "label_en": "Junior",
        "minimum": 20,
        "core_coverage": 25,
        "verified_projects": 0,
        "verified_experience_months": 0,
        "responsibility_evidence": 0,
    },
    {
        "id": "professional",
        "label": "Profissional",
        "label_en": "Professional",
        "minimum": 45,
        "core_coverage": 60,
        "verified_projects": 2,
        "verified_experience_hours": 1600,
        "responsibility_evidence": 0,
    },
    {
        "id": "specialist",
        "label": "Especialista",
        "label_en": "Specialist",
        "minimum": 70,
        "core_coverage": 75,
        "verified_projects": 5,
        "verified_experience_hours": 4800,
        "responsibility_evidence": 1,
    },
    {
        "id": "master",
        "label": "Master",
        "label_en": "Master",
        "minimum": 85,
        "core_coverage": 90,
        "verified_projects": 8,
        "verified_experience_hours": 8000,
        "responsibility_evidence": 2,
    },
)


def normalize(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFKD", value.lower().strip())
        if not unicodedata.combining(char)
    )


def profession_id(profession: str) -> str:
    value = normalize(profession)
    if not value:
        return "unselected"
    for key, matches in PROFESSION_MATCHES.items():
        if any(match in value for match in matches):
            return key
    return "trade-" + (
        re.sub(r"[^a-z0-9]+", "-", value).strip("-") or "unselected"
    )


def _verified_current(certificate: dict[str, Any], today: date) -> bool:
    if certificate.get("status") != "verified":
        return False
    try:
        issued = certificate.get("issued_at")
        expires = certificate.get("expires_at")
        return (not issued or date.fromisoformat(issued) <= today) and (
            not expires or date.fromisoformat(expires) >= today
        )
    except (TypeError, ValueError):
        return False



def _evidence_type(certificate: dict[str, Any]) -> str:
    explicit = str(certificate.get("evidence_type", "")).strip()
    if explicit in {
        "qualification",
        "work_record",
        "employer_validation",
        "technical_assessment",
        "authorisation",
    }:
        return explicit
    name = normalize(str(certificate.get("name", "")))
    if any(term in name for term in AUTHORISATION_TERMS):
        return "authorisation"
    return "qualification"


def _matches_competency(
    certificate: dict[str, Any],
    competency_id: str,
    aliases: tuple[str, ...],
) -> bool:
    if str(certificate.get("competency_id", "")).strip() == competency_id:
        return True
    return _certificate_matches_node(certificate, aliases)


def _demonstrates_competency(
    certificate: dict[str, Any],
    competency_id: str,
    aliases: tuple[str, ...],
    today: date,
) -> bool:
    if not _verified_current(certificate, today):
        return False
    if not _matches_competency(certificate, competency_id, aliases):
        return False
    evidence_type = _evidence_type(certificate)
    if evidence_type == "authorisation":
        return False
    if competency_id in KNOWLEDGE_NODE_IDS:
        return evidence_type in {"qualification", *TECHNICAL_EVIDENCE_TYPES}
    return evidence_type in TECHNICAL_EVIDENCE_TYPES


def _certificate_matches_node(
    certificate: dict[str, Any],
    aliases: tuple[str, ...],
) -> bool:
    node_id = normalize(str(certificate.get("node_id", "")))
    name = normalize(str(certificate.get("name", "")))
    normalized_aliases = tuple(normalize(value) for value in aliases)
    return any(
        alias and (node_id == alias or alias in name)
        for alias in normalized_aliases
    )


def _approved_attendance_hours(
    worker_id: str,
    attendance: list[dict[str, Any]],
    project_id: str | None = None,
) -> float:
    total = 0.0
    for item in attendance:
        if item.get("worker_id") != worker_id:
            continue
        if item.get("approval_status") != "approved":
            continue
        if project_id and item.get("project_id") != project_id:
            continue
        try:
            check_in = datetime.fromisoformat(str(item.get("check_in", "")).replace("Z", "+00:00"))
            check_out = datetime.fromisoformat(str(item.get("check_out", "")).replace("Z", "+00:00"))
        except (TypeError, ValueError):
            continue
        hours = (check_out - check_in).total_seconds() / 3600
        if hours > 0:
            total += min(hours, 16)
    return round(total, 1)


def _verified_projects(
    worker: dict[str, Any],
    projects: list[dict[str, Any]],
    attendance: list[dict[str, Any]],
    area: str,
) -> int:
    return sum(
        1
        for item in projects
        if item.get("id")
        and item.get("status") == "completed"
        and worker["id"] in item.get("worker_ids", [])
        and (not item.get("profession_id") or item.get("profession_id") == area)
        and _approved_attendance_hours(
            worker["id"], attendance, str(item["id"])
        ) > 0
    )


def _experience_points(verified_hours: float, projects: int) -> int:
    duration_points = min(15, round(verified_hours / 160))
    project_points = min(10, projects * 2)
    return min(25, duration_points + project_points)


def _competency_proficiency(
    certificates: list[dict[str, Any]],
    competency_id: str,
    aliases: tuple[str, ...],
    verified_projects: int,
    today: date,
    *,
    knowledge: bool = False,
    responsibility: bool = False,
) -> int:
    evidence = [
        item
        for item in certificates
        if _matches_competency(item, competency_id, aliases)
        and _evidence_type(item) != "authorisation"
    ]
    if not evidence:
        return 0

    verified = [item for item in evidence if _verified_current(item, today)]
    if not verified:
        return 1

    qualifications = [
        item for item in verified if _evidence_type(item) == "qualification"
    ]
    technical = [
        item for item in verified if _evidence_type(item) in TECHNICAL_EVIDENCE_TYPES
    ]
    independent = [
        item
        for item in verified
        if _evidence_type(item) in {"employer_validation", "technical_assessment"}
    ]

    demonstrated = bool(technical) or (knowledge and bool(qualifications))
    if not demonstrated:
        return 1

    advanced = (
        len(technical) >= 2
        and verified_projects >= 2
        and (not responsibility or len(independent) >= 1)
    )
    if not advanced:
        return 2

    reference = (
        len(technical) >= 4
        and verified_projects >= 4
        and len(independent) >= 1
        and (not responsibility or len(independent) >= 2)
    )
    return 4 if reference else 3


def professional_identity(
    worker: dict[str, Any],
    projects: list[dict[str, Any]],
    attendance: list[dict[str, Any]] | None = None,
    *,
    today: date | None = None,
) -> dict[str, Any]:
    """Calculate evidence score and level gates for the primary trade.

    Self-declared years, skills and portfolio entries never award verified
    points. Regulatory/site cards are reported separately and do not increase
    professional seniority by themselves.
    """

    today = today or date.today()
    area = profession_id(str(worker.get("profession", "")))
    attendance = attendance or []
    verified_projects = _verified_projects(worker, projects, attendance, area)
    verified_experience_hours = _approved_attendance_hours(worker["id"], attendance)

    certificates = list(worker.get("certificates", []))
    current_verified = [item for item in certificates if _verified_current(item, today)]

    core_nodes = CORE_NODE_ALIASES.get(area, {})
    responsibility_aliases = RESPONSIBILITY_NODE_ALIASES.get(area, ())
    proficiencies: dict[str, int] = {}
    for competency_id, aliases in core_nodes.items():
        proficiencies[competency_id] = _competency_proficiency(
            certificates,
            competency_id,
            aliases,
            verified_projects,
            today,
            knowledge=competency_id in KNOWLEDGE_NODE_IDS,
            responsibility=competency_id in responsibility_aliases,
        )

    verified_core = sum(level >= 2 for level in proficiencies.values())
    core_coverage = (
        round(verified_core / len(core_nodes) * 100) if core_nodes else 0
    )
    essential_average = (
        sum(proficiencies.values()) / len(proficiencies) if proficiencies else 0
    )

    responsibility_ids = set(RESPONSIBILITY_NODE_ALIASES.get(area, ()))
    demonstrated_responsibility = {
        competency_id
        for competency_id in responsibility_ids
        if any(
            _verified_current(item, today)
            and _evidence_type(item) in TECHNICAL_EVIDENCE_TYPES
            and (
                str(item.get("competency_id", "")).strip() == competency_id
                or _certificate_matches_node(item, (competency_id,))
            )
            for item in certificates
        )
    }
    responsibility_evidence = len(demonstrated_responsibility)

    relevant = [
        item
        for item in certificates
        if item.get("profession_id") == area
        or any(
            _certificate_matches_node(item, aliases)
            for aliases in core_nodes.values()
        )
    ]
    verified_relevant = [item for item in relevant if _verified_current(item, today)]
    verified_qualifications = sum(
        _evidence_type(item) == "qualification" for item in verified_relevant
    )

    regulatory_terms = REGULATORY_MATCHES.get(area, ())
    verified_regulatory = sum(
        1
        for item in current_verified
        if _evidence_type(item) == "authorisation"
        and any(
            normalize(term) in normalize(str(item.get("name", "")))
            for term in regulatory_terms
        )
    )

    technical_points = round((essential_average / 4) * 45)
    experience_points = _experience_points(verified_experience_hours, verified_projects)
    qualification_points = min(15, verified_qualifications * 5)

    verifiable = [
        item
        for item in relevant
        if _evidence_type(item) != "authorisation"
        and item.get("status") in {"verified", "pending", "recorded"}
    ]
    verified_proficiency = [
        item
        for item in verified_relevant
        if _evidence_type(item) != "authorisation"
    ]
    verification_ratio = (
        len(verified_proficiency) / len(verifiable) if verifiable else 0
    )
    independent_verified = sum(
        _evidence_type(item) in {"employer_validation", "technical_assessment"}
        for item in verified_proficiency
    )
    verification_points = round(verification_ratio * 10)
    independent_bonus = 5 if independent_verified >= 2 else 3 if independent_verified == 1 else 0
    confidence_points = min(15, verification_points + independent_bonus)

    score = min(
        100,
        technical_points
        + experience_points
        + qualification_points
        + confidence_points,
    )

    level_index = 0
    for index, gate in enumerate(LEVELS):
        eligible = (
            score >= gate["minimum"]
            and core_coverage >= gate["core_coverage"]
            and verified_projects >= gate["verified_projects"]
            and verified_experience_hours >= gate["verified_experience_hours"]
            and responsibility_evidence >= gate["responsibility_evidence"]
        )
        if eligible:
            level_index = index

    current = LEVELS[level_index]
    next_level = LEVELS[level_index + 1] if level_index + 1 < len(LEVELS) else None
    levels = [
        {
            "id": gate["id"],
            "label": gate["label"],
            "label_en": gate["label_en"],
            "minimum": gate["minimum"],
        }
        for gate in LEVELS
    ]

    if next_level:
        span = max(1, next_level["minimum"] - current["minimum"])
        progress = max(
            0,
            min(100, round((score - current["minimum"]) / span * 100)),
        )
    else:
        progress = 100

    components = [
        {
            "id": "technical",
            "label": "Competência técnica",
            "label_en": "Technical competence",
            "points": technical_points,
            "maximum": 45,
            "count": verified_core,
            "points_each": 0,
        },
        {
            "id": "experience",
            "label": "Experiência verificada",
            "label_en": "Verified experience",
            "points": experience_points,
            "maximum": 25,
            "count": verified_projects,
            "points_each": 0,
        },
        {
            "id": "qualifications",
            "label": "Qualificações",
            "label_en": "Qualifications",
            "points": qualification_points,
            "maximum": 15,
            "count": verified_qualifications,
            "points_each": 5,
        },
        {
            "id": "confidence",
            "label": "Confiança da evidência",
            "label_en": "Evidence confidence",
            "points": confidence_points,
            "maximum": 15,
            "count": len(verified_proficiency),
            "points_each": 0,
        },
    ]

    return {
        "id": worker["id"],
        "profession_id": area,
        "score": score,
        "maximum": 100,
        "level": {
            "id": current["id"],
            "label": current["label"],
            "label_en": current["label_en"],
            "minimum": current["minimum"],
        },
        "level_index": level_index,
        "levels": levels,
        "next_level": (
            {
                "id": next_level["id"],
                "label": next_level["label"],
                "label_en": next_level["label_en"],
                "minimum": next_level["minimum"],
            }
            if next_level
            else None
        ),
        "points_to_next": (
            max(0, next_level["minimum"] - score) if next_level else 0
        ),
        "progress": progress,
        "components": components,
        "core_coverage": core_coverage,
        "verified_projects": verified_projects,
        "verified_experience_hours": verified_experience_hours,
        "verified_qualifications": verified_qualifications,
        "responsibility_evidence": responsibility_evidence,
        "verified_regulatory": verified_regulatory,
        "regulatory_context": (
            "Os requisitos legais dependem do país, atividade, empregador e site."
        ),
        "level_gate_note": (
            "O score sozinho não sobe o nível: são exigidos cobertura essencial, "
            "experiência verificada e, nos níveis superiores, evidência de autonomia."
        ),
        "framework_note": (
            "Nível interno WORKLY; não corresponde a um nível EQF oficial."
        ),
    }
