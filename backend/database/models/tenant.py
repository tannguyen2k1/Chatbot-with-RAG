from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, DateTime, BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from database.models.base import BaseModel
from typing import Optional
from datetime import datetime


class Tenant(BaseModel):
    __tablename__ = "tenants"
    __table_args__ = (
        UniqueConstraint("domain", "subdomain", name="uq_tenants_domain_subdomain"),
    )
    tenant_code: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)  # Ví dụ: "root", "admin", "company1"
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    domain: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    subdomain: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    expiration_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True) 