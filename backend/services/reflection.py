"""
Query Reflection Service - Chuyển đổi ambiguous query thành standalone query.

Dựa trên conversation history, rewrite câu hỏi ambiguous
(vd: "nó có mấy màu?") thành standalone query đầy đủ
(vd: "iPhone 15 Pro có những màu nào?").

Đặt giữa bước load history và bước vector search trong chat flow:
    query + history → Reflection → standalone_query → vector search
"""

import logging
from typing import List, Optional

from config.settings import settings
from services.llm_provider import LLMProviderBase, get_cached_provider

logger = logging.getLogger(__name__)

REFLECTION_PROMPT_TEMPLATE = """Bạn là một trợ lý AI chuyên reformulate câu hỏi.

Cho một lịch sử hội thoại và câu hỏi mới nhất, hãy viết lại câu hỏi thành dạng **standalone question** - tức là câu hỏi tự đứng được, không cần đọc lịch sử để hiểu.

QUY TẮC:
- Nếu câu hỏi mới là standalone (đã đầy đủ ngữ cảnh), giữ nguyên
- Nếu có đại từ (nó, cái đó, sản phẩm đó, món này...) hoặc câu hỏi ngắn, thay bằng entity rõ ràng từ lịch sử
- Nếu lịch sử hội thoại trống, giữ nguyên câu hỏi
- Viết lại bằng tiếng Việt, giữ nguyên ý định của câu hỏi gốc
- KHÔNG trả lời câu hỏi, chỉ reformulate

[LỊCH SỬ HỘI THOẠI]:
{history_string}

[CÂU HỎI MỚI NHẤT]:
{last_query}

[CÂU HỎI STANDALONE]:
"""


class ReflectionService:
    def __init__(self, llm_provider: LLMProviderBase | None = None):
        self._llm = llm_provider

    @property
    def llm(self) -> LLMProviderBase:
        """Lazy-load LLM provider từ cache (singleton)."""
        if self._llm is None:
            self._llm = get_cached_provider()
        return self._llm

    def _format_history(
        self, conversation_history: List[dict], max_items: int = 100
    ) -> str:
        """
        Format conversation history thành chuỗi string cho reflection prompt.
        Hỗ trợ cả format cũ ('parts') và format mới ('role'/'content').
        """
        if not conversation_history:
            return "(Không có lịch sử hội thoại)"

        items = conversation_history[-max_items:]
        lines = []
        for entry in items:
            if "parts" in entry:
                role = entry.get("parts", [{}])[0].get("role", "user")
                text = entry.get("parts", [{}])[0].get("text", "")
            else:
                role = entry.get("role", "user")
                text = entry.get("content", "")

            if not text:
                continue

            if role == "user":
                lines.append(f"User: {text}")
            else:
                lines.append(f"Assistant: {text}")

        return "\n".join(lines) if lines else "(Không có lịch sử hội thoại)"

    def reflect(
        self,
        conversation_history: List[dict],
        last_query: str,
        max_items: int = 100,
    ) -> str:
        """
        Rewrite ambiguous query thành standalone query.

        Args:
            conversation_history: Danh sách message lịch sử [{role, content}, ...]
            last_query: Câu hỏi mới nhất của user
            max_items: Số lượng history items dùng cho reflection

        Returns:
            Standalone query đã được rewrite
        """
        history_string = self._format_history(conversation_history, max_items)
        prompt = REFLECTION_PROMPT_TEMPLATE.format(
            history_string=history_string,
            last_query=last_query,
        )

        try:
            reflected = self.llm.complete(
                model=settings.llm_model_name,
                messages=[{"role": "user", "content": prompt}],
            ).strip()
            logger.info(
                f"[Reflection] Original: '{last_query}' -> Reflected: '{reflected}'"
            )
            return reflected
        except Exception as e:
            logger.error(f"[Reflection] Error: {e}")
            return last_query

    async def reflect_async(
        self,
        conversation_history: List[dict],
        last_query: str,
        max_items: int = 100,
    ) -> str:
        """
        Async version của reflect(). Dùng cho chat endpoint để không block.
        """
        history_string = self._format_history(conversation_history, max_items)
        prompt = REFLECTION_PROMPT_TEMPLATE.format(
            history_string=history_string,
            last_query=last_query,
        )

        try:
            reflected = (
                await self.llm.complete_async(
                    model=settings.llm_model_name,
                    messages=[{"role": "user", "content": prompt}],
                )
            ).strip()
            logger.info(
                f"[Reflection] Original: '{last_query}' -> Reflected: '{reflected}'"
            )
            return reflected
        except Exception as e:
            logger.error(f"[Reflection] Error: {e}")
            return last_query


_reflection_service: ReflectionService | None = None


def get_reflection_service() -> ReflectionService:
    """Dependency injection cho FastAPI."""
    global _reflection_service
    if _reflection_service is None:
        _reflection_service = ReflectionService()
    return _reflection_service
