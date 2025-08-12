from datetime import timedelta, datetime, timezone
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, UserRole, Role
from services.rbac import RBACService
from config.settings import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_user(self, username: str, password: str) -> User:
        result = await self.db.execute(select(User).filter(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        if not pwd_context.verify(password, str(user.hashed_password)):
            raise ValueError("Incorrect password")
        return user

    def create_access_token(self, user: User, expires_delta: timedelta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)) -> str:
        expire = datetime.now(timezone.utc) + expires_delta
        payload = {
            "sub": str(user.id),
            "role": user.role,
            "exp": str(int(expire.timestamp()))
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    def create_refresh_token(self, user: User, expires_delta: timedelta = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)) -> str:
        expire = datetime.now(timezone.utc) + expires_delta
        payload = {
            "sub": str(user.id),
            "role": user.role,
            "exp": str(int(expire.timestamp()))
        }
        return jwt.encode(payload, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        """Đổi mật khẩu cho user hiện tại"""
        # Verify current password
        if not pwd_context.verify(current_password, str(user.hashed_password)):
            raise ValueError("Current password is incorrect")

        # Hash new password
        hashed_new_password = pwd_context.hash(new_password)
        
        # Use async update
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            await self.db.commit()
            await self.db.refresh(user_to_update)
        return True
    
    
    def create_reset_token(self, user: User) -> str:
        """Tạo token để reset password (có thời hạn ngắn)"""
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        payload = {
            "sub": str(user.id), 
            "type": "password_reset",
            "exp": str(int(expire.timestamp()))  # Token có hiệu lực 15 phút
        }
        encoded_jwt = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return encoded_jwt
    

    async def verify_reset_token(self, token: str) -> User:
        """Verify reset password token và trả về user"""
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
            token_type = payload.get("type")
            
            if user_id is None or token_type != "password_reset":
                raise ValueError("Invalid token")
                
            result = await self.db.execute(select(User).filter(User.id == int(user_id)))
            user = result.scalar_one_or_none()
            if not user:
                raise ValueError("User not found")
                
            return user
        except JWTError:
            raise ValueError("Invalid or expired reset token")
    
    
    async def reset_password(self, token: str, new_password: str) -> bool:
        """Reset password bằng token"""
        user = await self.verify_reset_token(token)
        
        # Hash new password
        hashed_new_password = pwd_context.hash(new_password)
        
        # Update password in database
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            await self.db.commit()
            await self.db.refresh(user_to_update)
        
        return True
    
    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str]:
        """Tạo cặp access/refresh token mới từ refresh token hợp lệ"""
        try:
            payload = jwt.decode(refresh_token, settings.JWT_REFRESH_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
            if user_id is None:
                raise ValueError("Invalid token payload")
        except JWTError:
            raise ValueError("Invalid or expired refresh token")

        result = await self.db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        new_access_token = self.create_access_token(user)
        new_refresh_token = self.create_refresh_token(user)
        return new_access_token, new_refresh_token
            
    async def get_user_info_dict(self, user: User) -> dict:
        """Trả về dict user kèm roles, permissions, loại bỏ trường nhạy cảm"""
        from services.rbac import RBACService
        from database.models.auth_models import UserRole, Role
        from sqlalchemy import select
        role_service = RBACService(self.db)
        user_dict = user.__dict__.copy()
        perms = await role_service.get_user_permissions(user.id)
        user_dict["permissions"] = perms
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        if role_ids:
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
        else:
            roles = []
        user_dict["roles"] = [r.name for r in roles]
        user_dict.pop("hashed_password", None)
        user_dict.pop("_sa_instance_state", None)
        return user_dict

    
    async def get_user_by_email(self, email: str) -> User:
        """Lấy user theo email"""
        result = await self.db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User with this email not found")
        return user
    
    
    async def simple_reset_password(self, username: str, new_password: str) -> bool:
        """Reset password đơn giản chỉ với username và new_password"""
        result = await self.db.execute(select(User).filter(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        
        # Hash new password
        hashed_new_password = pwd_context.hash(new_password)
        
        # Update password in database
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            await self.db.commit()
            await self.db.refresh(user_to_update)
        
        return True