from pydantic import BaseModel, Field
from typing import Optional

class ContextChatRequest(BaseModel):
    query: str = Field(..., description="Câu hỏi của người dùng")
    collection_name: str = Field(..., description="Tên collection cần tìm kiếm")
    limit: int = Field(default=5, description="Số lượng đoạn văn tối đa dùng làm ngữ cảnh")
    use_reranker: bool = Field(default=True, description="Sử dụng Reranker")
    rerank_top_k: int = Field(default=50, description="Số lượng kết quả lấy từ Qdrant để đưa vào Reranker")
    score_threshold: Optional[float] = Field(default=None, description="Ngưỡng loại bỏ rác")

class ContextChatResponse(BaseModel):
    query: str
    context: str
    raw_results_count: int
    prompt_preview: str

class ChatResponse(BaseModel):
    query: str
    answer: str
    context_sources: int
