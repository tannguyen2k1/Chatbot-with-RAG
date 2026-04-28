from sqlalchemy.ext.asyncio import AsyncSession
from services.config import ConfigService


async def seed_default_configs(db: AsyncSession) -> None:
    """Seed các cấu hình mặc định cho hệ thống."""
    service = ConfigService(db)

    default_configs = [
        {"key": "chat.collection_name", "value": "default", "description": "Tên collection Qdrant mặc định cho chat", "group_name": "chat"},
        {"key": "chat.limit", "value": "3", "description": "Số lượng đoạn văn tối đa dùng làm ngữ cảnh", "group_name": "chat"},
        {"key": "chat.use_reranker", "value": "true", "description": "Sử dụng Reranker để cải thiện kết quả tìm kiếm", "group_name": "chat"},
        {"key": "chat.rerank_top_k", "value": "30", "description": "Số lượng kết quả lấy từ Qdrant để đưa vào Reranker", "group_name": "chat"},
        {"key": "chat.system_prompt", "value": """Bạn là một trợ lý AI thông minh.
            Dựa vào các tài liệu cung cấp dưới đây, hãy trả lời câu hỏi của người dùng một cách chính xác.
            Nếu tài liệu không chứa thông tin để trả lời, hãy nói thẳng là "Tôi không có thông tin", TUYỆT ĐỐI KHÔNG được tự bịa ra câu trả lời.
            [TÀI LIỆU CUNG CẤP]:
            {context}
            [CÂU HỎI CỦA NGƯỜI DÙNG]:
            {query}
            Câu trả lời của bạn:""", "description": "System prompt cho AI chat (dùng {context} và {query} làm placeholder)", "group_name": "chat"},
    ]

    for cfg in default_configs:
        await service.upsert_config(
            key=cfg["key"],
            value=cfg["value"],
            description=cfg["description"],
            group_name=cfg["group_name"]
        )
