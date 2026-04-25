from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, BigInteger
from database.models import BaseModel
from typing import Optional


class Config(BaseModel):
    __tablename__ = "configs"

    key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    group_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, index=True)
    is_system: Mapped[bool] = mapped_column(default=False, nullable=False)
