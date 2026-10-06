from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Conversation, Document, Faq, MessageFeedback, StaffTicket
from schemas.utc import (
    FeedbackCreate,
    FeedbackResponse,
    FaqCreate,
    PaginatedTicketResponse,
    StatsOverview,
    TicketAnswer,
    TicketCreate,
    TicketResponse,
)
from services.document import DocumentService
from services.faq import FaqService
from services.rbac_helper import ensure_permission_global


class FeedbackService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: int, data: FeedbackCreate) -> MessageFeedback:
        fb = MessageFeedback(
            message_id=data.message_id,
            conversation_id=data.conversation_id,
            user_id=user_id,
            is_helpful=1 if data.is_helpful else 0,
            comment=data.comment,
            domain=data.domain,
        )
        self.db.add(fb)
        await self.db.commit()
        await self.db.refresh(fb)

        # Auto-open ticket on negative feedback
        if not data.is_helpful:
            ticket_svc = TicketService(self.db)
            question = data.comment or "Phản hồi: câu trả lời không hữu ích"
            # Try load message content as question context
            from database.models import Message

            result = await self.db.execute(select(Message).filter(Message.id == data.message_id))
            msg = result.scalar_one_or_none()
            # Prefer previous user message in conversation
            if data.conversation_id:
                uresult = await self.db.execute(
                    select(Message)
                    .filter(
                        Message.conversation_id == data.conversation_id,
                        Message.role == "user",
                    )
                    .order_by(Message.id.desc())
                    .limit(1)
                )
                umsg = uresult.scalar_one_or_none()
                if umsg and umsg.content:
                    question = umsg.content
            await ticket_svc.create_raw(
                user_id=user_id,
                question=question,
                domain=data.domain,
                conversation_id=data.conversation_id,
                message_id=data.message_id,
            )
        return fb

    async def create_for(self, user_id: int, data: FeedbackCreate) -> FeedbackResponse:
        # Any authenticated user can feedback their messages
        fb = await self.create(user_id, data)
        return FeedbackResponse.model_validate(fb)


class TicketService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_raw(
        self,
        user_id: int,
        question: str,
        domain: str | None = None,
        conversation_id: int | None = None,
        message_id: int | None = None,
    ) -> StaffTicket:
        ticket = StaffTicket(
            user_id=user_id,
            question=question,
            domain=domain,
            conversation_id=conversation_id,
            message_id=message_id,
            status="open",
        )
        self.db.add(ticket)
        await self.db.commit()
        await self.db.refresh(ticket)
        return ticket

    async def create_for(self, user_id: int, data: TicketCreate) -> TicketResponse:
        ticket = await self.create_raw(
            user_id=user_id,
            question=data.question,
            domain=data.domain,
            conversation_id=data.conversation_id,
            message_id=data.message_id,
        )
        return TicketResponse.model_validate(ticket)

    async def list_tickets(
        self,
        page: int = 1,
        page_size: int = 10,
        status: str | None = None,
        domain: str | None = None,
    ) -> PaginatedTicketResponse:
        base = select(StaffTicket)
        count_q = select(func.count()).select_from(StaffTicket)
        if status:
            base = base.filter(StaffTicket.status == status)
            count_q = count_q.filter(StaffTicket.status == status)
        if domain:
            base = base.filter(StaffTicket.domain == domain)
            count_q = count_q.filter(StaffTicket.domain == domain)
        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(
            base.order_by(StaffTicket.id.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedTicketResponse(
            data=[TicketResponse.model_validate(r) for r in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def list_for(self, user_id: int, **kwargs) -> PaginatedTicketResponse:
        await ensure_permission_global(user_id, "ticket", "view")
        return await self.list_tickets(**kwargs)

    async def get_by_id(self, ticket_id: int) -> StaffTicket | None:
        result = await self.db.execute(select(StaffTicket).filter(StaffTicket.id == ticket_id))
        return result.scalar_one_or_none()

    async def answer_for(self, staff_id: int, ticket_id: int, data: TicketAnswer) -> TicketResponse:
        await ensure_permission_global(staff_id, "ticket", "update")
        from fastapi import HTTPException, status

        ticket = await self.get_by_id(ticket_id)
        if not ticket:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

        ticket.staff_answer = data.staff_answer
        ticket.status = "answered"
        ticket.answered_by = staff_id
        ticket.answered_at = datetime.now(timezone.utc)
        if data.domain:
            ticket.domain = data.domain

        if data.create_faq:
            faq_svc = FaqService(self.db)
            faq = await faq_svc.create(
                FaqCreate(
                    question=ticket.question,
                    answer=data.staff_answer,
                    domain=ticket.domain or data.domain or "chung",
                ),
                created_by=staff_id,
                source_ticket_id=ticket.id,
            )
            ticket.faq_id = faq.id

        await self.db.commit()
        await self.db.refresh(ticket)
        return TicketResponse.model_validate(ticket)


class StatsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def overview_for(self, user_id: int) -> StatsOverview:
        await ensure_permission_global(user_id, "stats", "view")

        total_conversations = (
            await self.db.execute(select(func.count()).select_from(Conversation))
        ).scalar_one()
        total_feedback = (
            await self.db.execute(select(func.count()).select_from(MessageFeedback))
        ).scalar_one()
        helpful = (
            await self.db.execute(
                select(func.count()).select_from(MessageFeedback).filter(MessageFeedback.is_helpful == 1)
            )
        ).scalar_one()
        open_tickets = (
            await self.db.execute(
                select(func.count()).select_from(StaffTicket).filter(StaffTicket.status == "open")
            )
        ).scalar_one()
        faq_count = (await self.db.execute(select(func.count()).select_from(Faq))).scalar_one()
        document_count = (
            await self.db.execute(select(func.count()).select_from(Document))
        ).scalar_one()

        # Top domains from tickets + feedback
        domain_rows = (
            await self.db.execute(
                select(StaffTicket.domain, func.count())
                .filter(StaffTicket.domain.isnot(None))
                .group_by(StaffTicket.domain)
                .order_by(func.count().desc())
                .limit(10)
            )
        ).all()
        top_domains = [{"domain": d or "unknown", "count": c} for d, c in domain_rows]

        # Domains with open tickets but few docs
        from constants.utc import UTC_DOMAINS

        missing = []
        for domain in UTC_DOMAINS:
            if domain == "out_of_scope":
                continue
            docs = (
                await self.db.execute(
                    select(func.count()).select_from(Document).filter(Document.domain == domain)
                )
            ).scalar_one()
            opens = (
                await self.db.execute(
                    select(func.count())
                    .select_from(StaffTicket)
                    .filter(StaffTicket.domain == domain, StaffTicket.status == "open")
                )
            ).scalar_one()
            if opens > 0 and docs == 0:
                missing.append(domain)

        return StatsOverview(
            total_conversations=total_conversations,
            total_feedback=total_feedback,
            helpful_rate=(helpful / total_feedback) if total_feedback else 0.0,
            open_tickets=open_tickets,
            faq_count=faq_count,
            document_count=document_count,
            top_domains=top_domains,
            missing_data_domains=missing,
        )
