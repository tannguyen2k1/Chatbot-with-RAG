from enum import StrEnum

from pydantic import field_validator
from pydantic_settings import BaseSettings


class OrderStatus(StrEnum):
    pending = "pending"
    cancelled = "cancelled"
    completed = "completed"


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    JWT_SECRET_KEY: str = ""
    JWT_REFRESH_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080
    CORS_ALLOW_ORIGINS: str = "https://vtms.localhost,http://localhost:3000,http://127.0.0.1:3000,http://localhost,capacitor://localhost,ionic://localhost,null"
    CORS_ALLOW_ORIGIN_REGEX: str = r"^(null|https?://([a-zA-Z0-9-]+\.)?(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?|(capacitor|ionic|file)://.*)$"
    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: str = "lax"
    REFRESH_COOKIE_PATH: str = "/"
    REFRESH_COOKIE_DOMAIN: str | None = None

    @field_validator("REFRESH_COOKIE_DOMAIN", mode="before")
    @classmethod
    def empty_cookie_domain_as_none(cls, value):
        if value is None:
            return None
        if isinstance(value, str) and not value.strip():
            return None
        return value

    # Qdrant Vector Database
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_GRPC_PORT: int = 6334

    # Embedding Model
    EMBEDDING_PROVIDER: str = "gemini"
    EMBEDDING_USE_FLASH_ATTENTION: bool = False

    # Reranker Model
    RERANKER_MODEL_NAME: str = "rerank-multilingual-v3.0"
    COHERE_API_KEY: str | None = None
    RERANKER_MIN_TOKENS: int = 20
    RERANKER_MIN_CANDIDATES: int = 3
    CHUNK_MIN_TOKENS_TO_MERGE: int = 40

    # NER Model (Vietnamese Named Entity Recognition)
    NER_MODEL_NAME: str = "NlpHUST/ner-vietnamese-electra-base"

    # LLM Settings - Strategy Pattern
    LLM_PROVIDER: str = "gemini"  # "mistral" | "deepseek" | "gemini"

    # Mistral
    MISTRAL_API_KEY: str | None = None
    MISTRAL_MODEL_NAME: str = "mistral-large-latest"
    MISTRAL_EMBEDDING_MODEL:str="mistral-embed"

    # DeepSeek
    DEEPSEEK_API_KEY: str | None = None
    DEEPSEEK_MODEL_NAME: str = "deepseek-chat"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"

    # Gemini
    GEMINI_API_KEY: str | None = None
    GEMINI_CHAT_MODEL: str = "gemini-2.5-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    GEMINI_BASE_URL: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    @property
    def llm_model_name(self) -> str:
        match self.LLM_PROVIDER:
            case "mistral":
                return self.MISTRAL_MODEL_NAME
            case "deepseek":
                return self.DEEPSEEK_MODEL_NAME
            case "gemini":
                return self.GEMINI_CHAT_MODEL
            case _:
                raise ValueError(
                    f"LLM_PROVIDER không hợp lệ: '{self.LLM_PROVIDER}'. Chỉ hỗ trợ 'mistral', 'deepseek', 'gemini'."
                )

    # Chat System Prompt
    CHAT_SYSTEM_PROMPT: str = """Bạn là chatbot hỗ trợ sinh viên Trường Đại học Giao thông Vận tải (UTC).
Chỉ trả lời dựa trên tài liệu được cung cấp dưới đây. Nếu không đủ thông tin, hãy nói rõ không tìm thấy — TUYỆT ĐỐI KHÔNG bịa.
Trả lời bằng tiếng Việt, ngắn gọn. KHÔNG ghi [Tài liệu 1], [Tài liệu 2] trong câu trả lời.

[TÀI LIỆU CUNG CẤP]:
{context}

[CÂU HỎI]:
{query}

Câu trả lời của bạn:"""

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [x.strip() for x in self.CORS_ALLOW_ORIGINS.split(",") if x.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
