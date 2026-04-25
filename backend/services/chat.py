from typing import AsyncIterator, List

from mistralai import Mistral

from config.settings import settings
from schemas.vector import SearchResult


class ChatService:
    def _build_client(self) -> Mistral:
        api_key = settings.MISTRAL_API_KEY
        if not api_key:
            raise ValueError("Khong tim thay MISTRAL_API_KEY trong file .env")
        return Mistral(api_key=api_key)

    def build_context(self, results: List[SearchResult]) -> str:
        if not results:
            return "Khong tim thay tai lieu phu hop nao trong he thong."

        context_text = ""
        for i, res in enumerate(results):
            heading = res.payload.get("heading", "Khong ro")
            text = res.payload.get("_text", "")
            filename = res.payload.get("filename", "Tai lieu")

            context_text += (
                f"[Tai lieu {i + 1} | Nguon: {filename} | Phan: {heading}]\n"
            )
            context_text += f"{text}\n"
            context_text += "-" * 50 + "\n\n"

        return context_text.strip()

    def generate_prompt_preview(self, query: str, context: str) -> str:
        return f"""Bạn là một trợ lý AI thông minh của công ty VIETCIS.
            Dựa vào các tài liệu cung cấp dưới đây, hãy trả lời câu hỏi của người dùng mộ   t cách chính xác.
            Nếu tài liệu không chứa thông tin để trả lời, hãy nói thẳng là "Tôi không có thông tin", TUYỆT ĐỐI KHÔNG được tự bịa ra câu trả lời.
            [TÀI LIỆU CUNG CẤP]:
            {context}
            [CÂU HỎI CỦA NGƯỜI DÙNG]:
            {query}
            Câu trả lời của bạn:"""

    def _build_greeting_response(self, query: str) -> str:
        q = query.strip().lower()
        if any(w in q for w in ["tạm biệt", "bye", "goodbye", "hẹn gặp"]):
            return "Tạm biệt bạn! Rất vui được trò chuyện cùng bạn. Nếu cần hỏi gì, cứ quay lại nhé."
        if any(w in q for w in ["cảm ơn", "cám ơn", "thank", "thks"]):
            return "Không có gì ạ! Mình luôn sẵn sàng hỗ trợ bạn. Nếu cần hỏi thêm điều gì, cứ thoải mái nhé."
        return (
            "Xin chào! Mình là trợ lý AI của VIETCIS. Bạn cần mình hỗ trợ gì hôm nay?"
        )

    async def generate_simple_answer(self, query: str) -> str:
        return self._build_greeting_response(query)

    async def stream_simple_answer(self, query: str) -> AsyncIterator[str]:
        response = self._build_greeting_response(query)
        yield response

    async def generate_answer(self, query: str, context: str) -> str:
        client = self._build_client()
        prompt = self.generate_prompt_preview(query, context)

        try:
            response = await client.chat.complete_async(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        except AttributeError:
            response = client.chat.complete(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content

    async def stream_answer(self, query: str, context: str) -> AsyncIterator[str]:
        client = self._build_client()
        prompt = self.generate_prompt_preview(query, context)

        try:
            stream = await client.chat.stream_async(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": prompt}],
            )
            async for event in stream:
                for choice in event.data.choices:
                    content = choice.delta.content
                    if isinstance(content, str) and content:
                        yield content
        except AttributeError:
            stream = client.chat.stream(
                model="mistral-large-latest",
                messages=[{"role": "user", "content": prompt}],
            )
            for event in stream:
                for choice in event.data.choices:
                    content = choice.delta.content
                    if isinstance(content, str) and content:
                        yield content


chat_service = ChatService()


def get_chat_service() -> ChatService:
    return chat_service
