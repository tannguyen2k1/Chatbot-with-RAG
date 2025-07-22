from sqlalchemy.orm import Session
from database.models.auth_models import Role, Module, Permission, RolePermission, UserRole

class RBACService:
    def __init__(self, db: Session):
        self.db = db

    def is_root(self, user):
        """Trả về True nếu user có role là root"""
        user_roles = self.db.query(UserRole).filter_by(user_id=user.id).all()
        role_ids = [ur.role_id for ur in user_roles]
        if not role_ids:
            return False
        roles = self.db.query(Role).filter(Role.id.in_(role_ids)).all()
        role_names = [r.name for r in roles]
        return "root" in role_names

    def can_manage_user(self, current_user, target_user):
        """
        Chỉ root có thể thao tác với mọi user, admin chỉ thao tác với user thường, user không thao tác ai.
        """
        # Lấy role của current_user và target_user
        user_roles = self.db.query(UserRole).filter_by(user_id=current_user.id).all()
        target_roles = self.db.query(UserRole).filter_by(user_id=target_user.id).all()
        role_ids = [ur.role_id for ur in user_roles]
        target_role_ids = [ur.role_id for ur in target_roles]
        roles = self.db.query(Role).filter(Role.id.in_(role_ids)).all()
        target_roles = self.db.query(Role).filter(Role.id.in_(target_role_ids)).all()
        role_names = [r.name for r in roles]
        target_role_names = [r.name for r in target_roles]
        # Root quản lý tất cả
        if "root" in role_names:
            return True
        # Admin không được thao tác với root/admin
        if "admin" in role_names:
            if any(r in ["admin", "root"] for r in target_role_names):
                return False
            return True
        # User không thao tác ai
        return False

    def get_user_permissions(self, user_id: int) -> dict:
        """
        Trả về dict dạng {module: [action, ...], ...} cho user
        """
        permissions_dict = {}
        # Lấy tất cả role của user
        user_roles = self.db.query(UserRole).filter_by(user_id=user_id).all()
        role_ids = [ur.role_id for ur in user_roles]
        if not role_ids:
            return permissions_dict
        # Lấy tất cả RolePermission của các role này
        role_perms = self.db.query(RolePermission).filter(RolePermission.role_id.in_(role_ids)).all()
        # Lấy mapping module_id -> name, permission_id -> name
        modules = {m.id: m.name for m in self.db.query(Module).all()}
        perms = {p.id: p.name for p in self.db.query(Permission).all()}
        for rp in role_perms:
            module_name = modules.get(rp.module_id)
            perm_name = perms.get(rp.permission_id)
            if module_name and perm_name:
                permissions_dict.setdefault(module_name, []).append(perm_name)
        return permissions_dict


    def is_admin_or_above(self, user):
        user_roles = self.db.query(UserRole).filter_by(user_id=user.id).all()
        if not user_roles:
            return False
        role_ids = [ur.role_id for ur in user_roles]
        roles = self.db.query(Role).filter(Role.id.in_(role_ids)).all()
        role_names = [r.name for r in roles]
        return any(rn in ("admin", "root") for rn in role_names)

    def create_role(self, name: str, description: str = None):
        role = Role(name=name, description=description)
        self.db.add(role)
        self.db.commit()
        self.db.refresh(role)
        return role

    def create_module(self, name: str, description: str = None):
        module = Module(name=name, description=description)
        self.db.add(module)
        self.db.commit()
        self.db.refresh(module)
        return module

    def create_permission(self, name: str, description: str = None):
        permission = Permission(name=name, description=description)
        self.db.add(permission)
        self.db.commit()
        self.db.refresh(permission)
        return permission

    def assign_role_to_user(self, user_id: int, role_id: int):
        user_role = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(user_role)
        self.db.commit()
        self.db.refresh(user_role)
        return user_role

    def assign_permission_to_role(self, role_id: int, module_id: int, permission_id: int):
        rp = RolePermission(role_id=role_id, module_id=module_id, permission_id=permission_id)
        self.db.add(rp)
        self.db.commit()
        self.db.refresh(rp)
        return rp

    def check_user_permission(self, user_id: int, module_name: str, permission_name: str) -> bool:
        roles = self.db.query(UserRole).filter_by(user_id=user_id).all()
        role_ids = [r.role_id for r in roles]
        module = self.db.query(Module).filter_by(name=module_name).first()
        permission = self.db.query(Permission).filter_by(name=permission_name).first()
        if not module or not permission:
            return False
        count = self.db.query(RolePermission).filter(
            RolePermission.role_id.in_(role_ids),
            RolePermission.module_id == module.id,
            RolePermission.permission_id == permission.id
        ).count()
        return count > 0
