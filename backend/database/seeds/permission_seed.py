from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Role, Permission, Module, RolePermission, Tenant

async def seed_root_admin_permissions(db: AsyncSession, tenant: Tenant) -> None:
    """Seed permissions cho role root và admin của tenant (admin không có quyền tenant)"""
    # Lấy role root và admin
    result = await db.execute(select(Role).filter_by(name="root", tenant_id=tenant.id))
    root_role = result.scalar_one_or_none()
    result = await db.execute(select(Role).filter_by(name="admin", tenant_id=tenant.id))
    admin_role = result.scalar_one_or_none()
    if not root_role or not admin_role:
        return

    # Lấy tất cả permissions và modules của tenant
    result = await db.execute(select(Permission).filter_by(tenant_id=tenant.id))
    all_permissions = result.scalars().all()
    result = await db.execute(select(Module).filter_by(tenant_id=tenant.id))
    modules = {m.name: m.id for m in result.scalars().all()}

    async def assign_all_permissions(role: Role, exclude_tenant: bool = False) -> None:
        # Existing role-permission pairs for this role
        result = await db.execute(select(RolePermission).filter_by(role_id=role.id, tenant_id=tenant.id))
        existing_pairs = {(rp.permission_id, rp.module_id) for rp in result.scalars().all()}
        count = 0
        for perm in all_permissions:
            # Nếu exclude_tenant=True, bỏ qua các quyền liên quan đến tenant
            if exclude_tenant and "tenant" in perm.name:
                continue
                
            module_id = None
            if "." in perm.name:
                module_name = perm.name.split(".", 1)[0]
                module_id = modules.get(module_name)
            else:
                module_id = None
            if module_id is not None and (perm.id, module_id) not in existing_pairs:
                role_perm = RolePermission(
                    role_id=role.id, 
                    module_id=module_id, 
                    permission_id=perm.id,
                    tenant_id=tenant.id
                )
                db.add(role_perm)
                count += 1
        if count:
            await db.commit()

    # Root có tất cả quyền
    await assign_all_permissions(root_role, exclude_tenant=False)
    
    # Admin có tất cả quyền trừ tenant
    await assign_all_permissions(admin_role, exclude_tenant=True)
