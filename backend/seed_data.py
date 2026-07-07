import uuid
from datetime import datetime, timezone, timedelta


def _iso(days_ago=0, hours=0):
    return (datetime.now(timezone.utc) - timedelta(days=days_ago, hours=hours)).isoformat()


async def run_seed(db, hash_password, now_iso):
    # Wipe collections
    for col in ["users", "jobs", "job_listings", "contracts", "conversations",
                "messages", "projects", "notifications", "checkins"]:
        await db[col].delete_many({})

    pw = hash_password("password123")

    worker_id = str(uuid.uuid4())
    company_id = str(uuid.uuid4())

    worker = {
        "id": worker_id,
        "name": "João Silva",
        "email": "worker@workly.com",
        "password_hash": pw,
        "role": "worker",
        "created_at": _iso(400),
        "avatar": "https://images.pexels.com/photos/37556452/pexels-photo-37556452.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "title": "Certified Electrician",
        "trust_score": 87,
        "reputation": 4.8,
        "level": "Elite Professional",
        "level_progress": 0.78,
        "location": "Lisboa, Portugal",
        "available": True,
        "skills": [
            {"name": "Electrical Wiring", "level": 0.95},
            {"name": "Safety Compliance", "level": 0.9},
            {"name": "Solar Installation", "level": 0.72},
            {"name": "Project Coordination", "level": 0.6},
        ],
        "certificates": [
            {"name": "Certified Electrician (CE)", "issuer": "EU Trades Board", "expires": "2027-06-01", "status": "valid"},
            {"name": "Working at Heights", "issuer": "SafetyPro", "expires": "2026-08-15", "status": "expiring"},
            {"name": "First Aid Level 2", "issuer": "Red Cross", "expires": "2028-01-20", "status": "valid"},
        ],
        "languages": ["Português", "English", "Español"],
        "countries": ["Portugal", "Spain", "France"],
        "portfolio": [
            {"title": "Solar Farm - Évora", "image": "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80"},
            {"title": "Office Rewiring - Porto", "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80"},
        ],
        "timeline": [
            {"title": "Elite Professional Status", "org": "WORKLY", "date": "2025-11", "desc": "Reached 4.8★ over 200 jobs"},
            {"title": "Senior Electrician", "org": "VoltEdge Lda", "date": "2023-04", "desc": "Led team of 6 on commercial projects"},
            {"title": "Electrician", "org": "PowerFix", "date": "2020-01", "desc": "Residential & industrial installations"},
            {"title": "Apprentice", "org": "EDP Group", "date": "2018-06", "desc": "Completed 2-year apprenticeship"},
        ],
        "achievements": [
            {"title": "200 Jobs Completed", "icon": "trophy", "unlocked": True},
            {"title": "Perfect Month", "icon": "star", "unlocked": True},
            {"title": "Safety Champion", "icon": "shield-checkmark", "unlocked": True},
            {"title": "500 Jobs", "icon": "rocket", "unlocked": False},
        ],
        "training": [
            {"title": "Advanced Solar Systems", "progress": 0.65, "hours": 12},
            {"title": "EV Charger Installation", "progress": 1.0, "hours": 8},
            {"title": "Smart Home Automation", "progress": 0.3, "hours": 15},
        ],
    }

    company = {
        "id": company_id,
        "name": "BuildCorp Europe",
        "email": "company@workly.com",
        "password_hash": pw,
        "role": "company",
        "created_at": _iso(600),
        "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85",
        "title": "Construction & Infrastructure",
        "trust_score": 92,
        "reputation": 4.6,
        "level": "Verified Employer",
        "location": "Lisboa, Portugal",
        "industry": "Construction",
        "languages": ["Português", "English"],
        "countries": ["Portugal", "Spain", "Germany"],
    }

    # Extra workers for company search
    extra_workers = []
    profiles = [
        ("Maria Costa", "Plumbing Specialist", 4.9, 91, ["Plumbing", "Pipe Fitting"], "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80", True),
        ("Ricardo Alves", "Site Foreman", 4.7, 85, ["Management", "Safety"], "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80", True),
        ("Ana Ferreira", "Carpenter", 4.5, 79, ["Carpentry", "Finishing"], "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&q=80", False),
        ("Pedro Santos", "Welder", 4.6, 82, ["Welding", "Metalwork"], "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", True),
        ("Sofia Marques", "Painter", 4.4, 74, ["Painting", "Coating"], "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80", True),
    ]
    for name, title, rep, ts, skills, avatar, avail in profiles:
        extra_workers.append({
            "id": str(uuid.uuid4()),
            "name": name,
            "email": f"{name.split()[0].lower()}@workly.com",
            "password_hash": pw,
            "role": "worker",
            "created_at": _iso(200),
            "avatar": avatar,
            "title": title,
            "trust_score": ts,
            "reputation": rep,
            "level": "Professional",
            "level_progress": 0.5,
            "location": "Lisboa, Portugal",
            "available": avail,
            "skills": [{"name": s, "level": 0.8} for s in skills],
            "certificates": [],
            "languages": ["Português", "English"],
            "countries": ["Portugal"],
            "portfolio": [],
            "timeline": [],
            "achievements": [],
            "training": [],
        })

    await db.users.insert_many([worker, company] + extra_workers)

    # Today's jobs for worker
    jobs = [
        {"id": str(uuid.uuid4()), "worker_id": worker_id, "title": "Panel Installation", "company": "BuildCorp Europe",
         "location": "Av. da Liberdade 120, Lisboa", "time": "09:00 - 13:00", "pay": 240, "status": "upcoming",
         "lat": 38.7223, "lng": -9.1393},
        {"id": str(uuid.uuid4()), "worker_id": worker_id, "title": "Rewiring - Retail Store", "company": "Nova Retail",
         "location": "Centro Comercial Colombo, Lisboa", "time": "14:30 - 18:00", "pay": 320, "status": "upcoming",
         "lat": 38.7546, "lng": -9.1881},
    ]
    await db.jobs.insert_many(jobs)

    # Job listings (worker search)
    listings = [
        {"id": str(uuid.uuid4()), "title": "Senior Electrician", "company": "VoltEdge Lda", "location": "Porto", "pay": "€28/h", "type": "Full-time", "posted": "2d ago"},
        {"id": str(uuid.uuid4()), "title": "Solar Installer", "company": "SunPower EU", "location": "Faro", "pay": "€25/h", "type": "Contract", "posted": "1d ago"},
        {"id": str(uuid.uuid4()), "title": "Site Electrician", "company": "BuildCorp Europe", "location": "Lisboa", "pay": "€24/h", "type": "Full-time", "posted": "4h ago"},
        {"id": str(uuid.uuid4()), "title": "Maintenance Technician", "company": "MetroLine", "location": "Lisboa", "pay": "€22/h", "type": "Part-time", "posted": "5d ago"},
    ]
    await db.job_listings.insert_many(listings)

    # Projects for company
    projects = [
        {"id": str(uuid.uuid4()), "company_id": company_id, "name": "Lisbon Tower Retrofit", "status": "active", "workers": 12, "progress": 0.62, "budget": 145000, "deadline": "2026-09-30"},
        {"id": str(uuid.uuid4()), "company_id": company_id, "name": "Porto Warehouse Build", "status": "active", "workers": 8, "progress": 0.34, "budget": 89000, "deadline": "2026-11-15"},
        {"id": str(uuid.uuid4()), "company_id": company_id, "name": "Faro Solar Park", "status": "planning", "workers": 4, "progress": 0.1, "budget": 210000, "deadline": "2027-02-01"},
    ]
    await db.projects.insert_many(projects)

    # Contracts (shared between worker & company)
    contracts = [
        {"id": str(uuid.uuid4()), "worker_id": worker_id, "company_id": company_id,
         "title": "Electrical Works Agreement", "company_name": "BuildCorp Europe", "worker_name": "João Silva",
         "rate": "€24/h", "duration": "6 months", "status": "pending", "created_at": _iso(2),
         "signed_worker": False, "signed_company": True, "signature": None,
         "summary": "Full-time electrical installation and maintenance services for the Lisbon Tower Retrofit project.",
         "timeline": [
             {"label": "Contract created", "date": _iso(3), "done": True},
             {"label": "Signed by BuildCorp Europe", "date": _iso(2), "done": True},
             {"label": "Awaiting worker signature", "date": None, "done": False},
         ]},
        {"id": str(uuid.uuid4()), "worker_id": worker_id, "company_id": company_id,
         "title": "Solar Installation Contract", "company_name": "SunPower EU", "worker_name": "João Silva",
         "rate": "€25/h", "duration": "3 months", "status": "active", "created_at": _iso(40),
         "signed_worker": True, "signed_company": True, "signature": "João Silva",
         "summary": "Installation of rooftop solar systems across 4 commercial sites in the Algarve region.",
         "timeline": [
             {"label": "Contract created", "date": _iso(45), "done": True},
             {"label": "Signed by both parties", "date": _iso(40), "done": True},
             {"label": "Active", "date": _iso(40), "done": True},
         ]},
        {"id": str(uuid.uuid4()), "worker_id": worker_id, "company_id": company_id,
         "title": "Maintenance Retainer", "company_name": "MetroLine", "worker_name": "João Silva",
         "rate": "€22/h", "duration": "12 months", "status": "expired", "created_at": _iso(400),
         "signed_worker": True, "signed_company": True, "signature": "João Silva",
         "summary": "Ongoing electrical maintenance for metro stations.",
         "timeline": [
             {"label": "Contract created", "date": _iso(410), "done": True},
             {"label": "Completed", "date": _iso(30), "done": True},
         ]},
    ]
    await db.contracts.insert_many(contracts)

    # Conversation between worker & company
    conv_id = str(uuid.uuid4())
    conv2_id = str(uuid.uuid4())
    await db.conversations.insert_many([
        {"id": conv_id, "participants": [worker_id, company_id], "last_message": "Perfeito, vemo-nos amanhã às 9h!",
         "last_at": _iso(0, 1), "title": "BuildCorp Europe"},
        {"id": conv2_id, "participants": [worker_id, extra_workers[1]["id"]], "last_message": "Envio-te o relatório de segurança.",
         "last_at": _iso(1), "title": "Ricardo Alves"},
    ])
    msgs = [
        {"id": str(uuid.uuid4()), "conversation_id": conv_id, "sender_id": company_id, "text": "Olá João! Confirmas a instalação de amanhã?", "type": "text", "meta": {}, "created_at": _iso(0, 3)},
        {"id": str(uuid.uuid4()), "conversation_id": conv_id, "sender_id": worker_id, "text": "Olá! Sim, confirmo. A que horas?", "type": "text", "meta": {}, "created_at": _iso(0, 2)},
        {"id": str(uuid.uuid4()), "conversation_id": conv_id, "sender_id": company_id, "text": "9h na Av. da Liberdade. Trago o material.", "type": "text", "meta": {}, "created_at": _iso(0, 2)},
        {"id": str(uuid.uuid4()), "conversation_id": conv_id, "sender_id": company_id, "text": None, "type": "voice", "meta": {"duration": "0:14"}, "created_at": _iso(0, 1)},
        {"id": str(uuid.uuid4()), "conversation_id": conv_id, "sender_id": worker_id, "text": "Perfeito, vemo-nos amanhã às 9h!", "type": "text", "meta": {}, "created_at": _iso(0, 1)},
    ]
    await db.messages.insert_many(msgs)

    # Notifications
    def notif(uid, ntype, title, body, days=0, hours=0, read=False):
        return {"id": str(uuid.uuid4()), "user_id": uid, "type": ntype, "title": title, "body": body,
                "created_at": _iso(days, hours), "read": read}

    await db.notifications.insert_many([
        notif(worker_id, "contract", "Novo Contrato", "BuildCorp Europe enviou-te um contrato para assinar", 0, 2),
        notif(worker_id, "message", "Nova Mensagem", "Ricardo Alves: Envio-te o relatório de segurança.", 1),
        notif(worker_id, "certificate", "Certificado a Expirar", "'Working at Heights' expira em 60 dias", 0, 5),
        notif(worker_id, "payment", "Pagamento Recebido", "Recebeste €320 da SunPower EU", 2),
        notif(worker_id, "review", "Nova Avaliação", "Recebeste 5★ da BuildCorp Europe", 3),
        notif(company_id, "project", "Projeto Atribuído", "Lisbon Tower Retrofit atingiu 62% de progresso", 0, 4),
        notif(company_id, "message", "Nova Mensagem", "João Silva confirmou a instalação de amanhã", 0, 1),
    ])

    return {"ok": True, "worker": "worker@workly.com", "company": "company@workly.com", "password": "password123"}
