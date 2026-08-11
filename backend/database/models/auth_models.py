from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.models import BaseModel, GlobalBaseModel


class Role(GlobalBaseModel):
    """Role model"""

    __tablename__ = "roles"
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user_roles: Mapped[list["UserRole"]] = relationship("UserRole", back_populates="role")
    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="role")


class Module(GlobalBaseModel):
    """Module model"""

    __tablename__ = "modules"
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="module")


class Permission(GlobalBaseModel):
    """Permission model"""

    __tablename__ = "permissions"
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    role_permissions: Mapped[list["RolePermission"]] = relationship("RolePermission", back_populates="permission")


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
