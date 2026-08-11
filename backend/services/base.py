from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, TypeVar, Generic, Type
from database.models.base import BaseModel

T = TypeVar('T', bound=BaseModel)

class BaseService(Generic[T]):
    """Base service class for common CRUD operations"""
    
    def __init__(self, db: AsyncSession, model_class: Type[T]):
        self.db = db
        self.model_class = model_class
    
    async def get_by_id(self, id: int):
        query = select(self.model_class).filter(self.model_class.id == id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_all(self, **filters):
        query = select(self.model_class)
        
        for field, value in filters.items():
            if hasattr(self.model_class, field):
                query = query.filter(getattr(self.model_class, field) == value)
        
        result = await self.db.execute(query)
        return result.scalars().all()
    
    async def create(self, **data):
        instance = self.model_class(**data)
        self.db.add(instance)
        await self.db.commit()
        await self.db.refresh(instance)
        return instance
    
    async def update(self, id: int, **data):
        instance = await self.get_by_id(id)
        if not instance:
            return None
        
        for field, value in data.items():
            if hasattr(instance, field):
                setattr(instance, field, value)
        
        await self.db.commit()
        await self.db.refresh(instance)
        return instance
    
    async def delete(self, id: int):
        instance = await self.get_by_id(id)
        if not instance:
            return False
        
        await self.db.delete(instance)
        await self.db.commit()
        return True
