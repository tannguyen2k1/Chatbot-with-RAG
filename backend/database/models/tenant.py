from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, DateTime, BigInteger, ForeignKey
from sqlalchemy.sql import func
from database.models.base import Base
from typing import Optional
from datetime import datetime


class Tenant(Base):
    __tablename__ = "tenants"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    tenant_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)  # Ví dụ: "root", "admin", "company1"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    subdomain: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True) 
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), onupdate=func.now())