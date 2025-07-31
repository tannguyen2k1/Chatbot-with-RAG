from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from services.audit_log import AuditLogService
from schemas.audit_log import PaginatedAuditLogResponse
from middleware import get_db
from middleware.dependency import get_current_user
from services import RBACService

router = APIRouter(prefix="/audit-logs", tags=["AuditLog"])

@router.get("/", summary="Lấy danh sách audit logs", response_model=PaginatedAuditLogResponse)
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(None, alias="search"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    role_service = RBACService(db)
    perms = role_service.get_user_permissions(current_user.id)
    actions = perms.get("audit_log", [])
    if "audit_log.view" not in actions:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="You don't have permission to view audit logs")
    service = AuditLogService(db)
    response = service.get_all_audit_logs(page=page, page_size=page_size, search=search)
    return response
