from pydantic import BaseModel, Field
from typing import Optional

class ContextChatRequest(BaseModel):
    query: str = Field(..., description="Câu hỏi của người dùng")
    collection_name: str = Field(..., description="Tên collection cần tìm kiếm")
    limit: int = Field(default=5, description="Số lượng đoạn văn tối đa dùng làm ngữ cảnh")
    use_reranker: bool = Field(default=True, description="Sử dụng Reranker")
    rerank_top_k: int = Field(default=50, description="Số lượng kết quả lấy từ Qdrant để đưa vào Reranker")
    score_threshold: Optional[float] = Field(default=None, description="Ngưỡng loại bỏ rác")
    use_bm25: bool = Field(default=True, description="Sử dụng BM25 để tìm kiếm keyword")
    bm25_top_k: int = Field(default=30, description="Số kết quả lấy từ BM25 để merge")
    bm25_weight: float = Field(default=0.3, ge=0.0, le=1.0, description="Trọng số BM25 khi merge với vector search")

class ContextChatResponse(BaseModel):
    query: str
    context: str
    raw_results_count: int
    prompt_preview: str

class ChatResponse(BaseModel):
    query: str
    answer: str
    context_sources: int
