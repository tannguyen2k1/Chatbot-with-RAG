from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database.models.config import Config
from schemas.config import ConfigCreate, ConfigUpdate
from typing import Optional
from .rbac_helper import ensure_permission_global
from database.context import current_tenant_id


class ConfigService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_configs(self) -> list[Config]:
        """Lấy tất cả cấu hình"""
        result = await self.db.execute(select(Config).order_by(Config.group_name, Config.key))
        return list(result.scalars().all())

    async def get_config_by_key(self, key: str) -> Optional[Config]:
        """Lấy cấu hình theo key"""
        result = await self.db.execute(select(Config).where(Config.key == key))
        return result.scalar_one_or_none()

    async def get_configs_by_group(self, group_name: str) -> list[Config]:
        """Lấy cấu hình theo nhóm"""
        result = await self.db.execute(
            select(Config).where(Config.group_name == group_name).order_by(Config.key)
        )
        return list(result.scalars().all())

    async def create_config(self, data: ConfigCreate) -> Config:
        """Tạo cấu hình mới"""
        tid = current_tenant_id.get()
        new_config = Config(
            key=data.key,
            value=data.value or "",
            description=data.description,
            group_name=data.group_name,
            is_system=data.is_system,
            tenant_id=int(tid) if tid and tid != "-" else None
        )
        self.db.add(new_config)
        await self.db.commit()
        await self.db.refresh(new_config)
        return new_config

    async def update_config(self, key: str, data: ConfigUpdate) -> Optional[Config]:
        """Cập nhật cấu hình"""
        config = await self.get_config_by_key(key)
        if not config:
            return None
        if data.value is not None:
            config.value = data.value
        if data.description is not None:
            config.description = data.description
        if data.group_name is not None:
            config.group_name = data.group_name
        await self.db.commit()
        await self.db.refresh(config)
        return config

    async def upsert_config(self, key: str, value: str, description: str = None, group_name: str = None) -> Config:
        """Thêm mới hoặc cập nhật cấu hình"""
        existing = await self.get_config_by_key(key)
        if existing:
            existing.value = value
            if description is not None:
                existing.description = description
            if group_name is not None:
                existing.group_name = group_name
            await self.db.commit()
            await self.db.refresh(existing)
            return existing

        tid = current_tenant_id.get()
        new_config = Config(
            key=key,
            value=value,
            description=description,
            group_name=group_name,
            tenant_id=int(tid) if tid and tid != "-" else None
        )
        self.db.add(new_config)
        await self.db.commit()
        await self.db.refresh(new_config)
        return new_config

    async def delete_config(self, key: str) -> bool:
        """Xóa cấu hình"""
        config = await self.get_config_by_key(key)
        if not config:
            return False
        await self.db.delete(config)
        await self.db.commit()
        return True

    # =========================================================================
    # "For" methods matching demo pattern (handle permissions)
    # =========================================================================

    async def get_all_configs_for(self, current_user_id: int, group_name: str = None) -> list[Config]:
        """Get configs with permission check"""
        await ensure_permission_global(current_user_id, "config", "view")
        if group_name:
            return await self.get_configs_by_group(group_name)
        return await self.get_all_configs()

    async def get_config_for(self, current_user_id: int, key: str) -> Config:
        """Get config by key with permission check"""
        await ensure_permission_global(current_user_id, "config", "view")
        config = await self.get_config_by_key(key)
        if not config:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Config '{key}' not found")
        return config

    async def create_config_for(self, current_user_id: int, data: ConfigCreate) -> Config:
        """Create config with permission check"""
        await ensure_permission_global(current_user_id, "config", "create")
        return await self.create_config(data)

    async def update_config_for(self, current_user_id: int, key: str, data: ConfigUpdate) -> Config:
        """Update config with permission check"""
        await ensure_permission_global(current_user_id, "config", "update")
        config = await self.update_config(key, data)
        if not config:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Config '{key}' not found")
        return config

    async def delete_config_for(self, current_user_id: int, key: str) -> dict:
        """Delete config with permission check"""
        await ensure_permission_global(current_user_id, "config", "delete")
        deleted = await self.delete_config(key)
        if not deleted:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Config '{key}' not found")
        return {"message": f"Config '{key}' deleted successfully"}

    async def update_chat_config_for(self, current_user_id: int, data) -> dict:
        """Update chat-related configs with permission check"""
        await ensure_permission_global(current_user_id, "config", "update")
        
        if data.limit is not None:
            await self.upsert_config("chat.limit", str(data.limit), "Số tài liệu tìm kiếm", "chat")
        if data.use_reranker is not None:
            await self.upsert_config("chat.use_reranker", "true" if data.use_reranker else "false", "Sử dụng reranker", "chat")
        if data.rerank_top_k is not None:
            await self.upsert_config("chat.rerank_top_k", str(data.rerank_top_k), "Số kết quả rerank", "chat")
        if data.collection_name is not None:
            await self.upsert_config("chat.collection_name", data.collection_name, "Collection mặc định", "chat")
        if data.system_prompt is not None:
            await self.upsert_config("chat.system_prompt", data.system_prompt, "System prompt cho AI chat", "chat")
        if data.use_bm25 is not None:
            await self.upsert_config("chat.use_bm25", "true" if data.use_bm25 else "false", "Sử dụng BM25", "chat")
        if data.bm25_top_k is not None:
            await self.upsert_config("chat.bm25_top_k", str(data.bm25_top_k), "Số kết quả BM25 để merge", "chat")
        if data.bm25_weight is not None:
            await self.upsert_config("chat.bm25_weight", str(data.bm25_weight), "Trọng số BM25 khi merge", "chat")
        if data.reflection_enabled is not None:
            await self.upsert_config("chat.reflection_enabled", "true" if data.reflection_enabled else "false", "Bật/tắt query reflection", "chat")
        if data.reflection_max_history is not None:
            await self.upsert_config("chat.reflection_max_history", str(data.reflection_max_history), "Số tin nhắn gần nhất cho reflection", "chat")
        if data.conversation_history_enabled is not None:
            await self.upsert_config("chat.history_enabled", "true" if data.conversation_history_enabled else "false", "Bật/tắt lịch sử hội thoại", "chat")
        if data.conversation_history_max_messages is not None:
            await self.upsert_config("chat.history_max_messages", str(data.conversation_history_max_messages), "Số tin nhắn lịch sử đưa vào LLM", "chat")
        if data.conversation_history_include_system is not None:
            await self.upsert_config("chat.history_include_system", "true" if data.conversation_history_include_system else "false", "System prompt mỗi turn", "chat")

        return {"message": "Lưu cấu hình thành công"}
    
    async def get_chat_config_for(self, current_user_id: int) -> dict:
        """Get consolidated chat configs with permission check"""
        await ensure_permission_global(current_user_id, "config", "view")
        
        configs = await self.get_configs_by_group("chat")
        config_dict = {cfg.key: cfg.value for cfg in configs}
        
        default_prompt = """Bạn là một trợ lý AI thông minh.
            Dựa vào các tài liệu cung cấp dưới đây, hãy trả lời câu hỏi của người dùng một cách chính xác.
            Nếu tài liệu không chứa thông tin để trả lời, hãy nói thẳng là "Tôi không có thông tin", TUYỆT ĐỐI KHÔNG được tự bịa ra câu trả lời.
            [TÀI LIỆU CUNG CẤP]:
            {context}
            [CÂU HỎI CỦA NGƯỜI DÙNG]:
            {query}
            Câu trả lời của bạn:"""
        
        return {
            "limit": int(config_dict.get("chat.limit", 3)),
            "use_reranker": config_dict.get("chat.use_reranker", "true").lower() == "true",
            "rerank_top_k": int(config_dict.get("chat.rerank_top_k", 30)),
            "collection_name": config_dict.get("chat.collection_name", "default"),
            "system_prompt": config_dict.get("chat.system_prompt", default_prompt),
            "use_bm25": config_dict.get("chat.use_bm25", "true").lower() == "true",
            "bm25_top_k": int(config_dict.get("chat.bm25_top_k", 30)),
            "bm25_weight": float(config_dict.get("chat.bm25_weight", 0.3)),
            "reflection_enabled": config_dict.get("chat.reflection_enabled", "true").lower() == "true",
            "reflection_max_history": int(config_dict.get("chat.reflection_max_history", 20)),
            "conversation_history_enabled": config_dict.get("chat.history_enabled", "true").lower() == "true",
            "conversation_history_max_messages": int(config_dict.get("chat.history_max_messages", 10)),
            "conversation_history_include_system": config_dict.get("chat.history_include_system", "true").lower() == "true",
        }
    async def update_general_config_for(self, current_user_id: int, data) -> dict:
        """Update general application configs with permission check"""
        await ensure_permission_global(current_user_id, "config", "update")
        
        if data.theme is not None:
            await self.upsert_config("general.theme", data.theme, "Giao diện (light/dark/system)", "general")
        if data.language is not None:
            await self.upsert_config("general.language", data.language, "Ngôn ngữ giao diện", "general")
        if data.font_size is not None:
            await self.upsert_config("general.font_size", data.font_size, "Cỡ chữ hiển thị", "general")
            
        return {"message": "Lưu cài đặt thành công"}

    async def get_general_config_for(self, current_user_id: int) -> dict:
        """Get consolidated general configs with permission check"""
        await ensure_permission_global(current_user_id, "config", "view")
        
        configs = await self.get_configs_by_group("general")
        config_dict = {cfg.key: cfg.value for cfg in configs}
        
        return {
            "theme": config_dict.get("general.theme", "system"),
            "language": config_dict.get("general.language", "vi"),
            "font_size": config_dict.get("general.font_size", "medium")
        }

