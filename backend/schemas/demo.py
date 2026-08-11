from datetime import datetime

from pydantic import BaseModel


class DemoCreate(BaseModel):
    title: str
    description: str | None = None


class DemoUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class DemoResponse(BaseModel):
    id: int
    title: str
    description: str | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class PaginatedDemoResponse(BaseModel):
    data: list[DemoResponse]
    total: int
    page: int
    page_size: int
