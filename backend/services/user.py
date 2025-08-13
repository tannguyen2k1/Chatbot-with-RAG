from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update
from database.models import User
from schemas import UserCreate, UserUpdate, UserResponse, PaginatedUserResponse
from typing import Optional
from services import RBACService
from database.models.auth_models import UserRole, Role

class UserService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_user(self, user_data: UserCreate, tenant_id: int) -> User:
        # Check if username already exists in the same tenant
        result = await self.db.execute(
            select(User).filter(
                User.username == user_data.username,
                User.tenant_id == tenant_id
            )
        )
        existing_username = result.scalar_one_or_none()
        if existing_username:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"User with username '{user_data.username}' already exists in this tenant."
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
            is_active=user_data.is_active,
            tenant_id=tenant_id
        )
        self.db.add(new_user)
        await self.db.commit()
        await self.db.refresh(new_user)
        return new_user


    async def get_user(self, user_id: int, tenant_id: int) -> Optional[User]:
        result = await self.db.execute(
            select(User).filter(
                User.id == user_id,
                User.tenant_id == tenant_id
            )
        )
        return result.scalar_one_or_none()


    async def update_user(self, user_id: int, update_data: UserUpdate, tenant_id: int) -> Optional[User]:
        from database.models.auth_models import UserRole, Role
        user = await self.get_user(user_id, tenant_id)
        if not user:
            return None
        
        # Check trùng username trong cùng tenant
        if update_data.username is not None:
            result = await self.db.execute(
                select(User).filter(
                    User.username == update_data.username, 
                    User.id != user_id,
                    User.tenant_id == tenant_id
                )
            )
            from fastapi import HTTPException, status
            if result.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"User with username '{update_data.username}' already exists in this tenant."
                )

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


    async def delete_user(self, user_id: int, tenant_id: int) -> bool:
        user = await self.get_user(user_id, tenant_id)
        if not user:
            return False
        await self.db.delete(user)
        await self.db.commit()
        return True


    async def list_users(self, tenant_id: int, skip: int = 0, limit: int = 10, search: str = "") -> list[User]:
        query = select(User).filter(User.tenant_id == tenant_id)
        if search:
            search_lower = f"%{search.lower()}%"
            query = query.filter(
                (User.username.ilike(search_lower)) |
                (User.email.ilike(search_lower))
            )
        query = query.order_by(User.id.asc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def count_users(self, tenant_id: int, search: str = "") -> int:
        query = select(User).filter(User.tenant_id == tenant_id)
        if search:
            search_lower = f"%{search.lower()}%"
            query = query.filter(
                (User.username.ilike(search_lower)) |
                (User.email.ilike(search_lower))
            )
        result = await self.db.execute(query)
        return len(result.scalars().all())

    # "For" methods that handle permissions and business logic
    async def create_user_for(self, current_user_id: int, user_data: UserCreate, tenant_id: int) -> UserResponse:
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "user", "create")
        
        user = await self.create_user(user_data, tenant_id)
        
        # Ensure user has at least one role assigned if role is provided in user_data
        if hasattr(user_data, 'role') and user_data.role:
            # Find role by name
            result = await self.db.execute(select(Role).filter_by(name=user_data.role))
            role_obj = result.scalar_one_or_none()
            if role_obj:
                # Check if user already has this role
                result = await self.db.execute(select(UserRole).filter_by(user_id=user.id, role_id=role_obj.id))
                existing = result.scalar_one_or_none()
                if not existing:
                    self.db.add(UserRole(user_id=user.id, role_id=role_obj.id))
                    await self.db.commit()
        
        # Get roles array
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        if role_ids:
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
        else:
            roles = []
        
        user_dict = user.__dict__.copy()
        user_dict["roles"] = [r.name for r in roles] if roles else []
        return UserResponse(**user_dict)

    async def list_users_for(self, current_user_id: int, tenant_id: int, page: int, page_size: int, search: str = "") -> PaginatedUserResponse:
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "user", "view")
        
        skip = (page - 1) * page_size
        users = await self.list_users(tenant_id, skip=skip, limit=page_size, search=search)
        total = await self.count_users(tenant_id, search=search)
        
        result = []
        for u in users:
            status = "active" if getattr(u, "is_active", 1) == 1 else "inactive"
            if hasattr(u, "id") and isinstance(u.id, int):
                permissions = await role_service.get_user_permissions(u.id)
            else:
                permissions = {}
            
            # Get roles array
            result_roles = await self.db.execute(select(UserRole).filter_by(user_id=u.id))
            user_roles = result_roles.scalars().all()
            role_ids = [ur.role_id for ur in user_roles]
            if role_ids:
                result_roles = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
                roles = result_roles.scalars().all()
            else:
                roles = []
            
            user_dict = u.__dict__.copy()
            user_dict["roles"] = [r.name for r in roles]
            user_dict["permissions"] = permissions
            user_dict["status"] = status
            result.append(UserResponse(**user_dict))
        
        return PaginatedUserResponse(
            data=result,
            total=total,
            page=page,
            page_size=page_size
        )

    async def get_user_for(self, current_user_id: int, user_id: int, tenant_id: int) -> UserResponse:
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "user", "view")
        
        user = await self.get_user(user_id, tenant_id)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        status = "active" if getattr(user, "is_active", 1) == 1 else "inactive"
        if hasattr(user, "id") and isinstance(user.id, int):
            permissions = await role_service.get_user_permissions(user.id)
        else:
            permissions = {}
        
        # Get roles array
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        if role_ids:
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
        else:
            roles = []
        
        user_dict = user.__dict__.copy()
        user_dict["roles"] = [r.name for r in roles]
        user_dict["permissions"] = permissions
        user_dict["status"] = status
        return UserResponse(**user_dict)

    async def update_user_for(self, current_user_id: int, user_id: int, update_data: UserUpdate, tenant_id: int) -> UserResponse:
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "user", "update")
        
        user = await self.get_user(user_id, tenant_id)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        # Only root can edit role, and cannot set to 'root'
        if not await role_service.is_root(current_user_id):
            update_data.role = None
        elif update_data.role == "root":
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Không được gán role là root")
        
        updated_user = await self.update_user(user_id, update_data, tenant_id)
        if updated_user is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found after update")
        
        # Get roles array like other APIs
        result = await self.db.execute(select(UserRole).filter_by(user_id=getattr(updated_user, "id", None)))
        user_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        if role_ids:
            result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
            roles = result.scalars().all()
        else:
            roles = []
        
        user_dict = updated_user.__dict__.copy()
        user_dict["roles"] = [r.name for r in roles]
        return UserResponse(**user_dict)

    async def delete_user_for(self, current_user_id: int, user_id: int, tenant_id: int) -> dict:
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "user", "delete")
        
        user = await self.get_user(user_id, tenant_id)
        if not user:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        success = await self.delete_user(user_id, tenant_id)
        if not success:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        return {"message": f"User with ID: {user_id} has been deleted"}