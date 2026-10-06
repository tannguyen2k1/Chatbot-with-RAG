from datetime import date, datetime

from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    title: str
    domain: str = "chung"
    audience: str = "all"
    effective_from: date | None = None
    effective_to: date | None = None
    source: str | None = None
    collection_name: str = "default"


class DocumentUpdate(BaseModel):
    title: str | None = None
    domain: str | None = None
    audience: str | None = None
    effective_from: date | None = None
    effective_to: date | None = None
    source: str | None = None
    status: str | None = None


class DocumentResponse(BaseModel):
    id: int
    title: str
    filename: str | None
    source: str | None
    domain: str
    audience: str
    effective_from: date | None
    effective_to: date | None
    status: str
    collection_name: str
    job_id: str | None
    error_message: str | None
    uploaded_by: int | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class PaginatedDocumentResponse(BaseModel):
    data: list[DocumentResponse]
    total: int
    page: int
    page_size: int


class FaqCreate(BaseModel):
    question: str
    answer: str
    domain: str = "chung"
    is_active: int = 1


class FaqUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    domain: str | None = None
    is_active: int | None = None


class FaqResponse(BaseModel):
    id: int
    question: str
    answer: str
    domain: str
    is_active: int
    created_by: int | None
    source_ticket_id: int | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class PaginatedFaqResponse(BaseModel):
    data: list[FaqResponse]
    total: int
    page: int
    page_size: int


class FeedbackCreate(BaseModel):
    message_id: int
    conversation_id: int
    is_helpful: bool
    comment: str | None = None
    domain: str | None = None


class FeedbackResponse(BaseModel):
    id: int
    message_id: int
    conversation_id: int
    user_id: int
    is_helpful: int
    comment: str | None
    domain: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    question: str
    domain: str | None = None
    conversation_id: int | None = None
    message_id: int | None = None


class TicketAnswer(BaseModel):
    staff_answer: str
    create_faq: bool = True
    domain: str | None = None


class TicketResponse(BaseModel):
    id: int
    conversation_id: int | None
    message_id: int | None
    user_id: int
    question: str
    domain: str | None
    status: str
    staff_answer: str | None
    answered_by: int | None
    answered_at: datetime | None
    faq_id: int | None
    created_at: datetime
    updated_at: datetime | None

    class Config:
        from_attributes = True


class PaginatedTicketResponse(BaseModel):
    data: list[TicketResponse]
    total: int
    page: int
    page_size: int


class CitationSource(BaseModel):
    title: str
    excerpt: str
    document_id: int | None = None
    heading: str | None = None
    filename: str | None = None
    score: float | None = None


class StatsOverview(BaseModel):
    total_conversations: int = 0
    total_feedback: int = 0
    helpful_rate: float = 0.0
    open_tickets: int = 0
    faq_count: int = 0
    document_count: int = 0
    top_domains: list[dict] = Field(default_factory=list)
    missing_data_domains: list[str] = Field(default_factory=list)


class SampleQuestionsResponse(BaseModel):
    domains: dict[str, list[str]]
