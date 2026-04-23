from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from services.ingestion import ingestion_service
from services.chunking import chunking_service
from schemas.ingestion import IngestDBRequest, IngestResponse
from services.embedding import EmbeddingService, get_embedding_service
from services.vector import VectorService
from api.vector import get_vector_service
from schemas.vector import PointUpsert
import uuid
import os

router = APIRouter(prefix="/ingestion", tags=["Data Ingestion & Parsing"])

@router.post("/file", response_model=IngestResponse, summary="Ingest & Parse tài liệu từ file")
async def ingest_file(
    file: UploadFile = File(...),
    collection_name: str | None = Query(None, description="Tên collection Qdrant để lưu. Bỏ trống nếu chỉ muốn xem kết quả parse."),
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service)
):
    """
    Tải lên tài liệu (PDF, DOCX, HTML) để trích xuất nội dung.
    Hệ thống sẽ tự động nhận diện cấu trúc (heading, section, paragraph),
    chia nhỏ văn bản (chunking) và đính kèm metadata tương ứng.
    Nếu cung cấp collection_name, hệ thống sẽ tự động embed chunks và lưu vào Qdrant.
    """
    allowed_extensions = [".pdf", ".docx", ".doc", ".html", ".htm"]
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail=f"File extension {ext} not supported. Use PDF, DOCX, HTML.")
        
    try:
        parsed_elements, metadata = await ingestion_service.ingest_file(file)
        chunks = chunking_service.group_and_chunk(parsed_elements, metadata)
        
        if collection_name and chunks:
            batch_size = 500
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i + batch_size]
                texts = [chunk["text"] for chunk in batch_chunks]
                vectors = embedding_service.encode_texts(texts, is_query=False)
                
                points = []
                for chunk, vector in zip(batch_chunks, vectors):
                    point_id = str(uuid.uuid4())
                    payload = {**chunk.get("metadata", {}), "_text": chunk["text"]}
                    points.append(PointUpsert(id=point_id, vector=vector, payload=payload))
                
                await vector_service.upsert_points(collection_name, points)
        
        return IngestResponse(
            message="Ingest, Parse và Vectorize file thành công" if collection_name else "Ingest và Parse file thành công",
            document_id=str(uuid.uuid4()),
            chunks_count=len(chunks),
            chunks=chunks,
            metadata=metadata
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/db", response_model=IngestResponse, summary="Ingest & Parse dữ liệu từ Database")
async def ingest_db(
    request: IngestDBRequest,
    embedding_service: EmbeddingService = Depends(get_embedding_service),
    vector_service: VectorService = Depends(get_vector_service)
):
    """
    Nhận dữ liệu văn bản từ Database record để trích xuất nội dung.
    Hệ thống sẽ tự động phân tích cấu trúc, chia nhỏ thành các chunk và lưu trữ kèm metadata.
    Nếu cung cấp collection_name trong request, hệ thống sẽ tự động embed chunks và lưu vào Qdrant.
    """
    try:
        source_metadata = {
            "source_table": request.source_table,
            "record_id": request.record_id,
            **request.metadata
        }
        
        parsed_elements, metadata = await ingestion_service.ingest_db_record(request.content, source_metadata)
        chunks = chunking_service.group_and_chunk(parsed_elements, metadata)
        
        if request.collection_name and chunks:
            batch_size = 500
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i + batch_size]
                texts = [chunk["text"] for chunk in batch_chunks]
                vectors = embedding_service.encode_texts(texts, is_query=False)
                
                points = []
                for chunk, vector in zip(batch_chunks, vectors):
                    point_id = str(uuid.uuid4())
                    payload = {**chunk.get("metadata", {}), "_text": chunk["text"]}
                    points.append(PointUpsert(id=point_id, vector=vector, payload=payload))
                
                await vector_service.upsert_points(request.collection_name, points)
        
        return IngestResponse(
            message="Ingest, Parse và Vectorize DB record thành công" if request.collection_name else "Ingest DB record thành công",
            document_id=f"db_{request.source_table}_{request.record_id}",
            chunks_count=len(chunks),
            chunks=chunks,
            metadata=metadata
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
