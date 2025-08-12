from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import Demo
from schemas import DemoCreate, DemoUpdate, PaginatedDemoResponse, DemoResponse
from typing import Optional


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

