
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.models import Tenant
from database.context import current_tenant_id
from database.seeds.tenant_seed import seed_default_tenant
from database.seeds.role_seed import seed_default_roles
from database.seeds.module_permission_seed import seed_modules_and_permissions
from database.seeds.user_seed import seed_default_accounts
from database.seeds.permission_seed import seed_root_admin_permissions
from database.seeds.demo_seed import seed_default_demos

async def auto_seed_all(db: AsyncSession) -> None:
    """Seed tất cả dữ liệu cần thiết cho hệ thống"""
    
    try:
        # Chỉ seed 1 tenant mặc định
        default_tenant = await seed_default_tenant(db)
        
        # Set tenant context cho seeding
        current_tenant_id.set(str(default_tenant.id))
        
        # Seed dữ liệu cho tenant mặc định
        await seed_default_roles(db, default_tenant)
        await seed_modules_and_permissions(db, default_tenant)
        await seed_default_accounts(db, default_tenant)
        await seed_root_admin_permissions(db, default_tenant)  # Root có tất cả quyền, admin có tất cả trừ tenant
        await seed_default_demos(db, default_tenant)
        
    except Exception as e:
        print(f"❌ Critical error during seeding: {str(e)}")
        raise

