from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import AsyncGenerator
from jose import JWTError, jwt
from config.settings import settings
from database.database import get_async_db
from database.models.user import User
from .database import get_db, get_global_db

# Sử dụng HTTPBearer thay vì OAuth2PasswordBearer để đơn giản hơn
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: AsyncSession = Depends(get_global_db)  # Sử dụng global DB cho auth
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
            
    except JWTError as e:
        raise credentials_exception
    
    # Lấy user từ database
    # Luôn tìm user theo ID trước
    result = await db.execute(select(User).filter(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    # Kiểm tra quyền truy cập tenant
    if tenant_id:
        # Nếu user là root (tenant_id = NULL), cho phép truy cập bất kỳ tenant nào
        if not user.is_root_user and user.tenant_id != int(tenant_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User does not have access to this tenant"
            )
    
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
