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
from database.database import engine, AsyncSessionLocal
from database.models.base import Base
from api import auth, rbac, demo, user, audit_log, tenant, vector, ingestion, chat, config, conversation
from database.audit_event import register_audit_events  # Đăng ký audit event listener


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Thiết lập Row Level Security cho multi-tenancy
    from database.rls import setup_rls

    await setup_rls(engine)

    # Đăng ký audit event listener cho tất cả các bảng
    register_audit_events()

    # Auto seed RBAC (roles, modules, permissions)
    async with AsyncSessionLocal() as db:
        try:
            from database.seeds.auto_seed_data import auto_seed_all

            await auto_seed_all(db)
        except Exception as e:
            print(f"Error during seeding: {e}")

    # Kiểm tra kết nối Qdrant
    try:
        from database.qdrant import async_qdrant_client
        from services.vector import VectorService
        qdrant_service = VectorService(async_qdrant_client)
        health = await qdrant_service.health_check()
        if health["status"] == "healthy":
            print(f"[Qdrant] Connected! Collections: {health['collections']}")
        else:
            print(f"[WARN] Qdrant unhealthy: {health.get('error', 'unknown')}")
    except Exception as e:
        print(f"[WARN] Qdrant not available: {e}")

    # Khởi tạo (Pre-load) các model AI
    try:
        from services.embedding import get_embedding_service
        from services.rerank import get_rerank_service
        print("[AI Models] Đang tải các mô hình ngôn ngữ (Embedding & Reranker)...")
        get_embedding_service()._load_model()
        get_rerank_service()._load_model()
        print("[AI Models] Khởi tạo thành công!")
    except Exception as e:
        print(f"[WARN] Lỗi tải AI Models: {e}")

    # Train query classifier
    try:
        from services.query_classifier import get_query_classifier
        print("[Query Classifier] Đang train classifier...")
        get_query_classifier()
    except Exception as e:
        print(f"[WARN] Lỗi train Query Classifier: {e}")

    yield

    # Shutdown: đóng Qdrant client
    try:
        await async_qdrant_client.close()
        print("[Qdrant] Client closed.")
    except Exception:
        pass


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
