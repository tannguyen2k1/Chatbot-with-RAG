from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from database.models import Role, Module, Permission, RolePermission, UserRole
from schemas import RoleUpdate, PermissionError


class RBACService:
    def __init__(self, db: AsyncSession):
        self.db = db

    # -----------------------
    # Permission helpers
    # -----------------------
    async def ensure_permission(self, current_user_id: int, module: str, action: str) -> None:
        perms = await self.get_user_permissions(current_user_id)
        actions = perms.get(module, [])
        required = f"{module}.{action}"
        if required not in actions:
            raise PermissionError(f"You don't have permission to {action} {module}")

    # -----------------------
    # Role operations with permission checks
    # -----------------------
    async def list_roles_for(self, current_user_id: int):
        await self.ensure_permission(current_user_id, "role", "view")
        return await self.get_all_roles()

    async def get_role_detail_for(self, current_user_id: int, role_id: int):
        await self.ensure_permission(current_user_id, "role", "view")
        return await self.get_role_by_id(role_id)

    async def create_role_for(self, current_user_id: int, name: str, description: str = ""):
        await self.ensure_permission(current_user_id, "role", "create")
        return await self.create_role(name, description)

    async def update_role_for(self, current_user_id: int, role_id: int, data: RoleUpdate):
        await self.ensure_permission(current_user_id, "role", "update")
        return await self.update_role(role_id, data)

    async def delete_role_for(self, current_user_id: int, role_id: int):
        await self.ensure_permission(current_user_id, "role", "delete")
        return await self.delete_role(role_id)

    async def assign_role_to_user_for(self, current_user_id: int, user_id: int, role_id: int):
        await self.ensure_permission(current_user_id, "role", "assign-role")
        return await self.assign_role_to_user(user_id, role_id)

    # -----------------------
    # Module operations with permission checks
    # -----------------------
    async def list_modules_for(self, current_user_id: int):
        await self.ensure_permission(current_user_id, "module", "view")
        return await self.get_all_modules()

    async def create_module_for(self, current_user_id: int, name: str, description: str = ""):
        await self.ensure_permission(current_user_id, "module", "create")
        return await self.create_module(name, description)

    # -----------------------
    # Permission entity operations with checks
    # -----------------------
    async def list_permissions_for(self, current_user_id: int):
        await self.ensure_permission(current_user_id, "permission", "view")
        return await self.get_all_permissions()

    async def create_permission_for(self, current_user_id: int, name: str, description: str = ""):
        await self.ensure_permission(current_user_id, "permission", "create")
        return await self.create_permission(name, description)

    async def remove_permission_from_role_for(self, current_user_id: int, role_id: int, module_id: int, permission_id: int):
        await self.ensure_permission(current_user_id, "permission", "remove")
        return await self.remove_permission_from_role(role_id, module_id, permission_id)

    async def assign_permission_to_role_for(self, current_user_id: int, role_id: int, module_id: int, permission_id: int):
        await self.ensure_permission(current_user_id, "permission", "assign")
        return await self.assign_permission_to_role(role_id, module_id, permission_id)

    async def check_user_permission_for(self, current_user_id: int, user_id: int, module_name: str, permission_name: str) -> bool:
        await self.ensure_permission(current_user_id, "permission", "check")
        return await self.check_user_permission(user_id, module_name, permission_name)

    async def get_role_by_id(self, role_id: int):
        result = await self.db.execute(select(Role).filter_by(id=role_id))
        role = result.scalar_one_or_none()
        if not role:
            return None
        # Lấy permissions cho role này
        result = await self.db.execute(select(RolePermission).filter_by(role_id=role_id))
        role_perms = result.scalars().all()
        perms = [
            {"module_id": rp.module_id, "permission_id": rp.permission_id}
            for rp in role_perms
        ]
        return {
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": perms
        }

    async def get_module_by_name(self, name: str):
        result = await self.db.execute(select(Module).filter_by(name=name))
        return result.scalar_one_or_none()

    async def get_permission_by_name(self, name: str):
        result = await self.db.execute(select(Permission).filter_by(name=name))
        return result.scalar_one_or_none()
    
    async def update_role(self, role_id: int, data: RoleUpdate):
        result = await self.db.execute(select(Role).filter_by(id=role_id))
        role = result.scalar_one_or_none()
        if not role:
            return None
        if data.name is not None:
            role.name = data.name
        if data.description is not None:
            role.description = data.description
        await self.db.commit()
        await self.db.refresh(role)
        return role

    async def delete_role(self, role_id: int):
        result = await self.db.execute(select(Role).filter_by(id=role_id))
        role = result.scalar_one_or_none()
        if not role:
            return False
        # Remove all RolePermission and UserRole linked to this role
        await self.db.execute(delete(RolePermission).filter_by(role_id=role_id))
        await self.db.execute(delete(UserRole).filter_by(role_id=role_id))
        await self.db.delete(role)
        await self.db.commit()
        return True
    
    async def is_root(self, user):
        """Trả về True nếu user có role là root"""
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        if not role_ids:
            return False
        result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
        roles = result.scalars().all()
        role_names = [r.name for r in roles]
        return "root" in role_names

    async def can_manage_user(self, current_user, target_user):
        """
        Chỉ root có thể thao tác với mọi user, admin chỉ thao tác với user thường, user không thao tác ai.
        """
        # Lấy role của current_user và target_user
        result = await self.db.execute(select(UserRole).filter_by(user_id=current_user.id))
        user_roles = result.scalars().all()
        result = await self.db.execute(select(UserRole).filter_by(user_id=target_user.id))
        target_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        target_role_ids = [ur.role_id for ur in target_roles]
        result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
        roles = result.scalars().all()
        result = await self.db.execute(select(Role).filter(Role.id.in_(target_role_ids)))
        target_roles = result.scalars().all()
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

    async def get_user_permissions(self, user_id: int) -> dict:
        """
        Trả về dict dạng {module: [action, ...], ...} cho user
        """
        permissions_dict = {}
        # Lấy tất cả role của user
        result = await self.db.execute(select(UserRole).filter_by(user_id=user_id))
        user_roles = result.scalars().all()
        role_ids = [ur.role_id for ur in user_roles]
        if not role_ids:
            return permissions_dict
        # Lấy tất cả RolePermission của các role này
        result = await self.db.execute(select(RolePermission).filter(RolePermission.role_id.in_(role_ids)))
        role_perms = result.scalars().all()
        # Lấy mapping module_id -> name, permission_id -> name
        result = await self.db.execute(select(Module))
        modules = {m.id: m.name for m in result.scalars().all()}
        result = await self.db.execute(select(Permission))
        perms = {p.id: p.name for p in result.scalars().all()}
        for rp in role_perms:
            module_name = modules.get(rp.module_id)
            perm_name = perms.get(rp.permission_id)
            if module_name is not None and perm_name is not None:
                permissions_dict.setdefault(str(module_name), []).append(str(perm_name))
        return permissions_dict
    
    async def remove_permission_from_role(self, role_id: int, module_id: int, permission_id: int):
        result = await self.db.execute(select(RolePermission).filter_by(role_id=role_id, module_id=module_id, permission_id=permission_id))
        rp = result.scalar_one_or_none()
        if rp:
            await self.db.delete(rp)
            await self.db.commit()
            return True
        return False

    async def is_admin_or_above(self, user):
        result = await self.db.execute(select(UserRole).filter_by(user_id=user.id))
        user_roles = result.scalars().all()
        if not user_roles:
            return False
        role_ids = [ur.role_id for ur in user_roles]
        result = await self.db.execute(select(Role).filter(Role.id.in_(role_ids)))
        roles = result.scalars().all()
        role_names = [r.name for r in roles]
        return any(rn in ("admin", "root") for rn in role_names)

    async def create_role(self, name: str, description: str = ""):
        role = Role(name=name, description=description)
        self.db.add(role)
        await self.db.commit()
        await self.db.refresh(role)
        return role
    
    async def get_all_roles(self):
        result = await self.db.execute(select(Role))
        roles = result.scalars().all()
        # Get all role permissions
        result = await self.db.execute(select(RolePermission))
        role_permissions = result.scalars().all()
        # Build mapping: role_id -> list of {module_id, permission_id}
        from collections import defaultdict
        role_perm_map = defaultdict(list)
        for rp in role_permissions:
            role_perm_map[rp.role_id].append({
                "module_id": rp.module_id,
                "permission_id": rp.permission_id
            })
        # Attach permissions to each role
        result = []
        for role in roles:
            role_dict = {
                "id": role.id,
                "name": role.name,
                "description": role.description,
                "permissions": role_perm_map.get(role.id, [])
            }
            result.append(role_dict)
        return result
    
    async def create_module(self, name: str, description: str = ""):
        module = Module(name=name, description=description)
        self.db.add(module)
        await self.db.commit()
        await self.db.refresh(module)
        return module
    
    async def get_all_modules(self):
        result = await self.db.execute(select(Module))
        return result.scalars().all()

    async def create_permission(self, name: str, description: str = ""):
        permission = Permission(name=name, description=description)
        self.db.add(permission)
        await self.db.commit()
        await self.db.refresh(permission)
        return permission
    
    async def get_all_permissions(self):
        # Lấy tất cả permissions, kèm module_id nếu có
        result = await self.db.execute(select(Permission))
        permissions = result.scalars().all()
        # Map: module_id = module.id nếu permission thuộc module, else None
        # Giả định: tên permission dạng 'module.action', lấy module theo tên
        result = []
        result_modules = await self.db.execute(select(Module))
        modules = {m.name: m.id for m in result_modules.scalars().all()}
        for perm in permissions:
            parts = perm.name.split(".")
            module_name = parts[0] if len(parts) > 1 else None
            module_id = modules.get(module_name) if module_name else None
            result.append({
                "id": perm.id,
                "name": perm.name,
                "description": perm.description,
                "module_id": module_id
            })
        return result

    async def assign_role_to_user(self, user_id: int, role_id: int):
        user_role = UserRole(user_id=user_id, role_id=role_id)
        self.db.add(user_role)
        await self.db.commit()
        await self.db.refresh(user_role)
        return user_role

    async def assign_permission_to_role(self, role_id: int, module_id: int, permission_id: int):
        rp = RolePermission(role_id=role_id, module_id=module_id, permission_id=permission_id)
        self.db.add(rp)
        await self.db.commit()
        await self.db.refresh(rp)
        return rp

    async def check_user_permission(self, user_id: int, module_name: str, permission_name: str) -> bool:
        result = await self.db.execute(select(UserRole).filter_by(user_id=user_id))
        roles = result.scalars().all()
        role_ids = [r.role_id for r in roles]
        
        result = await self.db.execute(select(Module).filter_by(name=module_name))
        module = result.scalar_one_or_none()
        result = await self.db.execute(select(Permission).filter_by(name=permission_name))
        permission = result.scalar_one_or_none()
        if not module or not permission:
            return False
        result = await self.db.execute(select(RolePermission).filter(
            RolePermission.role_id.in_(role_ids),
            RolePermission.module_id == module.id,
            RolePermission.permission_id == permission.id
        ))
        count = len(result.scalars().all())
        return count > 0
