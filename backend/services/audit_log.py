from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from database.models.audit_log import AuditLog
from schemas.audit_log import PaginatedAuditLogResponse, AuditLogOut
from typing import Optional

class AuditLogService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_audit_logs(self, page: int = 1, page_size: int = 10, search: Optional[str] = None):
        """Lấy tất cả audit_logs với phân trang và tìm kiếm"""
        query = select(AuditLog)
        if search:
            like = f"%{search}%"
            query = query.filter(
                (AuditLog.table_name.ilike(like)) |
                (AuditLog.action.ilike(like)) |
                (AuditLog.description.ilike(like))
            )
        # Get total count
        result = await self.db.execute(query)
        total = len(result.scalars().all())
        
        # Get paginated results with user relationship
        query = query.options(selectinload(AuditLog.user)).order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        logs = result.scalars().all()
        
        return PaginatedAuditLogResponse(
            data=[AuditLogOut.model_validate(log) for log in logs],
            total=total,
            page=page,
            page_size=page_size
        )
    

