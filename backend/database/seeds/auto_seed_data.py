# Auto seed base modules and permissions for RBAC
from database.database import SessionLocal
from services.rbac import RBACService

# Danh sách module cần seed
MODULES = [
    ("user", "Quản lý người dùng"),
    ("demo", "Quản lý demo"),
    ("product", "Quản lý sản phẩm"),
    # Thêm module khác tại đây
]

BASE_ACTIONS = [
    ("view", "Xem"),
    ("create", "Tạo"),
    ("update", "Sửa"),
    ("delete", "Xoá"),
]


def seed_modules_and_permissions():
    db = SessionLocal()
    rbac = RBACService(db)
    for module_name, module_desc in MODULES:
        # Tạo module nếu chưa có
        module = rbac.get_module_by_name(module_name)
        if not module:
            rbac.create_module(module_name, module_desc)
        # Tạo 4 quyền mặc định nếu chưa có
        for action, action_desc in BASE_ACTIONS:
            perm = rbac.get_permission_by_name(action)
            if not perm:
                rbac.create_permission(action, f"{action_desc} {module_desc.lower()}")
    db.close()

# Seed tài khoản mặc định (root, admin, user)
def seed_default_accounts():
    from database.models.auth_models import User
    from services.user import UserService, UserCreate
    db = SessionLocal()
    user_service = UserService(db)
    default_accounts = [
        ("root", "root@local", "root123456"),
        ("admin", "admin@local", "admin123456"),
        ("user", "user@local", "user123456"),
    ]
    for username, email, password in default_accounts:
        user = db.query(User).filter_by(username=username).first()
        if not user:
            user_create = UserCreate(username=username, email=email, password=password)
            user_service.create_user(user_create)
    db.close()

# Seed demo mẫu (nếu chưa có)
def seed_default_demos():
    from services.demo import DemoService
    from validators.demos import DemoCreate
    db = SessionLocal()
    demo_service = DemoService(db)
    if not demo_service.get_all_demos():
        demo_service.create_demo(DemoCreate(title="Demo 1", description="Demo mẫu 1"))
        demo_service.create_demo(DemoCreate(title="Demo 2", description="Demo mẫu 2"))
        demo_service.create_demo(DemoCreate(title="Demo 3", description="Demo mẫu 3"))
        demo_service.create_demo(DemoCreate(title="Demo 4", description="Demo mẫu 4"))
    db.close()

