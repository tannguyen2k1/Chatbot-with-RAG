"""
Schemas cho Vector Database (Qdrant) API
"""

import uuid
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any


def _gen_uuid() -> str:
    return str(uuid.uuid4())


# --- Collection ---
class CollectionCreate(BaseModel):
    """Tạo collection mới trong Qdrant"""
    name: str = Field(..., description="Tên collection")
    vector_size: int = Field(..., ge=1, description="Kích thước vector (ví dụ: 384, 768, 1536)")
    distance: str = Field(
        default="Cosine",
        description="Hàm tính khoảng cách: Cosine, Euclid, Dot"
    )


class CollectionInfo(BaseModel):
    """Thông tin collection"""
    name: str
    vectors_count: int = 0
    points_count: int = 0
    status: str = ""
    vector_size: Optional[int] = None
    distance: Optional[str] = None


# --- Point (Vector + Payload) ---
class PointUpsert(BaseModel):
    """Thêm/cập nhật một point vào collection"""
    id: str | int = Field(default_factory=_gen_uuid, description="ID của point (tự sinh UUID nếu bỏ trống)")
    vector: list[float] = Field(..., description="Vector embedding")
    payload: dict[str, Any] = Field(default_factory=dict, description="Metadata đi kèm vector")


class PointsBatchUpsert(BaseModel):
    """Thêm/cập nhật nhiều points cùng lúc"""
    points: list[PointUpsert] = Field(..., description="Danh sách points")





# --- Search ---
class VectorSearchRequest(BaseModel):
    """Tìm kiếm bằng vector trực tiếp"""
    vector: list[float] = Field(..., description="Vector query để tìm kiếm")
    limit: int = Field(default=10, ge=1, le=100, description="Số kết quả trả về")
    score_threshold: Optional[float] = Field(
        default=None,
        description="Ngưỡng score tối thiểu"
    )
    filter: Optional[dict[str, Any]] = Field(
        default=None,
        description="Qdrant filter conditions"
    )


class TextSearchRequest(BaseModel):
    """Tìm kiếm bằng TEXT - tự embed rồi search"""
    query: str = Field(..., description="Câu hỏi / nội dung cần tìm")
    limit: int = Field(default=7, ge=1, le=100, description="Số kết quả trả về")
    score_threshold: Optional[float] = Field(
        default=None,
        description="Ngưỡng score tối thiểu"
    )
    filter: Optional[dict[str, Any]] = Field(
        default=None,
        description="Qdrant filter conditions"
    )
    use_reranker: bool = Field(default=True, description="Sử dụng Reranker để sắp xếp lại chính xác hơn")
    rerank_top_k: int = Field(default=50, description="Số lượng kết quả lấy từ Qdrant để đưa vào Reranker")
    use_bm25: bool = Field(default=True, description="Sử dụng BM25 để tìm kiếm keyword song song")
    bm25_top_k: int = Field(default=30, description="Số kết quả lấy từ BM25 để merge")
    bm25_weight: float = Field(default=0.3, ge=0.0, le=1.0, description="Trọng số BM25 khi merge với vector")


class SearchResult(BaseModel):
    """Kết quả tìm kiếm"""
    id: str | int
    score: float
    payload: dict[str, Any] = {}


class VectorSearchResponse(BaseModel):
    """Response tìm kiếm vector"""
    results: list[SearchResult]
    count: int
