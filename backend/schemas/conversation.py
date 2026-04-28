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


class AddMessageRequest(BaseModel):
    """Request để thêm message vào cuộc hội thoại và nhận streaming response"""
    query: str = Field(..., description="Câu hỏi của user")
    collection_name: str = Field(..., description="Tên collection cần tìm kiếm")
    limit: int = Field(default=5, description="Số lượng đoạn văn tối đa dùng làm ngữ cảnh")
    use_reranker: bool = Field(default=True, description="Sử dụng Reranker")
    rerank_top_k: int = Field(default=50, description="Số lượng kết quả lấy từ Qdrant để đưa vào Reranker")
    score_threshold: Optional[float] = Field(default=None, description="Ngưỡng loại bỏ rác")
