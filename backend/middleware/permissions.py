
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from middleware.dependencies import get_current_user, get_db
from services.rbac import RBACService


# RBAC permission dependency generator (chuẩn RBAC, không dùng privilege cũ)
def require_permission(module: str, action: str):
    def dependency(
        current_user = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        rbac = RBACService(db)
        if not rbac.check_user_permission(current_user.id, module, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"You don't have permission to {action} {module}"
            )
        return current_user
    return dependency

