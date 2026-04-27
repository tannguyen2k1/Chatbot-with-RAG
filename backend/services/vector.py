"""
Vector Service - Quản lý Qdrant vector database operations

Cung cấp các thao tác:
- Quản lý collections (CRUD)
- Upsert/delete points (vectors + payload)
- Similarity search
"""

from typing import Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from qdrant_client import AsyncQdrantClient
from qdrant_client.http.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from schemas.vector import (
    CollectionCreate,
    CollectionInfo,
    PointUpsert,
    SearchResult,
    VectorSearchRequest,
    VectorSearchResponse,
    TextSearchRequest,
)
from services.embedding import EmbeddingService, get_embedding_service
from services.rerank import RerankService, get_rerank_service
from .rbac_helper import ensure_permission_global


DISTANCE_MAP = {
    "Cosine": Distance.COSINE,
    "Euclid": Distance.EUCLID,
    "Dot": Distance.DOT,
}

_vector_service: "VectorService | None" = None
_async_qdrant_client: "AsyncQdrantClient | None" = None


def get_async_qdrant_client_singleton() -> AsyncQdrantClient:
    """Lấy singleton async Qdrant client"""
    global _async_qdrant_client
    if _async_qdrant_client is None:
        from database.qdrant import create_async_qdrant_client
        _async_qdrant_client = create_async_qdrant_client()
    return _async_qdrant_client


