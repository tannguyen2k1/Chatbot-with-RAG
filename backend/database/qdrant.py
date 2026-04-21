"""
Qdrant Vector Database Client

Quản lý kết nối tới Qdrant vector database.
Sử dụng async client để tương thích với FastAPI async.

Cách dùng:
    from database.qdrant import get_qdrant_client, qdrant_client

    # Dùng singleton client
    client = qdrant_client

    # Hoặc dùng dependency injection trong FastAPI
    @router.get("/search")
    async def search(client: QdrantClient = Depends(get_qdrant_client)):
        ...
"""

from qdrant_client import QdrantClient, AsyncQdrantClient
from config.settings import settings


def create_qdrant_client() -> QdrantClient:
    """Tạo synchronous Qdrant client."""
    return QdrantClient(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        grpc_port=settings.QDRANT_GRPC_PORT,
        prefer_grpc=True,
    )


def create_async_qdrant_client() -> AsyncQdrantClient:
    """Tạo async Qdrant client cho FastAPI."""
    return AsyncQdrantClient(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        grpc_port=settings.QDRANT_GRPC_PORT,
        prefer_grpc=True,
    )


# Singleton clients
qdrant_client = create_qdrant_client()
async_qdrant_client = create_async_qdrant_client()


def get_qdrant_client() -> QdrantClient:
    """FastAPI dependency - sync client."""
    return qdrant_client


def get_async_qdrant_client() -> AsyncQdrantClient:
    """FastAPI dependency - async client."""
    return async_qdrant_client
