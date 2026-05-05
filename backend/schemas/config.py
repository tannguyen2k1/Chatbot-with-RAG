from pydantic import BaseModel, Field
from typing import Optional


class ConfigBase(BaseModel):
    key: str = Field(..., description="Khóa cấu hình, duy nhất")
    value: Optional[str] = Field(None, description="Giá trị cấu hình")
    description: Optional[str] = Field(None, description="Mô tả")
    group_name: Optional[str] = Field(None, description="Nhóm cấu hình (ví dụ: chat, email, system)")
    is_system: bool = Field(default=False, description="Cấu hình hệ thống, không cho sửa/xóa")


class ConfigCreate(ConfigBase):
    pass


class ConfigUpdate(BaseModel):
    value: Optional[str] = None
    description: Optional[str] = None
    group_name: Optional[str] = None


class ChatConfigUpdate(BaseModel):
    collection_name: Optional[str] = None
    limit: Optional[int] = None
    use_reranker: Optional[bool] = None
    rerank_top_k: Optional[int] = None
    use_bm25: Optional[bool] = None
    bm25_top_k: Optional[int] = None
    bm25_weight: Optional[float] = None
    system_prompt: Optional[str] = None
    reflection_enabled: Optional[bool] = None
    reflection_max_history: Optional[int] = None
    conversation_history_enabled: Optional[bool] = None
    conversation_history_max_messages: Optional[int] = None
    conversation_history_include_system: Optional[bool] = None


class ChatConfigResponse(BaseModel):
    collection_name: str
    limit: int
    use_reranker: bool
    rerank_top_k: int
    use_bm25: bool
    bm25_top_k: int
    bm25_weight: float
    system_prompt: str
    reflection_enabled: bool
    reflection_max_history: int
    conversation_history_enabled: bool
    conversation_history_max_messages: int
    conversation_history_include_system: bool


class GeneralConfigUpdate(BaseModel):
    theme: Optional[str] = None
    language: Optional[str] = None
    font_size: Optional[str] = None


class ConfigResponse(ConfigBase):
    id: int
    tenant_id: Optional[int]
    created_at: str
    updated_at: Optional[str]

    class Config:
        from_attributes = True