class VectorService:
    """Service layer cho Qdrant vector database"""

    _instance: "VectorService | None" = None

    def __init__(self, client: AsyncQdrantClient):
        self.client = client

    @classmethod
    def get_instance(cls) -> "VectorService":
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls(get_async_qdrant_client_singleton())
        return cls._instance

    # ==================== Collections ====================

    async def list_collections(self) -> list[str]:
        """Lấy danh sách tất cả collections"""
        response = await self.client.get_collections()
        return [c.name for c in response.collections]

    async def get_collection_info(self, name: str) -> CollectionInfo:
        """Lấy thông tin chi tiết của một collection"""
        info = await self.client.get_collection(name)
        
        vector_size = None
        distance = None
        if info.config and info.config.params and info.config.params.vectors:
            vectors_config = info.config.params.vectors
            # vectors_config có thể là VectorParams hoặc dict of named vectors
            if hasattr(vectors_config, 'size'):
                vector_size = vectors_config.size
                distance = str(vectors_config.distance) if vectors_config.distance else None
        
        return CollectionInfo(
            name=name,
            vectors_count=getattr(info, "vectors_count", 0) or 0,
            points_count=getattr(info, "points_count", 0) or 0,
            status=str(getattr(info, "status", "")),
            vector_size=vector_size,
            distance=distance,
        )

    async def create_collection(self, data: CollectionCreate) -> bool:
        """Tạo collection mới"""
        distance = DISTANCE_MAP.get(data.distance, Distance.COSINE)
        result = await self.client.create_collection(
            collection_name=data.name,
            vectors_config=VectorParams(
                size=data.vector_size,
                distance=distance,
            ),
        )
        return result

    async def delete_collection(self, name: str) -> bool:
        """Xóa collection"""
        return await self.client.delete_collection(name)

    # ==================== Points ====================

    async def upsert_points(
        self, collection_name: str, points: list[PointUpsert]
    ) -> None:
        """Thêm hoặc cập nhật points vào collection"""
        qdrant_points = [
            PointStruct(
                id=p.id,
                vector=p.vector,
                payload=p.payload,
            )
            for p in points
        ]
        await self.client.upsert(
            collection_name=collection_name,
            points=qdrant_points,
        )

    async def delete_points(
        self, collection_name: str, point_ids: list[str | int]
    ) -> None:
        """Xóa points theo IDs"""
        await self.client.delete(
            collection_name=collection_name,
            points_selector=point_ids,
        )

    async def clear_collection(self, collection_name: str) -> None:
        """Xoá sạch tất cả points trong một collection (giữ lại cấu hình)"""
        await self.client.delete(
            collection_name=collection_name,
            points_selector=Filter(),
        )

    async def get_point(
        self, collection_name: str, point_id: str | int
    ) -> Optional[dict]:
        """Lấy point theo ID"""
        results = await self.client.retrieve(
            collection_name=collection_name,
            ids=[point_id],
            with_vectors=True,
            with_payload=True,
        )
        if not results:
            return None
        point = results[0]
        return {
            "id": point.id,
            "vector": point.vector,
            "payload": point.payload,
        }

    # ==================== Search ====================

    async def search(
        self,
        collection_name: str,
        vector: list[float],
        limit: int = 10,
        score_threshold: Optional[float] = None,
        filter_conditions: Optional[dict[str, Any]] = None,
    ) -> list[SearchResult]:
        """Tìm kiếm vector tương tự (similarity search)"""
        # Build Qdrant filter nếu có
        query_filter = None
        if filter_conditions:
            must_conditions = []
            for key, value in filter_conditions.items():
                must_conditions.append(
                    FieldCondition(key=key, match=MatchValue(value=value))
                )
            query_filter = Filter(must=must_conditions)

        results = await self.client.query_points(
            collection_name=collection_name,
            query=vector,
            limit=limit,
            score_threshold=score_threshold,
            query_filter=query_filter,
            with_payload=True,
        )

        return [
            SearchResult(
                id=hit.id,
                score=hit.score,
                payload=hit.payload or {},
            )
            for hit in results.points
        ]

    # ==================== Health ====================

    async def health_check(self) -> dict:
        """Kiểm tra kết nối Qdrant"""
        try:
            collections = await self.list_collections()
            return {
                "status": "healthy",
                "collections_count": len(collections),
                "collections": collections,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
            }

    # ==================== "For" methods with permission checks ====================

    async def health_check_for(self, current_user_id: int) -> dict:
        """Kiểm tra kết nối Qdrant với permission check"""
        await ensure_permission_global(current_user_id, "vector", "view")
        return await self.health_check()

    async def list_collections_for(self, current_user_id: int) -> list[str]:
        """Lấy danh sách collections với permission check"""
        await ensure_permission_global(current_user_id, "vector", "view")
        return await self.list_collections()

    async def get_collection_info_for(self, current_user_id: int, name: str) -> CollectionInfo:
        """Lấy thông tin collection với permission check"""
        await ensure_permission_global(current_user_id, "vector", "view")
        return await self.get_collection_info(name)

    async def create_collection_for(self, current_user_id: int, data: CollectionCreate) -> dict:
        """Tạo collection với permission check"""
        await ensure_permission_global(current_user_id, "vector", "create")
        await self.create_collection(data)
        return {"message": f"Collection '{data.name}' created successfully"}

    async def delete_collection_for(self, current_user_id: int, name: str) -> dict:
        """Xóa collection với permission check"""
        await ensure_permission_global(current_user_id, "vector", "delete")
        await self.delete_collection(name)
        return {"message": f"Collection '{name}' deleted successfully"}

    async def upsert_points_for(self, current_user_id: int, collection_name: str, points: list[PointUpsert]) -> dict:
        """Upsert points với permission check"""
        await ensure_permission_global(current_user_id, "vector", "create")
        await self.upsert_points(collection_name, points)
        return {"message": f"Upserted {len(points)} points"}

    async def get_point_for(self, current_user_id: int, collection_name: str, point_id: str | int) -> dict:
        """Lấy point với permission check"""
        await ensure_permission_global(current_user_id, "vector", "view")
        result = await self.get_point(collection_name, point_id)
        if not result:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Point '{point_id}' not found")
        return result

    async def delete_points_for(self, current_user_id: int, collection_name: str, point_ids: list[str | int]) -> dict:
        """Xóa points với permission check"""
        await ensure_permission_global(current_user_id, "vector", "delete")
        await self.delete_points(collection_name, point_ids)
        return {"message": f"Deleted {len(point_ids)} points"}

    async def clear_collection_for(self, current_user_id: int, collection_name: str) -> dict:
        """Xóa sạch collection với permission check"""
        await ensure_permission_global(current_user_id, "vector", "delete")
        await self.clear_collection(collection_name)
        return {"message": f"All points in collection '{collection_name}' have been cleared"}

    async def search_vectors_for(
        self,
        current_user_id: int,
        collection_name: str,
        request: VectorSearchRequest,
    ) -> VectorSearchResponse:
        """Tìm kiếm vectors với permission check"""
        await ensure_permission_global(current_user_id, "vector", "view")
        results = await self.search(
            collection_name=collection_name,
            vector=request.vector,
            limit=request.limit,
            score_threshold=request.score_threshold,
            filter_conditions=request.filter,
        )
        return VectorSearchResponse(results=results, count=len(results))

    async def search_by_text_for(
        self,
        current_user_id: int,
        collection_name: str,
        search_req: TextSearchRequest,
        embedding: EmbeddingService,
        reranker: RerankService,
    ) -> VectorSearchResponse:
        """Tìm kiếm bằng text với permission check"""
        await ensure_permission_global(current_user_id, "vector", "view")
        query_vector = embedding.encode_single(search_req.query, is_query=True)
        fetch_limit = search_req.rerank_top_k if search_req.use_reranker else search_req.limit

        results = await self.search(
            collection_name=collection_name,
            vector=query_vector,
            limit=fetch_limit,
            score_threshold=None if search_req.use_reranker else search_req.score_threshold,
            filter_conditions=search_req.filter,
        )

        if search_req.use_reranker and results:
            results = reranker.rerank_results(
                query=search_req.query,
                results=results,
                top_k=search_req.limit,
                score_threshold=search_req.score_threshold,
            )

        return VectorSearchResponse(results=results, count=len(results))


def get_vector_service() -> VectorService:
    """Dependency injection cho FastAPI"""
    return VectorService.get_instance()
