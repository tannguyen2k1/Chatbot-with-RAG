from sqlalchemy.ext.asyncio import AsyncSession

from schemas import DemoCreate
from services import DemoService


async def seed_default_demos(db: AsyncSession) -> None:
    """Seed default demo data"""
    demo_service = DemoService(db)
    response = await demo_service.get_all_demos()
    if not response.data:
        for i in range(1, 5):
            demo_create = DemoCreate(title=f"Demo {i}", description=f"Demo sample {i}")
            await demo_service.create_demo(demo_create)
