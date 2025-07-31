from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import List

class AuditLogOut(BaseModel):
    id: int
    action: str
    table_name: str
    record_id: int
    user_id: Optional[int]
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
