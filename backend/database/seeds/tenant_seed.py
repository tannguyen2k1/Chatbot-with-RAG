from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Tenant
from sqlalchemy import select


async def seed_default_tenant(db: AsyncSession):
    """Tạo tenant mặc định nếu chưa có"""
    
    # Kiểm tra xem đã có tenant mặc định chưa
    result = await db.execute(select(Tenant).where(Tenant.name == "Default Tenant"))
    existing_tenant = result.scalar_one_or_none()
    
    if not existing_tenant:
        # Tạo tenant mặc định
        default_tenant = Tenant(
            name="Default Tenant",
            domain="localhost",
            subdomain="default",
            is_active=True,
            max_users=1000,
            plan="enterprise",
            settings='{"theme": "default", "features": ["all"]}'
        )
        
        db.add(default_tenant)
        await db.commit()
        await db.refresh(default_tenant)
        
        print(f"✅ Created default tenant: {default_tenant.name} (ID: {default_tenant.id})")
        return default_tenant
    
    print(f"✅ Default tenant already exists: {existing_tenant.name} (ID: {existing_tenant.id})")
    return existing_tenant

# Xóa function seed_sample_tenants vì chỉ cần 1 tenant mặc định
