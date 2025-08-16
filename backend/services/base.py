from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.context import current_tenant_id
from typing import Optional, TypeVar, Generic, Type
from database.models.base import BaseModel
from database.tenant_session import TenantSession
from database.database import engine

T = TypeVar('T', bound=BaseModel)

class BaseService(Generic[T]):
    """Base service class với automatic tenant filtering"""
    
    def __init__(self, db: AsyncSession, model_class: Type[T]):
        self.db = db
        self.model_class = model_class
    
    def _get_current_tenant_id(self) -> Optional[int]:
        """Lấy tenant_id từ context"""
        tenant_id = current_tenant_id.get()
        if tenant_id is None or tenant_id == "-":
            return None
        try:
            return int(tenant_id)
        except (ValueError, TypeError):
            return None
    
    def _add_tenant_filter(self, query, tenant_id: Optional[int] = None):
        """Tự động thêm tenant filter vào query"""
        if tenant_id is None:
            tenant_id = self._get_current_tenant_id()
        
        if tenant_id is not None:
            query = query.filter(self.model_class.tenant_id == tenant_id)
        
        return query
    
    async def get_by_id(self, id: int, tenant_id: Optional[int] = None):
        """Lấy record theo ID với tenant filter"""
        async with TenantSession(bind=engine) as session:
            query = select(self.model_class).filter(self.model_class.id == id)
            query = self._add_tenant_filter(query, tenant_id)
            result = await session.execute(query)
            return result.scalar_one_or_none()
    
    async def get_all(self, tenant_id: Optional[int] = None, **filters):
        """Lấy tất cả records với tenant filter"""
        async with TenantSession(bind=engine) as session:
            query = select(self.model_class)
            
            # Thêm các filter khác
            for field, value in filters.items():
                if hasattr(self.model_class, field):
                    query = query.filter(getattr(self.model_class, field) == value)
            
            query = self._add_tenant_filter(query, tenant_id)
            result = await session.execute(query)
            return result.scalars().all()
    
    async def create(self, **data):
        """Tạo record mới với tenant_id tự động"""
        async with TenantSession(bind=engine) as session:
            tenant_id = self._get_current_tenant_id()
            if tenant_id is not None:
                data['tenant_id'] = tenant_id
            
            instance = self.model_class(**data)
            session.add(instance)
            await session.commit()
            await session.refresh(instance)
            return instance
    
    async def update(self, id: int, **data):
        """Update record với tenant filter"""
        async with TenantSession(bind=engine) as session:
            instance = await self.get_by_id(id)
            if not instance:
                return None
            
            for field, value in data.items():
                if hasattr(instance, field):
                    setattr(instance, field, value)
            
            await session.commit()
            await session.refresh(instance)
            return instance
    
    async def delete(self, id: int):
        """Xóa record với tenant filter"""
        async with TenantSession(bind=engine) as session:
            instance = await self.get_by_id(id)
            if not instance:
                return False
            
            await session.delete(instance)
            await session.commit()
            return True
