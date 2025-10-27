from pydantic import BaseModel
from typing import List, Optional

# Pydantic schemas for user operations
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: int = 1
    role: Optional[str] = None

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: int | None = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: int
    roles: list[str] = []
    permissions: dict[str, list[str]] = {}
    class Config:
        from_attributes = True

class UserResetPassword(BaseModel):
    new_password: str

class PaginatedUserResponse(BaseModel):
    data: List[UserResponse]
    total: int
    page: int
    page_size: int
