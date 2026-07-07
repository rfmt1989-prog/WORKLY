import os
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from fastapi import FastAPI, APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

SECRET_KEY = os.environ['JWT_SECRET_KEY']
ALGORITHM = os.environ['JWT_ALGORITHM']
TOKEN_EXPIRE_MINUTES = int(os.environ['ACCESS_TOKEN_EXPIRE_MINUTES'])

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="WORKLY API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ----------------------------- Utils -----------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    if creds is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    user.pop("_id", None)
    return user


def public_user(user: dict) -> dict:
    u = dict(user)
    u.pop("password_hash", None)
    u.pop("_id", None)
    return u


# ----------------------------- Models -----------------------------
class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # worker | company


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class MessageInput(BaseModel):
    text: Optional[str] = None
    type: str = "text"  # text | voice | image | document
    meta: Optional[dict] = None


class SignInput(BaseModel):
    signature: str


class AvailabilityInput(BaseModel):
    available: bool


# ----------------------------- Profile defaults -----------------------------
def _default_profile(role: str, name: str) -> dict:
    if role == "worker":
        return {
            "avatar": "https://images.pexels.com/photos/37556452/pexels-photo-37556452.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            "title": "General Worker",
            "trust_score": 72,
            "reputation": 4.2,
            "level": "Rising Professional",
            "level_progress": 0.4,
            "location": "Lisboa, Portugal",
            "available": True,
            "skills": [],
            "certificates": [],
            "languages": ["Português"],
            "countries": ["Portugal"],
            "portfolio": [],
            "timeline": [],
            "achievements": [],
            "training": [],
        }
    return {
        "avatar": "https://images.unsplash.com/photo-1560250097-0b93528c311a?crop=entropy&cs=srgb&fm=jpg&q=85",
        "title": "Company",
        "trust_score": 80,
        "reputation": 4.5,
        "level": "Verified Employer",
        "location": "Lisboa, Portugal",
        "industry": "Construction",
    }


# ----------------------------- Auth Routes -----------------------------
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email já registado")
    if data.role not in ("worker", "company"):
        raise HTTPException(status_code=400, detail="Role inválido")
    user = {
        "id": str(uuid.uuid4()),
        "name": data.name,
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "role": data.role,
        "created_at": now_iso(),
    }
    user.update(_default_profile(data.role, data.name))
    await db.users.insert_one(user)
    token = create_token(user["id"])
    return {"token": token, "user": public_user(user)}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    user = await db.users.find_one({"email": data.email.lower()})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Email ou password incorretos")
    token = create_token(user["id"])
    return {"token": token, "user": public_user(user)}


@api_router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return public_user(current)


# ----------------------------- Dashboard -----------------------------
@api_router.get("/dashboard")
async def dashboard(current=Depends(get_current_user)):
    role = current["role"]
    if role == "worker":
        jobs = await db.jobs.find({"worker_id": current["id"]}).to_list(50)
        for j in jobs:
            j.pop("_id", None)
        contracts = await db.contracts.count_documents({"worker_id": current["id"]})
        convs = await db.conversations.count_documents({"participants": current["id"]})
        active_checkin = await db.checkins.find_one({"worker_id": current["id"], "checkout_at": None})
        if active_checkin:
            active_checkin.pop("_id", None)
        return {
            "role": "worker",
            "trust_score": current.get("trust_score", 0),
            "reputation": current.get("reputation", 0),
            "level": current.get("level"),
            "level_progress": current.get("level_progress", 0),
            "earnings_month": 2340,
            "jobs_completed": 48,
            "todays_jobs": jobs,
            "active_checkin": active_checkin,
            "stats": {"contracts": contracts, "conversations": convs, "hours_week": 32},
        }
    projects = await db.projects.find({"company_id": current["id"]}).to_list(50)
    for p in projects:
        p.pop("_id", None)
    workers_available = await db.users.count_documents({"role": "worker", "available": True})
    return {
        "role": "company",
        "trust_score": current.get("trust_score", 0),
        "reputation": current.get("reputation", 0),
        "spend_month": 18450,
        "active_projects": len([p for p in projects if p.get("status") == "active"]),
        "workers_hired": 12,
        "projects": projects,
        "stats": {"available_workers": workers_available, "open_contracts": 5, "invoices_due": 3},
    }


# ----------------------------- Search -----------------------------
@api_router.get("/search")
async def search(q: str = "", current=Depends(get_current_user)):
    if current["role"] == "company":
        query = {"role": "worker"}
        if q:
            query["$or"] = [
                {"name": {"$regex": q, "$options": "i"}},
                {"title": {"$regex": q, "$options": "i"}},
                {"skills": {"$regex": q, "$options": "i"}},
            ]
        workers = await db.users.find(query).to_list(50)
        return {"type": "workers", "results": [public_user(w) for w in workers]}
    query = {}
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"company": {"$regex": q, "$options": "i"}},
            {"location": {"$regex": q, "$options": "i"}},
        ]
    jobs = await db.job_listings.find(query).to_list(50)
    for j in jobs:
        j.pop("_id", None)
    return {"type": "jobs", "results": jobs}


# ----------------------------- Messages -----------------------------
@api_router.get("/conversations")
async def get_conversations(current=Depends(get_current_user)):
    convs = await db.conversations.find({"participants": current["id"]}).to_list(100)
    result = []
    for c in convs:
        c.pop("_id", None)
        other_id = next((p for p in c["participants"] if p != current["id"]), None)
        other = await db.users.find_one({"id": other_id}) if other_id else None
        c["other"] = {
            "id": other.get("id"),
            "name": other.get("name"),
            "avatar": other.get("avatar"),
            "title": other.get("title"),
        } if other else {"name": c.get("title", "Chat"), "avatar": None}
        result.append(c)
    result.sort(key=lambda x: x.get("last_at", ""), reverse=True)
    return result


