from copy import deepcopy
from uuid import uuid4


WORKERS = [
    {
        "id": "w1",
        "name": "João Silva",
        "email": "worker@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80",
        "age": 36,
        "country": "Portugal",
        "country_code": "PT",
        "flag": "🇵🇹",
        "specialty": "Eletricista industrial",
        "title": "Eletricista industrial",
        "experience_years": 14,
        "available": False,
        "status": "in_project",
        "trust_score": 9.3,
        "productivity_score": 9.1,
        "quality_score": 9.4,
        "punctuality_score": 9.0,
        "certificates": ["Habilitação elétrica", "Trabalhos em altura"],
        "skills": ["Quadros elétricos", "Cablagem", "Solar"],
        "project": "Hospital Lisboa",
    },
    {
        "id": "w2",
        "name": "Ana Costa",
        "email": "ana.costa@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80",
        "age": 32,
        "country": "Portugal",
        "country_code": "PT",
        "flag": "🇵🇹",
        "specialty": "Canalizadora",
        "title": "Canalizadora",
        "experience_years": 9,
        "available": False,
        "status": "in_project",
        "trust_score": 9.0,
        "productivity_score": 8.8,
        "quality_score": 9.2,
        "punctuality_score": 9.3,
        "certificates": ["Redes de água", "Segurança em obra"],
        "skills": ["PPR", "Multicamada", "AVAC hidráulico"],
        "project": "Hospital Lisboa",
    },
    {
        "id": "w3",
        "name": "Pedro Gomes",
        "email": "pedro.gomes@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        "age": 41,
        "country": "Portugal",
        "country_code": "PT",
        "flag": "🇵🇹",
        "specialty": "Soldador TIG/MIG",
        "title": "Soldador TIG/MIG",
        "experience_years": 17,
        "available": True,
        "status": "available",
        "trust_score": 9.6,
        "productivity_score": 9.2,
        "quality_score": 9.7,
        "punctuality_score": 8.9,
        "certificates": ["EN ISO 9606-1", "Trabalhos a quente"],
        "skills": ["TIG", "MIG/MAG", "Inox"],
        "project": None,
    },
    {
        "id": "w4",
        "name": "Marta Ferreira",
        "email": "marta.ferreira@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
        "age": 29,
        "country": "Espanha",
        "country_code": "ES",
        "flag": "🇪🇸",
        "specialty": "Técnica AVAC",
        "title": "Técnica AVAC",
        "experience_years": 7,
        "available": True,
        "status": "available",
        "trust_score": 8.8,
        "productivity_score": 9.0,
        "quality_score": 9.1,
        "punctuality_score": 8.7,
        "certificates": ["Gases fluorados", "Manutenção AVAC"],
        "skills": ["VRV/VRF", "Chillers", "Diagnóstico"],
        "project": None,
    },
    {
        "id": "w5",
        "name": "Ricardo Alves",
        "email": "ricardo.alves@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
        "age": 38,
        "country": "Portugal",
        "country_code": "PT",
        "flag": "🇵🇹",
        "specialty": "Montador de estruturas",
        "title": "Montador de estruturas",
        "experience_years": 13,
        "available": False,
        "status": "in_project",
        "trust_score": 9.1,
        "productivity_score": 9.4,
        "quality_score": 8.9,
        "punctuality_score": 9.2,
        "certificates": ["Montagem metálica", "Trabalhos em altura"],
        "skills": ["Estruturas", "Aparafusamento", "Leitura de desenho"],
        "project": "Hotel Porto",
    },
    {
        "id": "w6",
        "name": "Sofia Marques",
        "email": "sofia.marques@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
        "age": 34,
        "country": "França",
        "country_code": "FR",
        "flag": "🇫🇷",
        "specialty": "Operadora IPAF 3A/3B",
        "title": "Operadora IPAF 3A/3B",
        "experience_years": 8,
        "available": True,
        "status": "available",
        "trust_score": 8.9,
        "productivity_score": 9.3,
        "quality_score": 8.7,
        "punctuality_score": 9.5,
        "certificates": ["IPAF 3A", "IPAF 3B"],
        "skills": ["Tesoura", "Articulada", "Inspeção diária"],
        "project": None,
    },
    {
        "id": "w7",
        "name": "Luís Pereira",
        "email": "luis.pereira@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=400&q=80",
        "age": 45,
        "country": "Portugal",
        "country_code": "PT",
        "flag": "🇵🇹",
        "specialty": "Operador de máquinas",
        "title": "Operador de máquinas",
        "experience_years": 20,
        "available": False,
        "status": "in_project",
        "trust_score": 9.4,
        "productivity_score": 8.9,
        "quality_score": 9.0,
        "punctuality_score": 9.1,
        "certificates": ["Máquinas de movimentação", "SST"],
        "skills": ["Escavadora", "Empilhador", "Manitou"],
        "project": "Hotel Porto",
    },
    {
        "id": "w8",
        "name": "Carlos Mendes",
        "email": "carlos.mendes@workly.pt",
        "avatar": "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&q=80",
        "age": 47,
        "country": "Portugal",
        "country_code": "PT",
        "flag": "🇵🇹",
        "specialty": "Encarregado de obra",
        "title": "Encarregado de obra",
        "experience_years": 23,
        "available": False,
        "status": "in_project",
        "trust_score": 9.7,
        "productivity_score": 9.5,
        "quality_score": 9.3,
        "punctuality_score": 9.6,
        "certificates": ["Coordenação de segurança", "Primeiros socorros"],
        "skills": ["Planeamento", "Equipas", "Qualidade"],
        "project": "Hospital Lisboa",
    },
]

