from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
from database.models import User
from dependencies import get_current_user, get_db
from dependencies.database import get_global_db
from services.auth import AuthService
from config.settings import settings
from schemas import (TokenResponse, 
                     LoginRequest,
                     ChangePasswordRequest, 
                     SimpleResetPasswordRequest, 
                     MessageResponse)



router = APIRouter(prefix="/auth", tags=["auth"])
REMEMBER_ME_COOKIE_NAME = "remember_me"


def get_auth_service(db: AsyncSession = Depends(get_global_db)) -> AuthService:
    """Dependency injection cho AuthService (dùng global db)"""
    return AuthService(db)


def get_auth_service_session(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Dependency injection cho AuthService (dùng session db)"""
    return AuthService(db)


def set_refresh_cookie(response: Response, refresh_token: str, remember_me: bool) -> None:
    cookie_kwargs = dict(
        key=settings.REFRESH_COOKIE_NAME,
        value=refresh_token,
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.REFRESH_COOKIE_DOMAIN,
    )
    if remember_me:
        cookie_kwargs["max_age"] = settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60

    response.set_cookie(**cookie_kwargs)

# Endpoint: Simple login with JSON body
@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    service: AuthService = Depends(get_auth_service)
):
    """
    Đăng nhập với username, password và tenant_code
    """
    try:
        user, tenant = await service.authenticate_user(
            login_data.username, 
            login_data.password,
            login_data.tenant_code
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    access_token = await service.create_access_token(
        user,
        tenant,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    refresh_token = await service.create_refresh_token(
        user,
        tenant,
        expires_delta=timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    )

    # Set refresh token cookie theo remember_me:
    # - remember_me=True  -> persistent cookie
    # - remember_me=False -> session cookie (mất khi đóng browser)
    set_refresh_cookie(response, refresh_token, login_data.remember_me)
    response.set_cookie(
        key=REMEMBER_ME_COOKIE_NAME,
        value="1" if login_data.remember_me else "0",
        httponly=True,
        secure=settings.REFRESH_COOKIE_SECURE,
        samesite=settings.REFRESH_COOKIE_SAMESITE,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.REFRESH_COOKIE_DOMAIN,
        max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60 if login_data.remember_me else None,
    )

    # Get user info with roles and permissions (dùng service)
    user_dict = await service.get_user_info_dict(user)
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
        service: AuthService = Depends(get_auth_service_session)
):
    try:
        # Get refresh token from cookie
        refresh_token = request.cookies.get("refresh_token")
        if not refresh_token:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token found")
        
        new_access_token, new_refresh_token = await service.refresh_tokens(refresh_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))

    remember_me = request.cookies.get(REMEMBER_ME_COOKIE_NAME) == "1"
    set_refresh_cookie(response, new_refresh_token, remember_me)

    # Lấy user từ refresh token
    user = await service.get_user_from_refresh_token(refresh_token)
    user_dict = await service.get_user_info_dict(user)
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
    service: AuthService = Depends(get_auth_service)
):
    """
    Đổi mật khẩu cho user hiện tại
    Sử dụng get_global_db để tránh tenant filtering khi update password (đặc biệt cho root user)
    """
    try:
        await service.change_password(
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
        key=settings.REFRESH_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.REFRESH_COOKIE_DOMAIN,
    )
    response.delete_cookie(
        key=REMEMBER_ME_COOKIE_NAME,
        path=settings.REFRESH_COOKIE_PATH,
        domain=settings.REFRESH_COOKIE_DOMAIN,
    )
    return MessageResponse(message="Logged out successfully")


# Endpoint: Simple reset password 
@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: SimpleResetPasswordRequest,
    service: AuthService = Depends(get_auth_service_session)
):
    """
    Reset password đơn giản với username và new_password
    """
    try:
        await service.simple_reset_password(reset_data.username, reset_data.new_password)
        return MessageResponse(message=f"Password has been reset successfully for user: {reset_data.username}")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
