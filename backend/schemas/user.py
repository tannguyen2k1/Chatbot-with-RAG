from pydantic import BaseModel


# Pydantic schemas for user operations
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str | None = None
    phone: str | None = None
    is_active: int = 1
    role: str | None = None


class UserUpdate(BaseModel):
    username: str | None = None
    email: str | None = None
    full_name: str | None = None
    phone: str | None = None
    is_active: int | None = None
    role: str | None = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None = None
    phone: str | None = None
    is_active: int
    roles: list[str] = []
    permissions: dict[str, list[str]] = {}

    class Config:
        from_attributes = True


class UserResetPassword(BaseModel):
    new_password: str


class PaginatedUserResponse(BaseModel):
    data: list[UserResponse]
    total: int
    page: int
    page_size: int
