from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Boolean, ForeignKey
from database.models.base import BaseModel
from typing import Optional, List, TYPE_CHECKING

if TYPE_CHECKING:
    from database.models.user import User
    from database.models.auth_models import Role, Module

class Tenant(BaseModel):
    __tablename__ = "tenants"
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    subdomain: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    max_users: Mapped[int] = mapped_column(Integer, default=100)
    plan: Mapped[str] = mapped_column(String(50), default="basic")  # basic, pro, enterprise
    settings: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)  # JSON string for custom settings
    
    # Relationships - sử dụng string để tránh circular import
    users: Mapped[List["User"]] = relationship("User", back_populates="tenant")
    roles: Mapped[List["Role"]] = relationship("Role", back_populates="tenant")
    modules: Mapped[List["Module"]] = relationship("Module", back_populates="tenant")
