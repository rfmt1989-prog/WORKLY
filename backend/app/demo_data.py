"""Deterministic demonstration data for the WORKLY web and mobile demo."""

from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone


DEMO_PASSWORD = "WorklyDemo!"
WORKER_DEMO_EMAIL = "worker.demo@workly.app"
COMPANY_DEMO_EMAIL = "company.demo@workly.app"


def _certificate(name: str, issuer: str, expires: str, status: str = "valid") -> dict:
    return {
        "id": f"cert-{name.lower().replace(' ', '-')[:24]}",
        "name": name,
        "issuer": issuer,
        "issued_at": "2025-02-12",
        "expires_at": expires,
        "status": status,
        "file_name": f"{name.replace(' ', '_').lower()}.pdf",
    }


def _document(worker_id: str, suffix: str, title: str, category: str) -> dict:
    return {
        "id": f"doc-{worker_id}-{suffix}",
        "owner_type": "worker",
        "owner_id": worker_id,
        "title": title,
        "category": category,
        "file_name": f"{suffix}.pdf",
        "status": "valid",
        "updated_at": "2026-07-18T10:00:00Z",
        "demo_content": (
            f"Documento de demonstração WORKLY — {title}. "
            "Não possui validade legal."
        ),
    }


def _project_document(
    project_id: str, suffix: str, title: str, category: str, *, status: str = "valid"
) -> dict:
    return {
        "id": f"doc-{project_id}-{suffix}",
        "owner_type": "project",
        "owner_id": project_id,
        "title": title,
        "category": category,
        "file_name": f"{suffix}_{project_id}.pdf",
        "status": status,
        "updated_at": "2026-08-08T14:00:00Z",
        "demo_content": (
            f"Documento de obra de demonstração WORKLY — {title}. "
            "Organizado no arquivo técnico da obra e sem validade legal."
        ),
    }


def _project_item(project_id: str, title: str, location: str, year: int) -> dict:
    return {
        "id": project_id,
        "title": title,
        "location": location,
        "year": year,
        "summary": "Projeto concluído com segurança, qualidade e cumprimento do prazo.",
    }


def _worker(
    worker_id: str,
    name: str,
    age: int,
    country: str,
    flag: str,
    profession: str,
    experience_years: int,
    skills: list[tuple[str, int]],
    certificates: list[dict],
    best_projects: list[dict],
    *,
    status: str = "available",
    availability: bool = True,
    trust: float = 8.8,
    productivity: float = 8.6,
    company_id: str | None = None,
    location: str = "Coimbra, Portugal",
) -> dict:
    return {
        "id": worker_id,
        "name": name,
        "email": (
            WORKER_DEMO_EMAIL
            if worker_id == "worker-1"
            else f"{worker_id}@demo.workly.app"
        ),
        "role": "worker",
        "avatar": "",
        "avatar_color": "#1B6CFF",
        "age": age,
        "country": country,
        "flag": flag,
        "profession": profession,
        "title": profession,
        "experience_years": experience_years,
        "location": location,
        "phone": "+351 910 000 000",
        "bio": (
            f"Profissional de {profession.lower()} com {experience_years} anos "
            "de experiência em projetos europeus."
        ),
        "skills": [{"name": item, "level": level} for item, level in skills],
        "certificates": certificates,
        "availability": availability,
        "status": status,
        "trust_score": trust,
        "productivity_score": productivity,
        "rating": round((trust + productivity) / 2, 1),
        "best_projects": best_projects,
        "documents": [
            _document(worker_id, "identificacao", "Identificação profissional", "identity"),
            _document(worker_id, "seguro", "Seguro de acidentes de trabalho", "insurance"),
            _document(worker_id, "aptidao", "Ficha de aptidão médica", "medical"),
        ],
        "languages": ["Português", "English"],
        "company_id": company_id,
        "current_project_id": None,
        "schedule": "08:00–17:00",
    }


