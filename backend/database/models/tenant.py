from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, DateTime, BigInteger, ForeignKey
from sqlalchemy.sql import func
from database.models.base import BaseModel
from typing import Optional
from datetime import datetime


class Tenant(BaseModel):
    __tablename__ = "tenants"
    tenant_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)  # Ví dụ: "root", "admin", "company1"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)
    subdomain: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True) 