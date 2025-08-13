from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import List, Optional
from dependencies import get_db, get_current_tenant
from database.models import Tenant
from pydantic import BaseModel
from datetime import datetime
# Bỏ imports không cần thiết

router = APIRouter(prefix="/tenant", tags=["Tenant Management"])

# Pydantic models
class TenantCreate(BaseModel):
    name: str
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    max_users: int = 100
    plan: str = "basic"
    settings: Optional[str] = None

class TenantUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    subdomain: Optional[str] = None
    is_active: Optional[bool] = None
    max_users: Optional[int] = None
    plan: Optional[str] = None
    settings: Optional[str] = None

class TenantResponse(BaseModel):
    id: int
    name: str
    domain: Optional[str]
    subdomain: Optional[str]
    is_active: bool
    max_users: int
    plan: str
    settings: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class PaginatedTenantResponse(BaseModel):
    data: List[TenantResponse]
    total: int
    page: int
    page_size: int

@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: AsyncSession = Depends(get_db)
):
    """Tạo tenant mới"""
    
    # Kiểm tra domain/subdomain unique
    if tenant_data.domain:
        existing = await db.execute(
            select(Tenant).where(Tenant.domain == tenant_data.domain)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Domain already exists"
            )
    
    if tenant_data.subdomain:
        existing = await db.execute(
            select(Tenant).where(Tenant.subdomain == tenant_data.subdomain)
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Subdomain already exists"
            )
    
    # Tạo tenant
    tenant = Tenant(
        name=tenant_data.name,
        domain=tenant_data.domain,
        subdomain=tenant_data.subdomain,
        max_users=tenant_data.max_users,
        plan=tenant_data.plan,
        settings=tenant_data.settings
    )
    
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    
    return tenant

@router.get("/", response_model=PaginatedTenantResponse)
async def list_tenants(
    page: int = 1,
    page_size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_tenant: Optional[Tenant] = Depends(get_current_tenant)
):
    """Lấy danh sách tenants với phân trang"""
    
    # Tính offset
    skip = (page - 1) * page_size
    
    # Nếu có tenant context, chỉ trả về tenant đó
    if current_tenant:
        return PaginatedTenantResponse(
            data=[current_tenant],
            total=1,
            page=page,
            page_size=page_size
        )
    
    # Nếu không có tenant context, trả về tất cả (cho admin)
    # Đếm tổng số records
    count_result = await db.execute(select(Tenant))
    total = len(count_result.scalars().all())
    
    # Lấy data với phân trang
    result = await db.execute(
        select(Tenant).offset(skip).limit(page_size)
    )
    tenants = result.scalars().all()
    
    return PaginatedTenantResponse(
        data=tenants,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_tenant: Optional[Tenant] = Depends(get_current_tenant)
):
    """Lấy thông tin tenant theo ID"""
    
    # Kiểm tra quyền truy cập
    if current_tenant and current_tenant.id != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this tenant"
        )
    
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )
    
    return tenant

@router.put("/{tenant_id}", response_model=TenantResponse)
async def update_tenant(
    tenant_id: int,
    tenant_data: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    current_tenant: Optional[Tenant] = Depends(get_current_tenant)
):
    """Cập nhật thông tin tenant"""
    
    # Kiểm tra quyền truy cập
    if current_tenant and current_tenant.id != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this tenant"
        )
    
    # Kiểm tra tenant tồn tại
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    tenant = result.scalar_one_or_none()
    
    if not tenant:
        raise HTTPException(
            status_code=404,
            detail="Tenant not found"
        )
    
    # Cập nhật dữ liệu
    update_data = tenant_data.dict(exclude_unset=True)
    
    # Kiểm tra domain/subdomain unique nếu có thay đổi
    if "domain" in update_data and update_data["domain"]:
        existing = await db.execute(
            select(Tenant).where(
                Tenant.domain == update_data["domain"],
                Tenant.id != tenant_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Domain already exists"
            )
    
    if "subdomain" in update_data and update_data["subdomain"]:
        existing = await db.execute(
            select(Tenant).where(
                Tenant.subdomain == update_data["subdomain"],
                Tenant.id != tenant_id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(
                status_code=400,
                detail="Subdomain already exists"
            )
    
    # Thực hiện cập nhật
    await db.execute(
        update(Tenant)
        .where(Tenant.id == tenant_id)
        .values(**update_data)
    )
    await db.commit()
    
    # Lấy tenant đã cập nhật
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id)
    )
    return result.scalar_one()

@router.delete("/{tenant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tenant(
    tenant_id: int,
    db: AsyncSession = Depends(get_db),
    current_tenant: Optional[Tenant] = Depends(get_current_tenant)
):
    """Xóa tenant (soft delete)"""
    
    # Kiểm tra quyền truy cập
    if current_tenant and current_tenant.id != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this tenant"
        )
    
    # Soft delete - chỉ đánh dấu không active
    await db.execute(
        update(Tenant)
        .where(Tenant.id == tenant_id)
        .values(is_active=False)
    )
    await db.commit()
    
    return None
