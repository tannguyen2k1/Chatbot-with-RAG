from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import text
from typing import AsyncGenerator, Optional
from database.database import engine, AsyncSessionLocal
from database.context import current_tenant_id
from database.rls import APP_ROLE, NO_TENANT_SENTINEL

# Global session factory (không set RLS variable, không SET ROLE - cho auth operations)
GlobalAsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


def _resolve_tenant_setting(raw_tenant_id: Optional[str]) -> str:
    """Parse tenant_id từ JWT context; trả sentinel nếu không hợp lệ."""
    if not raw_tenant_id or raw_tenant_id in ("-", "invalid_token"):
        return NO_TENANT_SENTINEL
    try:
        return str(int(raw_tenant_id))
    except (ValueError, TypeError):
        return NO_TENANT_SENTINEL


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session với tenant context.

    Luôn SET ROLE app_tenant_user để superuser không bypass RLS.
    Nếu không có tenant hợp lệ → set sentinel (-1) → không thấy row nào.
    """
    async with AsyncSessionLocal() as session:
        tenant_setting = _resolve_tenant_setting(current_tenant_id.get())
        await session.execute(text(f"SET ROLE {APP_ROLE}"))
        await session.execute(
            text(f"SET app.current_tenant_id = '{tenant_setting}'")
        )
        try:
            yield session
        finally:
            await session.close()


async def get_global_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get global database session (KHÔNG set RLS variable, KHÔNG SET ROLE).
    Dùng cho auth operations - cần truy cập users ở tất cả tenants.
    """
    async with GlobalAsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
