from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database.models.audit_log import AuditLog
from schemas.audit_log import PaginatedAuditLogResponse, AuditLogOut
from typing import Optional
from services import RBACService
from database.tenant_session import TenantSession
from database.database import engine

class AuditLogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_audit_logs(self, page: int = 1, page_size: int = 10, search: Optional[str] = None):
        """Lấy tất cả audit_logs với phân trang và tìm kiếm"""
        async with TenantSession(bind=engine) as session:
            query = select(AuditLog)
            if search:
                like = f"%{search}%"
                query = query.filter(
                    (AuditLog.table_name.ilike(like)) |
                    (AuditLog.action.ilike(like)) |
                    (AuditLog.description.ilike(like))
                )
            # Get total count
            result = await session.execute(query)
            total = len(result.scalars().all())
            
            # Get paginated results with user relationship
            query = query.options(selectinload(AuditLog.user)).order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
            result = await session.execute(query)
            logs = result.scalars().all()
            
            return PaginatedAuditLogResponse(
                data=[AuditLogOut.model_validate(log) for log in logs],
                total=total,
                page=page,
                page_size=page_size
            )

    # "For" method that handles permissions and business logic
    async def get_all_audit_logs_for(self, current_user_id: int, page: int = 1, page_size: int = 10, search: Optional[str] = None) -> PaginatedAuditLogResponse:
        """Get all audit logs with permission check"""
        async with TenantSession(bind=engine) as session:
            role_service = RBACService(session)
            await role_service.ensure_permission(current_user_id, "audit_log", "view")
            return await self.get_all_audit_logs(page, page_size, search)
    

