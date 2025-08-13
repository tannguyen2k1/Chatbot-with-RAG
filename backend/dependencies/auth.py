from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import AsyncGenerator
from jose import JWTError, jwt
from config.settings import settings
from database.database import get_async_db
from database.models.user import User
from .database import get_db

# Sử dụng HTTPBearer thay vì OAuth2PasswordBearer để đơn giản hơn
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: AsyncSession = Depends(get_db)
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
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        tenant_id: str = payload.get("tenant_id")
        
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Lấy user từ database
    if tenant_id:
        # Nếu có tenant_id trong token, tìm user trong tenant đó
        result = await db.execute(
            select(User).filter(
                User.id == int(user_id),
                User.tenant_id == int(tenant_id)
            )
        )
    else:
        # Fallback: tìm user theo ID (cho trường hợp global user)
        result = await db.execute(select(User).filter(User.id == int(user_id)))
    
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_tenant_id(
    current_user: User = Depends(get_current_user)
) -> int:
    """Lấy tenant_id từ current user"""
    if not current_user.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not associated with any tenant"
        )
    return current_user.tenant_id
