from sqlalchemy.orm import Session, selectinload
from database.models.audit_log import AuditLog
from schemas.audit_log import PaginatedAuditLogResponse, AuditLogOut
from typing import Optional

class AuditLogService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_audit_logs(self, page: int = 1, page_size: int = 10, search: Optional[str] = None):
        """Lấy tất cả audit_logs với phân trang và tìm kiếm"""
        query = self.db.query(AuditLog)
        if search:
            like = f"%{search}%"
            query = query.filter(
                (AuditLog.table_name.ilike(like)) |
                (AuditLog.action.ilike(like)) |
                (AuditLog.description.ilike(like))
            )
        total = query.count()
        logs = query.options(selectinload(AuditLog.user)).order_by(AuditLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()
        return PaginatedAuditLogResponse(
            data=[AuditLogOut.model_validate(log) for log in logs],
            total=total,
            page=page,
            page_size=page_size
        )
    

