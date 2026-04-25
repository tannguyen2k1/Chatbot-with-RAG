from sqlalchemy.ext.asyncio import AsyncSession
from services.config import ConfigService


async def seed_default_configs(db: AsyncSession) -> None:
    """Seed các cấu hình mặc định cho hệ thống."""
    service = ConfigService(db)

    default_configs = [
        {"key": "chat.collection_name", "value": "vietcis_kb", "description": "Tên collection Qdrant mặc định cho chat", "group_name": "chat"},
        {"key": "chat.limit", "value": "3", "description": "Số lượng đoạn văn tối đa dùng làm ngữ cảnh", "group_name": "chat"},
        {"key": "chat.use_reranker", "value": "true", "description": "Sử dụng Reranker để cải thiện kết quả tìm kiếm", "group_name": "chat"},
        {"key": "chat.rerank_top_k", "value": "20", "description": "Số lượng kết quả lấy từ Qdrant để đưa vào Reranker", "group_name": "chat"},
    ]

    for cfg in default_configs:
        await service.upsert_config(
            key=cfg["key"],
            value=cfg["value"],
            description=cfg["description"],
            group_name=cfg["group_name"]
        )
