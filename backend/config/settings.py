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
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 10080
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

    # NER Model (Vietnamese Named Entity Recognition)
    NER_MODEL_NAME: str = "NlpHUST/ner-vietnamese-electra-base"

    # LLM Settings - Strategy Pattern
    LLM_PROVIDER: str = "mistral"  # "mistral" | "deepseek"

    # Mistral
    MISTRAL_API_KEY: Optional[str] = None
    MISTRAL_MODEL_NAME: str = "mistral-large-latest"

    # DeepSeek
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_MODEL_NAME: str = "deepseek-chat"
    DEEPSEEK_BASE_URL: str = "https://api.deepseek.com"

    @property
    def llm_model_name(self) -> str:
        match self.LLM_PROVIDER:
            case "mistral":
                return self.MISTRAL_MODEL_NAME
            case "deepseek":
                return self.DEEPSEEK_MODEL_NAME
            case _:
                raise ValueError(f"LLM_PROVIDER không hợp lệ: '{self.LLM_PROVIDER}'. Chỉ hỗ trợ 'mistral' hoặc 'deepseek'.")

    # Chat System Prompt
    CHAT_SYSTEM_PROMPT: str = """Bạn là một trợ lý AI thông minh chuyên phân tích tài liệu.

QUY TẮC:
1. Chỉ trả lời DỰA TRÊN tài liệu được cung cấp bên dưới.
2. Sau mỗi câu trả lời có thông tin từ tài liệu, phải trích dẫn nguồn bằng [Tài liệu N].
3. Nếu tài liệu có thông tin nhưng không đầy đủ, hãy trả lời những gì có và nói rõ "Theo tài liệu...".
4. Nếu tài liệu KHÔNG chứa thông tin, nói "Tôi không tìm thấy thông tin này trong tài liệu." TUYỆT ĐỐI KHÔNG bịa.
5. Nếu câu hỏi không liên quan đến tài liệu, trả lời bằng kiến thức của bạn và ghi chú rõ.

[TÀI LIỆU CUNG CẤP]:
{context}

[CÂU HỎI]:
{query}

Trả lời (kèm trích dẫn [Tài liệu N]):"""

    @property
    def cors_allow_origins_list(self) -> list[str]:
        return [x.strip() for x in self.CORS_ALLOW_ORIGINS.split(",") if x.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
