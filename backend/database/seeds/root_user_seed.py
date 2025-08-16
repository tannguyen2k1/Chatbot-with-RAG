from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, UserRole, Role
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_root_user(db: AsyncSession) -> None:
    """Seed root user (tenant_id = NULL) với tất cả quyền"""
    
    # Kiểm tra root user đã tồn tại chưa
    result = await db.execute(
        select(User).filter(
            User.username == "root",
            User.tenant_id.is_(None)  # tenant_id = NULL
        )
    )
    root_user = result.scalar_one_or_none()
    
    if not root_user:
        # Tạo root user với tenant_id = NULL
        hashed_password = pwd_context.hash("root123456")
        root_user = User(
            username="root",
            email="root@system.local",
            hashed_password=hashed_password,
            full_name="Root User",
            is_active=1,
            tenant_id=None  # Global user
        )
        db.add(root_user)
        await db.commit()
        await db.refresh(root_user)
        print("✅ Created root user with global access")
    else:
        print("ℹ️ Root user already exists")
    
    # Gán role root cho user root
    result = await db.execute(select(Role).filter_by(name="root"))
    root_role = result.scalar_one_or_none()
    
    if root_role and root_user:
        # Kiểm tra đã gán role chưa
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
                tenant_id=None  # Global role assignment
            )
            db.add(user_role)
            await db.commit()
            print("✅ Assigned root role to root user")
        else:
            print("ℹ️ Root user already has root role")
    
    return root_user
