from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, UserRole, Role, Tenant
from services import UserService
from schemas import UserCreate

async def seed_default_accounts(db: AsyncSession, tenant: Tenant) -> None:
    """Seed tài khoản mặc định cho tenant"""
    user_service = UserService(db)
    default_accounts = [
        ("root", "Super Admin", "root@local.com", "root123456", "root"),
        ("admin", "Admin", "admin@local.com", "admin123456", "admin"),
        ("user", "User", "user@local.com", "user123456", "user"),
    ]

    for username, full_name, email, password, role in default_accounts:
        # Kiểm tra user có tồn tại trong tenant này chưa
        result = await db.execute(
            select(User).filter(
                User.username == username,
                User.tenant_id == tenant.id
            )
        )
        user = result.scalar_one_or_none()
        
        if not user:
            # Tạo user mới nếu chưa tồn tại
            try:
                user_create = UserCreate(
                    username=username,
                    email=email,
                    password=password,
                    full_name=full_name,
                    role=role,
                )
                user = await user_service.create_user(user_create, tenant_id=tenant.id)
                print(f"✅ Created user: {username} for tenant: {tenant.name}")
            except Exception as e:
                print(f"❌ Error creating user {username}: {str(e)}")
                continue
        else:
            print(f"ℹ️ User {username} already exists for tenant: {tenant.name}")

        # Gán role vào bảng user_roles nếu chưa có
        result = await db.execute(select(Role).filter_by(name=role, tenant_id=tenant.id))
        role_obj = result.scalar_one_or_none()
        if user and role_obj:
            result = await db.execute(
                select(UserRole).filter_by(user_id=user.id, role_id=role_obj.id, tenant_id=tenant.id)
            )
            existing = result.scalar_one_or_none()
            if not existing:
                user_role = UserRole(user_id=user.id, role_id=role_obj.id, tenant_id=tenant.id)
                db.add(user_role)
                await db.commit()
                print(f"🔗 Assigned role {role} to user {username}")
            else:
                print(f"ℹ️ Role {role} already assigned to user {username}")
