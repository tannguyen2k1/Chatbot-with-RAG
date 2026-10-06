from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Module, Permission, Role, RolePermission

# Modules staff can fully manage
STAFF_MODULE_ACTIONS = {
    "faq": {"view", "create", "update", "delete"},
    "ticket": {"view", "create", "update"},
}

# Student: no admin modules (chat is open to authenticated users)


async def _assign_role_perms(
    db: AsyncSession,
    role_name: str,
    allowed: dict[str, set[str]],
) -> None:
    result = await db.execute(select(Role).filter_by(name=role_name))
    role = result.scalar_one_or_none()
    if not role:
        print(f"[ERROR] Role {role_name} not found")
        return

    result = await db.execute(select(Permission))
    all_permissions = result.scalars().all()
    result = await db.execute(select(Module))
    modules = {m.name: m.id for m in result.scalars().all()}

    result = await db.execute(select(RolePermission).filter_by(role_id=role.id))
    existing_pairs = {(rp.permission_id, rp.module_id) for rp in result.scalars().all()}

    count = 0
    for perm in all_permissions:
        if "." not in perm.name:
            continue
        module_name, action = perm.name.split(".", 1)
        if module_name not in allowed or action not in allowed[module_name]:
            continue
        module_id = modules.get(module_name)
        if module_id is None:
            continue
        if (perm.id, module_id) not in existing_pairs:
            db.add(
                RolePermission(
                    role_id=role.id,
                    module_id=module_id,
                    permission_id=perm.id,
                )
            )
            count += 1

    if count > 0:
        await db.commit()
        print(f"[OK] Assigned {count} permissions to {role_name} role")
    else:
        print(f"[INFO] {role_name} role permissions already up to date")


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


async def seed_staff_role_permissions(db: AsyncSession) -> None:
    await _assign_role_perms(db, "staff", STAFF_MODULE_ACTIONS)
