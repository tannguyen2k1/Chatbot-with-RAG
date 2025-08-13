
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, BigInteger
from database.models import BaseModel
from typing import Optional

class Role(BaseModel):
    __tablename__ = "roles"
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class Module(BaseModel):
    __tablename__ = "modules"
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class Permission(BaseModel):
    __tablename__ = "permissions"
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

class RolePermission(BaseModel):
    __tablename__ = "role_permissions"
    role_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    module_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    permission_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)

class UserRole(BaseModel):
    __tablename__ = "user_roles"
    user_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    role_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
