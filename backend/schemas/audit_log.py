
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import List

class UserShortInfo(BaseModel):
    id: int
    username: Optional[str]
    full_name: Optional[str]

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    action: str
    table_name: str
    record_id: int
    user: Optional[UserShortInfo]
    timestamp: datetime
    old_value: Optional[str]
    new_value: Optional[str]
    description: Optional[str]

    class Config:
        from_attributes = True

class PaginatedAuditLogResponse(BaseModel):
    data: List[AuditLogOut]
    total: int
    page: int
    page_size: int
