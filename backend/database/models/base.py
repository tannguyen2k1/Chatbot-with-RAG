from sqlalchemy.orm import declarative_base,Mapped, mapped_column, DeclarativeMeta
from sqlalchemy import DateTime,BigInteger
from typing import Optional
from sqlalchemy.sql import func
Base: DeclarativeMeta = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())