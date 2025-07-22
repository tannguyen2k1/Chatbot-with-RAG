

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.rbac import RoleCreate, ModuleCreate, PermissionCreate, AssignRoleToUser, AssignPermissionToRole
from schemas.remove_permission import RemovePermissionFromRole

from services.rbac import RBACService
from schemas.role_out import RoleOut
from middleware.dependencies import get_db

router = APIRouter(prefix="/rbac", tags=["RBAC"])


@router.get("/roles", response_model=list[RoleOut])
def get_roles(db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.get_all_roles()

@router.post("/roles")
def create_role(data: RoleCreate, db: Session = Depends(get_db)):
    service = RBACService(db)
    desc = data.description if data.description is not None else ""
    return service.create_role(data.name, desc)

@router.get("/modules")
def get_modules(db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.get_all_modules()

@router.post("/modules")
def create_module(data: ModuleCreate, db: Session = Depends(get_db)):
    service = RBACService(db)
    desc = data.description if data.description is not None else ""
    return service.create_module(data.name, desc)

@router.get("/permissions")
def get_permissions(db: Session = Depends(get_db)):
    service = RBACService(db)
    return service.get_all_permissions()

@router.post("/permissions")
def create_permission(data: PermissionCreate, db: Session = Depends(get_db)):
    service = RBACService(db)
    desc = data.description if data.description is not None else ""
    return service.create_permission(data.name, desc)

@router.post("/remove-permission")
def remove_permission_from_role(data: RemovePermissionFromRole, db: Session = Depends(get_db)):
    service = RBACService(db)
    success = service.remove_permission_from_role(data.role_id, data.module_id, data.permission_id)
    if not success:
        raise HTTPException(status_code=404, detail="Permission not found for this role")
    return {"success": True}

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

@router.delete("/roles/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db)):
    service = RBACService(db)
    success = service.delete_role(role_id)
    if not success:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"success": True}