"""
NER Service - Vietnamese Named Entity Recognition

Sử dụng NlpHUST/ner-vietnamese-electra-base để extract entities ở chunk-level:
- PER: Person names
- ORG: Organization names
- LOC: Location names

Được pre-load tại startup giống Embedding/Reranker.
"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Entity types to extract (filter out MISC - too noisy)
TARGET_ENTITIES = {"PER", "ORG", "LOC"}


class NERService:
    """Singleton NER service dùng NlpHUST/ner-vietnamese-electra-base."""

    _instance: Optional["NERService"] = None

    def __init__(self, model_name: str = "NlpHUST/ner-vietnamese-electra-base"):
        self.model_name = model_name
        self._pipeline = None

    @classmethod
    def get_instance(cls) -> "NERService":
        if cls._instance is None:
            from config.settings import settings
            model_name = settings.NER_MODEL_NAME
            cls._instance = cls(model_name)
        return cls._instance

    def _load_model(self):
        """Stubbed out due to removal of local ML dependencies."""
        pass

    @property
    def pipeline(self):
        return None

    def extract_entities(self, text: str) -> list[dict]:
        """
        Trích xuất entities từ text.

        Args:
            text: Chuỗi text cần extract entities.

        Returns:
            List of entity dicts với keys: word, entity_group, score, start, end
            VD: [{"word": "VIETCIS", "entity_group": "ORG", "score": 0.99, "start": 0, "end": 7}]
        """
        if not text or not text.strip() or self.pipeline is None:
            return []

        try:
            results = self.pipeline(text)
            filtered = [
                {
                    "word": r["word"],
                    "entity_group": r["entity_group"],
                    "score": float(r["score"]),
                    "start": r["start"],
                    "end": r["end"],
                }
                for r in results
                if r["entity_group"] in TARGET_ENTITIES
            ]
            return filtered
        except Exception as e:
            logger.warning(f"[NER] Extraction failed: {e}")
            return []

    def extract_entity_texts(self, text: str) -> list[str]:
        """
        Trích xuất chỉ danh sách entity text (không có group/score).

        Args:
            text: Chuỗi text cần extract.

        Returns:
            List of unique entity texts.
            VD: ["VIETCIS", "Nguyễn Văn A", "Hà Nội"]
        """
        entities = self.extract_entities(text)
        seen = set()
        unique = []
        for e in entities:
            if e["word"] not in seen:
                seen.add(e["word"])
                unique.append(e["word"])
        return unique

    def extract_entity_names(self, text: str) -> list[str]:
        """
        Trích xuất entity names dạng clean, phù hợp làm prefix.

        Giữ nguyên capitalization, loại bỏ special chars.
        """
        entities = self.extract_entities(text)
        seen = set()
        names = []
        for e in entities:
            word = e["word"].strip()
            if word and word not in seen:
                seen.add(word)
                names.append(word)
        return names


def get_ner_service() -> NERService:
    """Dependency injection cho FastAPI."""
    return NERService.get_instance()
