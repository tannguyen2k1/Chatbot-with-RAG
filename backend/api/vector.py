"""
Vector Database API Endpoints

Quản lý collections, points và similarity search trên Qdrant.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from database.qdrant import get_async_qdrant_client
from qdrant_client import AsyncQdrantClient
from services.vector import VectorService
from services.embedding import EmbeddingService, get_embedding_service
from services.rerank import RerankService, get_rerank_service
from schemas.vector import (
    CollectionCreate,
    CollectionInfo,
    PointsBatchUpsert,
    TextSearchRequest,
    VectorSearchRequest,
    VectorSearchResponse,
)

router = APIRouter(prefix="/vectors", tags=["Vector Database"])


def get_vector_service(
    client: AsyncQdrantClient = Depends(get_async_qdrant_client),
) -> VectorService:
    return VectorService(client)


@router.get("/health")
async def vector_health(service: VectorService = Depends(get_vector_service)):
    """Kiểm tra kết nối Qdrant"""
    return await service.health_check()


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
        raise HTTPException(
            status_code=404, detail=f"Collection '{name}' not found: {e}"
        )


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


@router.post(
    "/collections/{collection_name}/points", status_code=status.HTTP_201_CREATED
)
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


@router.get("/collections/{collection_name}/points/{point_id}")
async def get_point(
    collection_name: str,
    point_id: str,
    service: VectorService = Depends(get_vector_service),
):
    """Lấy point theo ID"""
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
    collection_name: str, service: VectorService = Depends(get_vector_service)
):
    """Xóa sạch tất cả points trong collection (giữ lại cấu hình collection)"""
    try:
        await service.clear_collection(collection_name)
        return {
            "message": f"All points in collection '{collection_name}' have been cleared"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
    reranker: RerankService = Depends(get_rerank_service),
):
    """
    Tìm kiếm bằng TEXT - gửi câu hỏi, backend tự embed rồi tìm.
    Có thể bật Reranker để kết quả chính xác hơn.
    """
    try:
        query_vector = embedding.encode_single(search_req.query, is_query=True)
        fetch_limit = (
            search_req.rerank_top_k if search_req.use_reranker else search_req.limit
        )

        results = await service.search(
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
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
