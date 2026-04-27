from enum import Enum
from pydantic_settings import BaseSettings
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    # Type hints for development, không ảnh hưởng runtime
    pass


class OrderStatus(str, Enum):
    pending = "pending"
    cancelled = "cancelled"
    completed = "completed"


class Settings(BaseSettings):
    DATABASE_URL: str = ""
    JWT_SECRET_KEY: str = ""
    JWT_REFRESH_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10000000
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10000000
    CORS_ALLOW_ORIGINS: str = "https://vtms.localhost,http://localhost:3000,http://127.0.0.1:3000,http://localhost,capacitor://localhost,ionic://localhost,null"
    CORS_ALLOW_ORIGIN_REGEX: str = r"^(null|https?://([a-zA-Z0-9-]+\.)?(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+)(:\d+)?|(capacitor|ionic|file)://.*)$"
    REFRESH_COOKIE_NAME: str = "refresh_token"
    REFRESH_COOKIE_SECURE: bool = False
    REFRESH_COOKIE_SAMESITE: str = "lax"
    REFRESH_COOKIE_PATH: str = "/"
    REFRESH_COOKIE_DOMAIN: Optional[str] = None

    # Qdrant Vector Database
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_GRPC_PORT: int = 6334

    # Embedding Model (Qwen3)
    EMBEDDING_MODEL_NAME: str = "Qwen/Qwen3-Embedding-0.6B"
    EMBEDDING_USE_FLASH_ATTENTION: bool = False

    # Reranker Model
    RERANKER_MODEL_NAME: str = "Qwen/Qwen3-Reranker-0.6B"
    RERANKER_MIN_TOKENS: int = 20
    RERANKER_MIN_CANDIDATES: int = 3
    CHUNK_MIN_TOKENS_TO_MERGE: int = 40

    # LLM Settings
    MISTRAL_API_KEY: Optional[str] = None

    # Chat System Prompt
    CHAT_SYSTEM_PROMPT: str = """Bạn là một trợ lý AI thông minh.
            Dựa vào các tài liệu cung cấp dưới đây, hãy trả lời câu hỏi của người dùng một cách chính xác.
            Nếu tài liệu không chứa thông tin để trả lời, hãy nói thẳng là "Tôi không có thông tin", TUYỆT ĐỐI KHÔNG được tự bịa ra câu trả lời.
            [TÀI LIỆU CUNG CẤP]:
            {context}
            [CÂU HỎI CỦA NGƯỜI DÙNG]:
            {query}
            Câu trả lời của bạn:"""

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [x.strip() for x in self.CORS_ALLOW_ORIGINS.split(",") if x.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
