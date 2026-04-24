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

            context_text += f"[Tai lieu {i+1} | Nguon: {filename} | Phan: {heading}]\n"
            context_text += f"{text}\n"
            context_text += "-" * 50 + "\n\n"

        return context_text.strip()

    def generate_prompt_preview(self, query: str, context: str) -> str:
        return f"""Ban la mot tro ly AI thong minh cua cong ty VIETCIS.
            Dua vao cac TAI LIEU CUNG CAP duoi day, hay tra loi CAU HOI cua nguoi dung mot cach chinh xac.
            Neu tai lieu khong chua thong tin de tra loi, hay noi thang la "Toi khong co thong tin", TUYET DOI KHONG duoc tu bia ra cau tra loi.
            [TAI LIEU CUNG CAP]:
            {context}
            [CAU HOI CUA NGUOI DUNG]:
            {query}
            Cau tra loi cua ban:"""

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
