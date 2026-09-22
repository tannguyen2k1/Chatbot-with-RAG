"""
Embedding Service - Qwen3 Embedding Model

Sử dụng Qwen3-Embedding-0.6B qua sentence-transformers để:
- Encode text thành vector embeddings
- Dùng nội bộ cho upsert points (text -> vector -> Qdrant)
"""

import logging
from typing import Optional

from config.settings import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service quản lý Qwen3 embedding model (Singleton)"""

    _instance: Optional["EmbeddingService"] = None
    _model = None  # Lazy loaded

    def __init__(self):
        pass

    @classmethod
    def get_instance(cls) -> "EmbeddingService":
        """Singleton pattern - chỉ tạo 1 instance duy nhất"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_model(self):
        """No local model to load for Mistral API"""

    @property
    def model(self):
        return None

    @property
    def vector_dimension(self) -> int:
        """Trả về kích thước vector của model (gemini = 768, mistral = 1024)"""
        if settings.EMBEDDING_PROVIDER == "gemini":
            return 768
        return 1024

    def encode_texts(
        self,
        texts: list[str],
        is_query: bool = False,
        normalize: bool = True,
    ) -> list[list[float]]:
        """
        Encode texts thành vectors.
        """
        import httpx

        provider = settings.EMBEDDING_PROVIDER
        
        if provider == "gemini":
            from openai import OpenAI
            api_key = settings.GEMINI_API_KEY
            if not api_key:
                raise ValueError("GEMINI_API_KEY is not set in environment variables.")
            
            client = OpenAI(
                api_key=api_key,
                base_url=settings.GEMINI_BASE_URL,
            )
            try:
                response = client.embeddings.create(
                    input=texts,
                    model=settings.GEMINI_EMBEDDING_MODEL,
                    dimensions=768
                )
                embeddings = [item.embedding for item in response.data]
                return embeddings
            except Exception as e:
                logger.error(f"Error calling Gemini Embedding API: {e}")
                raise

        elif provider == "mistral":
            api_key = settings.MISTRAL_API_KEY
            if not api_key:
                raise ValueError("MISTRAL_API_KEY is not set in environment variables.")

            payload = {"model": settings.MISTRAL_EMBEDDING_MODEL, "input": texts}

            try:
                with httpx.Client() as client:
                    response = client.post(
                        "https://api.mistral.ai/v1/embeddings",
                        headers={"Authorization": f"Bearer {api_key}"},
                        json=payload,
                        timeout=30.0,
                    )
                    response.raise_for_status()
                    data = response.json()
                    embeddings = [item["embedding"] for item in data["data"]]
                    return embeddings
            except Exception as e:
                logger.error(f"Error calling Mistral Embedding API: {e}")
                raise
        else:
            raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {provider}")

    def encode_single(
        self,
        text: str,
        is_query: bool = False,
        normalize: bool = True,
    ) -> list[float]:
        """Encode 1 text thành vector"""
        return self.encode_texts([text], is_query=is_query, normalize=normalize)[0]


def get_embedding_service() -> EmbeddingService:
    """Dependency injection cho FastAPI"""
    return EmbeddingService.get_instance()