def build_demo_state() -> dict:
    workers = [
        _worker(
            "worker-1",
            "Rodolfo Maia",
            36,
            "Portugal",
            "🇵🇹",
            "Nacellista / Operador IPAF 3a/3b",
            12,
            [
                ("Plataformas elevatórias", 96),
                ("Montagem industrial", 91),
                ("Segurança em altura", 94),
                ("Eletricidade industrial", 82),
            ],
            [
                _certificate("IPAF 3a e 3b", "IPAF", "2029-03-15"),
                _certificate("Habilitação elétrica H0B0", "APAVE", "2028-09-01"),
                _certificate("Trabalho em altura", "Safety Pro", "2027-11-20"),
            ],
            [
                _project_item("best-1", "Daltile Quartz", "Tennessee, EUA", 2024),
                _project_item("best-2", "Rennes Métropole", "Rennes, França", 2025),
            ],
            status="contracted",
            availability=False,
            trust=9.3,
            productivity=9.1,
            company_id="company-1",
            location="Coimbra, Portugal",
        ),
        _worker(
            "worker-2",
            "Ana Costa",
            31,
            "Portugal",
            "🇵🇹",
            "Eletricista",
            9,
            [("Quadros elétricos", 94), ("Baixa tensão", 91), ("Solar", 86)],
            [
                _certificate("Técnico de instalações elétricas", "DGEG", "2029-05-10"),
                _certificate("Primeiros socorros", "Cruz Vermelha", "2027-02-18"),
            ],
            [_project_item("best-3", "Campus Solar Centro", "Leiria, Portugal", 2025)],
            status="on_site",
            availability=False,
            trust=9.4,
            productivity=9.0,
            company_id="company-2",
            location="Leiria, Portugal",
        ),
        _worker(
            "worker-3",
            "Miguel Santos",
            42,
            "Portugal",
            "🇵🇹",
            "Canalizador",
            18,
            [("Redes de água", 95), ("AVAC hidráulico", 86), ("Leitura de projeto", 91)],
            [_certificate("Instalador de redes prediais", "CENFIC", "2028-12-20")],
            [_project_item("best-4", "Hotel Mondego", "Coimbra, Portugal", 2024)],
            status="contracted",
            availability=False,
            trust=9.1,
            productivity=8.8,
            company_id="company-2",
        ),
        _worker(
            "worker-4",
            "Lukas Novak",
            34,
            "Chéquia",
            "🇨🇿",
            "Soldador",
            11,
            [("MIG/MAG", 96), ("TIG", 92), ("Estruturas metálicas", 90)],
            [
                _certificate("EN ISO 9606-1", "TÜV", "2028-06-30"),
                _certificate("Hot Work Safety", "EU Safety", "2027-10-12"),
            ],
            [_project_item("best-5", "Ponte Logística Norte", "Porto, Portugal", 2025)],
            trust=9.0,
            productivity=9.2,
            location="Porto, Portugal",
        ),
        _worker(
            "worker-5",
            "Sofia Martins",
            29,
            "Portugal",
            "🇵🇹",
            "Técnica AVAC",
            7,
            [("Climatização", 92), ("Refrigeração", 89), ("Eficiência energética", 88)],
            [
                _certificate("Técnica de AVAC", "ATEC", "2029-01-14"),
                _certificate("Gases fluorados", "APA", "2028-04-06"),
            ],
            [_project_item("best-6", "Hospital Técnico", "Aveiro, Portugal", 2026)],
            trust=8.9,
            productivity=8.7,
            location="Aveiro, Portugal",
        ),
        _worker(
            "worker-6",
            "Marco Rossi",
            38,
            "Itália",
            "🇮🇹",
            "Montador de estruturas",
            15,
            [("Estrutura metálica", 95), ("LSF", 88), ("Leitura de desenho", 93)],
            [
                _certificate("Montagem de estruturas", "Scuola Edile", "2028-08-22"),
                _certificate("Trabalho em altura", "Sicurezza+", "2027-07-12"),
            ],
            [_project_item("best-7", "Nave Industrial Atlântico", "Setúbal, Portugal", 2025)],
            status="contracted",
            availability=False,
            trust=9.2,
            productivity=9.4,
            company_id="company-1",
            location="Setúbal, Portugal",
        ),
        _worker(
            "worker-7",
            "Erik Hansen",
            45,
            "Noruega",
            "🇳🇴",
            "Operador de máquinas",
            20,
            [("Escavadora", 96), ("Empilhador", 93), ("Movimentação de terras", 94)],
            [
                _certificate("Heavy Equipment Operator", "Nordic Skills", "2029-02-28"),
                _certificate("SST Construção", "HMS Norge", "2028-05-05"),
            ],
            [_project_item("best-8", "Terminal Logístico", "Oslo, Noruega", 2024)],
            trust=9.5,
            productivity=9.3,
            location="Braga, Portugal",
        ),
        _worker(
            "worker-8",
            "Carlos Oliveira",
            51,
            "Portugal",
            "🇵🇹",
            "Encarregado de obra",
            27,
            [("Coordenação", 97), ("Planeamento", 94), ("Segurança", 96)],
            [
                _certificate("Técnico de segurança", "ACT", "2029-10-01"),
                _certificate("Gestão de equipas", "IEFP", "2030-01-15"),
            ],
            [_project_item("best-9", "Complexo Industrial Mondego", "Figueira da Foz", 2026)],
            status="contracted",
            availability=False,
            trust=9.7,
            productivity=9.2,
            company_id="company-1",
            location="Figueira da Foz, Portugal",
        ),
    ]

    companies = [
        {
            "id": "company-1",
            "name": "Atlas Estruturas",
            "email": COMPANY_DEMO_EMAIL,
            "role": "company",
            "avatar": "",
            "avatar_color": "#FF3B30",
            "industry": "Construção e estruturas metálicas",
            "description": (
                "Execução e coordenação de estruturas metálicas, montagem industrial "
                "e construção modular em Portugal e na Europa."
            ),
            "location": "Coimbra, Portugal",
            "phone": "+351 239 000 100",
            "website": "www.atlasestruturas.demo",
            "tax_id": "PT 500 000 001",
            "trust_score": 9.4,
            "productivity_score": 9.1,
            "documents": [
                {
                    "id": "doc-company-1-insurance",
                    "owner_type": "company",
                    "owner_id": "company-1",
                    "title": "Seguro de responsabilidade civil",
                    "category": "insurance",
                    "file_name": "seguro_rc_atlas.pdf",
                    "status": "valid",
                    "updated_at": "2026-07-12T09:00:00Z",
                    "demo_content": "Apólice fictícia para demonstração da plataforma.",
                },
                {
                    "id": "doc-company-1-cert",
                    "owner_type": "company",
                    "owner_id": "company-1",
                    "title": "Certidão permanente",
                    "category": "legal",
                    "file_name": "certidao_atlas.pdf",
                    "status": "valid",
                    "updated_at": "2026-06-20T09:00:00Z",
                    "demo_content": "Certidão fictícia para demonstração da plataforma.",
                },
            ],
        },
        {
            "id": "company-2",
            "name": "Lumen Instalações Técnicas",
            "email": "company.technical@workly.app",
            "role": "company",
            "avatar": "",
            "avatar_color": "#FF3B30",
            "industry": "Eletricidade, AVAC e redes técnicas",
            "description": (
                "Instalações elétricas e mecânicas, AVAC, manutenção e eficiência "
                "energética para edifícios técnicos."
            ),
            "location": "Aveiro, Portugal",
            "phone": "+351 234 000 200",
            "website": "www.lumentecnica.demo",
            "tax_id": "PT 500 000 002",
            "trust_score": 9.2,
            "productivity_score": 8.9,
            "documents": [
                {
                    "id": "doc-company-2-cert",
                    "owner_type": "company",
                    "owner_id": "company-2",
                    "title": "Alvará de instalações técnicas",
                    "category": "license",
                    "file_name": "alvara_lumen.pdf",
                    "status": "valid",
                    "updated_at": "2026-05-15T09:00:00Z",
                    "demo_content": "Alvará fictício para demonstração da plataforma.",
                }
            ],
        },
    ]

    projects = [
        {
            "id": "project-1",
            "company_id": "company-1",
            "name": "Parque Industrial Mondego",
            "client": "Mondego Industrial",
            "description": "Montagem de nave metálica e plataformas técnicas.",
            "location": "Coimbra, Portugal",
            "latitude": 40.2033,
            "longitude": -8.4103,
            "status": "active",
            "progress": 68,
            "start_date": "2026-05-04",
            "end_date": "2026-09-18",
            "schedule": "08:00–17:00",
            "team_ids": ["team-1"],
            "worker_ids": ["worker-1", "worker-4", "worker-6", "worker-8"],
            "documents": [
                _project_document("project-1", "pss", "Plano de Segurança e Saúde", "safety"),
                _project_document("project-1", "desenhos", "Desenhos e peças de montagem", "technical"),
                _project_document("project-1", "cronograma", "Planeamento e cronograma", "planning", status="active"),
                _project_document("project-1", "registo", "Registo diário de obra", "planning", status="active"),
            ],
        },
        {
            "id": "project-2",
            "company_id": "company-1",
            "name": "Estrutura Logística Atlântico",
            "client": "Atlântico Logistics",
            "description": "Reforço e ampliação de estrutura logística.",
            "location": "Porto, Portugal",
            "latitude": 41.1579,
            "longitude": -8.6291,
            "status": "planned",
            "progress": 18,
            "start_date": "2026-08-12",
            "end_date": "2026-12-04",
            "schedule": "07:30–16:30",
            "team_ids": ["team-2"],
            "worker_ids": ["worker-7"],
            "documents": [
                _project_document("project-2", "pss", "Plano de Segurança e Saúde", "safety"),
                _project_document("project-2", "projeto", "Projeto de execução", "technical"),
                _project_document("project-2", "cronograma", "Planeamento e cronograma", "planning", status="active"),
            ],
        },
        {
            "id": "project-3",
            "company_id": "company-2",
            "name": "Renovação Técnica Hospital Aveiro",
            "client": "Unidade Hospitalar Centro",
            "description": "Renovação de AVAC, quadros e redes técnicas.",
            "location": "Aveiro, Portugal",
            "latitude": 40.6405,
            "longitude": -8.6538,
            "status": "active",
            "progress": 44,
            "start_date": "2026-04-20",
            "end_date": "2026-10-30",
            "schedule": "08:00–17:00",
            "team_ids": [],
            "worker_ids": ["worker-2", "worker-3", "worker-5"],
            "documents": [
                _project_document("project-3", "pss", "Plano de Segurança e Saúde", "safety"),
                _project_document("project-3", "avac", "Projeto AVAC e redes técnicas", "technical"),
                _project_document("project-3", "quadros", "Esquemas de quadros elétricos", "technical"),
                _project_document("project-3", "cronograma", "Planeamento e cronograma", "planning", status="active"),
            ],
        },
    ]

    project_by_worker = {
        "worker-1": "project-1",
        "worker-2": "project-3",
        "worker-3": "project-3",
        "worker-5": "project-3",
        "worker-6": "project-1",
        "worker-8": "project-1",
    }
    for worker in workers:
        worker["current_project_id"] = project_by_worker.get(worker["id"])

    teams = [
        {
            "id": "team-1",
            "company_id": "company-1",
            "name": "Equipa Estrutura Alfa",
            "specialty": "Montagem e coordenação",
            "description": "Montagem principal do Parque Industrial Mondego.",
            "status": "on_site",
            "leader_id": "worker-8",
            "member_ids": ["worker-8", "worker-1", "worker-6"],
            "project_id": "project-1",
        },
        {
            "id": "team-2",
            "company_id": "company-1",
            "name": "Equipa Operações Norte",
            "specialty": "Soldadura e máquinas",
            "description": "Preparação da obra logística do Porto.",
            "status": "available",
            "leader_id": "worker-4",
            "member_ids": ["worker-4", "worker-7"],
            "project_id": "project-2",
        },
    ]

    attendance = [
        {
            "id": "attendance-1",
            "worker_id": "worker-2",
            "company_id": "company-2",
            "project_id": "project-3",
            "check_in": "2026-07-29T07:58:00Z",
            "check_out": None,
            "location_mode": "gps",
            "latitude": 40.6404,
            "longitude": -8.6537,
            "note": "Entrada dentro da zona da obra.",
        },
        {
            "id": "attendance-2",
            "worker_id": "worker-1",
            "company_id": "company-1",
            "project_id": "project-1",
            "check_in": "2026-07-28T07:55:00Z",
            "check_out": "2026-07-28T16:59:00Z",
            "location_mode": "demo",
            "latitude": 40.2033,
            "longitude": -8.4103,
            "note": "Registo de demonstração.",
        },
        {
            "id": "attendance-3",
            "worker_id": "worker-6",
            "company_id": "company-1",
            "project_id": "project-1",
            "check_in": "2026-07-28T08:02:00Z",
            "check_out": "2026-07-28T17:04:00Z",
            "location_mode": "gps",
            "latitude": 40.2032,
            "longitude": -8.4104,
            "note": "Turno concluído.",
        },
    ]

    contracts = [
        {
            "id": "contract-1",
            "worker_id": "worker-1",
            "company_id": "company-1",
            "project_id": "project-1",
            "title": "Contrato de cedência — Parque Industrial Mondego",
            "status": "active",
            "start_date": "2026-05-04",
            "end_date": "2027-05-03",
            "signed_worker": True,
            "signed_company": True,
            "file_name": "contrato_mondego_demo.pdf",
            "demo_content": (
                "Contrato fictício de demonstração entre Rodolfo Maia e Atlas "
                "Estruturas. Sem validade legal."
            ),
        },
        {
            "id": "contract-2",
            "worker_id": "worker-6",
            "company_id": "company-1",
            "project_id": "project-1",
            "title": "Contrato de montagem industrial",
            "status": "active",
            "start_date": "2026-05-04",
            "end_date": "2026-11-30",
            "signed_worker": True,
            "signed_company": True,
            "file_name": "contrato_montagem_demo.pdf",
            "demo_content": "Contrato fictício para demonstração da plataforma.",
        },
        {
            "id": "contract-3",
            "worker_id": "worker-7",
            "company_id": "company-1",
            "project_id": "project-2",
            "title": "Proposta de operação de máquinas",
            "status": "pending",
            "start_date": "2026-08-12",
            "end_date": "2026-12-04",
            "signed_worker": False,
            "signed_company": True,
            "file_name": "proposta_operador_demo.pdf",
            "demo_content": "Proposta fictícia para demonstração da plataforma.",
        },
    ]

    notifications = [
        {
            "id": "notification-1",
            "target_id": "worker-1",
            "title": "Horário confirmado",
            "message": "O turno de amanhã começa às 08:00.",
            "read": False,
            "created_at": "2026-07-29T08:30:00Z",
        },
        {
            "id": "notification-2",
            "target_id": "company-1",
            "title": "Documento a expirar",
            "message": "Um certificado da equipa expira nos próximos 60 dias.",
            "read": False,
            "created_at": "2026-07-29T09:10:00Z",
        },
    ]

    return {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "workers": workers,
        "companies": companies,
        "teams": teams,
        "projects": projects,
        "attendance": attendance,
        "contracts": contracts,
        "notifications": notifications,
    }


def fresh_demo_state() -> dict:
    """Return a mutable deep copy so reset operations are deterministic."""

    return deepcopy(build_demo_state())
