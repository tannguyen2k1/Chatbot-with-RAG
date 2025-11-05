from fastapi import Request
from sqlalchemy import select
from typing import Optional
from database.models import Tenant
from database.database import get_async_db
# Bỏ imports không cần thiết

class TenantMiddleware:
    """Middleware để xác định tenant từ request"""
    
    async def get_tenant_from_request(self, request: Request) -> Optional[Tenant]:
        """Lấy tenant từ request header hoặc domain"""
        
        # 1. Kiểm tra X-Tenant-ID header (cho development)
        tenant_id = request.headers.get("X-Tenant-ID")
        if tenant_id:
            try:
                tenant = await self._get_tenant_by_id(int(tenant_id))
                if tenant:
                    return tenant
            except ValueError:
                pass
        
        # 2. Kiểm tra subdomain
        host = request.headers.get("host", "")
        if "." in host:
            subdomain = host.split(".")[0]
            if subdomain and subdomain != "www":
                tenant = await self._get_tenant_by_subdomain(subdomain)
                if tenant:
                    return tenant
        
        # 3. Kiểm tra domain
        if host:
            tenant = await self._get_tenant_by_domain(host)
            if tenant:
                return tenant
        
        return None
    
    async def _get_tenant_by_id(self, tenant_id: int) -> Optional[Tenant]:
        """Lấy tenant theo ID"""
        async for db in get_async_db():
            try:
                result = await db.execute(
                    select(Tenant).filter(Tenant.id == tenant_id, Tenant.is_active)
                )
                return result.scalar_one_or_none()
            finally:
                await db.close()
        return None
    
    async def _get_tenant_by_subdomain(self, subdomain: str) -> Optional[Tenant]:
        """Lấy tenant theo subdomain"""
        async for db in get_async_db():
            try:
                result = await db.execute(
                    select(Tenant).filter(Tenant.subdomain == subdomain, Tenant.is_active)
                )
                return result.scalar_one_or_none()
            finally:
                await db.close()
        return None
    
    async def _get_tenant_by_domain(self, domain: str) -> Optional[Tenant]:
        """Lấy tenant theo domain"""
        async for db in get_async_db():
            try:
                result = await db.execute(
                    select(Tenant).filter(Tenant.domain == domain, Tenant.is_active)
                )
                return result.scalar_one_or_none()
            finally:
                await db.close()
        return None

# Instance để sử dụng
tenant_middleware = TenantMiddleware()
