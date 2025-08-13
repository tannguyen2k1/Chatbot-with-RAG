from sqlalchemy.ext.asyncio import AsyncSession
from database.models import Tenant
from services import DemoService
from schemas import DemoCreate

async def seed_default_demos(db: AsyncSession, tenant: Tenant) -> None:
    """Seed demo data mặc định cho tenant"""
    demo_service = DemoService(db)
    response = await demo_service.get_all_demos()
    if not response.data:
        for i in range(1, 5):
            demo_create = DemoCreate(title=f"Demo {i}", description=f"Demo mẫu {i}")
            demo = await demo_service.create_demo(demo_create)
            # Gán tenant_id cho demo
            demo.tenant_id = tenant.id
            await db.commit()
