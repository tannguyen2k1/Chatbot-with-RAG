
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Text, BigInteger, Integer, ForeignKey
from database.models import BaseModel
from typing import Optional, List

class Role(BaseModel):
    __tablename__ = "roles"
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="roles")
    user_roles: Mapped[List["UserRole"]] = relationship("UserRole", back_populates="role")
    role_permissions: Mapped[List["RolePermission"]] = relationship("RolePermission", back_populates="role")

class Module(BaseModel):
    __tablename__ = "modules"
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    tenant = relationship("Tenant", back_populates="modules")
    role_permissions: Mapped[List["RolePermission"]] = relationship("RolePermission", back_populates="module")

class Permission(BaseModel):
    __tablename__ = "permissions"
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    role_permissions: Mapped[List["RolePermission"]] = relationship("RolePermission", back_populates="permission")

class RolePermission(BaseModel):
    __tablename__ = "role_permissions"
    
    # Foreign keys
    role_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("roles.id"), nullable=False, index=True)
    module_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("modules.id"), nullable=False, index=True)
    permission_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("permissions.id"), nullable=False, index=True)
    
    # Relationships
    role = relationship("Role", back_populates="role_permissions")
    module = relationship("Module", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")

class UserRole(BaseModel):
    __tablename__ = "user_roles"
    
    # Foreign keys
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    role_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("roles.id"), nullable=False, index=True)
    
    # Relationships
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")
