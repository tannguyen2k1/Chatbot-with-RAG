from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, UserRole, Role
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_root_user(db: AsyncSession) -> None:
    """Seed root user with root role"""
    
    result = await db.execute(
        select(User).filter(User.username == "root")
    )
    root_user = result.scalar_one_or_none()
    
    if not root_user:
        hashed_password = pwd_context.hash("root123456")
        root_user = User(
            username="root",
            email="root@system.local",
            hashed_password=hashed_password,
            full_name="Root User",
            is_active=1,
        )
        db.add(root_user)
        await db.commit()
        await db.refresh(root_user)
        print("[OK] Created root user")
    else:
        print("[INFO] Root user already exists")
    
    result = await db.execute(select(Role).filter_by(name="root"))
    root_role = result.scalar_one_or_none()
    
    if root_role and root_user:
        result = await db.execute(
            select(UserRole).filter_by(
                user_id=root_user.id, 
                role_id=root_role.id
            )
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            user_role = UserRole(
                user_id=root_user.id, 
                role_id=root_role.id,
            )
            db.add(user_role)
            await db.commit()
            print("[OK] Assigned root role to root user")
        else:
            print("[INFO] Root user already has root role")
    
    return root_user
