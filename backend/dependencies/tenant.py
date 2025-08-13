from fastapi import Depends, Request, HTTPException
from typing import Optional
from database.models.tenant import Tenant
from middleware.tenant_middleware import tenant_middleware

async def get_current_tenant(request: Request) -> Optional[Tenant]:
    """Dependency để lấy tenant hiện tại từ request"""
    tenant = await tenant_middleware.get_tenant_from_request(request)
    return tenant

async def require_tenant(tenant: Optional[Tenant] = Depends(get_current_tenant)) -> Tenant:
    """Dependency bắt buộc phải có tenant"""
    if not tenant:
        raise HTTPException(
            status_code=400,
            detail="Tenant is required for this operation"
        )
    return tenant

def get_tenant_filter(tenant: Optional[Tenant] = None):
    """Tạo filter để lọc dữ liệu theo tenant"""
    if tenant:
        return {"tenant_id": tenant.id}
    return {}

async def filter_by_tenant(query, tenant: Optional[Tenant] = None):
    """Tự động filter query theo tenant"""
    if tenant:
        # Thêm tenant filter vào query
        if hasattr(query, 'where'):
            query = query.where(query.column('tenant_id') == tenant.id)
    return query
