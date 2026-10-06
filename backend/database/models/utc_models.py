from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from database.models import BaseModel


class Document(BaseModel):
    """Văn bản kho tri thức UTC (metadata + trạng thái ingest)."""

    __tablename__ = "documents"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    filename: Mapped[str | None] = mapped_column(String(500), nullable=True)
    source: Mapped[str | None] = mapped_column(String(500), nullable=True)
    domain: Mapped[str] = mapped_column(String(50), nullable=False, default="chung", index=True)
    audience: Mapped[str] = mapped_column(String(50), nullable=False, default="all", index=True)
    effective_from: Mapped[date | None] = mapped_column(Date, nullable=True)
    effective_to: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="pending", index=True)
    collection_name: Mapped[str] = mapped_column(String(100), nullable=False, default="default")
    job_id: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    uploaded_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)


class Faq(BaseModel):
    """Câu hỏi thường gặp."""

    __tablename__ = "faqs"

    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str] = mapped_column(String(50), nullable=False, default="chung", index=True)
    is_active: Mapped[int] = mapped_column(Integer, default=1)
    created_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)
    source_ticket_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)


class MessageFeedback(BaseModel):
    """Đánh giá câu trả lời assistant."""

    __tablename__ = "message_feedbacks"

    message_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("messages.id"), nullable=False, index=True)
    conversation_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("conversations.id"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    is_helpful: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 / 0
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain: Mapped[str | None] = mapped_column(String(50), nullable=True)


class StaffTicket(BaseModel):
    """Hàng chờ câu hỏi cần cán bộ trả lời."""

    __tablename__ = "staff_tickets"

    conversation_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("conversations.id"), nullable=True, index=True
    )
    message_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("messages.id"), nullable=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    domain: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="open", index=True)
    staff_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    answered_by: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("users.id"), nullable=True)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    faq_id: Mapped[int | None] = mapped_column(BigInteger, ForeignKey("faqs.id"), nullable=True)
