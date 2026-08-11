
from sqlalchemy.ext.asyncio import AsyncSession

from database.seeds.role_seed import seed_default_roles
from database.seeds.user_seed import seed_default_accounts
from database.seeds.demo_seed import seed_default_demos
from database.seeds.config_seed import seed_default_configs

from database.seeds.global_role_seed import seed_global_roles
from database.seeds.global_permission_seed import seed_global_modules_and_permissions
from database.seeds.root_user_seed import seed_root_user
from database.seeds.global_role_permission_seed import seed_global_role_permissions, seed_admin_role_permissions

async def auto_seed_all(db: AsyncSession) -> None:
    """Seed all necessary data for the system"""
    
    try:
        print("Starting seeding process...")
        
        print("[SEED] Seeding global roles...")
        await seed_global_roles(db)
        
        print("[SEED] Seeding global modules and permissions...")
        await seed_global_modules_and_permissions(db)
        
        print("[SEED] Seeding global role permissions...")
        await seed_global_role_permissions(db)
        await seed_admin_role_permissions(db)
        
        print("[SEED] Seeding root user...")
        await seed_root_user(db)
        
        print("[SEED] Seeding default data...")
        await seed_default_roles(db)
        await seed_default_accounts(db)
        await seed_default_demos(db)
        await seed_default_configs(db)
        
        print("[OK] Seeding completed successfully!")
        
    except Exception as e:
        print(f"[ERROR] Critical error during seeding: {str(e)}")
        raise
