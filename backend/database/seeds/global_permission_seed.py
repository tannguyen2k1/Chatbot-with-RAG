from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Permission, Module

GLOBAL_MODULES = [
    ("user", "User management"),
    ("role", "Role management"),
    ("permission", "Permission management"),
    ("module", "Module management"),
    ("audit_log", "Audit log management"),
    ("demo", "Demo data management"),
    ("vector", "Vector database management"),
    ("ingestion", "Data ingestion management"),
    ("config", "Configuration management"),
]

GLOBAL_PERMISSIONS = [
    ("user.view", "View users"),
    ("user.create", "Create users"),
    ("user.update", "Update users"),
    ("user.delete", "Delete users"),
    ("user.reset-password", "Reset user password"),
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
    ("audit_log.view", "View audit logs"),
    ("audit_log.create", "Create audit logs"),
    ("audit_log.update", "Update audit logs"),
    ("audit_log.delete", "Delete audit logs"),
    ("demo.view", "View demo data"),
    ("demo.create", "Create demo data"),
    ("demo.update", "Update demo data"),
    ("demo.delete", "Delete demo data"),
    ("vector.view", "View vector data"),
    ("vector.create", "Create vector data"),
    ("vector.update", "Update vector data"),
    ("vector.delete", "Delete vector data"),
    ("ingestion.view", "View ingestion data"),
    ("ingestion.create", "Create ingestion data"),
    ("ingestion.update", "Update ingestion data"),
    ("ingestion.delete", "Delete ingestion data"),
    ("config.view", "View configuration"),
    ("config.create", "Create configuration"),
    ("config.update", "Update configuration"),
    ("config.delete", "Delete configuration"),
]

async def seed_global_modules_and_permissions(db: AsyncSession) -> None:
    """Seed global modules and permissions"""
    
    for name, desc in GLOBAL_MODULES:
        result = await db.execute(select(Module).filter_by(name=name))
        module = result.scalar_one_or_none()
        if not module:
            module = Module(name=name, description=desc)
            db.add(module)
            await db.commit()
            print(f"[OK] Created global module: {name}")
        else:
            print(f"[INFO] Global module {name} already exists")
    
    for name, desc in GLOBAL_PERMISSIONS:
        result = await db.execute(select(Permission).filter_by(name=name))
        permission = result.scalar_one_or_none()
        if not permission:
            permission = Permission(name=name, description=desc)
            db.add(permission)
            await db.commit()
            print(f"[OK] Created global permission: {name}")
        else:
            print(f"[INFO] Global permission {name} already exists")