@api_router.get("/conversations/{conv_id}")
async def get_conversation(conv_id: str, current=Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conv_id})
    if not conv or current["id"] not in conv["participants"]:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    conv.pop("_id", None)
    msgs = await db.messages.find({"conversation_id": conv_id}).to_list(500)
    for m in msgs:
        m.pop("_id", None)
    msgs.sort(key=lambda x: x.get("created_at", ""))
    other_id = next((p for p in conv["participants"] if p != current["id"]), None)
    other = await db.users.find_one({"id": other_id}) if other_id else None
    conv["other"] = {"id": other.get("id"), "name": other.get("name"), "avatar": other.get("avatar")} if other else {}
    return {"conversation": conv, "messages": msgs}


@api_router.post("/conversations/{conv_id}/messages")
async def send_message(conv_id: str, data: MessageInput, current=Depends(get_current_user)):
    conv = await db.conversations.find_one({"id": conv_id})
    if not conv or current["id"] not in conv["participants"]:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")
    msg = {
        "id": str(uuid.uuid4()),
        "conversation_id": conv_id,
        "sender_id": current["id"],
        "text": data.text,
        "type": data.type,
        "meta": data.meta or {},
        "created_at": now_iso(),
    }
    await db.messages.insert_one(dict(msg))
    preview = data.text or ("Mensagem de voz" if data.type == "voice" else "Anexo")
    await db.conversations.update_one({"id": conv_id}, {"$set": {"last_message": preview, "last_at": msg["created_at"]}})
    msg.pop("_id", None)
    return msg


# ----------------------------- Contracts -----------------------------
@api_router.get("/contracts")
async def get_contracts(current=Depends(get_current_user)):
    field = "worker_id" if current["role"] == "worker" else "company_id"
    contracts = await db.contracts.find({field: current["id"]}).to_list(100)
    for c in contracts:
        c.pop("_id", None)
    contracts.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return contracts


@api_router.get("/contracts/{contract_id}")
async def get_contract(contract_id: str, current=Depends(get_current_user)):
    c = await db.contracts.find_one({"id": contract_id})
    if not c:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    c.pop("_id", None)
    return c


@api_router.post("/contracts/{contract_id}/sign")
async def sign_contract(contract_id: str, data: SignInput, current=Depends(get_current_user)):
    c = await db.contracts.find_one({"id": contract_id})
    if not c:
        raise HTTPException(status_code=404, detail="Contrato não encontrado")
    signer = "worker" if current["role"] == "worker" else "company"
    timeline = c.get("timeline", [])
    timeline.append({"label": f"Assinado por {current['name']}", "date": now_iso(), "done": True})
    await db.contracts.update_one(
        {"id": contract_id},
        {"$set": {f"signed_{signer}": True, "signature": data.signature, "status": "active", "timeline": timeline}},
    )
    updated = await db.contracts.find_one({"id": contract_id})
    updated.pop("_id", None)
    return updated


# ----------------------------- Check in/out -----------------------------
@api_router.post("/checkin")
async def checkin(current=Depends(get_current_user)):
    existing = await db.checkins.find_one({"worker_id": current["id"], "checkout_at": None})
    if existing:
        raise HTTPException(status_code=400, detail="Já tem um check-in ativo")
    rec = {"id": str(uuid.uuid4()), "worker_id": current["id"], "checkin_at": now_iso(), "checkout_at": None}
    await db.checkins.insert_one(dict(rec))
    rec.pop("_id", None)
    return rec


@api_router.post("/checkout")
async def checkout(current=Depends(get_current_user)):
    rec = await db.checkins.find_one({"worker_id": current["id"], "checkout_at": None})
    if not rec:
        raise HTTPException(status_code=400, detail="Sem check-in ativo")
    await db.checkins.update_one({"id": rec["id"]}, {"$set": {"checkout_at": now_iso()}})
    return {"ok": True}


# ----------------------------- Profile / Career -----------------------------
@api_router.get("/profile")
async def get_profile(current=Depends(get_current_user)):
    return public_user(current)


@api_router.get("/profile/{user_id}")
async def get_user_profile(user_id: str, current=Depends(get_current_user)):
    u = await db.users.find_one({"id": user_id})
    if not u:
        raise HTTPException(status_code=404, detail="Utilizador não encontrado")
    return public_user(u)


@api_router.post("/availability")
async def set_availability(data: AvailabilityInput, current=Depends(get_current_user)):
    await db.users.update_one({"id": current["id"]}, {"$set": {"available": data.available}})
    return {"available": data.available}


@api_router.get("/career")
async def get_career(current=Depends(get_current_user)):
    return {
        "timeline": current.get("timeline", []),
        "achievements": current.get("achievements", []),
        "training": current.get("training", []),
        "level": current.get("level"),
        "level_progress": current.get("level_progress", 0),
        "trust_score": current.get("trust_score", 0),
        "skills": current.get("skills", []),
    }


# ----------------------------- Notifications -----------------------------
@api_router.get("/notifications")
async def get_notifications(current=Depends(get_current_user)):
    notes = await db.notifications.find({"user_id": current["id"]}).to_list(100)
    for n in notes:
        n.pop("_id", None)
    notes.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return notes


@api_router.post("/notifications/read")
async def read_notifications(current=Depends(get_current_user)):
    await db.notifications.update_many({"user_id": current["id"]}, {"$set": {"read": True}})
    return {"ok": True}


# ----------------------------- Seed -----------------------------
@api_router.post("/seed")
async def seed():
    from seed_data import run_seed
    result = await run_seed(db, hash_password, now_iso)
    return result


@api_router.get("/")
async def root():
    return {"message": "WORKLY API online"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
