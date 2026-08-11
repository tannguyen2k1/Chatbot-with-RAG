from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from jose import JWTError, jwt
from config.settings import settings
from database.models.user import User
from services.auth import TOKEN_TYPE_ACCESS
from .database import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Lấy thông tin user hiện tại từ JWT access token"""
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
        token_iat: int = payload.get("iat")
        token_type: str = payload.get("type")

        if user_id is None or token_type != TOKEN_TYPE_ACCESS:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).filter(User.id == int(user_id)))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception

    if int(getattr(user, "is_active", 0) or 0) != 1:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is deactivated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.password_changed_at:
        if not token_iat:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been invalidated due to password change. Please login again.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        token_issued_at = datetime.fromtimestamp(token_iat, tz=timezone.utc)
        if user.password_changed_at > token_issued_at:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been invalidated due to password change. Please login again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

    return user
