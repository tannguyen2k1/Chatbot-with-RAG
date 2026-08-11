from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from database.models.user import User
from dependencies import get_current_user, get_db
from schemas import PaginatedUserResponse, PermissionError, UserCreate, UserResponse, UserUpdate
from schemas.user import UserResetPassword
from services import UserService
from services.rbac_helper import ensure_permission_global

router = APIRouter(prefix="/users", tags=["users"])


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.update_user_for(current_user.id, current_user.id, update_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.create_user_for(current_user.id, user_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.get("", response_model=PaginatedUserResponse)
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", description="Search by username or email"),
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.list_users_for(current_user.id, page, page_size, search)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.get_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    update_data: UserUpdate,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.update_user_for(current_user.id, user_id, update_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user(
    user_id: int,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return await service.delete_user_for(current_user.id, user_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e


@router.post("/{user_id}/reset-password", status_code=status.HTTP_200_OK)
async def reset_user_password(
    user_id: int,
    reset_data: UserResetPassword,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
):
    await ensure_permission_global(current_user.id, "user", "reset-password")
    try:
        return await service.reset_password_for(current_user.id, user_id, reset_data.new_password)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e)) from e
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
