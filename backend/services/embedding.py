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
        """Lazy load model - chỉ load khi cần lần đầu"""
        if self._model is None:
            # Lazy import để tránh crash nếu chưa cài sentence-transformers
            from sentence_transformers import SentenceTransformer

            model_name = settings.EMBEDDING_MODEL_NAME
            logger.info(f"Loading embedding model: {model_name}...")

            model_kwargs = {}
            processor_kwargs = {}

            if settings.EMBEDDING_USE_FLASH_ATTENTION:
                model_kwargs["attn_implementation"] = "flash_attention_2"
                model_kwargs["device_map"] = "auto"
                processor_kwargs["padding_side"] = "left"

            EmbeddingService._model = SentenceTransformer(
                model_name,
                model_kwargs=model_kwargs if model_kwargs else None,
                processor_kwargs=processor_kwargs if processor_kwargs else None,
                trust_remote_code=True,
            )
            logger.info(
                f"Embedding model loaded. "
                f"Dimension: {self._model.get_sentence_embedding_dimension()}"
            )

        return self._model

    @property
    def model(self):
        return self._load_model()

    @property
    def vector_dimension(self) -> int:
        """Trả về kích thước vector của model"""
        return self.model.get_sentence_embedding_dimension()

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
        kwargs = {"normalize_embeddings": normalize}
        if is_query:
            kwargs["prompt_name"] = "query"

        embeddings = self.model.encode(texts, **kwargs)
        return embeddings.tolist()

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
