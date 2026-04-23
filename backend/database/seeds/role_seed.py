from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Role, Tenant

BASE_ROLES = [
    ("root", "Super Admin"),
    ("admin", "Admin"),
    ("user", "User"),
]

async def seed_default_roles(db: AsyncSession, tenant: Tenant) -> None:
    """Seed roles mặc định cho tenant (giờ roles là global, chỉ seed nếu chưa có)"""
    for name, desc in BASE_ROLES:
        result = await db.execute(select(Role).filter_by(name=name))
        role = result.scalar_one_or_none()
        if not role:
            # Tạo global role (không có tenant_id)
            db.add(Role(name=name, description=desc))
            await db.commit()
            print(f"[OK] Created global role: {name}")
        else:
            print(f"[INFO] Role {name} already exists")
