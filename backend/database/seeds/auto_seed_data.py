
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.models import Tenant
from database.context import current_tenant_id
from database.seeds.tenant_seed import seed_default_tenant
from database.seeds.role_seed import seed_default_roles
from database.seeds.user_seed import seed_default_accounts
from database.seeds.demo_seed import seed_default_demos

# Import new global seed functions
from database.seeds.global_role_seed import seed_global_roles
from database.seeds.global_permission_seed import seed_global_modules_and_permissions
from database.seeds.root_user_seed import seed_root_user
from database.seeds.global_role_permission_seed import seed_global_role_permissions, seed_admin_role_permissions

async def auto_seed_all(db: AsyncSession) -> None:
    """Seed tất cả dữ liệu cần thiết cho hệ thống"""
    
    try:
        print("🌱 Starting seeding process...")
        
        # 1. Seed global data first (roles, permissions, modules không thuộc tenant nào)
        print("📝 Seeding global roles...")
        await seed_global_roles(db)
        
        print("📝 Seeding global modules and permissions...")
        await seed_global_modules_and_permissions(db)
        
        print("📝 Seeding global role permissions...")
        await seed_global_role_permissions(db)
        await seed_admin_role_permissions(db)
        
        print("📝 Seeding root user...")
        await seed_root_user(db)
        
        # 2. Seed tenant-specific data
        print("📝 Seeding default tenant...")
        default_tenant = await seed_default_tenant(db)
        
        # Set tenant context cho seeding
        current_tenant_id.set(str(default_tenant.id))
        
        print("📝 Seeding tenant-specific data...")
        await seed_default_roles(db, default_tenant)
        await seed_default_accounts(db, default_tenant)
        await seed_default_demos(db, default_tenant)
        
        print("✅ Seeding completed successfully!")
        
    except Exception as e:
        print(f"❌ Critical error during seeding: {str(e)}")
        raise

