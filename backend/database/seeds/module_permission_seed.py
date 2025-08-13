from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Module, Permission, Tenant

# Danh sách module cần seed
MODULES = [
    ("user", "user"),
    ("demo", "demo"),
    ("role", "role"),
    ("module", "module"),
    ("permission", "permission"),
    ("audit_log", "audit log"),
    ("tenant", "tenant management"),
]

BASE_ACTIONS = [
    ("view", "Xem"),
    ("create", "Tạo"),
    ("update", "Sửa"),
    ("delete", "Xoá"),
]

CUSTOM_ACTIONS = [
    ("role.assign-role", "Gán role cho user"),
    ("permission.assign", "Gán quyền cho role"),
    ("permission.remove", "Xóa quyền khỏi role"),
    ("permission.check", "Kiểm tra quyền user"),
    ("tenant.manage", "Quản lý tenant"),
]

async def seed_modules_and_permissions(db: AsyncSession, tenant: Tenant) -> None:
    """Seed modules và permissions cho tenant"""
    
    # Tạo modules nếu thiếu
    for module_name, module_desc in MODULES:
        module = await db.execute(select(Module).filter_by(name=module_name, tenant_id=tenant.id))
        if not module.scalar_one_or_none():
            # Tạo module với tenant_id
            module = Module(name=module_name, description=module_desc, tenant_id=tenant.id)
            db.add(module)
            await db.commit()
            await db.refresh(module)

        # Tạo 4 quyền mặc định cho mỗi module
        for action, action_desc in BASE_ACTIONS:
            perm_name = f"{module_name}.{action}"
            result = await db.execute(select(Permission).filter_by(name=perm_name, tenant_id=tenant.id))
            perm = result.scalar_one_or_none()
            if not perm:
                perm = Permission(name=perm_name, description=f"{action_desc} {module_desc.lower()}", tenant_id=tenant.id)
                db.add(perm)
                await db.commit()

    # Seed các quyền custom
    for custom_perm, custom_desc in CUSTOM_ACTIONS:
        result = await db.execute(select(Permission).filter_by(name=custom_perm, tenant_id=tenant.id))
        perm = result.scalar_one_or_none()
        if not perm:
            perm = Permission(name=custom_perm, description=custom_desc, tenant_id=tenant.id)
            db.add(perm)
            await db.commit()
