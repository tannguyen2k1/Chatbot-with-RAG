"""
BM25 Service - Keyword-based retrieval complement to vector search.

BM25 (Best Matching 25) là thuật toán xếp hạng tài liệu bằng keyword,
hoạt động tốt với exact keyword match và Vietnamese tokenization.

Dùng để:
- Cải thiện recall: bắt documents chứa exact keywords mà vector search có thể miss
- Hybrid search: kết hợp BM25 score với vector similarity score
- Pre-ranking: lọc top-K candidates trước khi đưa vào reranker
"""

import logging
import re
import unicodedata
from typing import Any

from rank_bm25 import BM25Okapi

logger = logging.getLogger(__name__)


def _normalize_vi(text: str) -> str:
    """Chuẩn hóa text cho BM25: lowercase + Vietnamese-friendly tokenization."""
    text = unicodedata.normalize("NFD", str(text).strip())
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
    text = text.lower()
    text = re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
    text = re.sub(r"[_\-]+", " ", text)
    text = re.sub(r"(\d)([a-z])", r"\1 \2", text)
    text = re.sub(r"([a-z])(\d)", r"\1 \2", text)
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


class BM25Service:
    """
    BM25 index cho một collection.

    Index được build từ documents được cung cấp.
    Lưu ý: BM25 index nằm trong memory; rebuild khi cần.
    """

    def __init__(self, collection_name: str):
        self.collection_name = collection_name
        self._index: BM25Okapi | None = None
        self._corpus: list[str] = []
        self._corpus_ids: list[str | int] = []
        self._payloads: list[dict[str, Any]] = []
        self._built = False

    @property
    def is_built(self) -> bool:
        return self._built

    def build(
        self,
        texts: list[str],
        ids: list[str | int],
        payloads: list[dict[str, Any]],
    ) -> None:
        """Build BM25 index từ corpus."""
        if not texts:
            self._index = None
            self._built = False
            return

        self._corpus = texts
        self._corpus_ids = ids
        self._payloads = payloads

        tokenized_corpus = [_normalize_vi(t).split() for t in texts]
        self._index = BM25Okapi(tokenized_corpus)
        self._built = True
        logger.info(
            f"[BM25] Built index for '{self.collection_name}': "
            f"{len(texts)} documents"
        )

    def search(
        self,
        query: str,
        top_k: int = 50,
        score_threshold: float | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search BM25 index.

        Args:
            query: Câu hỏi / query string
            top_k: Số kết quả trả về tối đa
            score_threshold: Ngưỡng BM25 score tối thiểu

        Returns:
            List of dicts với id, score, payload
        """
        if not self._built or self._index is None:
            return []

        tokens = _normalize_vi(query).split()
        if not tokens:
            return []

        scores = self._index.get_scores(tokens)

        results = []
        for idx, score in enumerate(scores):
            if score <= 0:
                continue
            if score_threshold is not None and score < score_threshold:
                continue
            results.append(
                {
                    "id": self._corpus_ids[idx],
                    "score": float(score),
                    "payload": self._payloads[idx],
                }
            )

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def invalidate(self) -> None:
        """Đánh dấu index cần rebuild."""
        self._built = False
        self._index = None
        self._corpus = []
        self._corpus_ids = []
        self._payloads = []


# --- Global registry: một BM25Service instance per collection ---

_bm25_registry: dict[str, BM25Service] = {}


def get_bm25_service(collection_name: str) -> BM25Service:
    """Lấy hoặc tạo BM25Service cho một collection."""
    if collection_name not in _bm25_registry:
        _bm25_registry[collection_name] = BM25Service(collection_name)
    return _bm25_registry[collection_name]


def invalidate_bm25(collection_name: str) -> None:
    """Invalidate BM25 index khi collection thay đổi (upsert/delete)."""
    if collection_name in _bm25_registry:
        _bm25_registry[collection_name].invalidate()
