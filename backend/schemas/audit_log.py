from datetime import datetime

from pydantic import BaseModel


class UserShortInfo(BaseModel):
    id: int
    username: str | None
    full_name: str | None

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: int
    action: str
    table_name: str
    record_id: int
    user: UserShortInfo | None
    timestamp: datetime
    old_value: str | None
    new_value: str | None
    description: str | None

    class Config:
        from_attributes = True


class PaginatedAuditLogResponse(BaseModel):
    data: list[AuditLogOut]
    total: int
    page: int
    page_size: int
