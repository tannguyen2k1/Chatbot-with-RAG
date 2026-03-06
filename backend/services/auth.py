from datetime import timedelta, datetime, timezone
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, UserRole, Role, Tenant
from config.settings import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _is_user_active(user: User) -> bool:
        # users.is_active is stored as Integer (1/0)
        return int(getattr(user, "is_active", 0) or 0) == 1

    async def authenticate_user(
        self, username: str, password: str, tenant_code: str
    ) -> tuple[User, Tenant]:
        # Tìm tenant theo tenant_code
        tenant_result = await self.db.execute(
            select(Tenant).filter(Tenant.tenant_code == tenant_code)
        )
        tenant = tenant_result.scalar_one_or_none()
        if not tenant:
            raise ValueError(f"Tenant with code '{tenant_code}' not found")

        # Kiểm tra tenant có active không
        if not tenant.is_active:
            raise ValueError(f"Tenant '{tenant_code}' is deactivated")

        # Kiểm tra tenant có hết hạn không
        if tenant.expiration_date and tenant.expiration_date < datetime.now(
            timezone.utc
        ):
            raise ValueError(f"Tenant '{tenant_code}' has expired")

        # Tìm user với username (không filter theo tenant để root có thể login vào bất kỳ tenant nào)
        result = await self.db.execute(select(User).filter(User.username == username))

        user = result.scalar_one_or_none()
        if not user:
            raise ValueError(f"User '{username}' not found")

        # Chặn đăng nhập nếu user đã bị disable
        if not self._is_user_active(user):
            raise ValueError(f"User '{username}' is deactivated")

        # Kiểm tra password
        if not pwd_context.verify(password, str(user.hashed_password)):
            raise ValueError("Incorrect password")

        # Kiểm tra xem user có quyền truy cập tenant này không
        # Root user (tenant_id = NULL) có thể truy cập bất kỳ tenant nào
        if not user.is_root_user and user.tenant_id != tenant.id:
            raise ValueError(
                f"User '{username}' does not have permission to access tenant '{tenant_code}'"
            )

        # Set tenant context cho session nếu là TenantSession
        if hasattr(self.db, "set_tenant_context"):
            self.db.set_tenant_context(tenant.id)

        return user, tenant

    async def create_access_token(
        self,
        user: User,
        tenant: Tenant = None,
        expires_delta: timedelta = timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    ) -> str:
        # Get user's primary role from user_roles table
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()

        # Get role names
        role_names = []
        if user_roles:
            role_ids = [ur.role_id for ur in user_roles]
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
            role_names = [r.name for r in roles]

        # Use first role as primary role, or "user" as default
        primary_role = role_names[0] if role_names else "user"

        # Nếu có tenant được truyền vào (cho root user), sử dụng tenant đó
        # Ngược lại sử dụng tenant_id của user
        current_tenant_id = tenant.id if tenant else user.tenant_id

        now = datetime.now(timezone.utc)
        expire = now + expires_delta
        payload = {
            "sub": str(user.id),
            "role": primary_role,
            "tenant_id": str(current_tenant_id) if current_tenant_id else None,
            "iat": int(now.timestamp()),  # Issued at - thời gian token được tạo
            "exp": int(expire.timestamp()),  # exp phải là integer, không phải string!
        }
        return jwt.encode(
            payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    async def create_refresh_token(
        self,
        user: User,
        tenant: Tenant = None,
        expires_delta: timedelta = timedelta(
            minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
        ),
    ) -> str:
        # Get user's primary role from user_roles table
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()

        # Get role names
        role_names = []
        if user_roles:
            role_ids = [ur.role_id for ur in user_roles]
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
            role_names = [r.name for r in roles]

        # Use first role as primary role, or "user" as default
        primary_role = role_names[0] if role_names else "user"

        # Nếu có tenant được truyền vào (cho root user), sử dụng tenant đó
        # Ngược lại sử dụng tenant_id của user
        current_tenant_id = tenant.id if tenant else user.tenant_id

        now = datetime.now(timezone.utc)
        expire = now + expires_delta
        payload = {
            "sub": str(user.id),
            "role": primary_role,
            "tenant_id": str(current_tenant_id) if current_tenant_id else None,
            "iat": int(now.timestamp()),  # Issued at - thời gian token được tạo
            "exp": int(expire.timestamp()),  # exp phải là integer, không phải string!
        }
        return jwt.encode(
            payload, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )

    async def change_password(
        self, user: User, current_password: str, new_password: str
    ) -> bool:
        """Đổi mật khẩu cho user hiện tại"""
        # Verify current password
        if not pwd_context.verify(current_password, str(user.hashed_password)):
            raise ValueError("Current password is incorrect")

        # Hash new password
        hashed_new_password = pwd_context.hash(new_password)

        # Use async update - query lại user từ database để đảm bảo an toàn
        # Query theo primary key (user.id) - unique trong toàn bộ database, không thể trùng
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()

        if not user_to_update:
            raise ValueError("User not found in database")

        # Double check: verify user ID khớp (thêm layer bảo mật)
        if user_to_update.id != user.id:
            raise ValueError("User ID mismatch - security check failed")

        # Update password và set password_changed_at để invalidate các token cũ
        user_to_update.hashed_password = hashed_new_password
        user_to_update.password_changed_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(user_to_update)
        return True

    def create_reset_token(self, user: User) -> str:
        """Tạo token để reset password (có thời hạn ngắn)"""
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
        payload = {
            "sub": str(user.id),
            "type": "password_reset",
            "exp": int(
                expire.timestamp()
            ),  # exp phải là integer, không phải string!  # Token có hiệu lực 15 phút
        }
        encoded_jwt = jwt.encode(
            payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    async def verify_reset_token(self, token: str) -> User:
        """Verify reset password token và trả về user"""
        try:
            payload = jwt.decode(
                token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
            )
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

        # Update password in database và set password_changed_at để invalidate các token cũ
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            user_to_update.password_changed_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(user_to_update)

        return True

    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str]:
        """Tạo cặp access/refresh token mới từ refresh token hợp lệ"""
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_REFRESH_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            user_id = payload.get("sub")
            tenant_id = payload.get("tenant_id")
            token_iat = payload.get("iat")  # Issued at time của token
            if user_id is None:
                raise ValueError("Invalid token payload")
        except JWTError:
            raise ValueError("Invalid or expired refresh token")

        result = await self.db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        # User đã bị disable thì refresh token cũng phải bị từ chối
        if not self._is_user_active(user):
            raise ValueError("User is deactivated")

        # Kiểm tra refresh token có bị invalidate do đổi mật khẩu không
        # Nếu user đã đổi mật khẩu sau khi token được tạo, token này không còn hợp lệ
        if user.password_changed_at:
            # Nếu token không có iat (token cũ), invalidate luôn nếu password đã đổi
            if not token_iat:
                raise ValueError(
                    "Refresh token has been invalidated due to password change. Please login again."
                )
            # Nếu token có iat, kiểm tra xem password đổi sau khi token được tạo
            token_issued_at = datetime.fromtimestamp(token_iat, tz=timezone.utc)
            if user.password_changed_at > token_issued_at:
                raise ValueError(
                    "Refresh token has been invalidated due to password change. Please login again."
                )

        # Lấy tenant từ tenant_id trong token
        tenant = None
        if tenant_id:
            from database.models import Tenant

            result = await self.db.execute(
                select(Tenant).filter(Tenant.id == int(tenant_id))
            )
            tenant = result.scalar_one_or_none()

        new_access_token = await self.create_access_token(user, tenant)
        new_refresh_token = await self.create_refresh_token(user, tenant)
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

    async def get_user_from_refresh_token(self, refresh_token: str) -> User:
        """Giải mã refresh token và trả về user tương ứng"""
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_REFRESH_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
            user_id = payload.get("sub")
            if user_id is None:
                raise ValueError("Invalid token payload")
        except JWTError:
            raise ValueError("Invalid or expired refresh token")

        result = await self.db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        if not self._is_user_active(user):
            raise ValueError("User is deactivated")
        return user

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

        # Update password in database và set password_changed_at để invalidate các token cũ
        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            user_to_update.password_changed_at = datetime.now(timezone.utc)
            await self.db.commit()
            await self.db.refresh(user_to_update)

        return True
