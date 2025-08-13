from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Role, Tenant

BASE_ROLES = [
    ("root", "Super Admin"),
    ("admin", "Admin"),
    ("user", "User"),
]

async def seed_default_roles(db: AsyncSession, tenant: Tenant) -> None:
    """Seed roles mặc định cho tenant"""
    for name, desc in BASE_ROLES:
        result = await db.execute(select(Role).filter_by(name=name, tenant_id=tenant.id))
        role = result.scalar_one_or_none()
        if not role:
            db.add(Role(name=name, description=desc, tenant_id=tenant.id))
            await db.commit()
