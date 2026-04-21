"""
Vector Database API Endpoints

Quản lý collections, points và similarity search trên Qdrant.
"""

import uuid
from fastapi import APIRouter, HTTPException, Request, status, Depends
from database.qdrant import get_async_qdrant_client
from qdrant_client import AsyncQdrantClient
from services.vector import VectorService
from services.embedding import EmbeddingService, get_embedding_service
from schemas.vector import (
    CollectionCreate,
    CollectionInfo,
    PointUpsert,
    PointsBatchUpsert,
    TextPointUpsert,
    TextPointsBatchUpsert,
    TextSearchRequest,
    VectorSearchRequest,
    VectorSearchResponse,
)

router = APIRouter(prefix="/vectors", tags=["Vector Database"])


def get_vector_service(
    client: AsyncQdrantClient = Depends(get_async_qdrant_client),
) -> VectorService:
    return VectorService(client)


# ==================== Health ====================

@router.get("/health")
async def vector_health(service: VectorService = Depends(get_vector_service)):
    """Kiểm tra kết nối Qdrant"""
    return await service.health_check()


# ==================== Collections ====================

@router.get("/collections", response_model=list[str])
async def list_collections(service: VectorService = Depends(get_vector_service)):
    """Lấy danh sách collections"""
    return await service.list_collections()


