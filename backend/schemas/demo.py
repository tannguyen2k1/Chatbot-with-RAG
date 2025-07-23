from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class DemoCreate(BaseModel):
    title: str
    description: Optional[str] = None

class DemoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class DemoResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

class PaginatedDemoResponse(BaseModel):
    data: List[DemoResponse]
    total: int
    page: int
    page_size: int
