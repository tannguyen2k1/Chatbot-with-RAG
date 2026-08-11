from pydantic import BaseModel, Field


class ConfigBase(BaseModel):
    key: str = Field(..., description="Khóa cấu hình, duy nhất")
    value: str | None = Field(None, description="Giá trị cấu hình")
    description: str | None = Field(None, description="Mô tả")
    group_name: str | None = Field(None, description="Nhóm cấu hình (ví dụ: chat, email, system)")
    is_system: bool = Field(default=False, description="Cấu hình hệ thống, không cho sửa/xóa")


class ConfigCreate(ConfigBase):
    pass


class ConfigUpdate(BaseModel):
    value: str | None = None
    description: str | None = None
    group_name: str | None = None


class ChatConfigUpdate(BaseModel):
    collection_name: str | None = None
    limit: int | None = None
    use_reranker: bool | None = None
    rerank_top_k: int | None = None
    use_bm25: bool | None = None
    bm25_top_k: int | None = None
    bm25_weight: float | None = None
    system_prompt: str | None = None
    reflection_enabled: bool | None = None
    reflection_max_history: int | None = None
    conversation_history_enabled: bool | None = None
    conversation_history_max_messages: int | None = None
    conversation_history_include_system: bool | None = None


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
    theme: str | None = None
    language: str | None = None
    font_size: str | None = None


class ConfigResponse(ConfigBase):
    id: int
    created_at: str
    updated_at: str | None

    class Config:
        from_attributes = True