COMPANIES = [
    {
        "id": "c1",
        "name": "Workly Build Portugal",
        "email": "company@workly.pt",
        "industry": "Construção e estruturas",
        "location": "Lisboa, Portugal",
        "verified": True,
        "workers": 18,
        "projects": 2,
    },
    {
        "id": "c2",
        "name": "Lumen Technical Services",
        "email": "technical@workly.pt",
        "industry": "Eletricidade, AVAC e manutenção",
        "location": "Coimbra, Portugal",
        "verified": True,
        "workers": 11,
        "projects": 1,
    },
]

PROJECTS = [
    {
        "id": "p1",
        "name": "Hospital Lisboa",
        "company_id": "c1",
        "location": "Lisboa",
        "status": "active",
        "progress": 78,
        "workers": 6,
        "deadline": "2026-10-30",
        "budget": 245000,
    },
    {
        "id": "p2",
        "name": "Hotel Porto",
        "company_id": "c1",
        "location": "Porto",
        "status": "active",
        "progress": 45,
        "workers": 4,
        "deadline": "2026-12-15",
        "budget": 168000,
    },
    {
        "id": "p3",
        "name": "Centro Técnico Coimbra",
        "company_id": "c2",
        "location": "Coimbra",
        "status": "planning",
        "progress": 22,
        "workers": 3,
        "deadline": "2027-02-28",
        "budget": 98000,
    },
]

TEAMS = [
    {
        "id": "t1",
        "name": "Equipa Instalações",
        "description": "Eletricidade, canalização e coordenação técnica.",
        "specialty": "Instalações técnicas",
        "status": "in_project",
        "country": "Portugal",
        "city": "Lisboa",
        "company_id": "c1",
        "project_id": "p1",
        "leader_id": "w8",
        "member_ids": ["w1", "w2", "w8"],
    },
    {
        "id": "t2",
        "name": "Equipa Estruturas",
        "description": "Montagem metálica e movimentação de equipamentos.",
        "specialty": "Estruturas metálicas",
        "status": "in_project",
        "country": "Portugal",
        "city": "Porto",
        "company_id": "c1",
        "project_id": "p2",
        "leader_id": "w5",
        "member_ids": ["w5", "w7"],
    },
]

MESSAGES = [
    {
        "id": "m1",
        "worker_id": "w1",
        "name": "João Silva",
        "preview": "Check-in confirmado no Hospital Lisboa.",
        "time": "08:02",
        "unread": 2,
    },
    {
        "id": "m2",
        "worker_id": "w8",
        "name": "Carlos Mendes",
        "preview": "A equipa concluiu a inspeção de segurança.",
        "time": "09:14",
        "unread": 0,
    },
    {
        "id": "m3",
        "worker_id": "w5",
        "name": "Ricardo Alves",
        "preview": "Material de montagem recebido.",
        "time": "Ontem",
        "unread": 1,
    },
]


def worker_by_id(worker_id: str):
    return next((worker for worker in WORKERS if worker["id"] == worker_id), None)


def project_by_id(project_id: str | None):
    if not project_id:
        return None
    return next((project for project in PROJECTS if project["id"] == project_id), None)


def team_response(team: dict):
    result = deepcopy(team)
    result["members"] = [
        deepcopy(worker)
        for worker_id in team.get("member_ids", [])
        if (worker := worker_by_id(worker_id))
    ]
    result["leader"] = deepcopy(worker_by_id(team.get("leader_id", "")))
    result["project"] = deepcopy(project_by_id(team.get("project_id")))
    result["member_count"] = len(result["members"])
    scores = [
        worker["trust_score"]
        for worker in result["members"]
    ]
    productivity = [
        worker["productivity_score"]
        for worker in result["members"]
    ]
    result["team_score"] = round(sum(scores) / len(scores), 1) if scores else 0
    result["average_trust"] = result["team_score"]
    result["average_productivity"] = (
        round(sum(productivity) / len(productivity), 1)
        if productivity
        else 0
    )
    return result


def new_id(prefix: str):
    return f"{prefix}{uuid4().hex[:8]}"
