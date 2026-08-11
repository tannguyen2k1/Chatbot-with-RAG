from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database.models import BaseModel


class Config(BaseModel):
    __tablename__ = "configs"

    key: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    value: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    group_name: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    is_system: Mapped[bool] = mapped_column(default=False, nullable=False)
