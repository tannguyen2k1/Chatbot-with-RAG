import re
from dataclasses import dataclass


@dataclass
class QueryClassification:
    needs_context: bool
    reason: str
    category: str


SIMPLE_GREETING_PATTERNS = [
    r"^(chào|xin chào|hi|hello|hey|alo|chào bạn|chào em|chào anh|chào chị|chào bạn ơi|hello there|hi there|good morning|good afternoon|good evening|good day|kính chào)\s*$",
    r"^(tạm biệt|tạm_biệt|bye|goodbye|see you|tạm biệt nhé|hẹn gặp lại)\s*$",
]

SIMPLE_GREETING_KEYWORDS = [
    "chào",
    "xin chào",
    "hi",
    "hello",
    "hey",
    "alo",
    "helo",
    "chào bạn",
    "chào em",
    "chào anh",
    "chào chị",
    "good morning",
    "good afternoon",
    "good evening",
    "good day",
    "tạm biệt",
    "bye",
    "goodbye",
]

SIMPLE_ACK_PATTERNS = [
    r"^(cảm ơn|cám ơn|thank you|thanks|thank|u\\+1|ok|okay|oke|b thanks|thks|thx)\s*$",
    r"^(được rồi|đồng ý|ok lun|oke luôn|ok đấy|vâng|có)\s*$",
]

SIMPLE_ACK_KEYWORDS = [
    "cảm ơn",
    "cám ơn",
    "thank you",
    "thanks",
    "ok",
    "okay",
    "oke",
    "được rồi",
    "vâng",
    "có",
]


class QueryClassifier:
    def __init__(self):
        self._greeting_re = re.compile(
            "|".join(SIMPLE_GREETING_PATTERNS), re.IGNORECASE | re.VERBOSE
        )
        self._ack_re = re.compile(
            "|".join(SIMPLE_ACK_PATTERNS), re.IGNORECASE | re.VERBOSE
        )

    def classify(self, query: str) -> QueryClassification:
        q = query.strip()

        if self._greeting_re.match(q):
            return QueryClassification(
                needs_context=False,
                reason="Đây là lời chào / lời tạm biệt, không cần ngữ cảnh",
                category="greeting",
            )

        if self._ack_re.match(q):
            return QueryClassification(
                needs_context=False,
                reason="Đây là lời cảm ơn / xác nhận đơn giản, không cần ngữ cảnh",
                category="acknowledgment",
            )

        greeting_kw_set = {kw.lower() for kw in SIMPLE_GREETING_KEYWORDS}
        ack_kw_set = {kw.lower() for kw in SIMPLE_ACK_KEYWORDS}
        words = set(w.lower() for w in re.findall(r"\w+", q))

        if words <= greeting_kw_set and len(words) <= 5:
            return QueryClassification(
                needs_context=False,
                reason="Từ khóa chỉ chứa lời chào, không cần ngữ cảnh",
                category="greeting",
            )

        if words <= ack_kw_set and len(words) <= 5:
            return QueryClassification(
                needs_context=False,
                reason="Từ khóa chỉ chứa lời cảm ơn / xác nhận, không cần ngữ cảnh",
                category="acknowledgment",
            )

        return QueryClassification(
            needs_context=True,
            reason="Đây là câu hỏi cần ngữ cảnh từ tài liệu",
            category="contextual",
        )


query_classifier = QueryClassifier()


def get_query_classifier() -> QueryClassifier:
    return query_classifier
