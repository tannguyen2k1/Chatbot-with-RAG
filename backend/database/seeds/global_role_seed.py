from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Role

GLOBAL_ROLES = [
    ("root", "Super Admin - Global access to all tenants"),
    ("admin", "Admin"),
    ("user", "User"),
]

async def seed_global_roles(db: AsyncSession) -> None:
    """Seed global roles (không thuộc tenant nào)"""
    for name, desc in GLOBAL_ROLES:
        result = await db.execute(select(Role).filter_by(name=name))
        role = result.scalar_one_or_none()
        if not role:
            # Tạo role global (không có tenant_id)
            role = Role(name=name, description=desc)
            db.add(role)
            await db.commit()
            print(f"✅ Created global role: {name}")
        else:
            print(f"ℹ️ Global role {name} already exists")
