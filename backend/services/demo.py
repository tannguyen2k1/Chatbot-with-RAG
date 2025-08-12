from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Demo
from schemas import DemoCreate, DemoUpdate, PaginatedDemoResponse, DemoResponse
from typing import Optional
from services import RBACService


class DemoService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all_demos(self, page: int = 1, page_size: int = 10, search: Optional[str] = None) -> PaginatedDemoResponse:
        """Lấy tất cả demos với phân trang và tìm kiếm"""
        query = select(Demo)
        if search:
            like = f"%{search}%"
            query = query.filter(
                (Demo.title.ilike(like)) | (Demo.description.ilike(like))
            )
        # Get total count
        result = await self.db.execute(query)
        total = len(result.scalars().all())
        
        # Get paginated results
        query = query.order_by(Demo.id.asc()).offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        demos = result.scalars().all()
        
        return PaginatedDemoResponse(
            data=[DemoResponse.model_validate(demo) for demo in demos],
            total=total,
            page=page,
            page_size=page_size
        )   

    async def get_demo_by_id(self, demo_id: int) -> Optional[Demo]:
        """Lấy demo theo ID"""
        result = await self.db.execute(select(Demo).filter(Demo.id == demo_id))
        return result.scalar_one_or_none()

    async def create_demo(self, demo_data: DemoCreate) -> Demo:
        """Tạo demo mới"""
        new_demo = Demo(
            title=demo_data.title,
            description=demo_data.description
        )
        self.db.add(new_demo)
        await self.db.commit()
        await self.db.refresh(new_demo)
        return new_demo

    async def update_demo(self, demo_id: int, demo_data: DemoUpdate) -> Optional[Demo]:
        """Cập nhật demo"""
        demo = await self.get_demo_by_id(demo_id)
        if not demo:
            return None
        if demo_data.title is not None:
            demo.title = demo_data.title
        if demo_data.description is not None:
            demo.description = demo_data.description
        await self.db.commit()
        await self.db.refresh(demo)
        return demo

    async def delete_demo(self, demo_id: int) -> bool:
        """Xóa demo"""
        demo = await self.get_demo_by_id(demo_id)
        if not demo:
            return False
        await self.db.delete(demo)
        await self.db.commit()
        return True

    # "For" methods that handle permissions and business logic
    async def get_all_demos_for(self, current_user_id: int, page: int = 1, page_size: int = 10, search: Optional[str] = None) -> PaginatedDemoResponse:
        """Get all demos with permission check"""
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "demo", "view")
        return await self.get_all_demos(page, page_size, search)

    async def get_demo_for(self, current_user_id: int, demo_id: int) -> DemoResponse:
        """Get demo by ID with permission check"""
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "demo", "view")
        
        demo = await self.get_demo_by_id(demo_id)
        if not demo:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo not found")
        
        return DemoResponse.model_validate(demo)

    async def create_demo_for(self, current_user_id: int, demo_data: DemoCreate) -> DemoResponse:
        """Create demo with permission check"""
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "demo", "create")
        
        demo = await self.create_demo(demo_data)
        return DemoResponse.model_validate(demo)

    async def update_demo_for(self, current_user_id: int, demo_id: int, demo_data: DemoUpdate) -> DemoResponse:
        """Update demo with permission check"""
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "demo", "update")
        
        demo = await self.get_demo_by_id(demo_id)
        if not demo:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo not found")
        
        updated_demo = await self.update_demo(demo_id, demo_data)
        if updated_demo is None:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo not found after update")
        
        return DemoResponse.model_validate(updated_demo)

    async def delete_demo_for(self, current_user_id: int, demo_id: int) -> dict:
        """Delete demo with permission check"""
        role_service = RBACService(self.db)
        await role_service.ensure_permission(current_user_id, "demo", "delete")
        
        demo = await self.get_demo_by_id(demo_id)
        if not demo:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo not found")
        
        deleted = await self.delete_demo(demo_id)
        if not deleted:
            from fastapi import HTTPException, status
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not delete demo")
        
        return {"message": f"Demo with ID: {demo_id} has been deleted"}

