from datetime import UTC, datetime, timedelta
from uuid import uuid4

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from config.settings import settings
from database.models import Role, User, UserRole
from database.models.refresh_token import RefreshToken

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"
TOKEN_TYPE_PASSWORD_RESET = "password_reset"


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @staticmethod
    def _is_user_active(user: User) -> bool:
        return int(getattr(user, "is_active", 0) or 0) == 1

    async def authenticate_user(self, username: str, password: str) -> User:
        result = await self.db.execute(select(User).filter(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError(f"User '{username}' not found")

        if not self._is_user_active(user):
            raise ValueError(f"User '{username}' is deactivated")

        if not pwd_context.verify(password, str(user.hashed_password)):
            raise ValueError("Incorrect password")

        return user

    async def _get_primary_role(self, user: User) -> str:
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        if not user_roles:
            return "user"
        role_ids = [ur.role_id for ur in user_roles]
        result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
        roles = result.scalars().all()
        return roles[0].name if roles else "user"

    async def create_access_token(
        self,
        user: User,
        expires_delta: timedelta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    ) -> str:
        primary_role = await self._get_primary_role(user)

        now = datetime.now(UTC)
        expire = now + expires_delta
        payload = {
            "sub": str(user.id),
            "type": TOKEN_TYPE_ACCESS,
            "role": primary_role,
            "iat": int(now.timestamp()),
            "exp": int(expire.timestamp()),
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    async def create_refresh_token(
        self,
        user: User,
        expires_delta: timedelta = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES),
        *,
        commit: bool = True,
    ) -> str:
        now = datetime.now(UTC)
        expire = now + expires_delta
        jti = uuid4().hex
        payload = {
            "sub": str(user.id),
            "type": TOKEN_TYPE_REFRESH,
            "jti": jti,
            "iat": int(now.timestamp()),
            "exp": int(expire.timestamp()),
        }

        self.db.add(
            RefreshToken(
                jti=jti,
                user_id=user.id,
                expires_at=expire,
            )
        )
        if commit:
            await self.db.commit()

        return jwt.encode(payload, settings.JWT_REFRESH_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    async def _get_refresh_record(self, jti: str) -> RefreshToken | None:
        result = await self.db.execute(select(RefreshToken).filter_by(jti=jti))
        return result.scalar_one_or_none()

    async def revoke_refresh_jti(self, jti: str, replaced_by_jti: str | None = None) -> None:
        record = await self._get_refresh_record(jti)
        if not record or record.revoked_at:
            return
        record.revoked_at = datetime.now(UTC)
        if replaced_by_jti:
            record.replaced_by_jti = replaced_by_jti
        await self.db.commit()

    async def revoke_all_refresh_tokens(self, user_id: int) -> None:
        now = datetime.now(UTC)
        await self.db.execute(
            update(RefreshToken)
            .where(
                RefreshToken.user_id == user_id,
                RefreshToken.revoked_at.is_(None),
            )
            .values(revoked_at=now)
        )
        await self.db.commit()

    async def change_password(self, user: User, current_password: str, new_password: str) -> bool:
        if not pwd_context.verify(current_password, str(user.hashed_password)):
            raise ValueError("Current password is incorrect")

        hashed_new_password = pwd_context.hash(new_password)

        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()

        if not user_to_update:
            raise ValueError("User not found in database")

        if user_to_update.id != user.id:
            raise ValueError("User ID mismatch - security check failed")

        user_to_update.hashed_password = hashed_new_password
        user_to_update.password_changed_at = datetime.now(UTC)
        await self.db.commit()
        await self.db.refresh(user_to_update)
        await self.revoke_all_refresh_tokens(user.id)
        return True

    def create_reset_token(self, user: User) -> str:
        expire = datetime.now(UTC) + timedelta(minutes=15)
        payload = {
            "sub": str(user.id),
            "type": TOKEN_TYPE_PASSWORD_RESET,
            "exp": int(expire.timestamp()),
        }
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    async def verify_reset_token(self, token: str) -> User:
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub")
            token_type = payload.get("type")

            if user_id is None or token_type != TOKEN_TYPE_PASSWORD_RESET:
                raise ValueError("Invalid token")

            result = await self.db.execute(select(User).filter(User.id == int(user_id)))
            user = result.scalar_one_or_none()
            if not user:
                raise ValueError("User not found")

            return user
        except JWTError:
            raise ValueError("Invalid or expired reset token") from None

    async def reset_password(self, token: str, new_password: str) -> bool:
        user = await self.verify_reset_token(token)

        hashed_new_password = pwd_context.hash(new_password)

        stmt = select(User).filter(User.id == user.id)
        result = await self.db.execute(stmt)
        user_to_update = result.scalar_one_or_none()
        if user_to_update:
            user_to_update.hashed_password = hashed_new_password
            user_to_update.password_changed_at = datetime.now(UTC)
            await self.db.commit()
            await self.db.refresh(user_to_update)
            await self.revoke_all_refresh_tokens(user.id)

        return True

    def _decode_refresh_payload(self, refresh_token: str) -> dict:
        try:
            payload = jwt.decode(
                refresh_token,
                settings.JWT_REFRESH_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
            )
        except JWTError as exc:
            raise ValueError("Invalid or expired refresh token") from exc

        if payload.get("type") != TOKEN_TYPE_REFRESH:
            raise ValueError("Invalid refresh token type")
        if payload.get("sub") is None:
            raise ValueError("Invalid token payload")
        if not payload.get("jti"):
            raise ValueError("Invalid refresh token: missing jti")
        return payload

    async def refresh_tokens(self, refresh_token: str) -> tuple[str, str]:
        payload = self._decode_refresh_payload(refresh_token)
        user_id = payload.get("sub")
        token_iat = payload.get("iat")
        jti = payload.get("jti")

        result = await self.db.execute(select(RefreshToken).where(RefreshToken.jti == jti).with_for_update())
        record = result.scalar_one_or_none()
        if not record:
            raise ValueError("Refresh token is not recognized")

        if record.revoked_at is not None:
            await self.revoke_all_refresh_tokens(record.user_id)
            raise ValueError("Refresh token reuse detected. Please login again.")

        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=UTC)
        if expires_at < datetime.now(UTC):
            record.revoked_at = datetime.now(UTC)
            await self.db.commit()
            raise ValueError("Refresh token has expired")

        result = await self.db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")

        if not self._is_user_active(user):
            raise ValueError("User is deactivated")

        if user.password_changed_at:
            if not token_iat:
                raise ValueError("Refresh token has been invalidated due to password change. Please login again.")
            token_issued_at = datetime.fromtimestamp(token_iat, tz=UTC)
            if user.password_changed_at > token_issued_at:
                raise ValueError("Refresh token has been invalidated due to password change. Please login again.")

        new_access_token = await self.create_access_token(user)
        new_refresh_token = await self.create_refresh_token(user, commit=False)

        new_payload = self._decode_refresh_payload(new_refresh_token)
        record.revoked_at = datetime.now(UTC)
        record.replaced_by_jti = new_payload.get("jti")
        await self.db.commit()

        return new_access_token, new_refresh_token

    async def get_user_info_dict(self, user: User) -> dict:
        from database.models.auth_models import Role, UserRole
        from services.rbac import RBACService

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
        payload = self._decode_refresh_payload(refresh_token)
        user_id = payload.get("sub")

        result = await self.db.execute(select(User).filter(User.id == int(user_id)))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found")
        if not self._is_user_active(user):
            raise ValueError("User is deactivated")
        return user

    async def revoke_refresh_token_string(self, refresh_token: str) -> None:
        try:
            payload = self._decode_refresh_payload(refresh_token)
        except ValueError:
            return
        jti = payload.get("jti")
        if jti:
            await self.revoke_refresh_jti(jti)

    async def get_user_by_email(self, email: str) -> User:
        result = await self.db.execute(select(User).filter(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User with this email not found")
        return user
