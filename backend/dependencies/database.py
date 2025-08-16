from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from typing import AsyncGenerator
from database.database import get_async_db, engine

# Global session factory (không có tenant filtering)
GlobalAsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,  # Sử dụng AsyncSession thông thường
    expire_on_commit=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session bình thường"""
    async for session in get_async_db():
        yield session

async def get_global_db() -> AsyncGenerator[AsyncSession, None]:
    """Get global database session (không có tenant filtering) - cho auth operations"""
    async with GlobalAsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
