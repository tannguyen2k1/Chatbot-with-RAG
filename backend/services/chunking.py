import hashlib
import re
import unicodedata
from collections import Counter
from pathlib import Path
from typing import List, Dict, Any, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter
from rapidfuzz import fuzz, process
from config.settings import settings

URL_PATTERN = re.compile(r'^(https?://|www\.)\S+$', re.IGNORECASE)
SEPARATOR_PATTERN = re.compile(r'[-_=\.*~]{4,}')
WORD_PATTERN = re.compile(r"[A-Za-zÀ-ỹ]+", re.UNICODE)
OCR_TOKEN_MIN_LEN = 4
OCR_TOKEN_MIN_SCORE = 92
OCR_TOKEN_MIN_FREQ = 2


class ChunkingService:
    def __init__(self, tokenizer=None, chunk_size: int = 8000, chunk_overlap: int = 800):
        if tokenizer:
            self.text_splitter = RecursiveCharacterTextSplitter.from_huggingface_tokenizer(
                tokenizer,
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", ".", "?", "!", " ", ""]
            )
        else:
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=chunk_size,
                chunk_overlap=chunk_overlap,
                separators=["\n\n", "\n", ".", "?", "!", " ", ""]
            )

    def _merge_short_splits(self, splits: List[str], min_tokens: int) -> List[str]:
        merged: List[str] = []
        buffer = ""

        for split in splits:
            current = split.strip()
            if not current:
                continue

            if not buffer:
                buffer = current
                continue

            if len(buffer.split()) < min_tokens:
                buffer = f"{buffer}\n{current}"
                continue

            merged.append(buffer)
            buffer = current

        if buffer:
            if merged and len(buffer.split()) < min_tokens:
                merged[-1] = f"{merged[-1]}\n{buffer}"
            else:
                merged.append(buffer)

        return merged

    def is_garbage_text(self, text: str) -> bool:
        if len(text) < 3:
            return True
        if text.isdigit():
            return True
        if URL_PATTERN.match(text.strip()):
            return True
        if len(text) <= 5 and " " in text:
            return True
        if len(text) > 10 and text.count(" ") / len(text) > 0.4:
            return True
        return False

    def _normalize_ocr_key(self, text: str) -> str:
        normalized = unicodedata.normalize("NFD", text)
        normalized = "".join(ch for ch in normalized if unicodedata.category(ch) != "Mn")
        normalized = normalized.lower()
        normalized = re.sub(r"[^a-z0-9\s]", " ", normalized)
        return re.sub(r"\s+", " ", normalized).strip()

    def _match_token_case(self, source: str, target: str) -> str:
        if source.isupper():
            return target.upper()
        if source[:1].isupper():
            return target[:1].upper() + target[1:]
        return target

    def _build_document_vocabulary(self, parsed_elements: List[Dict[str, Any]]) -> Dict[str, int]:
        token_counts: Counter[str] = Counter()
        for el in parsed_elements:
            raw_text = (el.get("text") or "").strip()
            if not raw_text:
                continue
            cleaned = SEPARATOR_PATTERN.sub("", raw_text)
            cleaned = re.sub(r"\n(?=[a-zà-ỹ])", " ", cleaned, flags=re.IGNORECASE)
            for token in WORD_PATTERN.findall(cleaned):
                normalized = self._normalize_ocr_key(token)
                if len(normalized) < OCR_TOKEN_MIN_LEN:
                    continue
                token_counts[normalized] += 1
        return dict(token_counts)

    def _normalize_ocr_tokens(self, text: str, vocabulary: Dict[str, int]) -> str:
        if not vocabulary:
            return text

        vocabulary_keys = list(vocabulary.keys())

        def replace_token(match: re.Match[str]) -> str:
            source = match.group(0)
            normalized_source = self._normalize_ocr_key(source)
            if len(normalized_source) < OCR_TOKEN_MIN_LEN:
                return source

            source_freq = vocabulary.get(normalized_source, 0)
            if source_freq >= OCR_TOKEN_MIN_FREQ:
                return source

            candidate = process.extractOne(
                normalized_source,
                vocabulary_keys,
                scorer=fuzz.ratio,
                score_cutoff=OCR_TOKEN_MIN_SCORE,
            )
            if not candidate:
                return source

            normalized_target = candidate[0]
            if normalized_target == normalized_source:
                return source

            target_freq = vocabulary.get(normalized_target, 0)
            if target_freq <= source_freq or target_freq < OCR_TOKEN_MIN_FREQ:
                return source

            if normalized_source[0] != normalized_target[0]:
                return source

            corrected = self._match_token_case(source, normalized_target)
            return corrected

        return WORD_PATTERN.sub(replace_token, text)

    def clean_text(self, text: str) -> str:
        return self._clean_text_with_vocabulary(text, {})

    def _clean_text_with_vocabulary(self, text: str, vocabulary: Dict[str, int]) -> str:
        text = SEPARATOR_PATTERN.sub("", text)
        text = re.sub(r"\n(?=[a-zà-ỹ])", " ", text, flags=re.IGNORECASE)
        text = self._normalize_ocr_tokens(text, vocabulary)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r" *\n *", "\n", text)
        return text.strip()

    def _looks_like_heading_text(self, text: str) -> bool:
        stripped = text.strip()
        if not stripped or len(stripped) > 80:
            return False
        if re.search(r'["“”]', stripped) and not stripped.endswith(":"):
            return False
        if stripped.endswith((".", ";", "?", "!")):
            return False

        words = stripped.split()
        if len(words) > 12:
            return False

        alpha_words = [word for word in words if re.search(r"[A-Za-zÀ-ỹ]", word)]
        if not alpha_words:
            return False

        if stripped.isupper():
            return True
        if stripped[0].islower():
            return False

        title_case_words = sum(
            1 for word in alpha_words
            if word[0].isupper() or word.isupper()
        )
        lower_case_words = sum(
            1 for word in alpha_words
            if word[0].islower()
        )

        if stripped.endswith(":"):
            return title_case_words >= max(1, len(alpha_words) // 2) and lower_case_words <= 2

        return title_case_words >= max(1, int(len(alpha_words) * 0.7)) and lower_case_words <= 1

    def _is_title(self, el: dict, text: str) -> bool:
        if el["type"] != "Title":
            if not ((text.isupper() or text.endswith(":")) and 4 <= len(text) <= 80):
                return False
            return self._looks_like_heading_text(text)

        if re.match(r"^(\d{4}|-|\*)", text) or text.endswith(".") or text.endswith(";"):
            return False
        return self._looks_like_heading_text(text)

    def _fallback_entity_name(self, base_metadata: dict) -> str:
        filename = (base_metadata.get("filename") or "").strip()
        if not filename:
            return ""

        stem = Path(filename).stem
        stem = re.sub(r"[-_=\.*~]+", " ", stem)
        return re.sub(r"\s+", " ", stem).strip()

    def _extract_chunk_entities(self, text: str, heading: str = "") -> list[str]:
        """
        Extract entities từ chunk text bằng NER model.

        Ưu tiên ORG > PER > LOC. Truncate text nếu quá dài (> 2000 chars).
        """
        combined = f"{heading} {text}".strip() if heading else text
        if len(combined) > 2000:
            combined = combined[:2000]

        try:
            from services.ner import get_ner_service
            entities = get_ner_service().extract_entity_names(combined)
            return [e for e in entities if len(e) >= 2][:3]
        except Exception:
            return []

    def group_and_chunk(
        self,
        parsed_elements: List[Dict[str, Any]],
        base_metadata: dict,
        min_tokens_to_merge: int = settings.CHUNK_MIN_TOKENS_TO_MERGE,
    ) -> List[Dict[str, Any]]:
        vocabulary = self._build_document_vocabulary(parsed_elements)
        sections = []
        current_heading = ""
        current_content = []

        for el in parsed_elements:
            raw_text = el.get("text", "").strip()
            if not raw_text:
                continue
            text = self._clean_text_with_vocabulary(raw_text, vocabulary)
            if not text or self.is_garbage_text(text):
                continue

            if self._is_title(el, text):
                if current_content:
                    sections.append({"heading": current_heading, "content": "\n".join(current_content)})
                    current_content = []
                current_heading = text
            else:
                current_content.append(text)

        if current_content:
            sections.append({"heading": current_heading, "content": "\n".join(current_content)})

        final_chunks = []
        seen = set()

        for sec in sections:
            splits = self.text_splitter.split_text(sec["content"])
            splits = self._merge_short_splits(splits, min_tokens=min_tokens_to_merge)
            heading = sec["heading"]

            for i, chunk_text in enumerate(splits):
                chunk_text = chunk_text.strip()
                if not chunk_text:
                    continue

                content_hash = hashlib.md5(chunk_text.encode()).hexdigest()
                if content_hash in seen:
                    continue
                seen.add(content_hash)

                # Extract entities từ chunk bằng NER
                chunk_entities = self._extract_chunk_entities(chunk_text, heading)

                # Build prefix: NER entities > heading > filename entity (fallback)
                prefix_parts = []
                if chunk_entities:
                    prefix_parts.extend(chunk_entities)
                elif heading:
                    prefix_parts.append(heading)
                else:
                    filename_entity = self._fallback_entity_name(base_metadata).strip()
                    if filename_entity:
                        prefix_parts.append(filename_entity)

                prefix = " - ".join(prefix_parts)
                embed_text = f"[{prefix}]\n{chunk_text}" if prefix else chunk_text

                final_chunks.append({
                    "text": chunk_text,
                    "embed_text": embed_text,
                    "metadata": {
                        **base_metadata,
                        "heading": heading,
                        "chunk_entities": chunk_entities,
                        "chunk_index": len(final_chunks),
                        "split_index": i,
                        "total_splits": len(splits),
                        "token_estimate": len(chunk_text.split()),
                    }
                })

        return final_chunks


chunking_service = ChunkingService()
