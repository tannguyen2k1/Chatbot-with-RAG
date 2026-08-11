from datetime import datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field


class JobStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class IngestResponse(BaseModel):
    message: str = Field(..., description="Trạng thái xử lý")
    document_id: str | None = Field(None, description="ID của document sau khi ingest")
    chunks_count: int = Field(0, description="Số lượng chunk được trích xuất")
    chunks: list[dict[str, Any]] = Field(default_factory=list, description="Danh sách các chunk và metadata của chúng")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Metadata đi kèm")


class IngestDBRequest(BaseModel):
    source_table: str = Field(..., description="Tên bảng nguồn")
    record_id: str = Field(..., description="ID của bản ghi")
    content: str = Field(..., description="Nội dung cần ingest")
    metadata: dict[str, Any] | None = Field(default_factory=dict, description="Metadata bổ sung")
    collection_name: str = Field(..., description="Tên collection Qdrant để lưu.")


class IngestionJob(BaseModel):
    job_id: str = Field(..., description="ID của job")
    status: JobStatus = Field(JobStatus.PENDING, description="Trạng thái job")
    source_type: str = Field(..., description="Loại nguồn: 'file' hoặc 'db'")
    filename: str | None = Field(None, description="Tên file (neu la file)")
    collection_name: str | None = Field(None, description="Collection Qdrant")
    result: IngestResponse | None = Field(None, description="Ket qua khi hoan thanh")
    error: str | None = Field(None, description="Loi neu that bai")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str | None = Field(None, description="User ID tao job")
