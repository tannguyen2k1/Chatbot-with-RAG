from pydantic import BaseModel

class RemovePermissionFromRole(BaseModel):
    role_id: int
    module_id: int
    permission_id: int
