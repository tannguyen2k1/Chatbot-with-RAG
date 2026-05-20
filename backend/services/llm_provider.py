"""
LLM Provider Strategy Pattern - Hỗ trợ nhiều LLM provider (Mistral, DeepSeek, OpenAI...)

Mỗi provider implement cùng interface LLMProviderBase,
cho phép chuyển đổi qua lại chỉ bằng cách đổi biến LLM_PROVIDER trong .env.
"""

import logging
from abc import ABC, abstractmethod
from typing import AsyncIterator, Iterator, List

from config.settings import settings

logger = logging.getLogger(__name__)


# ============================================================
# Abstract Base Class
# ============================================================


class LLMProviderBase(ABC):
    """Interface chung cho tất cả LLM provider."""

    @abstractmethod
    def complete(self, model: str, messages: List[dict], **kwargs) -> str:
        """Gọi LLM (sync), trả về nội dung text."""
        ...

    @abstractmethod
    async def complete_async(self, model: str, messages: List[dict], **kwargs) -> str:
        """Gọi LLM (async), trả về nội dung text."""
        ...

    @abstractmethod
    def stream(self, model: str, messages: List[dict], **kwargs) -> Iterator[str]:
        """Stream LLM response (sync generator)."""
        ...

    @abstractmethod
    async def stream_async(
        self, model: str, messages: List[dict], **kwargs
    ) -> AsyncIterator[str]:
        """Stream LLM response (async generator)."""
        ...


# ============================================================
# Mistral Provider
# ============================================================


class MistralProvider(LLMProviderBase):
    """Strategy cho Mistral AI."""

    def __init__(self) -> None:
        from mistralai import Mistral

        api_key = settings.MISTRAL_API_KEY
        if not api_key:
            raise ValueError("MISTRAL_API_KEY is not set in .env")
        self._client = Mistral(api_key=api_key)

    def complete(self, model: str, messages: List[dict], **kwargs) -> str:
        response = self._client.chat.complete(
            model=model,
            messages=messages,
            **kwargs,
        )
        return response.choices[0].message.content

    async def complete_async(self, model: str, messages: List[dict], **kwargs) -> str:
        response = await self._client.chat.complete_async(
            model=model,
            messages=messages,
            **kwargs,
        )
        return response.choices[0].message.content

    def stream(self, model: str, messages: List[dict], **kwargs) -> Iterator[str]:
        stream = self._client.chat.stream(
            model=model,
            messages=messages,
            **kwargs,
        )
        for event in stream:
            for choice in event.data.choices:
                content = choice.delta.content
                if isinstance(content, str) and content:
                    yield content

    async def stream_async(
        self, model: str, messages: List[dict], **kwargs
    ) -> AsyncIterator[str]:
        stream = await self._client.chat.stream_async(
            model=model,
            messages=messages,
            **kwargs,
        )
        async for event in stream:
            for choice in event.data.choices:
                content = choice.delta.content
                if isinstance(content, str) and content:
                    yield content


# ============================================================
# DeepSeek Provider
# ============================================================


class DeepSeekProvider(LLMProviderBase):
    """Strategy cho DeepSeek (dùng OpenAI-compatible SDK)."""

    def __init__(self) -> None:
        from openai import OpenAI

        api_key = settings.DEEPSEEK_API_KEY
        if not api_key:
            raise ValueError("DEEPSEEK_API_KEY is not set in .env")
        self._client = OpenAI(
            api_key=api_key,
            base_url=settings.DEEPSEEK_BASE_URL,
        )

    def complete(self, model: str, messages: List[dict], **kwargs) -> str:
        response = self._client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False,
            **kwargs,
        )
        return response.choices[0].message.content

    async def complete_async(self, model: str, messages: List[dict], **kwargs) -> str:
        # OpenAI SDK >=1.0 uses httpx, hỗ trợ async natively
        response = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            stream=False,
            **kwargs,
        )
        return response.choices[0].message.content

    def stream(self, model: str, messages: List[dict], **kwargs) -> Iterator[str]:
        stream = self._client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            **kwargs,
        )
        for chunk in stream:
            for choice in chunk.choices:
                content = choice.delta.content
                if content:
                    yield content

    async def stream_async(
        self, model: str, messages: List[dict], **kwargs
    ) -> AsyncIterator[str]:
        stream = await self._client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
            **kwargs,
        )
        async for chunk in stream:
            for choice in chunk.choices:
                content = choice.delta.content
                if content:
                    yield content


# ============================================================
# Provider Registry & Factory
# ============================================================

_PROVIDER_REGISTRY = {
    "mistral": MistralProvider,
    "deepseek": DeepSeekProvider,
}


def register_provider(name: str, provider_class: type) -> None:
    """Đăng ký thêm provider mới (vd: OpenAI, Anthropic...)."""
    _PROVIDER_REGISTRY[name.lower()] = provider_class


def get_llm_provider() -> LLMProviderBase:
    """
    Factory function - trả về LLM provider dựa trên setting LLM_PROVIDER.

    Cách dùng:
        provider = get_llm_provider()
        answer = await provider.complete_async(model="...", messages=[...])
    """
    provider_name = settings.LLM_PROVIDER.lower()
    provider_class = _PROVIDER_REGISTRY.get(provider_name)
    if provider_class is None:
        available = ", ".join(_PROVIDER_REGISTRY.keys())
        raise ValueError(
            f"Unsupported LLM_PROVIDER '{provider_name}'. Available: {available}"
        )
    logger.info(f"[LLMProvider] Using provider: {provider_name}")
    return provider_class()


# Singleton cache (tùy chọn)
_llm_provider: LLMProviderBase | None = None


def get_cached_provider() -> LLMProviderBase:
    """Lấy singleton provider (chỉ khởi tạo 1 lần)."""
    global _llm_provider
    if _llm_provider is None:
        _llm_provider = get_llm_provider()
    return _llm_provider


def reset_provider_cache() -> None:
    """Reset cache - dùng khi test hoặc đổi provider runtime."""
    global _llm_provider
    _llm_provider = None
