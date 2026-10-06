from sqlalchemy.ext.asyncio import AsyncSession

from constants.utc import DEFAULT_UTC_SYSTEM_PROMPT, UTC_SAMPLE_QUESTIONS
from services.config import ConfigService


async def seed_default_configs(db: AsyncSession) -> None:
    """Seed các cấu hình mặc định cho chatbot UTC."""
    service = ConfigService(db)

    import json

    default_configs = [
        {
            "key": "chat.collection_name",
            "value": "default",
            "description": "Tên collection Qdrant mặc định cho chat",
            "group_name": "chat",
        },
        {
            "key": "chat.limit",
            "value": "3",
            "description": "Số lượng đoạn văn tối đa dùng làm ngữ cảnh",
            "group_name": "chat",
        },
        {
            "key": "chat.use_reranker",
            "value": "true",
            "description": "Sử dụng Reranker để cải thiện kết quả tìm kiếm",
            "group_name": "chat",
        },
        {
            "key": "chat.rerank_top_k",
            "value": "30",
            "description": "Số lượng kết quả lấy từ Qdrant để đưa vào Reranker",
            "group_name": "chat",
        },
        {
            "key": "chat.use_bm25",
            "value": "true",
            "description": "Sử dụng BM25 để tìm kiếm theo keyword",
            "group_name": "chat",
        },
        {
            "key": "chat.bm25_top_k",
            "value": "30",
            "description": "Số kết quả lấy từ BM25 để merge",
            "group_name": "chat",
        },
        {
            "key": "chat.bm25_weight",
            "value": "0.3",
            "description": "Trọng số BM25 khi merge với vector (0.0-1.0)",
            "group_name": "chat",
        },
        {
            "key": "chat.system_prompt",
            "value": DEFAULT_UTC_SYSTEM_PROMPT,
            "description": "System prompt UTC (dùng {context} và {query})",
            "group_name": "chat",
        },
        {
            "key": "chat.sample_questions",
            "value": json.dumps(UTC_SAMPLE_QUESTIONS, ensure_ascii=False),
            "description": "Gợi ý câu hỏi mẫu theo domain (JSON)",
            "group_name": "chat",
        },
    ]

    for cfg in default_configs:
        await service.upsert_config(
            key=cfg["key"],
            value=cfg["value"],
            description=cfg["description"],
            group_name=cfg["group_name"],
        )