@router.get("/collections/{name}", response_model=CollectionInfo)
async def get_collection(
    name: str, service: VectorService = Depends(get_vector_service)
):
    """Lấy thông tin collection"""
    try:
        return await service.get_collection_info(name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Collection '{name}' not found: {e}")


@router.post("/collections", status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate, service: VectorService = Depends(get_vector_service)
):
    """Tạo collection mới"""
    try:
        await service.create_collection(data)
        return {"message": f"Collection '{data.name}' created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/collections/{name}", status_code=status.HTTP_200_OK)
async def delete_collection(
    name: str, service: VectorService = Depends(get_vector_service)
):
    """Xóa collection"""
    try:
        await service.delete_collection(name)
        return {"message": f"Collection '{name}' deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


# ==================== Points ====================

@router.post("/collections/{collection_name}/points", status_code=status.HTTP_201_CREATED)
async def upsert_points(
    collection_name: str,
    data: PointsBatchUpsert,
    service: VectorService = Depends(get_vector_service),
):
    """Thêm/cập nhật points vào collection"""
    try:
        await service.upsert_points(collection_name, data.points)
        return {"message": f"Upserted {len(data.points)} points"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/collections/{collection_name}/points/single", status_code=status.HTTP_201_CREATED)
async def upsert_single_point(
    collection_name: str,
    point: PointUpsert,
    service: VectorService = Depends(get_vector_service),
):
    """Thêm/cập nhật một point (truyền vector trực tiếp)"""
    try:
        await service.upsert_points(collection_name, [point])
        return {"message": f"Upserted point {point.id}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Text-based Upsert (Auto Embedding) ====================

import json as json_lib


def _parse_raw_json(raw: bytes) -> dict:
    """Parse JSON từ raw body, chấp nhận control characters.
    strict=False cho phép \\n, \\t, \\r... bên trong chuỗi JSON."""
    text = raw.decode("utf-8", errors="replace")
    return json_lib.loads(text, strict=False)


@router.post("/collections/{collection_name}/points/text", status_code=status.HTTP_201_CREATED)
async def upsert_text_points(
    collection_name: str,
    request: Request,
    service: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
):
    """
    Thêm/cập nhật points bằng TEXT - tự động embed thành vector qua Qwen3.
    
    Hỗ trợ text copy từ PDF (tự động xử lý ký tự đặc biệt).
    """
    try:
        raw_body = await request.body()
        body = _parse_raw_json(raw_body)
        data = TextPointsBatchUpsert(**body)

        # Embed tất cả texts cùng lúc (batch)
        texts = [p.text for p in data.points]
        vectors = embedding.encode_texts(texts, is_query=data.is_query)

        # Chuyển thành PointUpsert với vector đã embed + UUID tự sinh
        point_upserts = []
        for point, vector in zip(data.points, vectors):
            point_id = str(uuid.uuid4())
            payload = {**point.payload, "_text": point.text}
            point_upserts.append(
                PointUpsert(id=point_id, vector=vector, payload=payload)
            )

        await service.upsert_points(collection_name, point_upserts)
        return {
            "message": f"Embedded and upserted {len(data.points)} points",
            "vector_dimension": len(vectors[0]) if vectors else 0,
        }
    except json_lib.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/collections/{collection_name}/points/text/single", status_code=status.HTTP_201_CREATED)
async def upsert_single_text_point(
    collection_name: str,
    request: Request,
    service: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
):
    """
    Thêm/cập nhật 1 point bằng TEXT - tự động embed qua Qwen3.
    
    Hỗ trợ text copy từ PDF (tự động xử lý ký tự đặc biệt).
    """
    try:
        raw_body = await request.body()
        body = _parse_raw_json(raw_body)
        point = TextPointUpsert(**body)

        vector = embedding.encode_single(point.text)
        point_id = str(uuid.uuid4())
        payload = {**point.payload, "_text": point.text}
        point_upsert = PointUpsert(id=point_id, vector=vector, payload=payload)
        await service.upsert_points(collection_name, [point_upsert])
        return {
            "message": f"Embedded and upserted point {point_id}",
            "vector_dimension": len(vector),
        }
    except json_lib.JSONDecodeError as e:
        raise HTTPException(status_code=422, detail=f"Invalid JSON: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/collections/{collection_name}/points/{point_id}")
async def get_point(
    collection_name: str,
    point_id: str,
    service: VectorService = Depends(get_vector_service),
):
    """Lấy point theo ID"""
    # Thử parse sang int nếu có thể
    try:
        pid = int(point_id)
    except ValueError:
        pid = point_id

    result = await service.get_point(collection_name, pid)
    if not result:
        raise HTTPException(status_code=404, detail=f"Point '{point_id}' not found")
    return result


@router.delete("/collections/{collection_name}/points")
async def delete_points(
    collection_name: str,
    point_ids: list[str | int],
    service: VectorService = Depends(get_vector_service),
):
    """Xóa points theo IDs"""
    try:
        await service.delete_points(collection_name, point_ids)
        return {"message": f"Deleted {len(point_ids)} points"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/collections/{collection_name}/clear", status_code=status.HTTP_200_OK)
async def clear_collection(
    collection_name: str,
    service: VectorService = Depends(get_vector_service)
):
    """Xóa sạch tất cả points trong collection (giữ lại cấu hình collection)"""
    try:
        await service.clear_collection(collection_name)
        return {"message": f"All points in collection '{collection_name}' have been cleared"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# ==================== Search ====================

@router.post(
    "/collections/{collection_name}/search",
    response_model=VectorSearchResponse,
)
async def search_vectors(
    collection_name: str,
    request: VectorSearchRequest,
    service: VectorService = Depends(get_vector_service),
):
    """Tìm kiếm vector tương tự (truyền vector trực tiếp)"""
    try:
        results = await service.search(
            collection_name=collection_name,
            vector=request.vector,
            limit=request.limit,
            score_threshold=request.score_threshold,
            filter_conditions=request.filter,
        )
        return VectorSearchResponse(results=results, count=len(results))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post(
    "/collections/{collection_name}/search/text",
    response_model=VectorSearchResponse,
)
async def search_by_text(
    collection_name: str,
    search_req: TextSearchRequest,
    service: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
):
    """
    Tìm kiếm bằng TEXT - gửi câu hỏi, backend tự embed rồi tìm.
    
    Ví dụ: {"query": "FastAPI là gì?", "limit": 5}
    """
    try:
        # Embed query text thành vector (is_query=True để dùng prompt prefix)
        query_vector = embedding.encode_single(search_req.query, is_query=True)

        results = await service.search(
            collection_name=collection_name,
            vector=query_vector,
            limit=search_req.limit,
            score_threshold=search_req.score_threshold,
            filter_conditions=search_req.filter,
        )
        return VectorSearchResponse(results=results, count=len(results))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
