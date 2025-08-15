from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Tenant
from sqlalchemy import select
from datetime import datetime, timezone, timedelta


async def seed_default_tenant(db: AsyncSession):
    """Tạo tenant mặc định nếu chưa có"""
    
    # Kiểm tra xem đã có tenant mặc định chưa
    result = await db.execute(select(Tenant).where(Tenant.tenant_code == "root"))
    existing_tenant = result.scalar_one_or_none()
    
    if not existing_tenant:
        
        root_tenant = Tenant(
            name="Root Tenant",
            tenant_code="root",
            domain="localhost",
            subdomain="root",
            is_active=True,
            expiration_date=None
        )
        
        db.add(root_tenant)
        await db.commit()
        await db.refresh(root_tenant)
        
        print(f"✅ Created default tenant: {root_tenant.name} (ID: {root_tenant.id})")
        print(f"   Expires: {root_tenant.expiration_date}")
        return root_tenant
    
    print(f"✅ Default tenant already exists: {existing_tenant.name} (ID: {existing_tenant.id})")
    return existing_tenant
