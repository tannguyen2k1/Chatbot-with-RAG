import os
from datetime import date

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from sqlalchemy.ext.asyncio import AsyncSession

from api.ingestion import _do_ingest_file_bytes
from constants.utc import UTC_DOMAIN_LABELS, UTC_SAMPLE_QUESTIONS
from database.models.user import User
from dependencies import get_current_user, get_db
from schemas.utc import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
    FaqCreate,
    FaqResponse,
    FaqUpdate,
    FeedbackCreate,
    FeedbackResponse,
    PaginatedDocumentResponse,
    PaginatedFaqResponse,
    PaginatedTicketResponse,
    SampleQuestionsResponse,
    StatsOverview,
    TicketAnswer,
    TicketCreate,
    TicketResponse,
)
from services.document import DocumentService
from services.embedding import get_embedding_service
from services.faq import FaqService
from services.feedback_ticket import FeedbackService, StatsService, TicketService
from services.ingestion_job import ingestion_job_service
from services.rbac_helper import ensure_permission_global
from services.vector import get_vector_service

router = APIRouter(prefix="/utc", tags=["UTC Knowledge"])


def _parse_date(v: str | None) -> date | None:
    if not v:
        return None
    try:
        return date.fromisoformat(v)
    except ValueError:
        return None


@router.get("/domains")
async def list_domains(current_user: User = Depends(get_current_user)):
    return [{"value": k, "label": v} for k, v in UTC_DOMAIN_LABELS.items()]


@router.get("/sample-questions", response_model=SampleQuestionsResponse)
async def sample_questions(current_user: User = Depends(get_current_user)):
    return SampleQuestionsResponse(domains=UTC_SAMPLE_QUESTIONS)


@router.get("/documents", response_model=PaginatedDocumentResponse)
async def list_documents(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    domain: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService(db).list_for(current_user.id, page, page_size, search or None, domain)


@router.get("/documents/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService(db).get_for(current_user.id, doc_id)


@router.put("/documents/{doc_id}", response_model=DocumentResponse)
async def update_document(
    doc_id: int,
    data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService(db).update_for(current_user.id, doc_id, data)


@router.delete("/documents/{doc_id}")
async def delete_document(
    doc_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await DocumentService(db).delete_for(current_user.id, doc_id)


@router.post("/documents/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    title: str = Form(...),
    domain: str = Form("chung"),
    audience: str = Form("all"),
    collection_name: str = Form("default"),
    source: str | None = Form(None),
    effective_from: str | None = Form(None),
    effective_to: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await ensure_permission_global(current_user.id, "document", "create")
    await ensure_permission_global(current_user.id, "ingestion", "create")

    allowed = [".pdf", ".docx", ".doc", ".html", ".htm", ".txt"]
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    file_bytes = await file.read()
    await file.close()

    svc = DocumentService(db)
    data = DocumentCreate(
        title=title,
        domain=domain,
        audience=audience,
        collection_name=collection_name,
        source=source,
        effective_from=_parse_date(effective_from),
        effective_to=_parse_date(effective_to),
    )
    doc = await svc.create(
        data,
        uploaded_by=current_user.id,
        filename=file.filename,
        status="processing",
    )

    job = await ingestion_job_service.create_job(
        source_type="file",
        filename=file.filename,
        collection_name=collection_name,
        created_by=str(current_user.id),
    )
    await svc.mark_status(doc.id, "processing", job_id=job.job_id)

    extra_payload = {
        "title": title,
        "domain": domain,
        "audience": audience,
        "source": source,
        "document_id": doc.id,
    }
    if data.effective_from:
        extra_payload["effective_from"] = data.effective_from.isoformat()
    if data.effective_to:
        extra_payload["effective_to"] = data.effective_to.isoformat()

    embedding_service = get_embedding_service()
    vector_service = get_vector_service()
    background_tasks.add_task(
        _do_ingest_file_bytes,
        job.job_id,
        file_bytes,
        file.filename,
        collection_name,
        embedding_service,
        vector_service,
        extra_payload,
        doc.id,
    )

    doc = await svc.get_by_id(doc.id)
    return DocumentResponse.model_validate(doc)


# ---- FAQ ----
@router.get("/faqs", response_model=PaginatedFaqResponse)
async def list_faqs(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str = Query(""),
    domain: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await FaqService(db).list_for(
        current_user.id, page=page, page_size=page_size, search=search or None, domain=domain
    )


@router.post("/faqs", response_model=FaqResponse, status_code=status.HTTP_201_CREATED)
async def create_faq(
    data: FaqCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await FaqService(db).create_for(current_user.id, data)


@router.put("/faqs/{faq_id}", response_model=FaqResponse)
async def update_faq(
    faq_id: int,
    data: FaqUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await FaqService(db).update_for(current_user.id, faq_id, data)


@router.delete("/faqs/{faq_id}")
async def delete_faq(
    faq_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await FaqService(db).delete_for(current_user.id, faq_id)


# ---- Feedback ----
@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    data: FeedbackCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await FeedbackService(db).create_for(current_user.id, data)


# ---- Tickets ----
@router.get("/tickets", response_model=PaginatedTicketResponse)
async def list_tickets(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    status_filter: str | None = Query(None, alias="status"),
    domain: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TicketService(db).list_for(
        current_user.id, page=page, page_size=page_size, status=status_filter, domain=domain
    )


@router.post("/tickets", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    data: TicketCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TicketService(db).create_for(current_user.id, data)


@router.post("/tickets/{ticket_id}/answer", response_model=TicketResponse)
async def answer_ticket(
    ticket_id: int,
    data: TicketAnswer,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await TicketService(db).answer_for(current_user.id, ticket_id, data)


# ---- Stats ----
@router.get("/stats", response_model=StatsOverview)
async def stats_overview(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await StatsService(db).overview_for(current_user.id)
