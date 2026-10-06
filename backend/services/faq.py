from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Faq
from schemas.utc import FaqCreate, FaqResponse, FaqUpdate, PaginatedFaqResponse
from services.rbac_helper import ensure_permission_global


class FaqService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_faqs(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        domain: str | None = None,
        active_only: bool = False,
    ) -> PaginatedFaqResponse:
        base = select(Faq)
        count_q = select(func.count()).select_from(Faq)
        if search:
            like = f"%{search}%"
            filt = Faq.question.ilike(like) | Faq.answer.ilike(like)
            base = base.filter(filt)
            count_q = count_q.filter(filt)
        if domain:
            base = base.filter(Faq.domain == domain)
            count_q = count_q.filter(Faq.domain == domain)
        if active_only:
            base = base.filter(Faq.is_active == 1)
            count_q = count_q.filter(Faq.is_active == 1)

        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(
            base.order_by(Faq.id.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedFaqResponse(
            data=[FaqResponse.model_validate(r) for r in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_by_id(self, faq_id: int) -> Faq | None:
        result = await self.db.execute(select(Faq).filter(Faq.id == faq_id))
        return result.scalar_one_or_none()

    async def create(
        self, data: FaqCreate, created_by: int | None = None, source_ticket_id: int | None = None
    ) -> Faq:
        faq = Faq(
            question=data.question,
            answer=data.answer,
            domain=data.domain,
            is_active=data.is_active,
            created_by=created_by,
            source_ticket_id=source_ticket_id,
        )
        self.db.add(faq)
        await self.db.commit()
        await self.db.refresh(faq)
        return faq

    async def update(self, faq_id: int, data: FaqUpdate) -> Faq | None:
        faq = await self.get_by_id(faq_id)
        if not faq:
            return None
        for field in ("question", "answer", "domain", "is_active"):
            val = getattr(data, field)
            if val is not None:
                setattr(faq, field, val)
        await self.db.commit()
        await self.db.refresh(faq)
        return faq

    async def delete(self, faq_id: int) -> bool:
        faq = await self.get_by_id(faq_id)
        if not faq:
            return False
        await self.db.delete(faq)
        await self.db.commit()
        return True

    async def match_question(self, query: str, domain: str | None = None, limit: int = 5) -> list[Faq]:
        like = f"%{query.strip()}%"
        tokens = [t for t in query.lower().split() if len(t) > 2][:6]
        conditions = [Faq.question.ilike(like)]
        for tok in tokens:
            conditions.append(Faq.question.ilike(f"%{tok}%"))
        q = select(Faq).filter(Faq.is_active == 1).filter(or_(*conditions))
        if domain and domain != "out_of_scope":
            q = q.filter((Faq.domain == domain) | (Faq.domain == "chung"))
        result = await self.db.execute(q.order_by(Faq.id.desc()).limit(limit))
        return list(result.scalars().all())

    async def best_match(self, query: str, domain: str | None = None) -> Faq | None:
        candidates = await self.match_question(query, domain=domain, limit=10)
        if not candidates:
            return None
        q_lower = query.lower().strip()
        for faq in candidates:
            if q_lower in faq.question.lower() or faq.question.lower() in q_lower:
                return faq
        q_tokens = set(q_lower.split())

        def score(f: Faq) -> int:
            return len(q_tokens & set(f.question.lower().split()))

        ranked = sorted(candidates, key=score, reverse=True)
        if ranked and score(ranked[0]) >= max(1, len(q_tokens) // 3):
            return ranked[0]
        return None

    async def list_for(self, user_id: int, **kwargs) -> PaginatedFaqResponse:
        await ensure_permission_global(user_id, "faq", "view")
        return await self.list_faqs(**kwargs)

    async def create_for(self, user_id: int, data: FaqCreate) -> FaqResponse:
        await ensure_permission_global(user_id, "faq", "create")
        faq = await self.create(data, created_by=user_id)
        return FaqResponse.model_validate(faq)

    async def update_for(self, user_id: int, faq_id: int, data: FaqUpdate) -> FaqResponse:
        await ensure_permission_global(user_id, "faq", "update")
        from fastapi import HTTPException, status

        faq = await self.update(faq_id, data)
        if not faq:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")
        return FaqResponse.model_validate(faq)

    async def delete_for(self, user_id: int, faq_id: int) -> dict:
        await ensure_permission_global(user_id, "faq", "delete")
        from fastapi import HTTPException, status

        if not await self.delete(faq_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="FAQ not found")
        return {"message": f"FAQ {faq_id} deleted"}
