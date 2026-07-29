from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.company import router as company_router
from app.routers.worker import router as worker_router
from app.routers.worker_checkin import router as worker_checkin_router
from app.routers.worker_documents import router as worker_documents_router
from app.routers.worker_jobs import router as worker_jobs_router
from app.routers.worker_messages import router as worker_messages_router
from app.routers.worker_profile import router as worker_profile_router


API_PREFIX = "/api"


app = FastAPI(
    title="WORKLY API",
    version="0.8.0",
    description="API operacional da plataforma Workly.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:19006",
        "http://127.0.0.1:19006",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(worker_router, prefix=API_PREFIX)
app.include_router(worker_profile_router, prefix=API_PREFIX)
app.include_router(worker_documents_router, prefix=API_PREFIX)
app.include_router(worker_messages_router, prefix=API_PREFIX)
app.include_router(worker_checkin_router, prefix=API_PREFIX)
app.include_router(worker_jobs_router, prefix=API_PREFIX)
app.include_router(company_router, prefix=API_PREFIX)


@app.get("/", tags=["System"])
async def root():
    return {
        "name": "WORKLY API",
        "status": "running",
        "version": "0.8.0",
        "docs": "/docs",
    }


@app.get(f"{API_PREFIX}/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "service": "WORKLY API",
        "version": "0.8.0",
    }
