
from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from middleware import get_current_user, get_db
from services import RBACService


# RBAC permission dependency generator (chuẩn RBAC, không dùng privilege cũ)
def require_permission(module: str, action: str):
    async def dependency(
        current_user = Depends(get_current_user),
        db: AsyncSession = Depends(get_db)
    ):
        rbac = RBACService(db)
        has_perm = await rbac.check_user_permission(current_user.id, module, action)
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to {action} {module}"
            )
        return current_user
    return dependency

