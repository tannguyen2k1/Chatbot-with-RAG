from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.models import Document
from schemas.utc import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
    PaginatedDocumentResponse,
)
from services.rbac_helper import ensure_permission_global


class DocumentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_documents(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        domain: str | None = None,
        status: str | None = None,
    ) -> PaginatedDocumentResponse:
        base = select(Document)
        count_q = select(func.count()).select_from(Document)
        if search:
            like = f"%{search}%"
            filt = (Document.title.ilike(like)) | (Document.filename.ilike(like))
            base = base.filter(filt)
            count_q = count_q.filter(filt)
        if domain:
            base = base.filter(Document.domain == domain)
            count_q = count_q.filter(Document.domain == domain)
        if status:
            base = base.filter(Document.status == status)
            count_q = count_q.filter(Document.status == status)

        total = (await self.db.execute(count_q)).scalar_one()
        result = await self.db.execute(
            base.order_by(Document.id.desc()).offset((page - 1) * page_size).limit(page_size)
        )
        rows = result.scalars().all()
        return PaginatedDocumentResponse(
            data=[DocumentResponse.model_validate(r) for r in rows],
            total=total,
            page=page,
            page_size=page_size,
        )

    async def get_by_id(self, doc_id: int) -> Document | None:
        result = await self.db.execute(select(Document).filter(Document.id == doc_id))
        return result.scalar_one_or_none()

    async def create(
        self,
        data: DocumentCreate,
        uploaded_by: int | None = None,
        filename: str | None = None,
        job_id: str | None = None,
        status: str = "pending",
    ) -> Document:
        doc = Document(
            title=data.title,
            domain=data.domain,
            audience=data.audience,
            effective_from=data.effective_from,
            effective_to=data.effective_to,
            source=data.source,
            collection_name=data.collection_name,
            filename=filename,
            uploaded_by=uploaded_by,
            job_id=job_id,
            status=status,
        )
        self.db.add(doc)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def update(self, doc_id: int, data: DocumentUpdate) -> Document | None:
        doc = await self.get_by_id(doc_id)
        if not doc:
            return None
        for field in (
            "title",
            "domain",
            "audience",
            "effective_from",
            "effective_to",
            "source",
            "status",
        ):
            val = getattr(data, field)
            if val is not None:
                setattr(doc, field, val)
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def delete(self, doc_id: int) -> bool:
        doc = await self.get_by_id(doc_id)
        if not doc:
            return False
        await self.db.delete(doc)
        await self.db.commit()
        return True

    async def mark_status(
        self, doc_id: int, status: str, error_message: str | None = None, job_id: str | None = None
    ) -> Document | None:
        doc = await self.get_by_id(doc_id)
        if not doc:
            return None
        doc.status = status
        if error_message is not None:
            doc.error_message = error_message
        if job_id is not None:
            doc.job_id = job_id
        await self.db.commit()
        await self.db.refresh(doc)
        return doc

    async def list_for(
        self, user_id: int, page: int = 1, page_size: int = 10, search: str | None = None, domain: str | None = None
    ) -> PaginatedDocumentResponse:
        await ensure_permission_global(user_id, "document", "view")
        return await self.list_documents(page, page_size, search, domain)

    async def get_for(self, user_id: int, doc_id: int) -> DocumentResponse:
        await ensure_permission_global(user_id, "document", "view")
        from fastapi import HTTPException, status

        doc = await self.get_by_id(doc_id)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return DocumentResponse.model_validate(doc)

    async def update_for(self, user_id: int, doc_id: int, data: DocumentUpdate) -> DocumentResponse:
        await ensure_permission_global(user_id, "document", "update")
        from fastapi import HTTPException, status

        doc = await self.update(doc_id, data)
        if not doc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return DocumentResponse.model_validate(doc)

    async def delete_for(self, user_id: int, doc_id: int) -> dict:
        await ensure_permission_global(user_id, "document", "delete")
        from fastapi import HTTPException, status

        ok = await self.delete(doc_id)
        if not ok:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        return {"message": f"Document {doc_id} deleted"}

    @staticmethod
    def is_effective(doc: Document, on: date | None = None) -> bool:
        on = on or date.today()
        if doc.effective_from and on < doc.effective_from:
            return False
        if doc.effective_to and on > doc.effective_to:
            return False
        return True
