from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from database.models import User
from schemas import UserCreate, UserUpdate
from typing import Optional

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data: UserCreate) -> User:
        # Check if username already exists
        result = await self.db.execute(select(User).filter_by(username=user_data.username))
        existing_username = result.scalar_one_or_none()
        if existing_username:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with username '{user_data.username}' already exists."
            )
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash(user_data.password)
        new_user = User(
            username=user_data.username,
            email=user_data.email,
            hashed_password=hashed_password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            is_active=user_data.is_active
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user


    async def get_user(self, user_id: int) -> Optional[User]:
        result = await self.db.execute(select(User).filter(User.id == user_id))
        return result.scalar_one_or_none()


    async def update_user(self, user_id: int, update_data: UserUpdate) -> Optional[User]:
        from database.models.auth_models import UserRole, Role
        user = await self.get_user(user_id)
        if not user:
            return None
        update_dict = {}
        if update_data.username is not None:
            update_dict["username"] = update_data.username
        if update_data.email is not None:
            update_dict["email"] = update_data.email
        if update_data.full_name is not None:
            update_dict["full_name"] = update_data.full_name
        if update_data.phone is not None:
            update_dict["phone"] = update_data.phone
        if update_data.is_active is not None:
            update_dict["is_active"] = update_data.is_active
        # Xử lý cập nhật role (RBAC)
        if update_data.role is not None:
            # Xóa hết user_roles cũ
            await self.db.execute(delete(UserRole).filter_by(user_id=user_id))
            # Tìm role id mới
            result = await self.db.execute(select(Role).filter_by(name=update_data.role))
            role_obj = result.scalar_one_or_none()
            if role_obj:
                new_user_role = UserRole(user_id=user_id, role_id=role_obj.id)
                self.db.add(new_user_role)
        if update_dict:
            stmt = update(User).filter(User.id == user_id).values(**update_dict)
            await self.db.execute(stmt)
        await self.db.commit()
        await self.db.refresh(user)
        return user


    async def delete_user(self, user_id: int) -> bool:
        user = await self.get_user(user_id)
        if not user:
            return False
        await self.db.delete(user)
        await self.db.commit()
        return True


    async def list_users(self, skip: int = 0, limit: int = 10, search: str = "") -> list[User]:
        query = select(User)
        if search:
            search_lower = f"%{search.lower()}%"
            query = query.filter(
                (User.username.ilike(search_lower)) |
                (User.email.ilike(search_lower))
            )
        query = query.order_by(User.id.asc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_users(self, search: str = "") -> int:
        query = select(User)
        if search:
            search_lower = f"%{search.lower()}%"
            query = query.filter(
                (User.username.ilike(search_lower)) |
                (User.email.ilike(search_lower))
            )
        result = await self.db.execute(query)
        return len(result.scalars().all())