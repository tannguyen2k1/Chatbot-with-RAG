
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text
from database.models import BaseModel
from typing import Optional


class Demo(BaseModel):
    __tablename__ = "demos"
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
