from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Permission, Module

GLOBAL_MODULES = [
    ("user", "User management"),
    ("role", "Role management"),
    ("permission", "Permission management"),
    ("module", "Module management"),
    ("tenant", "Tenant management"),
]

GLOBAL_PERMISSIONS = [
    ("user.view", "View users"),
    ("user.create", "Create users"),
    ("user.update", "Update users"),
    ("user.delete", "Delete users"),
    ("role.view", "View roles"),
    ("role.create", "Create roles"),
    ("role.update", "Update roles"),
    ("role.delete", "Delete roles"),
    ("role.assign-role", "Assign roles to users"),
    ("permission.view", "View permissions"),
    ("permission.create", "Create permissions"),
    ("permission.assign", "Assign permissions to roles"),
    ("permission.remove", "Remove permissions from roles"),
    ("permission.check", "Check user permissions"),
    ("module.view", "View modules"),
    ("module.create", "Create modules"),
    ("tenant.view", "View tenants"),
    ("tenant.create", "Create tenants"),
    ("tenant.update", "Update tenants"),
    ("tenant.delete", "Delete tenants"),
]

async def seed_global_modules_and_permissions(db: AsyncSession) -> None:
    """Seed global modules và permissions (không thuộc tenant nào)"""
    
    # Seed modules
    for name, desc in GLOBAL_MODULES:
        result = await db.execute(select(Module).filter_by(name=name))
        module = result.scalar_one_or_none()
        if not module:
            module = Module(name=name, description=desc)
            db.add(module)
            await db.commit()
            print(f"✅ Created global module: {name}")
        else:
            print(f"ℹ️ Global module {name} already exists")
    
    # Seed permissions
    for name, desc in GLOBAL_PERMISSIONS:
        result = await db.execute(select(Permission).filter_by(name=name))
        permission = result.scalar_one_or_none()
        if not permission:
            permission = Permission(name=name, description=desc)
            db.add(permission)
            await db.commit()
            print(f"✅ Created global permission: {name}")
        else:
            print(f"ℹ️ Global permission {name} already exists")
