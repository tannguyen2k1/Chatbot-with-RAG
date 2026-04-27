from schemas import UserResponse, PaginatedUserResponse, UserCreate, UserUpdate, PermissionError
from schemas.user import UserResetPassword
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.models.user import User
from dependencies import get_db, get_current_user, get_current_tenant_id_from_token
from services import UserService
from services.rbac_helper import ensure_permission_global

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    """Dependency injection cho UserService"""
    return UserService(db)


# Endpoint: User tự cập nhật thông tin cá nhân
@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """User tự cập nhật thông tin cá nhân (email, phone, full_name)"""
    try:
        return await service.update_user_for(current_user.id, current_user.id, update_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# Endpoint: Create a new user (Root/Admin only)
@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_current_tenant_id_from_token)
):
    try:
        return await service.create_user_for(current_user.id, user_data, tenant_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Retrieve a list of users (Admin/Root only)
@router.get("", response_model=PaginatedUserResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by username or email"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
    tenant_id: int = Depends(get_current_tenant_id_from_token)
):
    try:
        return await service.list_users_for(current_user.id, page, page_size, search, tenant_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Retrieve user details by ID (Root/Admin có thể xem theo cấp độ)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    try:
        return await service.get_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Update user details by ID (Root/Admin có thể quản lý theo cấp độ)
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    update_data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    try:
        return await service.update_user_for(current_user.id, user_id, update_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Delete a user by ID (Root có thể xóa tất cả, Admin chỉ xóa user)
@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    try:
        return await service.delete_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# Endpoint: Reset password cho user (chỉ admin/root có quyền)
@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_user_password(
    user_id: int,
    reset_data: UserResetPassword,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user)
):
    """Reset password cho user (chỉ admin/root có quyền)"""
    await ensure_permission_global(current_user.id, "user", "reset-password")
    try:
        return await service.reset_password_for(current_user.id, user_id, reset_data.new_password)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


