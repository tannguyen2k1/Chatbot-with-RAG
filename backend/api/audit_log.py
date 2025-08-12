from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from services.audit_log import AuditLogService
from schemas.audit_log import PaginatedAuditLogResponse
from middleware import get_db
from middleware.dependency import get_current_user
from services.rbac import PermissionError


router = APIRouter(prefix="/audit-logs", tags=["AuditLog"])

@router.get("/", summary="Lấy danh sách audit logs", response_model=PaginatedAuditLogResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(None, alias="search"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = AuditLogService(db)
    try:
        return await service.get_all_audit_logs_for(current_user.id, page, page_size, search)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
