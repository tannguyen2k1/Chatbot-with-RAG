from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(50), nullable=False, index=True)
    table_name = Column(String(50), nullable=False, index=True)
    record_id = Column(Integer, nullable=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True, index=True)
    user = relationship('User', backref='audit_logs')
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    description = Column(String(255), nullable=True)
