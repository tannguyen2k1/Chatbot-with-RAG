from sqlalchemy.ext.asyncio import AsyncSession
from database.context import current_tenant_id
from typing import Optional
from database.models.base import BaseModel


class TenantSession(AsyncSession):
    """
    Custom session tự động gán tenant_id khi tạo record mới (INSERT).

    Việc lọc dữ liệu (SELECT/UPDATE/DELETE) được xử lý hoàn toàn bởi
    PostgreSQL Row Level Security (RLS) - không cần bất kỳ logic Python nào.

    Session này chỉ lo DUY NHẤT một việc: gán tenant_id cho record mới.
    """

    def _get_current_tenant_id(self) -> Optional[int]:
        """Lấy tenant_id từ context"""
        tenant_id = current_tenant_id.get()
        if tenant_id is None or tenant_id == "-":
            return None
        try:
            return int(tenant_id)
        except (ValueError, TypeError):
            return None

    def add(self, instance):
        """Override add để tự động set tenant_id cho record mới"""
        tenant_id = self._get_current_tenant_id()
        if tenant_id is not None and isinstance(instance, BaseModel):
            # Tự động set tenant_id nếu chưa có
            if getattr(instance, "tenant_id", None) is None:
                instance.tenant_id = tenant_id

        return super().add(instance)
