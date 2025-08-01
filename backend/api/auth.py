from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from database.models import User
from middleware.dependency import get_db, get_current_user
from middleware.security import verify_token
from services import AuthService , RBACService
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
def login(
    login_data: LoginRequest,
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
    
@router.get("/me", response_model=UserResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # RBAC: build permissions từ role/privileges
    role_service = RBACService(db)
    user_dict = current_user.__dict__.copy()
    # Lấy đủ quyền: merge các quyền từ tất cả role của user
    perms = role_service.get_user_permissions(current_user.id)
    # Đảm bảo không bị thiếu quyền nào (nếu cần merge thêm global hoặc các quyền đặc biệt thì xử lý ở đây)
    user_dict["permissions"] = perms
    # Chuẩn RBAC: trả về roles là mảng tên role
    user_roles = db.query(UserRole).filter_by(user_id=current_user.id).all()
    role_ids = [ur.role_id for ur in user_roles]
    roles = db.query(Role).filter(Role.id.in_(role_ids)).all() if role_ids else []
    user_dict["roles"] = [r.name for r in roles]
    return UserResponse(**user_dict)