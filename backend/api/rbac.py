from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import RoleCreate, RoleUpdate, ModuleCreate, PermissionCreate, AssignRoleToUser, AssignPermissionToRole, RemovePermissionFromRole, RoleOut
from services import RBACService
from middleware import get_db, get_current_user

router = APIRouter(prefix="/rbac", tags=["RBAC"])

# roles
@router.get("/roles", response_model=list[RoleOut])
async def get_roles(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("role", [])
    if "role.view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view roles")
    return await service.get_all_roles()

@router.get("/roles/{role_id}", response_model=RoleOut)
async def get_role_by_id(role_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("role", [])
    if "role.view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view roles")
    found_role = await service.get_role_by_id(role_id)
    if not found_role:
        raise HTTPException(status_code=404, detail="Role not found")
    return found_role

@router.post("/roles")
async def create_role(data: RoleCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("role", [])
    if "role.create" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to create roles")
    desc = data.description if data.description is not None else ""
    return await service.create_role(data.name, desc)

@router.put("/roles/{role_id}", response_model=RoleOut)
async def update_role(role_id: int, data: RoleUpdate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("role", [])
    if "role.update" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to update roles")
    updated_role = await service.update_role(role_id, data)
    if not updated_role:
        raise HTTPException(status_code=404, detail="Role not found")
    return updated_role

@router.delete("/roles/{role_id}")
async def delete_role(role_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("role", [])
    if "role.delete" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to delete roles")
    success = await service.delete_role(role_id)
    if not success:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"success": True}

@router.post("/assign-role")
async def assign_role_to_user(data: AssignRoleToUser, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("role", [])
    if "role.assign-role" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to assign roles")
    return await service.assign_role_to_user(data.user_id, data.role_id)

# modules
@router.get("/modules")
async def get_modules(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("module", [])
    if "module.view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view modules")
    return await service.get_all_modules()

@router.post("/modules")
async def create_module(data: ModuleCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("module", [])
    if "module.create" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to create modules")
    desc = data.description if data.description is not None else ""
    return await service.create_module(data.name, desc)

# permissions
@router.get("/permissions")
async def get_permissions(db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("permission", [])
    if "permission.view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view permissions")
    return await service.get_all_permissions()

@router.post("/permissions")
async def create_permission(data: PermissionCreate, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("permission", [])
    if "permission.create" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to create permissions")
    desc = data.description if data.description is not None else ""
    return await service.create_permission(data.name, desc)

@router.post("/remove-permission")
async def remove_permission_from_role(data: RemovePermissionFromRole, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("permission", [])
    if "permission.remove" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to remove permissions")
    success = await service.remove_permission_from_role(data.role_id, data.module_id, data.permission_id)
    if not success:
        raise HTTPException(status_code=404, detail="Permission not found for this role")
    return {"success": True}

@router.post("/assign-permission")
async def assign_permission_to_role(data: AssignPermissionToRole, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("permission", [])
    if "permission.assign" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to assign permissions")
    return await service.assign_permission_to_role(data.role_id, data.module_id, data.permission_id)

@router.get("/check-permission")
async def check_user_permission(user_id: int, module_name: str, permission_name: str, db: AsyncSession = Depends(get_db), current_user=Depends(get_current_user)):
    service = RBACService(db)
    perms = await service.get_user_permissions(current_user.id)
    actions = perms.get("permission", [])
    if "permission.check" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to check permissions")
    has_permission = await service.check_user_permission(user_id, module_name, permission_name)
    return {"has_permission": has_permission}




