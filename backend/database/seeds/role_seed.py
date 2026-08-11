from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Role

BASE_ROLES = [
    ("root", "Super Admin"),
    ("admin", "Admin"),
    ("user", "User"),
]


async def seed_default_roles(db: AsyncSession) -> None:
    """Seed default roles (idempotent - skips existing)"""
    for name, desc in BASE_ROLES:
        result = await db.execute(select(Role).filter_by(name=name))
        role = result.scalar_one_or_none()
        if not role:
            db.add(Role(name=name, description=desc))
            await db.commit()
            print(f"[OK] Created role: {name}")
        else:
            print(f"[INFO] Role {name} already exists")
