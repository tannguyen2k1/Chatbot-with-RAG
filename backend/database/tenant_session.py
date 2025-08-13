from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import event
from typing import Optional
from database.models import BaseModel
from database.models.tenant import Tenant

class TenantSessionWrapper:
    """Wrapper cho AsyncSession với tenant context"""
    
    def __init__(self, session: AsyncSession, tenant: Optional[Tenant] = None):
        self._session = session
        self._current_tenant = tenant
    
    def set_tenant(self, tenant: Tenant):
        """Set tenant context cho session"""
        self._current_tenant = tenant
    
    def get_tenant(self) -> Optional[Tenant]:
        """Lấy tenant context hiện tại"""
        return self._current_tenant
    
    def clear_tenant(self):
        """Xóa tenant context"""
        self._current_tenant = None
    
    def __getattr__(self, name):
        """Delegate tất cả methods khác cho AsyncSession gốc"""
        return getattr(self._session, name)

def get_tenant_session(tenant: Optional[Tenant] = None):
    """Tạo tenant session với tenant context"""
    from database.database import AsyncSessionLocal
    
    # Tạo session mới
    session = AsyncSessionLocal()
    
    # Wrap session với tenant context
    return TenantSessionWrapper(session, tenant)

# Event listener để tự động filter theo tenant
@event.listens_for(AsyncSession, 'do_orm_execute')
def _add_tenant_filter(execute_state):
    """Tự động thêm tenant filter cho tất cả queries"""
    if not execute_state.is_select:
        return
    
    session = execute_state.session
    
    # Kiểm tra nếu session có tenant context
    if hasattr(session, '_current_tenant') and session._current_tenant:
        # Chỉ áp dụng filter cho models kế thừa từ BaseModel
        if hasattr(execute_state.statement, 'from_obj'):
            for from_obj in execute_state.statement.from_obj:
                if hasattr(from_obj, 'entity') and issubclass(from_obj.entity, BaseModel):
                    # Thêm tenant filter
                    tenant_filter = from_obj.entity.tenant_id == session._current_tenant.id
                    if execute_state.statement.where is None:
                        execute_state.statement = execute_state.statement.where(tenant_filter)
                    else:
                        execute_state.statement = execute_state.statement.where(
                            execute_state.statement.where & tenant_filter
                        )
