from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Optional
from dependencies import get_db, get_current_tenant, get_current_user
from database.models import Tenant
from schemas.tenant import TenantCreate, TenantUpdate, TenantResponse, PaginatedTenantResponse
from services.rbac import RBACService

router = APIRouter(prefix="/tenant", tags=["Tenant Management"])


@router.post("/", response_model=TenantResponse, status_code=status.HTTP_201_CREATED)
async def create_tenant(
    tenant_data: TenantCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Tạo tenant mới"""
    
    # Kiểm tra quyền
    rbac_service = RBACService(db)
    await rbac_service.ensure_permission(current_user.id, "tenant", "create")
    
    # Kiểm tra tenant_code unique
    existing = await db.execute(
        select(Tenant).where(Tenant.tenant_code == tenant_data.tenant_code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Tenant code already exists"
        )
    
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
        tenant_code=tenant_data.tenant_code,
        domain=tenant_data.domain,
        subdomain=tenant_data.subdomain,
        expiration_date=tenant_data.expiration_date,
        is_active=tenant_data.is_active if tenant_data.is_active is not None else True
    )
    
    db.add(tenant)
    await db.commit()
    await db.refresh(tenant)
    
    return tenant

@router.get("/", response_model=PaginatedTenantResponse)
async def list_tenants(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: AsyncSession = Depends(get_db),
    current_tenant: Optional[Tenant] = Depends(get_current_tenant),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách tenants với phân trang và tìm kiếm"""
    
    # Kiểm tra quyền
    rbac_service = RBACService(db)
    await rbac_service.ensure_permission(current_user.id, "tenant", "view")
    
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
    query = select(Tenant)
    
    # Thêm search filter nếu có
    if search:
        search_lower = f"%{search.lower()}%"
        query = query.filter(
            (Tenant.name.ilike(search_lower)) |
            (Tenant.tenant_code.ilike(search_lower)) |
            (Tenant.domain.ilike(search_lower)) |
            (Tenant.subdomain.ilike(search_lower))
        )
    
    # Đếm tổng số records
    count_result = await db.execute(query)
    total = len(count_result.scalars().all())
    
    # Lấy data với phân trang
    result = await db.execute(
        query.offset(skip).limit(page_size)
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
    current_tenant: Optional[Tenant] = Depends(get_current_tenant),
    current_user = Depends(get_current_user)
):
    """Lấy thông tin tenant theo ID"""
    
    # Kiểm tra quyền
    rbac_service = RBACService(db)
    await rbac_service.ensure_permission(current_user.id, "tenant", "view")
    
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
    current_tenant: Optional[Tenant] = Depends(get_current_tenant),
    current_user = Depends(get_current_user)
):
    """Cập nhật thông tin tenant"""
    
    # Kiểm tra quyền
    rbac_service = RBACService(db)
    await rbac_service.ensure_permission(current_user.id, "tenant", "update")
    
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
    update_data = tenant_data.model_dump(exclude_unset=True)
    
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
    current_tenant: Optional[Tenant] = Depends(get_current_tenant),
    current_user = Depends(get_current_user)
):
    """Xóa tenant vĩnh viễn (hard delete)"""
    
    # Kiểm tra quyền
    rbac_service = RBACService(db)
    await rbac_service.ensure_permission(current_user.id, "tenant", "delete")
    
    # Kiểm tra quyền truy cập
    if current_tenant and current_tenant.id != tenant_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied to this tenant"
        )
    
    # Lấy tenant
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    # Hard delete
    db.delete(tenant)
    await db.commit()
    return None
