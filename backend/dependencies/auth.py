from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from jose import JWTError, jwt
from config.settings import settings
from database.models.user import User
from .database import get_global_db

# Sử dụng HTTPBearer thay vì OAuth2PasswordBearer để đơn giản hơn
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_global_db),  # Sử dụng global DB cho auth
) -> User:
    """Lấy thông tin user hiện tại từ JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        token_iat: int = payload.get("iat")  # Issued at time của token

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    # Lấy user từ database
    # Luôn tìm user theo ID trước
    result = await db.execute(select(User).filter(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    # User đã bị disable thì token hiện tại cũng không được dùng tiếp
    if int(getattr(user, "is_active", 0) or 0) != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Kiểm tra token có bị invalidate do đổi mật khẩu không
    # Nếu user đã đổi mật khẩu sau khi token được tạo, token này không còn hợp lệ
    if user.password_changed_at:
        # Nếu token không có iat (token cũ), invalidate luôn nếu password đã đổi
        if not token_iat:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been invalidated due to password change. Please login again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Nếu token có iat, kiểm tra xem password đổi sau khi token được tạo
        token_issued_at = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if user.password_changed_at > token_issued_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been invalidated due to password change. Please login again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Kiểm tra quyền truy cập tenant
    if tenant_id:
        # Nếu user là root (tenant_id = NULL), cho phép truy cập bất kỳ tenant nào
        if not user.is_root_user and user.tenant_id != int(tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have access to this tenant",
            )

    return user


async def get_current_tenant_id_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> int:
    """Lấy tenant_id từ JWT token"""
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        tenant_id: str = payload.get("tenant_id")

        if tenant_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token does not contain tenant_id",
            )
        return int(tenant_id)

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )


async def get_current_tenant_id(current_user: User = Depends(get_current_user)) -> int:
    """Lấy tenant_id từ current user (deprecated - use get_current_tenant_id_from_token instead)"""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with any tenant",
        )
    return current_user.tenant_id
