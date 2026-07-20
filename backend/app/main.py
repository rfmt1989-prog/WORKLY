from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.auth import router as auth_router
from app.routers.company import router as company_router
from app.routers.conversations import router as conversations_router
from app.routers.worker import router as worker_router
from app.routers.worker_checkin import router as worker_checkin_router
from app.routers.worker_documents import router as worker_documents_router
from app.routers.worker_jobs import router as worker_jobs_router
from app.routers.worker_messages import router as worker_messages_router
from app.routers.worker_profile import router as worker_profile_router


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
        "http://localhost:8082",
        "http://127.0.0.1:8082",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


for router in (
    auth_router,
    worker_router,
    worker_profile_router,
    worker_documents_router,
    worker_messages_router,
    worker_checkin_router,
    worker_jobs_router,
    company_router,
    conversations_router,
):
    app.include_router(router, prefix="/api")


@app.get("/", tags=["System"])
async def root():
    return {
        "name": "WORKLY API",
        "status": "running",
        "version": "0.8.0",
        "docs": "/docs",
    }


@app.get("/api", tags=["System"])
async def api_root():
    return {"message": "WORKLY API pronta", "status": "running"}


@app.get("/health", tags=["System"])
async def health():
    return {
        "status": "ok",
        "service": "WORKLY API",
        "version": "0.8.0",
    }
