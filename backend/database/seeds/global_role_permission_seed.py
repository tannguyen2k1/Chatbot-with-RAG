from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Module, Permission, Role, RolePermission


async def seed_global_role_permissions(db: AsyncSession) -> None:
    """Assign all permissions to root role"""

    result = await db.execute(select(Role).filter_by(name="root"))
    root_role = result.scalar_one_or_none()
    if not root_role:
        print("[ERROR] Root role not found")
        return

    result = await db.execute(select(Permission))
    all_permissions = result.scalars().all()
    result = await db.execute(select(Module))
    modules = {m.name: m.id for m in result.scalars().all()}

    result = await db.execute(select(RolePermission).filter_by(role_id=root_role.id))
    existing_pairs = {(rp.permission_id, rp.module_id) for rp in result.scalars().all()}

    count = 0
    for perm in all_permissions:
        module_id = None
        if "." in perm.name:
            module_name = perm.name.split(".", 1)[0]
            module_id = modules.get(module_name)

        if module_id is not None and (perm.id, module_id) not in existing_pairs:
            role_perm = RolePermission(
                role_id=root_role.id,
                module_id=module_id,
                permission_id=perm.id,
            )
            db.add(role_perm)
            count += 1

    if count > 0:
        await db.commit()
        print(f"[OK] Assigned {count} permissions to root role")
    else:
        print("[INFO] Root role already has all permissions")


async def seed_admin_role_permissions(db: AsyncSession) -> None:
    """Assign all permissions to admin role"""

    result = await db.execute(select(Role).filter_by(name="admin"))
    admin_role = result.scalar_one_or_none()
    if not admin_role:
        print("[ERROR] Admin role not found")
        return

    result = await db.execute(select(Permission))
    all_permissions = result.scalars().all()
    result = await db.execute(select(Module))
    modules = {m.name: m.id for m in result.scalars().all()}

    result = await db.execute(select(RolePermission).filter_by(role_id=admin_role.id))
    existing_pairs = {(rp.permission_id, rp.module_id) for rp in result.scalars().all()}

    count = 0
    for perm in all_permissions:
        module_id = None
        if "." in perm.name:
            module_name = perm.name.split(".", 1)[0]
            module_id = modules.get(module_name)

        if module_id is not None and (perm.id, module_id) not in existing_pairs:
            role_perm = RolePermission(
                role_id=admin_role.id,
                module_id=module_id,
                permission_id=perm.id,
            )
            db.add(role_perm)
            count += 1

    if count > 0:
        await db.commit()
        print(f"[OK] Assigned {count} permissions to admin role")
    else:
        print("[INFO] Admin role already has all permissions")
