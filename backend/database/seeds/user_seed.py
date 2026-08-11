from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Role, User, UserRole
from schemas import UserCreate
from services import UserService


async def seed_default_accounts(db: AsyncSession) -> None:
    """Seed default user accounts"""
    user_service = UserService(db)
    default_accounts = [
        ("admin", "Admin", "admin@local.com", "admin123456", "admin"),
        ("user", "User", "user@local.com", "user123456", "user"),
    ]

    for username, full_name, email, password, role in default_accounts:
        result = await db.execute(select(User).filter(User.username == username))
        user = result.scalar_one_or_none()

        if not user:
            try:
                user_create = UserCreate(
                    username=username,
                    email=email,
                    password=password,
                    full_name=full_name,
                    role=role,
                )
                user = await user_service.create_user(user_create)
            except Exception as e:
                print(f"[ERROR] Error creating user {username}: {e!s}")
                continue

        result = await db.execute(select(Role).filter_by(name=role))
        role_obj = result.scalar_one_or_none()
        if user and role_obj:
            result = await db.execute(select(UserRole).filter_by(user_id=user.id, role_id=role_obj.id))
            existing = result.scalar_one_or_none()
            if not existing:
                user_role = UserRole(user_id=user.id, role_id=role_obj.id)
                db.add(user_role)
                await db.commit()
                print(f"[OK] Assigned role {role} to user {username}")
