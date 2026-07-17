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
        pass

    @property
    def model(self):
        return None

    @property
    def vector_dimension(self) -> int:
        """Trả về kích thước vector của model (mistral-embed = 1024)"""
        return 1024

    def encode_texts(
        self,
        texts: list[str],
        is_query: bool = False,
        normalize: bool = True,
    ) -> list[list[float]]:
        """
        Encode texts thành vectors.

        Args:
            texts: Danh sách text cần encode
            is_query: True = query mode (có prompt prefix), False = document mode
            normalize: Chuẩn hóa vector (khuyến nghị True cho cosine similarity)
        """
        import httpx
        
        api_key = settings.MISTRAL_API_KEY
        if not api_key:
            raise ValueError("MISTRAL_API_KEY is not set in environment variables.")

        # Batch requests if needed, but for now just send directly
        # Mistral API limit is usually high enough, but we should handle it
        payload = {
            "model": settings.EMBEDDING_MODEL_NAME,
            "input": texts
        }
        
        try:
            # Using sync httpx for compatibility with existing synchronous flow
            with httpx.Client() as client:
                response = client.post(
                    "https://api.mistral.ai/v1/embeddings",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json=payload,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                # Mistral returns data in the same order as input
                embeddings = [item["embedding"] for item in data["data"]]
                return embeddings
        except Exception as e:
            logger.error(f"Error calling Mistral Embedding API: {e}")
            raise

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
