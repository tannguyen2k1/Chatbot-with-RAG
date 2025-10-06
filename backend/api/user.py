from schemas import UserResponse, PaginatedUserResponse, UserCreate, UserUpdate, PermissionError  # Pydantic response model for users
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from dependencies import get_db, get_current_user, get_current_tenant_id_from_token
from services import UserService

router = APIRouter(prefix="/users", tags=["users"])

# Endpoint: User tự cập nhật thông tin cá nhân
@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """User tự cập nhật thông tin cá nhân (email, phone, full_name)"""
    service = UserService(db)
    try:
        return await service.update_user_for(current_user.id, current_user.id, update_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


# Endpoint: Create a new user (Root/Admin only)
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_id: int = Depends(get_current_tenant_id_from_token)
):
    service = UserService(db)
    try:
        return await service.create_user_for(current_user.id, user_data, tenant_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Retrieve a list of users (Admin/Root only)
@router.get("/", response_model=PaginatedUserResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by username or email"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user),
    tenant_id: int = Depends(get_current_tenant_id_from_token)
):
    service = UserService(db)
    try:
        return await service.list_users_for(current_user.id, page, page_size, search, tenant_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Retrieve user details by ID (Root/Admin có thể xem theo cấp độ)
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = UserService(db)
    try:
        return await service.get_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Update user details by ID (Root/Admin có thể quản lý theo cấp độ)
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    update_data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = UserService(db)
    try:
        return await service.update_user_for(current_user.id, user_id, update_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

# Endpoint: Delete a user by ID (Root có thể xóa tất cả, Admin chỉ xóa user)
@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = UserService(db)
    try:
        return await service.delete_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))




