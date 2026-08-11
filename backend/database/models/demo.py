from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database.models import BaseModel


class Demo(BaseModel):
    __tablename__ = "demos"
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
