from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy import text
from typing import AsyncGenerator
from database.database import engine, AsyncSessionLocal
from database.context import current_tenant_id
from database.rls import APP_ROLE

# Global session factory (không set RLS variable, không SET ROLE - cho auth operations)
GlobalAsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,  # Sử dụng AsyncSession thông thường
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session với tenant context.

    Flow:
    1. SET ROLE app_tenant_user → chuyển sang role không phải superuser (RLS hoạt động)
    2. SET app.current_tenant_id = X → RLS tự động filter tất cả queries
    3. Khi session kết thúc → pool event tự RESET ROLE + RESET variable

    Code Python KHÔNG CẦN thêm WHERE tenant_id = X vào bất kỳ câu SQL nào.
    """
    async with AsyncSessionLocal() as session:
        # Đọc tenant_id từ contextvar (đã được set bởi logging middleware)
        tenant_id = current_tenant_id.get()
        if tenant_id and tenant_id != "-":
            try:
                tid = int(tenant_id)
                # SET ROLE → chuyển sang non-superuser để RLS có hiệu lực
                await session.execute(text(f"SET ROLE {APP_ROLE}"))
                # SET biến PostgreSQL cho RLS policy
                await session.execute(text(f"SET app.current_tenant_id = '{tid}'"))
            except (ValueError, TypeError):
                pass
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
