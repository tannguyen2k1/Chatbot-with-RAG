# --- IMPORTS & ROUTER KHAI BÁO ĐẦU FILE ---
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database.models.auth_models import User
from middleware.dependencies import get_db, get_current_user
from security import verify_token
from services.auth import AuthService
from config.settings import settings
from validators.auth import (
    RefreshTokenRequest, TokenResponse, Login, 
    ChangePasswordRequest, SimpleResetPasswordRequest, MessageResponse,
    LoginRequest, ResetPasswordRequest, ResetPasswordConfirm
)
from services.user import UserService, UserCreate

router = APIRouter(prefix="/auth", tags=["auth"])
# Endpoint: Register (chuẩn fullstackhero)
@router.post("/register", response_model=TokenResponse)
def register(
    user_data: LoginRequest,
    db: Session = Depends(get_db)
):
    service = UserService(db)
    # Check if user exists
    if db.query(User).filter((User.email == user_data.email) | (User.username == user_data.email)).first():
        raise HTTPException(status_code=400, detail="User already exists")
    # Tạo user mới
    user_create = UserCreate(username=user_data.email, email=user_data.email, password=user_data.password)
    user = service.create_user(user_create)
    auth_service = AuthService(db)
    access_token = auth_service.create_access_token(user)
    refresh_token = auth_service.create_refresh_token(user)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, token_type="bearer")

# Endpoint: Forgot password (gửi email, mô phỏng)
@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    data: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    try:
        user = auth_service.get_user_by_email(data.email)
        reset_token = auth_service.create_reset_token(user)
        # TODO: Gửi email thực tế, ở đây chỉ trả về token để test
        return MessageResponse(message=f"Reset token (test): {reset_token}")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Endpoint: Reset password confirm (qua token)
@router.post("/reset-password-confirm", response_model=MessageResponse)
def reset_password_confirm(
    data: ResetPasswordConfirm,
    db: Session = Depends(get_db)
):
    auth_service = AuthService(db)
    try:
        auth_service.reset_password(data.token, data.new_password)
        return MessageResponse(message="Password reset successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Endpoint: Get current user info (me)
@router.get("/me", response_model=Login)
def get_me(current_user: User = Depends(get_current_user)):
    return Login(username=current_user.username, password="protected")

# Endpoint: Logout (chuẩn fullstackhero, chỉ là dummy)
@router.post("/logout", response_model=MessageResponse)
def logout():
    return MessageResponse(message="Logged out (client hãy xóa token)")
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database.models.auth_models import User
from middleware.dependencies import get_db, get_current_user
from security import verify_token
from services.auth import AuthService
from config.settings import settings
from validators.auth import (
    RefreshTokenRequest, TokenResponse, Login, 
    ChangePasswordRequest, SimpleResetPasswordRequest, MessageResponse
)

router = APIRouter(prefix="/auth", tags=["auth"])

# Endpoint: Simple login with JSON body
@router.post("/login", response_model=TokenResponse)
def login(
    login_data: Login,
    db: Session = Depends(get_db)
):
    """
    Đăng nhập đơn giản với username và password
    """
    auth_service = AuthService(db)
    try:
        user = auth_service.authenticate_user(login_data.username, login_data.password)
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
def refresh_access_token(
        refresh_data: RefreshTokenRequest,
        db: Session = Depends(get_db)
):
    # Verify the refresh token
    payload = verify_token(refresh_data.refresh_token, is_refresh=True)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    # Query the user from the database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    auth_service = AuthService(db)
    # Create new tokens for the user
    new_access_token = auth_service.create_access_token(user)
    new_refresh_token = auth_service.create_refresh_token(user)

    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer"
    )

# Endpoint: Change password
@router.put("/change-password", response_model=MessageResponse)
def change_password(
    change_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Đổi mật khẩu cho user hiện tại
    """
    auth_service = AuthService(db)
    try:
        auth_service.change_password(
            current_user, 
            change_data.current_password, 
            change_data.new_password
        )
        return MessageResponse(message="Password changed successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# Endpoint: Simple reset password 
@router.post("/reset-password", response_model=MessageResponse)
def reset_password(
    reset_data: SimpleResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password đơn giản với username và new_password
    """
    auth_service = AuthService(db)
    try:
        auth_service.simple_reset_password(reset_data.username, reset_data.new_password)
        return MessageResponse(message=f"Password has been reset successfully for user: {reset_data.username}")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))