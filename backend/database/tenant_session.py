from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, event
from database.context import current_tenant_id
from typing import Optional, Any
from database.models.base import BaseModel

class TenantSession(AsyncSession):
    """Custom session với automatic tenant filtering"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._tenant_id = None
    
    def set_tenant_context(self, tenant_id: int):
        """Set tenant context cho session này"""
        self._tenant_id = tenant_id
    
    def _get_current_tenant_id(self) -> Optional[int]:
        """Lấy tenant_id từ context hoặc session"""
        # Ưu tiên tenant_id từ session trước
        if self._tenant_id is not None:
            return self._tenant_id
        
        # Sau đó mới lấy từ context
        tenant_id = current_tenant_id.get()
        if tenant_id is None or tenant_id == "-":
            return None
        try:
            return int(tenant_id)
        except (ValueError, TypeError):
            return None
    
    def _add_tenant_filter(self, query: Any) -> Any:
        """Tự động thêm tenant filter vào query"""
        tenant_id = self._get_current_tenant_id()
        if tenant_id is None:
            return query
        
        # Kiểm tra xem query có model kế thừa từ BaseModel không
        if hasattr(query, 'column_descriptions'):
            for desc in query.column_descriptions:
                if hasattr(desc['type'], '__table__'):
                    table = desc['type'].__table__
                    if hasattr(table.c, 'tenant_id'):
                        # Thêm tenant filter
                        return query.filter(table.c.tenant_id == tenant_id)
        
        return query
    
    async def execute(self, statement, *args, **kwargs):
        """Override execute để tự động thêm tenant filter"""
        # Chỉ áp dụng cho SELECT queries
        if hasattr(statement, 'is_select') and statement.is_select:
            statement = self._add_tenant_filter(statement)
        
        return await super().execute(statement, *args, **kwargs)
    
    async def get(self, entity, ident, *args, **kwargs):
        """Override get để tự động thêm tenant filter"""
        tenant_id = self._get_current_tenant_id()
        if tenant_id is not None and issubclass(entity, BaseModel):
            # Thêm tenant filter cho get
            stmt = select(entity).filter(
                entity.id == ident,
                entity.tenant_id == tenant_id
            )
            result = await self.execute(stmt)
            return result.scalar_one_or_none()
        
        return await super().get(entity, ident, *args, **kwargs)

    def add(self, instance):
        """Override add để tự động set tenant_id cho record mới"""
        tenant_id = self._get_current_tenant_id()
        if tenant_id is not None and isinstance(instance, BaseModel):
            # Tự động set tenant_id nếu chưa có
            if getattr(instance, 'tenant_id', None) is None:
                instance.tenant_id = tenant_id
        
        return super().add(instance)

# Factory function để tạo TenantSession
def create_tenant_session(bind, **kwargs):
    """Tạo TenantSession instance"""
    return TenantSession(bind=bind, **kwargs)
