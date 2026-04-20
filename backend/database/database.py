from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from config.settings import settings
from .tenant_session import TenantSession

# Convert DATABASE_URL to async format if it's not already
DATABASE_URL = settings.DATABASE_URL
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Create the async database engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=False,
    pool_recycle=300,
    pool_size=10,
    max_overflow=20,
)

# Đăng ký pool events để RESET biến tenant khi connection trả về pool
from .rls import register_pool_events

register_pool_events(engine)

# Create async session factory với TenantSession
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=TenantSession,  # Sử dụng TenantSession thay vì AsyncSession
    expire_on_commit=False,
)


# Base class for models
class Base(DeclarativeBase):
    pass


# Dependency to get async database session
async def get_async_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
