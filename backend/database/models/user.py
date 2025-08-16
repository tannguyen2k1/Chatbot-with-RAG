
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, ForeignKey
from database.models import BaseModel, UserRole
from typing import Optional, List

class User(BaseModel):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    
    # Relationships 
    user_roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="user")
    
    @property
    def is_root_user(self) -> bool:
        """Kiểm tra xem user có phái là root user không (tenant_id = NULL)"""
        return self.tenant_id is None