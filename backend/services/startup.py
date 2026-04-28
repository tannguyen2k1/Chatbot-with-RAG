"""
Startup Service - Các tác vụ khởi động backend

Tập trung toàn bộ logic startup:
- Kiểm tra kết nối Qdrant
- Pre-load AI Models (Embedding & Reranker)
- Tự động tạo collection "default" nếu chưa có
- Train Query Classifier
"""
from contextlib import asynccontextmanager

DEFAULT_COLLECTION = "default"


async def setup_database() -> None:
    """Khởi tạo database: tạo bảng, RLS, audit events, seed dữ liệu ban đầu."""
    from database.database import engine, AsyncSessionLocal
    from database.models.base import Base
    from database.audit_event import register_audit_events
    from database.rls import setup_rls

    # Tạo các bảng nếu chưa có
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Thiết lập Row Level Security cho multi-tenancy
    await setup_rls(engine)

    # Đăng ký audit event listener cho tất cả các bảng
    register_audit_events()

    # Auto seed RBAC (roles, modules, permissions)
    async with AsyncSessionLocal() as db:
        try:
            from database.seeds.auto_seed_data import auto_seed_all
            await auto_seed_all(db)
        except Exception as e:
            print(f"[SEED] Error: {e}")


async def check_qdrant_connection() -> None:
    """Kiểm tra kết nối Qdrant và in danh sách collections hiện có."""
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


def preload_ai_models() -> None:
    """Pre-load Embedding model và Reranker model vào bộ nhớ."""
    try:
        from services.embedding import get_embedding_service
        from services.rerank import get_rerank_service

        print("[AI Models] Đang tải các mô hình ngôn ngữ (Embedding & Reranker)...")
        get_embedding_service()._load_model()
        get_rerank_service()._load_model()
        print("[AI Models] Khởi tạo thành công!")
    except Exception as e:
        print(f"[WARN] Lỗi tải AI Models: {e}")


async def ensure_default_collection() -> None:
    """Tạo collection 'default' trong Qdrant nếu chưa tồn tại."""
    try:
        from database.qdrant import async_qdrant_client
        from services.vector import VectorService
        from services.embedding import get_embedding_service
        from schemas.vector import CollectionCreate

        qdrant_service = VectorService(async_qdrant_client)
        existing = await qdrant_service.list_collections()

        if DEFAULT_COLLECTION not in existing:
            vector_size = get_embedding_service().vector_dimension
            await qdrant_service.create_collection(
                CollectionCreate(
                    name=DEFAULT_COLLECTION,
                    vector_size=vector_size,
                    distance="Cosine",
                )
            )
            print(f"[Qdrant] Collection '{DEFAULT_COLLECTION}' created (dim={vector_size}).")
        else:
            print(f"[Qdrant] Collection '{DEFAULT_COLLECTION}' already exists.")
    except Exception as e:
        print(f"[WARN] Không thể tạo collection '{DEFAULT_COLLECTION}': {e}")


def train_query_classifier() -> None:
    """Train Query Classifier."""
    try:
        from services.query_classifier import get_query_classifier

        print("[Query Classifier] Đang train classifier...")
        get_query_classifier()
    except Exception as e:
        print(f"[WARN] Lỗi train Query Classifier: {e}")


async def shutdown() -> None:
    """Dọn dẹp tài nguyên khi tắt server."""
    try:
        from database.qdrant import async_qdrant_client

        await async_qdrant_client.close()
        print("[Qdrant] Client closed.")
    except Exception:
        pass


async def run_all() -> None:
    """
    Chạy toàn bộ các tác vụ khởi động theo thứ tự:
    1. Kiểm tra Qdrant
    2. Pre-load AI Models
    3. Tạo collection 'default' nếu chưa có
    4. Train Query Classifier
    """
    await check_qdrant_connection()
    preload_ai_models()
    await ensure_default_collection()
    train_query_classifier()


@asynccontextmanager
async def lifespan():
    """Context manager gộp toàn bộ startup + shutdown. Dùng trong lifespan của FastAPI."""
    await setup_database()
    await run_all()
    yield
    await shutdown()
