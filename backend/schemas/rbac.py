from pydantic import BaseModel


class RoleCreate(BaseModel):
    name: str
    description: str | None = None


class ModuleCreate(BaseModel):
    name: str
    description: str | None = None


class PermissionCreate(BaseModel):
    name: str
    description: str | None = None


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


class RoleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class PermissionError(Exception):
    """Custom exception for permission-related errors"""


class RoleOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    permissions: list[RolePermissionOut] = []

    class Config:
        from_attributes = True
