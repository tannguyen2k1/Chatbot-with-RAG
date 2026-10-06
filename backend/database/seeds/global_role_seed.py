from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Role

GLOBAL_ROLES = [
    ("root", "Super Admin - Full system access"),
    ("admin", "Admin — kho tri thức, RBAC, config, audit, thống kê"),
    ("staff", "Cán bộ — FAQ và hàng chờ hỗ trợ sinh viên"),
    ("student", "Sinh viên — chat hỗ trợ UTC"),
    ("user", "User (legacy)"),
]


async def seed_global_roles(db: AsyncSession) -> None:
    """Seed global roles"""
    for name, desc in GLOBAL_ROLES:
        result = await db.execute(select(Role).filter_by(name=name))
        role = result.scalar_one_or_none()
        if not role:
            role = Role(name=name, description=desc)
            db.add(role)
            await db.commit()
            print(f"[OK] Created global role: {name}")
        else:
            print(f"[INFO] Global role {name} already exists")
