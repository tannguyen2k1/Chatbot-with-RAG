from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class MessageBase(BaseModel):
    role: str = Field(..., description="Vai trò: 'user' hoặc 'assistant'")
    content: Optional[str] = Field(None, description="Nội dung tin nhắn")
    context_sources: int = Field(default=0, description="Số context sources được sử dụng")


class MessageCreate(MessageBase):
    conversation_id: int = Field(..., description="ID của cuộc hội thoại")


class MessageResponse(MessageBase):
    id: int
    conversation_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    title: str = Field(default="New Chat", description="Tiêu đề cuộc hội thoại")


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(None, description="Tiêu đề cuộc hội thoại mới")


class ConversationResponse(ConversationBase):
    id: int
    user_id: int
    is_deleted: int
    is_archived: int
    created_at: datetime
    updated_at: Optional[datetime]
    messages: List[MessageResponse] = []

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """Response khi liệt kê các cuộc hội thoại (không kèm messages)"""
    id: int
    title: str
    user_id: int
    is_deleted: int
    is_archived: int
    created_at: datetime
    updated_at: Optional[datetime]
    message_count: int = 0
    last_message: Optional[str] = None

    class Config:
        from_attributes = True


class CreateConversationWithMessageRequest(BaseModel):
    """Request để tạo conversation mới kèm message đầu tiên"""
    title: Optional[str] = Field(None, description="Tiêu đề (tự động tạo nếu không cung cấp)")
    query: str = Field(..., description="Câu hỏi đầu tiên của user")
    collection_name: str = Field(..., description="Tên collection cần tìm kiếm")
    limit: int = Field(default=5, description="Số lượng đoạn văn tối đa dùng làm ngữ cảnh")
    use_reranker: bool = Field(default=True, description="Sử dụng Reranker")
    rerank_top_k: int = Field(default=50, description="Số lượng kết quả lấy từ Qdrant để đưa vào Reranker")
    score_threshold: Optional[float] = Field(default=None, description="Ngưỡng loại bỏ rác")
    use_bm25: bool = Field(default=True, description="Sử dụng BM25 để tìm kiếm keyword")
    bm25_top_k: int = Field(default=30, description="Số kết quả lấy từ BM25 để merge")
    bm25_weight: float = Field(default=0.3, ge=0.0, le=1.0, description="Trọng số BM25 khi merge với vector search")
    reflection_enabled: bool = Field(default=True, description="Bật/tắt query reflection")
    reflection_max_history: int = Field(default=20, description="Số tin nhắn gần nhất đưa vào reflection")
    conversation_history_enabled: bool = Field(default=True, description="Bật/tắt lịch sử hội thoại")
    conversation_history_max_messages: int = Field(default=10, description="Số tin nhắn lịch sử đưa vào LLM")
    conversation_history_include_system: bool = Field(default=True, description="Đưa system prompt vào mỗi turn")
    system_prompt: Optional[str] = Field(None, description="System prompt tùy chỉnh")


class AddMessageRequest(BaseModel):
    """Request để thêm message vào cuộc hội thoại và nhận streaming response"""
    query: str = Field(..., description="Câu hỏi của user")
    collection_name: str = Field(..., description="Tên collection cần tìm kiếm")
    limit: int = Field(default=5, description="Số lượng đoạn văn tối đa dùng làm ngữ cảnh")
    use_reranker: bool = Field(default=True, description="Sử dụng Reranker")
    rerank_top_k: int = Field(default=50, description="Số lượng kết quả lấy từ Qdrant để đưa vào Reranker")
    score_threshold: Optional[float] = Field(default=None, description="Ngưỡng loại bỏ rác")
    use_bm25: bool = Field(default=True, description="Sử dụng BM25 để tìm kiếm keyword")
    bm25_top_k: int = Field(default=30, description="Số kết quả lấy từ BM25 để merge")
    bm25_weight: float = Field(default=0.3, ge=0.0, le=1.0, description="Trọng số BM25 khi merge với vector search")
    reflection_enabled: bool = Field(default=True, description="Bật/tắt query reflection")
    reflection_max_history: int = Field(default=20, description="Số tin nhắn gần nhất đưa vào reflection")
    conversation_history_enabled: bool = Field(default=True, description="Bật/tắt lịch sử hội thoại")
    conversation_history_max_messages: int = Field(default=10, description="Số tin nhắn lịch sử đưa vào LLM")
    conversation_history_include_system: bool = Field(default=True, description="Đưa system prompt vào mỗi turn")
    system_prompt: Optional[str] = Field(None, description="System prompt tùy chỉnh")
