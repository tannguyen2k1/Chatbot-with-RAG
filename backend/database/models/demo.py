
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, DateTime
from sqlalchemy.sql import func
from database.models import Base
from typing import Optional


class Demo(Base):
    __tablename__ = "demos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())
