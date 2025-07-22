from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List

from middleware.dependencies import get_db
from middleware.permissions import require_demo_view
from services.demo import DemoService
from validators.demos import DemoCreate, DemoUpdate, DemoResponse, PaginatedDemoResponse

router = APIRouter(prefix="/demos", tags=["Demos"])


@router.get("/", response_model=PaginatedDemoResponse)
def get_demos(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user = Depends(require_demo_view),
    db: Session = Depends(get_db)
):
    """Lấy danh sách tất cả demos (chỉ user có quyền demo_view mới xem được)"""
    demo_service = DemoService(db)
    skip = (page - 1) * page_size
    demos = demo_service.get_all_demos(skip=skip, limit=page_size)
    total = demo_service.count_demos()
    return {
        "data": demos,
        "total": total,
        "page": page,
        "page_size": page_size
    }



@router.post("/", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
def create_demo(
    demo_data: DemoCreate,
    db: Session = Depends(get_db)
):
    """Tạo demo mới"""
    demo_service = DemoService(db)
    new_demo = demo_service.create_demo(demo_data)
    return new_demo


@router.put("/{demo_id}", response_model=DemoResponse)
def update_demo(
    demo_id: int,
    demo_data: DemoUpdate,
    db: Session = Depends(get_db)
):
    """Cập nhật demo"""
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
    db: Session = Depends(get_db)
):
    """Xóa demo"""
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
    db: Session = Depends(get_db)
):
    """Lấy chi tiết demo"""
    demo_service = DemoService(db)
    demo = demo_service.get_demo_by_id(demo_id)
    if not demo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo not found"
        )
    return demo
