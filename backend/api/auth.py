from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from database.models import User
from middleware.dependency import get_db, get_current_user
from services import AuthService
from config.settings import settings
from database.models.auth_models import UserRole, Role
from schemas import (RefreshTokenRequest, 
                     TokenResponse, 
                     LoginRequest,
                     ChangePasswordRequest, 
                     SimpleResetPasswordRequest, 
                     MessageResponse,
                     UserResponse)



router = APIRouter(prefix="/auth", tags=["auth"])

# Endpoint: Simple login with JSON body
@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Đăng nhập đơn giản với username và password
    """
    auth_service = AuthService(db)
    try:
        user = await auth_service.authenticate_user(login_data.username, login_data.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    access_token = auth_service.create_access_token(
        user,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = auth_service.create_refresh_token(
        user,
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer"
    )

# Endpoint: Create refresh token
@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
        refresh_data: RefreshTokenRequest,
        db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    try:
        new_access_token, new_refresh_token = await auth_service.refresh_tokens(refresh_data.refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )

# Endpoint: Change password
@router.put("/change-password", response_model=MessageResponse)
async def change_password(
    change_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Đổi mật khẩu cho user hiện tại
    """
    auth_service = AuthService(db)
    try:
        await auth_service.change_password(
            current_user, 
            change_data.current_password, 
            change_data.new_password
        )
        return MessageResponse(message="Password changed successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Endpoint: Simple reset password 
@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: SimpleResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password đơn giản với username và new_password
    """
    auth_service = AuthService(db)
    try:
        await auth_service.simple_reset_password(reset_data.username, reset_data.new_password)
        return MessageResponse(message=f"Password has been reset successfully for user: {reset_data.username}")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    
@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    auth_service = AuthService(db)
    user_dict = await auth_service.get_user_profile(current_user)
    return UserResponse(**user_dict)