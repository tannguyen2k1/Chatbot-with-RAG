from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.models import BaseModel


class Conversation(BaseModel):
    """Lưu thông tin cuộc hội thoại của user với AI"""

    __tablename__ = "conversations"

    user_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="New Chat")
    is_deleted: Mapped[int] = mapped_column(Integer, default=0)  # Soft delete
    is_archived: Mapped[int] = mapped_column(Integer, default=0)  # Archive (ẩn khỏi main list)

    # Relationship
    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at",
    )


class Message(BaseModel):
    """Lưu từng tin nhắn trong cuộc hội thoại"""

    __tablename__ = "messages"

    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" hoặc "assistant"
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    context_sources: Mapped[int] = mapped_column(Integer, default=0)  # Số context sources được sử dụng

    # Relationship
    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")
