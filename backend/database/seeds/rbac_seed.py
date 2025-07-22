
from sqlalchemy.orm import Session
from database.models.auth_models import Role, Module, Permission, RolePermission

def seed_rbac_data(db: Session):
    # Seed roles
    roles = ["root", "admin", "user"]
    for r in roles:
        if not db.query(Role).filter_by(name=r).first():
            db.add(Role(name=r, description=f"{r} role"))
    # Seed modules
    modules = ["user", "demo", "role"]
    for m in modules:
        if not db.query(Module).filter_by(name=m).first():
            db.add(Module(name=m, description=f"{m} module"))
    # Seed permissions
    permissions = ["view", "create", "update", "delete", "manage"]
    for p in permissions:
        if not db.query(Permission).filter_by(name=p).first():
            db.add(Permission(name=p, description=f"{p} permission"))
    db.commit()

    # Ensure all permissions are seeded for 'root' and 'admin' roles
    all_modules = db.query(Module).all()
    all_permissions = db.query(Permission).all()
    for role_name in ["root", "admin"]:
        role = db.query(Role).filter_by(name=role_name).first()
        if role:
            for module in all_modules:
                for perm in all_permissions:
                    # Always check and create missing RolePermission
                    exists = db.query(RolePermission).filter_by(role_id=role.id, module_id=module.id, permission_id=perm.id).first()
                    if not exists:
                        db.add(RolePermission(role_id=role.id, module_id=module.id, permission_id=perm.id))
    db.commit()
