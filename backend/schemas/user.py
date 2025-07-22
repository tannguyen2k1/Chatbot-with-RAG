from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    role: str = "user"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserResponse(UserBase):
    id: int
    role: str
    permissions: dict[str, list[str]] = {}
    status: str = "active"
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[int] = None
    class Config:
        from_attributes = True


class PaginatedUserResponse(BaseModel):
    data: List[UserResponse]
    total: int
    page: int
    page_size: int
