import sys
import os
import asyncio

# Fix for Windows ProactorEventLoop issue with psycopg
if os.name == 'nt':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from fastapi import FastAPI, APIRouter
from middleware import log_requests
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from api import auth, rbac, demo, user, audit_log, tenant, vector, ingestion, chat, config, conversation
from services import startup as startup_service


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


# --- Root endpoint ---
@app.get("/")
async def root():
    return {"message": "Welcome to the API"}


# --- API Router with prefix /api ---
api_router = APIRouter(prefix="/api")

# --- Routers ---
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(demo.router)
api_router.include_router(rbac.router)
api_router.include_router(audit_log.router)
api_router.include_router(tenant.router)
api_router.include_router(vector.router)
api_router.include_router(ingestion.router)
api_router.include_router(chat.router)
api_router.include_router(config.router)
api_router.include_router(conversation.router)
app.include_router(api_router)


# --- CORS config (must be before routers) ---

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://([a-zA-Z0-9-]+\.)?localhost:(3000|3001|3002)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.middleware("http")(log_requests)
