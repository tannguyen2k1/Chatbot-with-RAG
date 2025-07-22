from pydantic import BaseModel
from typing import List, Optional

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
