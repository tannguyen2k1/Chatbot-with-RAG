from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from typing import List


# Pydantic models
class TenantCreate(BaseModel):
    name: str
    tenant_code: str
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    expiration_date: Optional[datetime] = None
    is_active: Optional[bool] = True

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    tenant_code: Optional[str] = None
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    is_active: Optional[bool] = None
    expiration_date: Optional[datetime] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    tenant_code: str
    domain: Optional[str]
    subdomain: Optional[str]
    is_active: bool
    expiration_date: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class PaginatedTenantResponse(BaseModel):
    data: List[TenantResponse]
    total: int
    page: int
    page_size: int