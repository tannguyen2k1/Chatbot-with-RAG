import asyncio
import os
import sys
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import (
    audit_log,
    auth,
    chat,
    config,
    conversation,
    demo,
    ingestion,
    rbac,
    user,
    vector,
)
from middleware import log_requests
from services import startup as startup_service

# Windows: SelectorEventLoop trước khi uvicorn tạo loop (psycopg async)
if os.name == "nt":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    async with startup_service.lifespan():
        yield


app = FastAPI(
    title="Chat Assistant",
    description="""
    Chat Assistant - API Documentation
    """,
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/")
async def root():
    return {"message": "Welcome to the API"}


api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(demo.router)
api_router.include_router(rbac.router)
api_router.include_router(audit_log.router)
api_router.include_router(vector.router)
api_router.include_router(ingestion.router)
api_router.include_router(chat.router)
api_router.include_router(config.router)
api_router.include_router(conversation.router)
app.include_router(api_router)


app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://([a-zA-Z0-9-]+\.)?localhost:(3000|3001|3002)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.middleware("http")(log_requests)
