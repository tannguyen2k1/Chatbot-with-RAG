import asyncio
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, Query, UploadFile
from database.models.user import User

from dependencies import get_current_user
from schemas.ingestion import (
    IngestDBRequest,
    IngestResponse,
    IngestionJob,
    JobStatus,
)
from schemas.vector import PointUpsert
from services.chunking import chunking_service
from services.embedding import EmbeddingService, get_embedding_service
from services.ingestion import ingestion_service
from services.ingestion_job import ingestion_job_service
from services.rbac_helper import ensure_permission_global
from services.vector import VectorService, get_vector_service

router = APIRouter(
    prefix="/ingestion",
    tags=["Data Ingestion & Parsing"],
    dependencies=[Depends(get_current_user)],
)


_parsing_executor = ThreadPoolExecutor(max_workers=4)


async def _do_ingest_file_bytes(
    job_id: str,
    file_bytes: bytes,
    filename: str,
    collection_name: str,
    embedding_service: EmbeddingService,
    vector_service: VectorService,
):
    await ingestion_job_service.update_job(job_id, status=JobStatus.PROCESSING)
    loop = asyncio.get_running_loop()
    parsed_elements, metadata = await loop.run_in_executor(
        _parsing_executor,
        ingestion_service.ingest_file_bytes,
        file_bytes,
        filename,
    )

    chunks = chunking_service.group_and_chunk(parsed_elements, metadata)

    if not chunks:
        result = IngestResponse(
            message="Ingest, Parse va Vectorize file thanh cong (khong co chunk)",
            document_id=job_id,
            chunks_count=0,
            chunks=[],
            metadata=metadata,
        )
        await ingestion_job_service.update_job(job_id, status=JobStatus.COMPLETED, result=result)
        return

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

    result = IngestResponse(
        message="Ingest, Parse va Vectorize file thanh cong",
        document_id=job_id,
        chunks_count=len(chunks),
        chunks=chunks,
        metadata=metadata,
    )
    await ingestion_job_service.update_job(job_id, status=JobStatus.COMPLETED, result=result)


async def _do_ingest_db(
    job_id: str,
    request: IngestDBRequest,
    embedding_service: EmbeddingService,
    vector_service: VectorService,
):
    await ingestion_job_service.update_job(job_id, status=JobStatus.PROCESSING)
    loop = asyncio.get_running_loop()
    source_metadata = {
        "source_table": request.source_table,
        "record_id": request.record_id,
        **request.metadata,
    }
    parsed_elements, metadata = await loop.run_in_executor(
        _parsing_executor,
        ingestion_service.ingest_db_record,
        request.content,
        source_metadata,
    )

    chunks = chunking_service.group_and_chunk(parsed_elements, metadata)

    if not chunks:
        result = IngestResponse(
            message="Ingest, Parse va Vectorize DB record thanh cong (khong co chunk)",
            document_id=job_id,
            chunks_count=0,
            chunks=[],
            metadata=metadata,
        )
        await ingestion_job_service.update_job(job_id, status=JobStatus.COMPLETED, result=result)
        return

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

    result = IngestResponse(
        message="Ingest, Parse va Vectorize DB record thanh cong",
        document_id=job_id,
        chunks_count=len(chunks),
        chunks=chunks,
        metadata=metadata,
    )
    await ingestion_job_service.update_job(job_id, status=JobStatus.COMPLETED, result=result)


@router.post(
    "/file",
    response_model=IngestionJob,
    summary="Ingest & Parse tai lieu tu file (async)",
)
async def ingest_file(
    file: UploadFile = File(...),
    collection_name: str = Query(..., description="Ten collection Qdrant de luu."),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service),
):
    await ensure_permission_global(current_user.id, "ingestion", "create")

    allowed_extensions = [".pdf", ".docx", ".doc", ".html", ".htm"]
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File extension {ext} not supported. Use PDF, DOCX, HTML.")

    file_bytes = await file.read()
    await file.close()

    job = await ingestion_job_service.create_job(
        source_type="file",
        filename=file.filename,
        collection_name=collection_name,
        created_by=str(current_user.id),
    )

    background_tasks.add_task(
        _do_ingest_file_bytes,
        job.job_id,
        file_bytes,
        file.filename,
        collection_name,
        embedding_service,
        vector_service,
    )

    return job


@router.post(
    "/db",
    response_model=IngestionJob,
    summary="Ingest & Parse du lieu tu Database (async)",
)
async def ingest_db(
    request: IngestDBRequest,
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_user),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service),
):
    await ensure_permission_global(current_user.id, "ingestion", "create")

    job = await ingestion_job_service.create_job(
        source_type="db",
        collection_name=request.collection_name,
        created_by=str(current_user.id),
    )

    background_tasks.add_task(
        _do_ingest_db,
        job.job_id,
        request,
        embedding_service,
        vector_service,
    )

    return job


@router.get(
    "/jobs",
    response_model=list[IngestionJob],
    summary="List active ingestion jobs",
)
async def list_jobs(
    current_user: User = Depends(get_current_user),
):
    allowed = await ingestion_job_service._check_ingestion_permission(current_user.id)
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized for ingestion.view")
    return await ingestion_job_service.get_active_jobs()


@router.get(
    "/jobs/{job_id}",
    response_model=IngestionJob,
    summary="Get status of an ingestion job",
)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    allowed = await ingestion_job_service._check_ingestion_permission(current_user.id)
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized for ingestion.view")
    job = await ingestion_job_service.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
