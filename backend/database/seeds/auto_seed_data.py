
# Auto seed base modules and permissions for RBAC
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.models import Role, Permission, User, UserRole, Module, RolePermission
from database.models.audit_log import AuditLog  # if referenced elsewhere
from services import RBACService, DemoService
from services.user import UserService
from schemas import UserCreate
from schemas import DemoCreate

# Danh sách module cần seed
MODULES = [
    ("user", "user"),
    ("demo", "demo"),
    ("role", "role"),
    ("module", "module"),
    ("permission", "permission"),
    ("audit_log", "audit log"),
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
]

BASE_ROLES = [
    ("root", "Super Admin"),
    ("admin", "Admin"),
    ("user", "User"),
]


async def seed_default_roles(db: AsyncSession) -> None:
    for name, desc in BASE_ROLES:
        result = await db.execute(select(Role).filter_by(name=name))
        role = result.scalar_one_or_none()
        if not role:
            db.add(Role(name=name, description=desc))
            await db.commit()


async def seed_modules_and_permissions(db: AsyncSession) -> None:
    rbac = RBACService(db)

    # Tạo modules nếu thiếu
    for module_name, module_desc in MODULES:
        module = await rbac.get_module_by_name(module_name)
        if not module:
            await rbac.create_module(module_name, module_desc)

        # Tạo 4 quyền mặc định cho mỗi module
        for action, action_desc in BASE_ACTIONS:
            perm_name = f"{module_name}.{action}"
            result = await db.execute(select(Permission).filter_by(name=perm_name))
            perm = result.scalar_one_or_none()
            if not perm:
                await rbac.create_permission(perm_name, f"{action_desc} {module_desc.lower()}")

    # Seed các quyền custom
    for custom_perm, custom_desc in CUSTOM_ACTIONS:
        result = await db.execute(select(Permission).filter_by(name=custom_perm))
        perm = result.scalar_one_or_none()
        if not perm:
            await rbac.create_permission(custom_perm, custom_desc)


async def seed_default_accounts(db: AsyncSession) -> None:
    user_service = UserService(db)
    default_accounts = [
        ("root", "Super Admin", "root@local.com", "root123456", "root"),
        ("admin", "Admin", "admin@local.com", "admin123456", "admin"),
        ("user", "User", "user@local.com", "user123456", "user"),
    ]

    for username, full_name, email, password, role in default_accounts:
        result = await db.execute(select(User).filter_by(username=username))
        user = result.scalar_one_or_none()
        if not user:
            user_create = UserCreate(
                username=username,
                email=email,
                password=password,
                full_name=full_name,
                role=role,
            )
            user = await user_service.create_user(user_create)

        # Gán role vào bảng user_roles nếu chưa có
        result = await db.execute(select(Role).filter_by(name=role))
        role_obj = result.scalar_one_or_none()
        if user and role_obj:
            result = await db.execute(
                select(UserRole).filter_by(user_id=user.id, role_id=role_obj.id)
            )
            existing = result.scalar_one_or_none()
            if not existing:
                db.add(UserRole(user_id=user.id, role_id=role_obj.id))
                await db.commit()


async def seed_default_demos(db: AsyncSession) -> None:
    demo_service = DemoService(db)
    response = await demo_service.get_all_demos()
    if not response.data:
        for i in range(1, 5):
            await demo_service.create_demo(
                DemoCreate(title=f"Demo {i}", description=f"Demo mẫu {i}")
            )


async def seed_root_admin_permissions(db: AsyncSession) -> None:
    # Lấy role root và admin
    result = await db.execute(select(Role).filter_by(name="root"))
    root_role = result.scalar_one_or_none()
    result = await db.execute(select(Role).filter_by(name="admin"))
    admin_role = result.scalar_one_or_none()
    if not root_role or not admin_role:
        return

    # Lấy tất cả permissions và modules
    result = await db.execute(select(Permission))
    all_permissions = result.scalars().all()
    result = await db.execute(select(Module))
    modules = {m.name: m.id for m in result.scalars().all()}

    async def assign_all_permissions(role: Role) -> None:
        # Existing role-permission pairs for this role
        result = await db.execute(select(RolePermission).filter_by(role_id=role.id))
        existing_pairs = {(rp.permission_id, rp.module_id) for rp in result.scalars().all()}
        count = 0
        for perm in all_permissions:
            module_id: Optional[int]
            if "." in perm.name:
                module_name = perm.name.split(".", 1)[0]
                module_id = modules.get(module_name)
            else:
                module_id = None
            if module_id is not None and (perm.id, module_id) not in existing_pairs:
                db.add(RolePermission(role_id=role.id, module_id=module_id, permission_id=perm.id))
                count += 1
        if count:
            await db.commit()

    await assign_all_permissions(root_role)
    await assign_all_permissions(admin_role)


async def auto_seed_all(db: AsyncSession) -> None:
    await seed_default_roles(db)
    await seed_modules_and_permissions(db)
    await seed_default_accounts(db)
    await seed_root_admin_permissions(db)
    await seed_default_demos(db)

