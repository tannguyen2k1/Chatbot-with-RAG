from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta
from typing import Optional
from database.models import User
from dependencies import get_db, get_current_user
from dependencies.database import get_global_db
from services.auth import AuthService
from config.settings import settings
from schemas import (TokenResponse, 
                     LoginRequest,
                     ChangePasswordRequest, 
                     SimpleResetPasswordRequest, 
                     MessageResponse)



router = APIRouter(prefix="/auth", tags=["auth"])

# Endpoint: Simple login with JSON body
@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_global_db)
):
    """
    Đăng nhập với username, password và tenant_code
    """
    auth_service = AuthService(db)
    try:
        user, tenant = await auth_service.authenticate_user(
            login_data.username, 
            login_data.password,
            login_data.tenant_code
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    access_token = await auth_service.create_access_token(
        user,
        tenant,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = await auth_service.create_refresh_token(
        user,
        tenant,
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False, # Set to False for development (HTTP)
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,  # Convert to seconds
        path="/"
    )

    # Get user info with roles and permissions (dùng service)
    user_dict = await auth_service.get_user_info_dict(user)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_dict
    )

# Endpoint: Create refresh token
@router.post("/refresh", response_model=TokenResponse)
async def refresh_access_token(
        request: Request,
        response: Response,
        db: AsyncSession = Depends(get_db)
):
    auth_service = AuthService(db)
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token found")
        
        new_access_token, new_refresh_token = await auth_service.refresh_tokens(refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    # Update refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=False,  # Set to False for development (HTTP)
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    # Lấy user từ refresh token
    user = await auth_service.get_user_from_refresh_token(refresh_token)
    user_dict = await auth_service.get_user_info_dict(user)
    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        user=user_dict
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


# Endpoint: Logout
@router.post("/logout", response_model=MessageResponse)
async def logout(response: Response):
    """
    Đăng xuất và clear refresh token cookie
    """
    response.delete_cookie(
        key="refresh_token",
        path="/"
    )
    return MessageResponse(message="Logged out successfully")


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
    