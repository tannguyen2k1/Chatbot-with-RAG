from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.models.user import User
from dependencies import get_db, get_current_user
from schemas import  PaginatedAuditLogResponse
from services import AuditLogService, PermissionError

router = APIRouter(prefix="/audit-logs", tags=["AuditLog"])

@router.get("", summary="Lấy danh sách audit logs", response_model=PaginatedAuditLogResponse)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(None, alias="search"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = AuditLogService(db)
    try:
        return await service.get_all_audit_logs_for(current_user.id, page=page, page_size=page_size, search=search)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
