
# Auto seed base modules and permissions for RBAC
from database.database import SessionLocal
from services.rbac import RBACService

# Danh sách module cần seed
MODULES = [
    ("user", "Quản lý người dùng"),
    ("demo", "Quản lý demo"),
    ("role", "Quản lý role"),
    # Thêm module khác tại đây
]

BASE_ACTIONS = [
    ("view", "Xem"),
    ("create", "Tạo"),
    ("update", "Sửa"),
    ("delete", "Xoá"),
]

BASE_ROLES = [
    ("root", "Super Admin"),
    ("admin", "Admin"),
    ("user", "User")
]


# Seed 3 role mặc định (root, admin, user)
def seed_default_roles():
    from database.models.auth_models import Role
    db = SessionLocal()
    for name, desc in BASE_ROLES:
        role = db.query(Role).filter_by(name=name).first()
        if not role:
            db.add(Role(name=name, description=desc))
            db.commit()
    db.close()


def seed_modules_and_permissions():
    from database.models.auth_models import Permission
    db = SessionLocal()
    rbac = RBACService(db)
    for module_name, module_desc in MODULES:
        # Tạo module nếu chưa có
        module = rbac.get_module_by_name(module_name)
        if not module:
            rbac.create_module(module_name, module_desc)
        # Tạo 4 quyền mặc định cho từng module nếu chưa có
        for action_tuple in BASE_ACTIONS:
            action, action_desc = action_tuple
            perm_name = f"{module_name}.{action}"
            perm = db.query(Permission).filter_by(name=perm_name).first()
            if not perm:
                rbac.create_permission(perm_name, f"{action_desc} {module_desc.lower()}")
    db.close()

# Seed tài khoản mặc định (root, admin, user)
def seed_default_accounts():
    from database.models.auth_models import User
    from services.user import UserService, UserCreate
    db = SessionLocal()
    user_service = UserService(db)
    default_accounts = [
        ("root", "Super Admin", "root@local.com", "root123456", "root"),
        ("admin", "Admin", "admin@local.com", "admin123456", "admin"),
        ("user", "User", "user@local.com", "user123456", "user"),
    ]
    from database.models.auth_models import UserRole, Role
    for username, full_name, email, password, role in default_accounts:
        user = db.query(User).filter_by(username=username).first()
        if not user:
            user_create = UserCreate(username=username, email=email, password=password, full_name=full_name, role=role)
            user = user_service.create_user(user_create)
        # Gán role vào bảng user_roles nếu chưa có
        role_obj = db.query(Role).filter_by(name=role).first()
        if user and role_obj:
            existing = db.query(UserRole).filter_by(user_id=user.id, role_id=role_obj.id).first()
            if not existing:
                db.add(UserRole(user_id=user.id, role_id=role_obj.id))
                db.commit()
    db.close()

# Seed demo mẫu (nếu chưa có)
def seed_default_demos():
    from services.demo import DemoService
    from schemas.demos import DemoCreate
    db = SessionLocal()
    demo_service = DemoService(db)
    if not demo_service.get_all_demos():
        demo_service.create_demo(DemoCreate(title="Demo 1", description="Demo mẫu 1"))
        demo_service.create_demo(DemoCreate(title="Demo 2", description="Demo mẫu 2"))
        demo_service.create_demo(DemoCreate(title="Demo 3", description="Demo mẫu 3"))
        demo_service.create_demo(DemoCreate(title="Demo 4", description="Demo mẫu 4"))
    db.close()

# Gán tất cả quyền cho role 'root' và 'admin' nếu chưa có
def seed_root_admin_permissions():
    from database.models.auth_models import Role, Permission, RolePermission, Module
    db = SessionLocal()
    # Lấy role root và admin
    root_role = db.query(Role).filter_by(name="root").first()
    admin_role = db.query(Role).filter_by(name="admin").first()
    if not root_role or not admin_role:
        db.close()
        return
    # Lấy tất cả permission (theo chuẩn mới: {module}.{action})
    all_permissions = db.query(Permission).all()
    modules = {m.name: m.id for m in db.query(Module).all()}
    def assign_all_permissions(role):
        existing = {(rp.permission_id, rp.module_id) for rp in db.query(RolePermission).filter_by(role_id=role.id).all()}
        count = 0
        for perm in all_permissions:
            # Parse module từ tên permission
            if '.' in perm.name:
                module_name = perm.name.split('.', 1)[0]
                module_id = modules.get(module_name)
            else:
                module_id = None
            if module_id is not None and (perm.id, module_id) not in existing:
                db.add(RolePermission(role_id=role.id, module_id=module_id, permission_id=perm.id))
                count += 1
        db.commit()
    assign_all_permissions(root_role)
    assign_all_permissions(admin_role)
    db.close()

# Hàm tổng hợp seed tất cả
def auto_seed_all():
    seed_default_roles()
    seed_modules_and_permissions()
    seed_default_accounts()
    seed_root_admin_permissions()
    seed_default_demos()

