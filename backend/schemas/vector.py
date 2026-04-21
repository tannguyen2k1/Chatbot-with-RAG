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


# --- Text-based Point (auto embedding) ---
class TextPointUpsert(BaseModel):
    """Thêm point bằng text - tự động embed thành vector, ID tự sinh"""
    text: str = Field(..., description="Nội dung text sẽ được auto embed thành vector")
    payload: dict[str, Any] = Field(default_factory=dict, description="Metadata đi kèm vector")

    @field_validator("text", mode="before")
    @classmethod
    def sanitize_text(cls, v: str) -> str:
        """Tự động làm sạch text từ PDF: bỏ ký tự control, chuẩn hóa khoảng trắng"""
        import re
        # Thay control characters (trừ \n \t) bằng space
        v = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', ' ', v)
        # Chuẩn hóa nhiều khoảng trắng liên tiếp
        v = re.sub(r' +', ' ', v)
        return v.strip()


class TextPointsBatchUpsert(BaseModel):
    """Thêm nhiều text points cùng lúc - tự động embed"""
    points: list[TextPointUpsert] = Field(..., description="Danh sách text points")
    is_query: bool = Field(
        default=False,
        description="True nếu text là query (thêm prompt prefix), False nếu là document",
    )


# --- Search ---
class VectorSearchRequest(BaseModel):
    """Tìm kiếm bằng vector trực tiếp"""
    vector: list[float] = Field(..., description="Vector query để tìm kiếm")
    limit: int = Field(default=10, ge=1, le=100, description="Số kết quả trả về")
    score_threshold: Optional[float] = Field(
        default=None,
        description="Ngưỡng score tối thiểu (0.0 - 1.0)"
    )
    filter: Optional[dict[str, Any]] = Field(
        default=None,
        description="Qdrant filter conditions"
    )


class TextSearchRequest(BaseModel):
    """Tìm kiếm bằng TEXT - tự embed rồi search"""
    query: str = Field(..., description="Câu hỏi / nội dung cần tìm")
    limit: int = Field(default=10, ge=1, le=100, description="Số kết quả trả về")
    score_threshold: Optional[float] = Field(
        default=None,
        description="Ngưỡng score tối thiểu (0.0 - 1.0)"
    )
    filter: Optional[dict[str, Any]] = Field(
        default=None,
        description="Qdrant filter conditions"
    )


class SearchResult(BaseModel):
    """Kết quả tìm kiếm"""
    id: str | int
    score: float
    payload: dict[str, Any] = {}


class VectorSearchResponse(BaseModel):
    """Response tìm kiếm vector"""
    results: list[SearchResult]
    count: int
