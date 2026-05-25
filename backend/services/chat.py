from typing import AsyncIterator, List, Optional

from config.settings import settings
from schemas.vector import SearchResult
from services.llm_provider import LLMProviderBase, get_cached_provider


DEFAULT_SYSTEM_PROMPT = """Bạn là một trợ lý AI thông minh chuyên phân tích tài liệu.

QUY TẮC:
1. Chỉ trả lời DỰA TRÊN tài liệu được cung cấp bên dưới.
2. Sau mỗi câu trả lời có thông tin từ tài liệu, phải trích dẫn nguồn bằng [Tài liệu N].
3. Nếu tài liệu có thông tin nhưng không đầy đủ, hãy trả lời những gì có và nói rõ "Theo tài liệu...".
4. Nếu tài liệu KHÔNG chứa thông tin, nói "Tôi không tìm thấy thông tin này trong tài liệu." TUYỆT ĐỐI KHÔNG bịa.
5. Nếu câu hỏi không liên quan đến tài liệu, trả lời bằng kiến thức của bạn và ghi chú rõ.

[TÀI LIỆU CUNG CẤP]:
{context}

[CÂU HỎI]:
{query}

Trả lời (kèm trích dẫn [Tài liệu N]):"""


class ChatService:
    def __init__(self, db=None, llm_provider: LLMProviderBase | None = None):
        self.db = db
        self._llm = llm_provider

    @property
    def llm(self) -> LLMProviderBase:
        """Lazy-load LLM provider từ cache (singleton)."""
        if self._llm is None:
            self._llm = get_cached_provider()
        return self._llm

    def build_context(self, results: List[SearchResult]) -> str:
        if not results:
            return "Không tìm thấy tài liệu phù hợp nào trong hệ thống."

        context_text = ""
        for i, res in enumerate(results):
            heading = res.payload.get("heading", "Không rõ")
            text = res.payload.get("_text", "")
            filename = res.payload.get("filename", "Tài liệu")

            context_text += (
                f"[Tài liệu {i + 1} | Nguồn: {filename} | Phần: {heading}]\n"
            )
            context_text += f"{text}\n\n"

        return context_text.strip()

    def generate_prompt_preview(
        self, query: str, context: str, system_prompt: str = None
    ) -> str:
        if not system_prompt:
            system_prompt = DEFAULT_SYSTEM_PROMPT
        return system_prompt.format(context=context, query=query)

    def _build_messages(
        self,
        query: str,
        context: str,
        system_prompt: str,
        conversation_history: Optional[List[dict]] = None,
        history_max_messages: int = 10,
        history_include_system: bool = True,
    ) -> List[dict]:
        messages = []

        if history_include_system:
            messages.append(
                {
                    "role": "system",
                    "content": system_prompt.format(context=context, query=query),
                }
            )

        if conversation_history and history_max_messages > 0:
            for entry in conversation_history[-history_max_messages:]:
                role = entry.get("role", "user")
                content = entry.get("content", "")
                if role == "user":
                    messages.append({"role": "user", "content": content})
                else:
                    messages.append({"role": "assistant", "content": content})

        messages.append({"role": "user", "content": query})

        return messages

    async def generate_answer(
        self,
        query: str,
        context: str,
        system_prompt: str = None,
        conversation_history: Optional[List[dict]] = None,
        history_max_messages: int = 10,
        history_include_system: bool = True,
    ) -> str:
        if not system_prompt:
            system_prompt = DEFAULT_SYSTEM_PROMPT
        messages = self._build_messages(
            query,
            context,
            system_prompt,
            conversation_history,
            history_max_messages,
            history_include_system,
        )

        return await self.llm.complete_async(
            model=settings.llm_model_name,
            messages=messages,
        )

    async def stream_answer(
        self,
        query: str,
        context: str,
        system_prompt: str = None,
        conversation_history: Optional[List[dict]] = None,
        history_max_messages: int = 10,
        history_include_system: bool = True,
    ) -> AsyncIterator[str]:
        if not system_prompt:
            system_prompt = DEFAULT_SYSTEM_PROMPT
        messages = self._build_messages(
            query,
            context,
            system_prompt,
            conversation_history,
            history_max_messages,
            history_include_system,
        )

        async for chunk in self.llm.stream_async(
            model=settings.llm_model_name,
            messages=messages,
        ):
            yield chunk

    async def get_system_prompt(self) -> str:
        """Lấy system prompt từ database theo tenant, fallback về default"""
        if not self.db:
            return DEFAULT_SYSTEM_PROMPT

        try:
            from services.config import ConfigService

            config_service = ConfigService(self.db)
            config = await config_service.get_config_by_key("chat.system_prompt")
            if config and config.value:
                return config.value
        except Exception:
            pass

        return DEFAULT_SYSTEM_PROMPT


chat_service = ChatService()


def get_chat_service() -> ChatService:
    return chat_service


async def get_chat_service_with_db(db) -> ChatService:
    """Factory function để tạo ChatService với db session cho multi-tenant"""
    return ChatService(db=db)
