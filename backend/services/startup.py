"""
Startup Service - Backend startup tasks
"""
from contextlib import asynccontextmanager

DEFAULT_COLLECTION = "default"


async def setup_database() -> None:
    """Initialize database: create tables, audit events, seed initial data."""
    from database.database import engine, AsyncSessionLocal
    from database.models.base import Base
    from database.audit_event import register_audit_events

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    register_audit_events()

    async with AsyncSessionLocal() as db:
        try:
            from database.seeds.auto_seed_data import auto_seed_all
            await auto_seed_all(db)
        except Exception as e:
            print(f"[SEED] Error: {e}")


async def check_qdrant_connection() -> None:
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
    try:
        from services.embedding import get_embedding_service
        from services.rerank import get_rerank_service
        from services.ner import get_ner_service

        print("[AI Models] Loading language models (Embedding, Reranker, NER)...")
        get_embedding_service()._load_model()
        get_rerank_service()._load_model()
        get_ner_service()._load_model()
        print("[AI Models] Models loaded successfully!")
    except Exception as e:
        print(f"[WARN] Error loading AI Models: {e}")


async def ensure_default_collection() -> None:
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
        print(f"[WARN] Cannot create collection '{DEFAULT_COLLECTION}': {e}")


def train_query_classifier() -> None:
    try:
        from services.query_classifier import get_query_classifier

        print("[Query Classifier] Training classifier...")
        get_query_classifier()
    except Exception as e:
        print(f"[WARN] Error training Query Classifier: {e}")


async def shutdown() -> None:
    try:
        from database.qdrant import async_qdrant_client

        await async_qdrant_client.close()
        print("[Qdrant] Client closed.")
    except Exception:
        pass


async def run_all() -> None:
    await check_qdrant_connection()
    preload_ai_models()
    await ensure_default_collection()
    train_query_classifier()


@asynccontextmanager
async def lifespan():
    await setup_database()
    await run_all()
    yield
    await shutdown()
