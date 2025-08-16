from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import RoleCreate, RoleUpdate, RoleOut, ModuleCreate, PermissionCreate, AssignRoleToUser, AssignPermissionToRole, RemovePermissionFromRole
from dependencies import get_db, get_current_user
from dependencies.database import get_global_db
from services import RBACService

router = APIRouter(prefix="/rbac", tags=["RBAC"])

# roles
@router.get("/roles", response_model=list[RoleOut])
async def get_roles(
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        return await service.list_roles_for(current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/roles/{role_id}", response_model=RoleOut)
async def get_role_by_id(
    role_id: int, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        found_role = await service.get_role_detail_for(current_user.id, role_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not found_role:
        raise HTTPException(status_code=404, detail="Role not found")
    return found_role

@router.post("/roles")
async def create_role(
    data: RoleCreate, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    desc = data.description if data.description is not None else ""
    try:
        return await service.create_role_for(current_user.id, data.name, desc)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.put("/roles/{role_id}", response_model=RoleOut)
async def update_role(
    role_id: int, 
    data: RoleUpdate, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        updated_role = await service.update_role_for(current_user.id, role_id, data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not updated_role:
        raise HTTPException(status_code=404, detail="Role not found")
    return updated_role

@router.delete("/roles/{role_id}")
async def delete_role(
    role_id: int, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        success = await service.delete_role_for(current_user.id, role_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not success:
        raise HTTPException(status_code=404, detail="Role not found")
    return {"success": True}

@router.post("/assign-role")
async def assign_role_to_user(
    data: AssignRoleToUser, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        return await service.assign_role_to_user_for(current_user.id, data.user_id, data.role_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# modules
@router.get("/modules")
async def get_modules(
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        return await service.list_modules_for(current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/modules")
async def create_module(
    data: ModuleCreate, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    desc = data.description if data.description is not None else ""
    try:
        return await service.create_module_for(current_user.id, data.name, desc)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# permissions
@router.get("/permissions")
async def get_permissions(
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        return await service.list_permissions_for(current_user.id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/permissions")
async def create_permission(
    data: PermissionCreate, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    desc = data.description if data.description is not None else ""
    try:
        return await service.create_permission_for(current_user.id, data.name, desc)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/remove-permission")
async def remove_permission_from_role(
    data: RemovePermissionFromRole, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        success = await service.remove_permission_from_role_for(current_user.id, data.role_id, data.module_id, data.permission_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    if not success:
        raise HTTPException(status_code=404, detail="Permission not found for this role")
    return {"success": True}

@router.post("/assign-permission")
async def assign_permission_to_role(
    data: AssignPermissionToRole, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        return await service.assign_permission_to_role_for(current_user.id, data.role_id, data.module_id, data.permission_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.get("/check-permission")
async def check_user_permission(
    user_id: int, 
    module_name: str, 
    permission_name: str, 
    db: AsyncSession = Depends(get_global_db), 
    current_user=Depends(get_current_user)
):
    service = RBACService(db)
    try:
        has_permission = await service.check_user_permission_for(current_user.id, user_id, module_name, permission_name)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"has_permission": has_permission}




