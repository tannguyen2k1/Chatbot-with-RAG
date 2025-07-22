from pydantic import BaseModel
from typing import Optional, List

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


    
class RemovePermissionFromRole(BaseModel):
    role_id: int
    module_id: int
    permission_id: int
    
    
class RolePermissionOut(BaseModel):
    module_id: int
    permission_id: int

class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    permissions: List[RolePermissionOut] = []

    class Config:
        orm_mode = True