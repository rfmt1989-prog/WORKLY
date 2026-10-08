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
from datetime import date
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
        "responsibility_evidence": 0,
    },
    {
        "id": "junior",
        "label": "Júnior",
        "label_en": "Junior",
        "minimum": 15,
        "core_coverage": 20,
        "verified_projects": 0,
        "responsibility_evidence": 0,
    },
    {
        "id": "professional",
        "label": "Profissional",
        "label_en": "Professional",
        "minimum": 40,
        "core_coverage": 50,
        "verified_projects": 1,
        "responsibility_evidence": 0,
    },
    {
        "id": "specialist",
        "label": "Especialista",
        "label_en": "Specialist",
        "minimum": 65,
        "core_coverage": 70,
        "verified_projects": 2,
        "responsibility_evidence": 1,
    },
    {
        "id": "master",
        "label": "Master",
        "label_en": "Master",
        "minimum": 85,
        "core_coverage": 85,
        "verified_projects": 3,
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


def _verified_projects(
    worker: dict[str, Any],
    projects: list[dict[str, Any]],
    area: str,
) -> int:
    completed_ids = {
        str(item["id"])
        for item in projects
        if item.get("id")
        and item.get("status") == "completed"
        and worker["id"] in item.get("worker_ids", [])
        and item.get("profession_id") == area
    }
    completed_ids.update(
        str(item["id"])
        for item in worker.get("best_projects", [])
        if item.get("id")
        and item.get("status") == "verified"
        and item.get("verified_by")
        and (not item.get("profession_id") or item.get("profession_id") == area)
    )
    return len(completed_ids)


def professional_identity(
    worker: dict[str, Any],
    projects: list[dict[str, Any]],
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
    verified_projects = _verified_projects(worker, projects, area)

    certificates = list(worker.get("certificates", []))
    current_verified = [item for item in certificates if _verified_current(item, today)]

    core_nodes = CORE_NODE_ALIASES.get(area, {})
    verified_core = 0
    for competency_id, aliases in core_nodes.items():
        if any(
            _demonstrates_competency(item, competency_id, aliases, today)
            for item in certificates
        ):
            verified_core += 1
    core_coverage = (
        round(verified_core / len(core_nodes) * 100) if core_nodes else 0
    )

    responsibility_aliases = RESPONSIBILITY_NODE_ALIASES.get(area, ())
    responsibility_evidence = sum(
        1
        for item in current_verified
        if _evidence_type(item) in TECHNICAL_EVIDENCE_TYPES
        and (
            str(item.get("competency_id", "")).strip() in responsibility_aliases
            or _certificate_matches_node(item, responsibility_aliases)
        )
    )

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

    core_points = round(core_coverage * 0.40)
    experience_points = min(25, verified_projects * 5)
    qualification_points = min(15, verified_qualifications * 5)
    autonomy_points = min(
        10,
        responsibility_evidence * 5 + (5 if verified_projects >= 3 else 0),
    )

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
    quality_ratio = (
        len(verified_proficiency) / len(verifiable) if verifiable else 0
    )
    quality_points = round(quality_ratio * 10)

    score = min(
        100,
        core_points
        + experience_points
        + qualification_points
        + autonomy_points
        + quality_points,
    )

    level_index = 0
    for index, gate in enumerate(LEVELS):
        eligible = (
            score >= gate["minimum"]
            and core_coverage >= gate["core_coverage"]
            and verified_projects >= gate["verified_projects"]
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
            "id": "core",
            "label": "Competências essenciais",
            "label_en": "Essential competences",
            "points": core_points,
            "maximum": 40,
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
            "points_each": 5,
        },
        {
            "id": "qualifications",
            "label": "Qualificações relevantes",
            "label_en": "Relevant qualifications",
            "points": qualification_points,
            "maximum": 15,
            "count": verified_qualifications,
            "points_each": 5,
        },
        {
            "id": "autonomy",
            "label": "Autonomia e responsabilidade",
            "label_en": "Autonomy & responsibility",
            "points": autonomy_points,
            "maximum": 10,
            "count": responsibility_evidence,
            "points_each": 5,
        },
        {
            "id": "quality",
            "label": "Qualidade da evidência",
            "label_en": "Evidence quality",
            "points": quality_points,
            "maximum": 10,
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
