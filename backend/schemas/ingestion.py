from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict

class IngestResponse(BaseModel):
    message: str = Field(..., description="Trạng thái xử lý")
    document_id: Optional[str] = Field(None, description="ID của document sau khi ingest")
    chunks_count: int = Field(0, description="Số lượng chunk được trích xuất")
    chunks: List[Dict[str, Any]] = Field(default_factory=list, description="Danh sách các chunk và metadata của chúng")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Metadata đi kèm")

class IngestDBRequest(BaseModel):
    source_table: str = Field(..., description="Tên bảng nguồn")
    record_id: str = Field(..., description="ID của bản ghi")
    content: str = Field(..., description="Nội dung cần ingest")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Metadata bổ sung")
    collection_name: Optional[str] = Field(None, description="Tên collection Qdrant để lưu. Bỏ trống nếu chỉ muốn xem kết quả parse.")
