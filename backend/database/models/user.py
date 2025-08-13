
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, String
from database.models import BaseModel
from typing import Optional

class User(BaseModel):
    __tablename__ = "users"
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    role: Mapped[str] = mapped_column(String(50), default="user")