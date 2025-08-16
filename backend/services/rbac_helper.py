"""
Helper functions for RBAC operations with global session support
"""
from dependencies.database import GlobalAsyncSessionLocal
from services.rbac import RBACService

async def ensure_permission_global(user_id: int, module: str, action: str):
    """Helper function để check permission với global session - dùng cho tất cả services"""
    async with GlobalAsyncSessionLocal() as global_session:
        role_service = RBACService(global_session)
        await role_service.ensure_permission(user_id, module, action)

async def get_user_permissions_global(user_id: int) -> dict:
    """Helper function để lấy user permissions với global session"""
    async with GlobalAsyncSessionLocal() as global_session:
        role_service = RBACService(global_session)
        return await role_service.get_user_permissions(user_id)

async def is_root_user_global(user_id: int) -> bool:
    """Helper function để check xem user có phải root không với global session"""
    async with GlobalAsyncSessionLocal() as global_session:
        from database.models import User
        from sqlalchemy import select
        result = await global_session.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return False
        
        role_service = RBACService(global_session)
        return await role_service.is_root(user)
