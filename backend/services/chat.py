from typing import AsyncIterator, List, Optional

from mistralai import Mistral

from config.settings import settings
from schemas.vector import SearchResult


DEFAULT_SYSTEM_PROMPT = """Bạn là một trợ lý AI thông minh.
            Dựa vào các tài liệu cung cấp dưới đây, hãy trả lời câu hỏi của người dùng một cách chính xác.
            Nếu tài liệu không chứa thông tin để trả lời, hãy nói thẳng là "Tôi không có thông tin", TUYỆT ĐỐI KHÔNG được tự bịa ra câu trả lời.
            [TÀI LIỆU CUNG CẤP]:
            {context}
            [CÂU HỎI CỦA NGƯỜI DÙNG]:
            {query}
            Câu trả lời của bạn:"""


class ChatService:
    def __init__(self, db=None):
        self.db = db

    def _build_client(self) -> Mistral:
        api_key = settings.MISTRAL_API_KEY
        if not api_key:
            raise ValueError("Do not find MISTRAL_API_KEY in .env file")
        return Mistral(api_key=api_key)

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
            context_text += f"{text}\n"
            context_text += "-" * 50 + "\n\n"

        return context_text.strip()

    def generate_prompt_preview(self, query: str, context: str, system_prompt: str = None) -> str:
        if not system_prompt:
            system_prompt = DEFAULT_SYSTEM_PROMPT
        return system_prompt.format(context=context, query=query)

    def _build_messages(
        self,
        query: str,
        context: str,
        system_prompt: str,
        conversation_history: Optional[List[dict]] = None,
    ) -> List[dict]:
        max_messages = settings.CONVERSATION_HISTORY_MAX_MESSAGES
        include_system = settings.CONVERSATION_HISTORY_INCLUDE_SYSTEM

        messages = []

        if include_system:
            messages.append({"role": "system", "content": system_prompt.format(context=context, query="{query}")})

        if conversation_history and max_messages > 0:
            for entry in conversation_history[-max_messages:]:
                role = entry.get("role", "user")
                content = entry.get("content", "")
                if role == "user":
                    messages.append({"role": "user", "content": content})
                else:
                    messages.append({"role": "assistant", "content": content})

        current_query = system_prompt.format(context=context, query=query)
        messages.append({"role": "user", "content": current_query})

        return messages

    async def generate_answer(
        self,
        query: str,
        context: str,
        system_prompt: str = None,
        conversation_history: Optional[List[dict]] = None,
    ) -> str:
        client = self._build_client()
        if not system_prompt:
            system_prompt = DEFAULT_SYSTEM_PROMPT
        messages = self._build_messages(query, context, system_prompt, conversation_history)

        try:
            response = await client.chat.complete_async(
                model="mistral-large-latest",
                messages=messages,
            )
            return response.choices[0].message.content
        except AttributeError:
            response = client.chat.complete(
                model="mistral-large-latest",
                messages=messages,
            )
            return response.choices[0].message.content

    async def stream_answer(
        self,
        query: str,
        context: str,
        system_prompt: str = None,
        conversation_history: Optional[List[dict]] = None,
    ) -> AsyncIterator[str]:
        client = self._build_client()
        if not system_prompt:
            system_prompt = DEFAULT_SYSTEM_PROMPT
        messages = self._build_messages(query, context, system_prompt, conversation_history)

        try:
            stream = await client.chat.stream_async(
                model="mistral-large-latest",
                messages=messages,
            )
            async for event in stream:
                for choice in event.data.choices:
                    content = choice.delta.content
                    if isinstance(content, str) and content:
                        yield content
        except AttributeError:
            stream = client.chat.stream(
                model="mistral-large-latest",
                messages=messages,
            )
            for event in stream:
                for choice in event.data.choices:
                    content = choice.delta.content
                    if isinstance(content, str) and content:
                        yield content

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
