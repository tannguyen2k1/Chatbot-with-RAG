"""
Vector Database API Endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, status
from database.models.user import User

from dependencies import get_current_user
from schemas.vector import (
    CollectionCreate,
    CollectionInfo,
    PointsBatchUpsert,
    TextSearchRequest,
    VectorSearchRequest,
    VectorSearchResponse,
)
from services.embedding import EmbeddingService, get_embedding_service
from services.rerank import RerankService, get_rerank_service
from services.vector import VectorService, get_vector_service

router = APIRouter(
    prefix="/vectors",
    tags=["Vector Database"],
    dependencies=[Depends(get_current_user)],
)


@router.get("/health")
async def vector_health(
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    return await service.health_check_for(current_user.id)


@router.get("/collections", response_model=list[str])
async def list_collections(
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    return await service.list_collections_for(current_user.id)


@router.get("/collections/{name}", response_model=CollectionInfo)
async def get_collection(
    name: str,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        return await service.get_collection_info_for(current_user.id, name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Collection '{name}' not found: {e}")


@router.post("/collections", status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        return await service.create_collection_for(current_user.id, data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/collections/{name}", status_code=status.HTTP_200_OK)
async def delete_collection(
    name: str,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        return await service.delete_collection_for(current_user.id, name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/collections/{collection_name}/points", status_code=status.HTTP_201_CREATED)
async def upsert_points(
    collection_name: str,
    data: PointsBatchUpsert,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        return await service.upsert_points_for(current_user.id, collection_name, data.points)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/collections/{collection_name}/points/{point_id}")
async def get_point(
    collection_name: str,
    point_id: str,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        pid = int(point_id)
    except ValueError:
        pid = point_id
    return await service.get_point_for(current_user.id, collection_name, pid)


@router.delete("/collections/{collection_name}/points")
async def delete_points(
    collection_name: str,
    point_ids: list[str | int],
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        return await service.delete_points_for(current_user.id, collection_name, point_ids)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/collections/{collection_name}/clear", status_code=status.HTTP_200_OK)
async def clear_collection(
    collection_name: str,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        return await service.clear_collection_for(current_user.id, collection_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/collections/{collection_name}/search", response_model=VectorSearchResponse)
async def search_vectors(
    collection_name: str,
    request: VectorSearchRequest,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
):
    try:
        return await service.search_vectors_for(current_user.id, collection_name, request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/collections/{collection_name}/search/text", response_model=VectorSearchResponse)
async def search_by_text(
    collection_name: str,
    search_req: TextSearchRequest,
    current_user: User = Depends(get_current_user),
    service: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
):
    try:
        return await service.search_by_text_for(
            current_user.id, collection_name, search_req, embedding, reranker
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
