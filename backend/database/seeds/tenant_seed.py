from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Tenant
from sqlalchemy import select
from datetime import datetime, timezone, timedelta


async def seed_default_tenant(db: AsyncSession):
    """Tạo tenant mặc định nếu chưa có"""
    
    # Kiểm tra xem đã có tenant mặc định chưa
    result = await db.execute(select(Tenant).where(Tenant.tenant_code == "default"))
    existing_tenant = result.scalar_one_or_none()
    
    if not existing_tenant:
        
        default_tenant = Tenant(
            name="Default Tenant",
            tenant_code="default",
            domain="localhost",
            subdomain="default",
            tenant_id=1,
            is_active=True,
            expiration_date=None
        )
        
        db.add(default_tenant)
        await db.commit()
        await db.refresh(default_tenant)
        return default_tenant
    
    return existing_tenant
