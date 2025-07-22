from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.rbac import RoleCreate, ModuleCreate, PermissionCreate, AssignRoleToUser, AssignPermissionToRole
from services.rbac import RBACService
from middleware.dependencies import get_db

router = APIRouter(prefix="/rbac", tags=["RBAC"])

@router.post("/roles")
def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.create_role(data.name, data.description)

@router.post("/modules")
def create_module(data: ModuleCreate, db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.create_module(data.name, data.description)

@router.post("/permissions")
def create_permission(data: PermissionCreate, db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.create_permission(data.name, data.description)

@router.post("/assign-role")
def assign_role_to_user(data: AssignRoleToUser, db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.assign_role_to_user(data.user_id, data.role_id)

@router.post("/assign-permission")
def assign_permission_to_role(data: AssignPermissionToRole, db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.assign_permission_to_role(data.role_id, data.module_id, data.permission_id)

@router.get("/check-permission")
def check_user_permission(user_id: int, module_name: str, permission_name: str, db: Session = Depends(get_db)):
    service = RBACService(db)
    has_permission = service.check_user_permission(user_id, module_name, permission_name)
    return {"has_permission": has_permission}
