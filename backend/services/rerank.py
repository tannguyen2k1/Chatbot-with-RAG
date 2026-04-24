import logging
import re
import unicodedata
from functools import cached_property
from pathlib import Path
from typing import List, Dict, Any, Optional

import torch
from config.settings import settings
from schemas.vector import SearchResult

logger = logging.getLogger(__name__)

STOPWORDS_FILE = (
    Path(__file__).resolve().parents[1] / "assets" / "vietnamese-stopwords.txt"
)

# Boost tối đa chỉ nên là 10-15% score range của cross-encoder
MAX_BOOST = 1.5
MIN_BOOST = -1.5


class RerankService:
    def __init__(self, model_name: Optional[str] = None):
        self.model_name = model_name or settings.RERANKER_MODEL_NAME
        self.model = None

    def _load_model(self):
        if self.model is None:
            logger.info(f"Loading reranker model {self.model_name}...")
            try:
                from sentence_transformers import CrossEncoder

                device = "cuda" if torch.cuda.is_available() else "cpu"
                self.model = CrossEncoder(self.model_name, device=device)
                logger.info(f"Loaded on {device}.")
            except Exception as e:
                logger.error(f"Failed to load reranker: {e}")
                raise

    def rerank(
        self,
        query: str,
        documents: List[str],
        top_k: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        if not documents:
            return []
        self._load_model()
        return self.model.rank(query, documents, return_documents=False, top_k=top_k)

    def rerank_results(
        self,
        query: str,
        results: List[SearchResult],
        top_k: int,
        score_threshold: Optional[float] = None,
    ) -> List[SearchResult]:
        if not results:
            return []

        min_tokens = getattr(settings, "RERANKER_MIN_TOKENS", 20)
        min_candidates = getattr(settings, "RERANKER_MIN_CANDIDATES", 3)

        candidates = [
            (idx, res)
            for idx, res in enumerate(results)
            if res.payload.get("token_estimate", 0) >= min_tokens
        ]
        if len(candidates) < min_candidates:
            candidates = list(enumerate(results))

        # Prepend heading tại đây — không phụ thuộc vào chunking service
        documents = []
        for _, res in candidates:
            heading = res.payload.get("heading", "").strip()
            text = res.payload.get("_text", "")
            documents.append(f"[{heading}]\n{text}" if heading else text)

        rankings = self.rerank(query, documents, top_k=top_k)

        reranked = []
        for rank in rankings:
            score = float(rank["score"])

            _, original_res = candidates[rank["corpus_id"]]
            heading = original_res.payload.get("heading", "")
            text = original_res.payload.get("_text", "")

            boost = self._coverage_boost(query, heading, text)
            final_score = score + boost
            
            # Lọc bằng final_score (đã cộng boost)
            if score_threshold is not None and final_score < score_threshold:
                continue

            original_res.score = final_score
            reranked.append(original_res)

        return sorted(reranked, key=lambda r: r.score, reverse=True)

    def _coverage_boost(self, query: str, heading: str, text: str) -> float:
        """
        Boost nhỏ dựa trên token overlap và chất lượng heading.
        Không chứa domain-specific logic.
        Clamp trong [-1.5, +1.5] để không override cross-encoder score.
        """
        norm_query = self._normalize_text(query)
        norm_doc = self._normalize_text(f"{heading} {text}")

        query_tokens = set(self._tokenize(norm_query))
        doc_tokens = set(self._tokenize(norm_doc))

        if not query_tokens:
            return 0.0

        coverage = len(query_tokens & doc_tokens) / len(query_tokens)
        boost = coverage * 0.8  # tối đa +0.8 từ coverage

        # Penalty nhẹ nếu heading rõ ràng là noise (không phải chữ hoa đầu câu)
        if self._is_noisy_heading(heading):
            boost -= 0.5

        # Bonus nhẹ nếu heading khớp từ khóa query
        norm_heading = self._normalize_text(heading)
        heading_tokens = set(self._tokenize(norm_heading))
        heading_overlap = len(query_tokens & heading_tokens) / len(query_tokens)
        boost += heading_overlap * 0.5  # tối đa +0.5 từ heading match

        return max(MIN_BOOST, min(MAX_BOOST, boost))

    def _is_noisy_heading(self, heading: str) -> bool:
        """Heading noise detection không hardcode domain."""
        h = heading.strip()
        if not h:
            return True
        # Có dấu nháy kép (thường là đoạn bị parse sai thành heading)
        if any(c in h for c in ('"', '"', '"', "'")):
            return True
        # Quá dài — chắc chắn là paragraph bị nhận nhầm
        if len(h.split()) > 10:
            return True
        # Kết thúc bằng dấu câu giữa câu
        if h.endswith(",") or h.endswith(";"):
            return True
        return False

    def _tokenize(self, normalized_text: str) -> list[str]:
        stopwords = self._stopwords
        return [t for t in normalized_text.split() if len(t) > 1 and t not in stopwords]

    def _normalize_text(self, text: str) -> str:
        text = unicodedata.normalize("NFD", text or "")
        text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        return re.sub(r"\s+", " ", text).strip()

    @cached_property  # fix memory leak — cache một lần, không giữ self
    def _stopwords(self) -> frozenset[str]:
        if not STOPWORDS_FILE.exists():
            return frozenset()
        return frozenset(
            normalized
            for line in STOPWORDS_FILE.read_text(encoding="utf-8").splitlines()
            if (normalized := self._normalize_text(line))
        )


rerank_service = RerankService()


def get_rerank_service() -> RerankService:
    return rerank_service
