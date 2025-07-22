from pydantic import BaseModel
from typing import Optional

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ModuleCreate(BaseModel):
    name: str
    description: Optional[str] = None

class PermissionCreate(BaseModel):
    name: str
    description: Optional[str] = None

class AssignRoleToUser(BaseModel):
    user_id: int
    role_id: int

class AssignPermissionToRole(BaseModel):
    role_id: int
    module_id: int
    permission_id: int
