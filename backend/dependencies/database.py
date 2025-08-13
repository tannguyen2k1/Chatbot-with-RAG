from sqlalchemy.ext.asyncio import AsyncSession
from typing import AsyncGenerator
from database.database import get_async_db

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session bình thường"""
    async for session in get_async_db():
        yield session
