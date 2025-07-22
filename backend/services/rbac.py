from sqlalchemy.orm import Session
from database.models.auth_models import Role, Module, Permission, RolePermission, UserRole

class RBACService:
    def __init__(self, db: Session):
        self.db = db

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
