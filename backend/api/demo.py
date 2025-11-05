from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from schemas import DemoCreate, DemoUpdate, DemoResponse, PaginatedDemoResponse
from dependencies import get_db, get_current_user
from services import DemoService, PermissionError

router = APIRouter(prefix="/demos", tags=["Demos"])


@router.get("", response_model=PaginatedDemoResponse)
async def get_demos(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách tất cả demos (có tìm kiếm)"""
    demo_service = DemoService(db)
    try:
        return await demo_service.get_all_demos_for(current_user.id, page, page_size, search or None)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
async def create_demo(
    demo_data: DemoCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Tạo demo mới"""
    demo_service = DemoService(db)
    try:
        return await demo_service.create_demo_for(current_user.id, demo_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.put("/{demo_id}", response_model=DemoResponse)
async def update_demo(
    demo_id: int,
    demo_data: DemoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cập nhật demo"""
    demo_service = DemoService(db)
    try:
        return await demo_service.update_demo_for(current_user.id, demo_id, demo_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{demo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_demo(
    demo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Xóa demo"""
    demo_service = DemoService(db)
    try:
        return await demo_service.delete_demo_for(current_user.id, demo_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{demo_id}", response_model=DemoResponse)
async def get_demo(
    demo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy chi tiết demo"""
    demo_service = DemoService(db)
    try:
        return await demo_service.get_demo_for(current_user.id, demo_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
