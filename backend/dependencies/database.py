from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from database.database import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get a plain database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_global_db() -> AsyncGenerator[AsyncSession, None]:
    """Alias for get_db (kept for backward compatibility)."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


# Kept for services that open their own session outside of FastAPI DI
GlobalAsyncSessionLocal = AsyncSessionLocal
