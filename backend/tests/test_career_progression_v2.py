"""Regression tests for WORKLY's evidence-driven professional levels."""
from datetime import date, datetime, timedelta, timezone

from backend.app.professional_identity import (
    _approved_attendance_hours,
    professional_identity,
)

TODAY = date(2026, 10, 14)


def verified_certificate(node, kind="work_record", *, name=None):
    return {
        "id": "test-" + node,
        "name": name or node,
        "node_id": node,
        "competency_id": node,
        "profession_id": "electromechanics",
        "evidence_type": kind,
        "status": "verified",
        "issued_at": "2025-06-01",
        "expires_at": "2029-06-01",
    }


def approved_shifts(count):
    first = datetime(2025, 1, 1, tzinfo=timezone.utc)
    rows = []
    for index in range(count):
        start = first + timedelta(days=index)
        rows.append({
            "worker_id": "w",
            "project_id": "site-1",
            "approval_status": "approved",
            "check_in": start.isoformat(),
            "check_out": (start + timedelta(hours=8)).isoformat(),
        })
    return rows


CORE_PROOFS = [
    verified_certificate("em-mechanical-systems"),
    verified_certificate("em-electrical-systems"),
    verified_certificate("em-maintenance"),
]


def identity(proofs):
    return {"id": "w", "profession": "Eletromecânica Industrial", "certificates": proofs}


def test_duplicate_and_overlapping_approved_shifts_are_counted_once():
    first = approved_shifts(1)[0]
    start = datetime.fromisoformat(first["check_in"]) + timedelta(hours=4)
    overlap = {**first, "check_in": start.isoformat(), "check_out": (start + timedelta(hours=8)).isoformat()}
    assert _approved_attendance_hours("w", [first, first, overlap]) == 12.0
    assert _approved_attendance_hours("different", [first, overlap]) == 0


def test_declarations_and_site_certifications_do_not_increase_value():
    extra = verified_certificate("site-atex", "qualification", name="Formação de riscos ATEX")
    worker = identity([extra])
    worker["experience_years"] = 50
    worker["skills"] = [{"name": "Expert", "level": 4}]
    result = professional_identity(worker, [], [], today=TODAY)
    assert result["score"] == 0
    assert result["verified_qualifications"] == 0
    assert result["level"]["label"] == "I"


def test_missing_course_or_internship_blocks_next_level():
    attendance = approved_shifts(20)
    just_skills = professional_identity(identity(CORE_PROOFS), [], attendance, today=TODAY)
    assert just_skills["score"] >= 20
    assert just_skills["core_coverage"] >= 25
    assert just_skills["verified_experience_hours"] == 160
    assert just_skills["level"]["label"] == "I"
    assert not just_skills["foundation_verified"]


def test_verified_course_and_internship_unlock_junior_when_other_gates_pass():
    proofs = [
        *CORE_PROOFS,
        verified_certificate("formation-professional-course", "qualification", name="Curso profissional"),
        verified_certificate("formation-internship", "work_record", name="Estágio"),
    ]
    result = professional_identity(identity(proofs), [], approved_shifts(20), today=TODAY)
    assert result["course_verified"]
    assert result["internship_verified"]
    assert result["verified_experience_hours"] == 160
    assert result["level"]["label"] == "II"


def test_proof_type_mismatch_does_not_unlock_foundation():
    certificates = [
        *CORE_PROOFS,
        verified_certificate("formation-professional-course", "authorisation", name="Curso profissional"),
        verified_certificate("formation-internship", "qualification", name="Estágio"),
    ]
    result = professional_identity(identity(certificates), [], approved_shifts(20), today=TODAY)
    assert not result["foundation_verified"]
    assert result["level"]["label"] == "I"
