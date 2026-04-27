from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database.models.user import User
from schemas import DemoCreate, DemoUpdate, DemoResponse, PaginatedDemoResponse
from dependencies import get_db, get_current_user
from services import DemoService, PermissionError

router = APIRouter(prefix="/demos", tags=["Demos"])


def get_demo_service(db: AsyncSession = Depends(get_db)) -> DemoService:
    """Dependency injection cho DemoService"""
    return DemoService(db)


@router.get("", response_model=PaginatedDemoResponse)
async def get_demos(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query("", alias="search"),
    service: DemoService = Depends(get_demo_service),
    current_user: User = Depends(get_current_user)
):
    """Lấy danh sách tất cả demos (có tìm kiếm)"""
    try:
        return await service.get_all_demos_for(current_user.id, page, page_size, search or None)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")

@router.post("", response_model=DemoResponse, status_code=status.HTTP_201_CREATED)
async def create_demo(
    demo_data: DemoCreate,
    service: DemoService = Depends(get_demo_service),
    current_user: User = Depends(get_current_user)
):
    """Tạo demo mới"""
    try:
        return await service.create_demo_for(current_user.id, demo_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.put("/{demo_id}", response_model=DemoResponse)
async def update_demo(
    demo_id: int,
    demo_data: DemoUpdate,
    service: DemoService = Depends(get_demo_service),
    current_user: User = Depends(get_current_user)
):
    """Cập nhật demo"""
    try:
        return await service.update_demo_for(current_user.id, demo_id, demo_data)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.delete("/{demo_id}", status_code=status.HTTP_200_OK)
async def delete_demo(
    demo_id: int,
    service: DemoService = Depends(get_demo_service),
    current_user: User = Depends(get_current_user)
):
    """Xóa demo"""
    try:
        await service.delete_demo_for(current_user.id, demo_id)
        return {"message": f"Demo {demo_id} deleted successfully"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")


@router.get("/{demo_id}", response_model=DemoResponse)
async def get_demo(
    demo_id: int,
    service: DemoService = Depends(get_demo_service),
    current_user: User = Depends(get_current_user)
):
    """Lấy chi tiết demo"""
    try:
        return await service.get_demo_for(current_user.id, demo_id)
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Backend Error: {str(e)}")
