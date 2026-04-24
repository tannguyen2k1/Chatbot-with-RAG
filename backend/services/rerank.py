import logging
import re
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional

import torch

from config.settings import settings
from schemas.vector import SearchResult

logger = logging.getLogger(__name__)

# Boost toi da chi nen la 10-15% score range cua cross-encoder
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

        documents = []
        for _, res in candidates:
            documents.append(self._build_rerank_document(res.payload))

        rankings = self.rerank(query, documents, top_k=top_k)

        reranked = []
        for rank in rankings:
            score = float(rank["score"])

            _, original_res = candidates[rank["corpus_id"]]
            heading = original_res.payload.get("heading", "")
            text = original_res.payload.get("_text", "")
            entity = self._payload_entity(original_res.payload)

            boost = self._coverage_boost(query, entity, heading, text)
            final_score = score + boost

            if score_threshold is not None and final_score < score_threshold:
                continue

            original_res.score = final_score
            reranked.append(original_res)

        return sorted(reranked, key=lambda r: r.score, reverse=True)

    def _coverage_boost(self, query: str, entity: str, heading: str, text: str) -> float:
        norm_query = self._normalize_text(query)
        norm_doc = self._normalize_text(f"{entity} {heading} {text}")

        query_tokens = set(self._tokenize(norm_query))
        doc_tokens = set(self._tokenize(norm_doc))

        if not query_tokens:
            return 0.0

        coverage = len(query_tokens & doc_tokens) / len(query_tokens)
        boost = coverage * 0.8

        if self._is_noisy_heading(heading):
            boost -= 0.5

        norm_context = self._normalize_text(f"{entity} {heading}")
        context_tokens = set(self._tokenize(norm_context))
        context_overlap = len(query_tokens & context_tokens) / len(query_tokens)
        boost += context_overlap * 0.5

        return max(MIN_BOOST, min(MAX_BOOST, boost))

    def _is_noisy_heading(self, heading: str) -> bool:
        h = heading.strip()
        if not h:
            return True
        if any(c in h for c in ('"', "'", "“", "”")):
            return True
        if len(h.split()) > 10:
            return True
        if h.endswith(",") or h.endswith(";"):
            return True
        return False

    def _tokenize(self, normalized_text: str) -> list[str]:
        return [t for t in normalized_text.split() if len(t) > 1]

    def _payload_entity(self, payload: dict[str, Any]) -> str:
        filename = (payload.get("filename") or "").strip()
        if not filename:
            return ""

        stem = Path(filename).stem
        stem = re.sub(r"[-_.\\]+", " ", stem)
        return re.sub(r"\s+", " ", stem).strip()

    def _build_rerank_document(self, payload: dict[str, Any]) -> str:
        entity = self._payload_entity(payload)
        heading = (payload.get("heading") or "").strip()
        text = payload.get("_text", "")

        prefix_parts = []
        if entity:
            prefix_parts.append(entity)
        if heading:
            prefix_parts.append(heading)

        prefix = " - ".join(prefix_parts)
        return f"[{prefix}]\n{text}" if prefix else text

    def _normalize_text(self, text: str) -> str:
        text = unicodedata.normalize("NFD", text or "")
        text = "".join(ch for ch in text if unicodedata.category(ch) != "Mn")
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        return re.sub(r"\s+", " ", text).strip()


rerank_service = RerankService()


def get_rerank_service() -> RerankService:
    return rerank_service
