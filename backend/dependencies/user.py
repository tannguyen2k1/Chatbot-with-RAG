from fastapi import Depends, HTTPException
from database.models.user import User
from database.models.tenant import Tenant
from .auth import get_current_user
from .tenant import require_tenant

async def get_current_user_with_tenant(
    tenant: Tenant = Depends(require_tenant),
    current_user: User = Depends(get_current_user)
) -> User:
    """Lấy user hiện tại với tenant context"""
    # Kiểm tra user có thuộc tenant không
    if current_user.tenant_id != tenant.id:
        raise HTTPException(
            status_code=403,
            detail="User does not belong to this tenant"
        )
    return current_user
