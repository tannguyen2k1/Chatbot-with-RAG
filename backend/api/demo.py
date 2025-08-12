from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from middleware.dependency import get_db, get_current_user
from services import RBACService, DemoService
from schemas import DemoCreate, DemoUpdate, DemoResponse, PaginatedDemoResponse

router = APIRouter(prefix="/demos", tags=["Demos"])


@router.get("/", response_model=PaginatedDemoResponse)
async def get_demos(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy danh sách tất cả demos (có tìm kiếm)"""
    role_service = RBACService(db)
    perms = await role_service.get_user_permissions(current_user.id)
    actions = perms.get("demo", [])
    if "demo.view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view demos")
    demo_service = DemoService(db)
    response = await demo_service.get_all_demos(page=page, page_size=page_size, search=search or None)
    return response

@router.post("/", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
async def create_demo(
    demo_data: DemoCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Tạo demo mới"""
    role_service = RBACService(db)
    perms = await role_service.get_user_permissions(current_user.id)
    actions = perms.get("demo", [])
    if "demo.create" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to create demos")
    demo_service = DemoService(db)
    new_demo = await demo_service.create_demo(demo_data)
    return new_demo


@router.put("/{demo_id}", response_model=DemoResponse)
async def update_demo(
    demo_id: int,
    demo_data: DemoUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cập nhật demo"""
    role_service = RBACService(db)
    perms = await role_service.get_user_permissions(current_user.id)
    actions = perms.get("demo", [])
    if "demo.update" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to update demos")
    demo_service = DemoService(db)
    demo = await demo_service.get_demo_by_id(demo_id)
    if not demo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo not found"
        )
    updated_demo = await demo_service.update_demo(demo_id, demo_data)
    return updated_demo


@router.delete("/{demo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_demo(
    demo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Xóa demo"""
    role_service = RBACService(db)
    perms = await role_service.get_user_permissions(current_user.id)
    actions = perms.get("demo", [])
    if "demo.delete" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to delete demos")
    demo_service = DemoService(db)
    demo = await demo_service.get_demo_by_id(demo_id)
    if not demo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo not found"
        )
    deleted = await demo_service.delete_demo(demo_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not delete demo"
        )


@router.get("/{demo_id}", response_model=DemoResponse)
async def get_demo(
    demo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Lấy chi tiết demo"""
    role_service = RBACService(db)
    perms = await role_service.get_user_permissions(current_user.id)
    actions = perms.get("demo", [])
    if "demo.view" not in actions:
        raise HTTPException(status_code=403, detail="You don't have permission to view demo details")
    demo_service = DemoService(db)
    demo = await demo_service.get_demo_by_id(demo_id)
    if not demo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo not found"
        )
    return demo
