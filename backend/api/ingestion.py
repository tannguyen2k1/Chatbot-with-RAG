import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from database.models.user import User

from dependencies import get_current_user
from schemas.ingestion import IngestDBRequest, IngestResponse
from schemas.vector import PointUpsert
from services.chunking import chunking_service
from services.embedding import EmbeddingService, get_embedding_service
from services.ingestion import ingestion_service
from services.rbac_helper import ensure_permission_global
from services.vector import VectorService, get_vector_service

router = APIRouter(
    prefix="/ingestion",
    tags=["Data Ingestion & Parsing"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/file", response_model=IngestResponse, summary="Ingest & Parse tai lieu tu file")
async def ingest_file(
    file: UploadFile = File(...),
    collection_name: str = Query(..., description="Ten collection Qdrant de luu."),
    entity_name: Optional[str] = Query(None, description="Ten thuc the de tiem vao ngu canh."),
    current_user: User = Depends(get_current_user),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service),
):
    await ensure_permission_global(current_user.id, "ingestion", "create")

    allowed_extensions = [".pdf", ".docx", ".doc", ".html", ".htm"]
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File extension {ext} not supported. Use PDF, DOCX, HTML.")

    try:
        parsed_elements, metadata = await ingestion_service.ingest_file(file)
        chunks = chunking_service.group_and_chunk(parsed_elements, metadata, entity_name=entity_name)

        if chunks:
            batch_size = 500
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i : i + batch_size]
                texts = [chunk.get("embed_text") or chunk["text"] for chunk in batch_chunks]
                vectors = embedding_service.encode_texts(texts, is_query=False)

                points = []
                for chunk, vector in zip(batch_chunks, vectors):
                    point_id = str(uuid.uuid4())
                    payload = {**chunk.get("metadata", {}), "_text": chunk["text"]}
                    points.append(PointUpsert(id=point_id, vector=vector, payload=payload))

                await vector_service.upsert_points(collection_name, points)

        return IngestResponse(
            message="Ingest, Parse va Vectorize file thanh cong",
            document_id=str(uuid.uuid4()),
            chunks_count=len(chunks),
            chunks=chunks,
            metadata=metadata,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/db", response_model=IngestResponse, summary="Ingest & Parse du lieu tu Database")
async def ingest_db(
    request: IngestDBRequest,
    current_user: User = Depends(get_current_user),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service),
):
    await ensure_permission_global(current_user.id, "ingestion", "create")

    try:
        source_metadata = {
            "source_table": request.source_table,
            "record_id": request.record_id,
            **request.metadata,
        }

        parsed_elements, metadata = await ingestion_service.ingest_db_record(request.content, source_metadata)
        chunks = chunking_service.group_and_chunk(parsed_elements, metadata, entity_name=request.entity_name)

        if chunks:
            batch_size = 500
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i : i + batch_size]
                texts = [chunk.get("embed_text") or chunk["text"] for chunk in batch_chunks]
                vectors = embedding_service.encode_texts(texts, is_query=False)

                points = []
                for chunk, vector in zip(batch_chunks, vectors):
                    point_id = str(uuid.uuid4())
                    payload = {**chunk.get("metadata", {}), "_text": chunk["text"]}
                    points.append(PointUpsert(id=point_id, vector=vector, payload=payload))

                await vector_service.upsert_points(request.collection_name, points)

        return IngestResponse(
            message="Ingest, Parse va Vectorize DB record thanh cong",
            document_id=f"db_{request.source_table}_{request.record_id}",
            chunks_count=len(chunks),
            chunks=chunks,
            metadata=metadata,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
