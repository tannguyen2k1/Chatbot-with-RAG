"""
Vector Service - Quản lý Qdrant vector database operations

Cung cấp các thao tác:
- Quản lý collections (CRUD)
- Upsert/delete points (vectors + payload)
- Similarity search
"""

from typing import Optional, Any
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
)


DISTANCE_MAP = {
    "Cosine": Distance.COSINE,
    "Euclid": Distance.EUCLID,
    "Dot": Distance.DOT,
}


class VectorService:
    """Service layer cho Qdrant vector database"""

    def __init__(self, client: AsyncQdrantClient):
        self.client = client

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
