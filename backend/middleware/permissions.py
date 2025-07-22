
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

# Demo Permissions
require_demo_view = require_permission("demo", "view")
require_demo_create = require_permission("demo", "create")
require_demo_update = require_permission("demo", "update")
require_demo_delete = require_permission("demo", "delete")

# User Permissions
require_user_view = require_permission("user", "view")
require_user_create = require_permission("user", "create")
require_user_update = require_permission("user", "update")
require_user_delete = require_permission("user", "delete")
