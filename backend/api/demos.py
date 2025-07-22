from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from middleware.dependencies import get_db, get_current_user
from services.rbac import RBACService
from services.demo import DemoService
from validators.demos import DemoCreate, DemoUpdate, DemoResponse, PaginatedDemoResponse

router = APIRouter(prefix="/demos", tags=["Demos"])


@router.get("/", response_model=PaginatedDemoResponse)
def get_demos(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách tất cả demos (có tìm kiếm)"""
    role_service = RBACService(db)
    perms = role_service.get_user_permissions(current_user.id)
    actions = perms.get("demos") or []
    if "view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view demos")
    demo_service = DemoService(db)
    skip = (page - 1) * page_size
    demos = demo_service.get_all_demos(skip=skip, limit=page_size, search=search or None)
    total = demo_service.count_demos(search=search or None)
    return {
        "data": demos,
        "total": total,
        "page": page,
        "page_size": page_size
    }



@router.post("/", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
def create_demo(
    demo_data: DemoCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Tạo demo mới"""
    role_service = RBACService(db)
    perms = role_service.get_user_permissions(current_user.id)
    actions = perms.get("demos") or []
    if "create" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to create demos")
    demo_service = DemoService(db)
    new_demo = demo_service.create_demo(demo_data)
    return new_demo


@router.put("/{demo_id}", response_model=DemoResponse)
def update_demo(
    demo_id: int,
    demo_data: DemoUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cập nhật demo"""
    role_service = RBACService(db)
    perms = role_service.get_user_permissions(current_user.id)
    actions = perms.get("demos") or []
    if "update" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to update demos")
    demo_service = DemoService(db)
    demo = demo_service.get_demo_by_id(demo_id)
    if not demo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo not found"
        )
    updated_demo = demo_service.update_demo(demo_id, demo_data)
    return updated_demo


@router.delete("/{demo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_demo(
    demo_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Xóa demo"""
    role_service = RBACService(db)
    perms = role_service.get_user_permissions(current_user.id)
    actions = perms.get("demos") or []
    if "delete" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to delete demos")
    demo_service = DemoService(db)
    demo = demo_service.get_demo_by_id(demo_id)
    if not demo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo not found"
        )
    deleted = demo_service.delete_demo(demo_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete demo"
        )


@router.get("/{demo_id}", response_model=DemoResponse)
def get_demo(
    demo_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy chi tiết demo"""
    role_service = RBACService(db)
    perms = role_service.get_user_permissions(current_user.id)
    actions = perms.get("demos") or []
    if "view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view demo details")
    demo_service = DemoService(db)
    demo = demo_service.get_demo_by_id(demo_id)
    if not demo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo not found"
        )
    return demo
