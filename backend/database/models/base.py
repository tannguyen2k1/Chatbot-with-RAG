from sqlalchemy import BigInteger, DateTime
from sqlalchemy.orm import DeclarativeMeta, Mapped, declarative_base, mapped_column
from sqlalchemy.sql import func

Base: DeclarativeMeta = declarative_base()


class BaseModel(Base):
    __abstract__ = True
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"


class GlobalBaseModel(Base):
    """Base model cho các entity global (like Role, Permission, Module)"""

    __abstract__ = True
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id})>"
