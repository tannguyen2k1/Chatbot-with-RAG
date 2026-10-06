import logging
from datetime import UTC, datetime
from typing import cast
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func, nullslast, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from api.vector import search_by_text
from constants.utc import UTC_CHAT_NO_CONTEXT_PROMPT, strip_inline_doc_citations
from database.database import AsyncSessionLocal
from database.models.conversation import Conversation, Message
from database.models.user import User
from dependencies import get_current_user
from dependencies.database import get_db
from schemas.conversation import (
    AddMessageRequest,
    ConversationCreate,
    ConversationListResponse,
    ConversationResponse,
    ConversationUpdate,
    CreateConversationWithMessageRequest,
    MessageResponse,
)
from schemas.vector import TextSearchRequest
from services.chat import get_chat_service_with_db
from services.embedding import EmbeddingService, get_embedding_service
from services.query_classifier import QueryClassifier, get_query_classifier
from services.reflection import ReflectionService, get_reflection_service
from services.rerank import RerankService, get_rerank_service
from services.utc_chat import (
    citations_header,
    prefer_effective,
    resolve_utc_pre_rag,
    results_to_citations,
)
from services.vector import VectorService, get_vector_service

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
    dependencies=[Depends(get_current_user)],
)


def generate_title(first_message: str, max_chars: int = 40) -> str:
    """Tạo title từ message đầu tiên"""
    clean = first_message.replace("\n", " ").strip()
    if len(clean) <= max_chars:
        return clean
    return clean[: max_chars - 3] + "..."


def _stream_headers(
    conversation_id: int,
    sources: int = 0,
    message_id: int | None = None,
    citations_json: str | None = None,
    domain: str | None = None,
) -> dict:
    headers = {
        "X-Conversation-Id": str(conversation_id),
        "X-Context-Sources": str(sources),
    }
    if message_id is not None:
        headers["X-Message-Id"] = str(message_id)
    if citations_json:
        headers["X-Citations"] = quote(citations_json, safe="")
    if domain:
        headers["X-Domain"] = domain
    return headers


async def _persist_assistant_message(
    message_id: int,
    conversation_id: int,
    content: str,
) -> None:
    """Persist final assistant text in a fresh session (stream may outlive request session)."""
    async with AsyncSessionLocal() as session:
        await session.execute(
            update(Message).where(Message.id == message_id).values(content=content)
        )
        await session.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(updated_at=datetime.now(UTC))
        )
        await session.commit()


async def _stream_and_persist(
    *,
    db: AsyncSession,
    conversation: Conversation,
    chat,
    query: str,
    context: str,
    system_prompt: str,
    assistant_msg: Message,
    conversation_history: list | None = None,
    history_max_messages: int = 0,
    history_include_system: bool = True,
):
    message_id = assistant_msg.id
    conversation_id = conversation.id
    answer_content = ""
    try:
        async for chunk in chat.stream_answer(
            query,
            context,
            system_prompt,
            conversation_history=conversation_history,
            history_max_messages=history_max_messages,
            history_include_system=history_include_system,
        ):
            answer_content += chunk
            yield chunk

        await _persist_assistant_message(
            message_id, conversation_id, strip_inline_doc_citations(answer_content)
        )
    except Exception as e:
        logger.error(f"[chat/stream] Error in stream: {e}")
        try:
            await _persist_assistant_message(
                message_id, conversation_id, f"Lỗi khi tạo response: {e!s}"
            )
        except Exception as persist_err:
            logger.error(f"[chat/stream] Failed to persist error message: {persist_err}")


async def _stream_fixed_answer(
    *,
    db: AsyncSession,
    conversation: Conversation,
    text: str,
    assistant_msg: Message,
):
    message_id = assistant_msg.id
    conversation_id = conversation.id
    clean = strip_inline_doc_citations(text)
    await _persist_assistant_message(message_id, conversation_id, clean)
    yield clean


async def _load_conversation_history(db: AsyncSession, conversation_id: int) -> list[dict]:
    """Load conversation history (user + assistant messages) for passing to LLM."""
    from sqlalchemy import select

    msg_query = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    result = await db.execute(msg_query)
    messages = result.scalars().all()

    history = []
    for m in messages:
        if m.role in ("user", "assistant") and m.content:
            history.append({"role": m.role, "content": m.content})
    return history


@router.get(
    "",
    response_model=list[ConversationListResponse],
    summary="Danh sách đoạn chat",
)
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách tất cả cuộc hội thoại của user hiện tại (không kèm messages)"""
    # Subquery để đếm số messages
    message_count_subq = (
        select(Message.conversation_id, func.count(Message.id).label("count"))
        .group_by(Message.conversation_id)
        .subquery()
    )

    # Subquery để lấy last message
    last_msg_subq = (
        select(
            Message.conversation_id,
            func.max(Message.created_at).label("last_time"),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )

    # Query chính
    query = (
        select(Conversation, message_count_subq.c.count)
        .outerjoin(message_count_subq, Conversation.id == message_count_subq.c.conversation_id)
        .where(Conversation.user_id == current_user.id)
        .where(Conversation.is_deleted == 0)
        .where(Conversation.is_archived == 0)
        .order_by(nullslast(desc(Conversation.updated_at)), desc(Conversation.created_at))
    )

    result = await db.execute(query)
    rows = result.all()

    # Lấy last message content
    last_msg_query = (
        select(Message.conversation_id, Message.content)
        .join(last_msg_subq, Message.conversation_id == last_msg_subq.c.conversation_id)
        .where(Message.created_at == last_msg_subq.c.last_time)
    )
    last_msg_result = await db.execute(last_msg_query)
    last_messages = {row[0]: row[1] for row in last_msg_result.all()}

    return [
        ConversationListResponse(
            id=conv.id,
            title=conv.title,
            user_id=conv.user_id,
            is_deleted=conv.is_deleted,
            is_archived=conv.is_archived,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=count or 0,
            last_message=last_messages.get(conv.id),
        )
        for conv, count in rows
    ]


@router.get(
    "/archived",
    response_model=list[ConversationListResponse],
    summary="Danh sách đoạn chat đã lưu trữ",
)
async def list_archived_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách tất cả cuộc hội thoại đã được archive"""
    message_count_subq = (
        select(Message.conversation_id, func.count(Message.id).label("count"))
        .group_by(Message.conversation_id)
        .subquery()
    )
    query = (
        select(Conversation, message_count_subq.c.count)
        .outerjoin(message_count_subq, Conversation.id == message_count_subq.c.conversation_id)
        .where(Conversation.user_id == current_user.id)
        .where(Conversation.is_deleted == 0)
        .where(Conversation.is_archived == 1)
        .order_by(nullslast(desc(Conversation.updated_at)), desc(Conversation.created_at))
    )
    result = await db.execute(query)
    rows = result.all()

    # Lấy last message content để hiển thị (tương tự list_conversations)
    last_msg_subq = (
        select(
            Message.conversation_id,
            func.max(Message.created_at).label("last_time"),
        )
        .group_by(Message.conversation_id)
        .subquery()
    )
    last_msg_query = (
        select(Message.conversation_id, Message.content)
        .join(last_msg_subq, Message.conversation_id == last_msg_subq.c.conversation_id)
        .where(Message.created_at == last_msg_subq.c.last_time)
    )
    last_msg_result = await db.execute(last_msg_query)
    last_messages = {row[0]: row[1] for row in last_msg_result.all()}

    return [
        ConversationListResponse(
            id=conv.id,
            title=conv.title,
            user_id=conv.user_id,
            is_deleted=conv.is_deleted,
            is_archived=conv.is_archived,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=count or 0,
            last_message=last_messages.get(conv.id),
        )
        for conv, count in rows
    ]


@router.patch("/archive-all", summary="Archive tất cả đoạn chat hiện tại")
async def archive_all_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive toàn bộ cuộc hội thoại chưa bị xóa của user"""
    from sqlalchemy import update as sql_update

    await db.execute(
        sql_update(Conversation)
        .where(Conversation.user_id == current_user.id)
        .where(Conversation.is_deleted == 0)
        .where(Conversation.is_archived == 0)
        .values(is_archived=1, updated_at=datetime.now(UTC))
    )
    await db.commit()
    return {"message": "All conversations archived successfully"}


@router.delete("/archived/delete-all", summary="Xóa vĩnh viễn tất cả đoạn chat đã lưu trữ")
async def delete_all_archived_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Hard delete tất cả conversation đã archive của user"""
    from sqlalchemy import delete as sql_delete

    await db.execute(
        sql_delete(Message).where(
            Message.conversation_id.in_(
                select(Conversation.id)
                .where(Conversation.user_id == current_user.id)
                .where(Conversation.is_archived == 1)
            )
        )
    )
    await db.execute(
        sql_delete(Conversation).where(Conversation.user_id == current_user.id).where(Conversation.is_archived == 1)
    )
    await db.commit()
    return {"message": "All archived conversations deleted permanently"}


@router.delete("/delete-all", summary="Xóa vĩnh viễn tất cả đoạn chat không lưu trữ")
async def delete_all_unarchived_conversations(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Hard delete tất cả conversation chưa archive của user"""
    from sqlalchemy import delete as sql_delete

    await db.execute(
        sql_delete(Message).where(
            Message.conversation_id.in_(
                select(Conversation.id)
                .where(Conversation.user_id == current_user.id)
                .where(Conversation.is_archived == 0)
            )
        )
    )
    await db.execute(
        sql_delete(Conversation).where(Conversation.user_id == current_user.id).where(Conversation.is_archived == 0)
    )
    await db.commit()
    return {"message": "All unarchived conversations deleted permanently"}


@router.get("/{conversation_id}", summary="Lấy chi tiết cuộc hội thoại")
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lấy chi tiết cuộc hội thoại với tất cả messages"""
    query = (
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .where(Conversation.user_id == current_user.id)
        .where(Conversation.is_deleted == 0)
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Load messages separately
    msg_query = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at)
    msg_result = await db.execute(msg_query)
    messages = msg_result.scalars().all()

    return ConversationResponse(
        id=conversation.id,
        title=conversation.title,
        user_id=conversation.user_id,
        is_deleted=conversation.is_deleted,
        is_archived=conversation.is_archived,
        created_at=cast("datetime", conversation.created_at),
        updated_at=cast("datetime | None", conversation.updated_at),
        messages=[MessageResponse.model_validate(m) for m in messages],
    )


@router.post("", summary="Tạo cuộc hội thoại mới")
async def create_conversation(
    conversation_data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Tạo một cuộc hội thoại mới trống"""
    conversation = Conversation(
        user_id=current_user.id,
        title=conversation_data.title,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    return {
        "id": conversation.id,
        "user_id": conversation.user_id,
        "title": conversation.title,
        "is_deleted": conversation.is_deleted,
        "is_archived": conversation.is_archived,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "messages": [],
    }


@router.delete("/{conversation_id}", summary="Xóa cuộc hội thoại")
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Xóa mềm (soft delete) cuộc hội thoại"""
    query = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
        Conversation.is_deleted == 0,
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.is_deleted = 1
    await db.commit()
    return {"message": "Conversation deleted successfully"}


@router.patch("/{conversation_id}/archive", summary="Archive / Unarchive cuộc hội thoại")
async def toggle_archive_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Toggle trạng thái archive của một cuộc hội thoại"""
    query = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
        Conversation.is_deleted == 0,
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    conversation.is_archived = 0 if conversation.is_archived else 1
    await db.commit()
    action = "archived" if conversation.is_archived else "unarchived"
    return {
        "message": f"Conversation {action} successfully",
        "is_archived": conversation.is_archived,
    }


@router.put(
    "/{conversation_id}/title",
    response_model=ConversationResponse,
    summary="Cập nhật tiêu đề cuộc hội thoại",
)
async def update_conversation_title(
    conversation_id: int,
    update_data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cập nhật tiêu đề cuộc hội thoại"""
    query = (
        select(Conversation)
        .options(selectinload(Conversation.messages))
        .where(Conversation.id == conversation_id)
        .where(Conversation.user_id == current_user.id)
        .where(Conversation.is_deleted == 0)
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if update_data.title is not None:
        conversation.title = update_data.title

    await db.commit()
    await db.refresh(conversation)
    return conversation


# =============================================================================
# Streaming Chat API - Tạo conversation mới với message đầu tiên
# =============================================================================


@router.post("/new-with-message", summary="Tạo conversation mới và bắt đầu chat (streaming)")
async def create_conversation_with_message(
    request: CreateConversationWithMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
    classifier: QueryClassifier = Depends(get_query_classifier),
):
    """Tạo cuộc hội thoại mới với message đầu tiên của user (UTC FAQ/OOS/RAG)."""
    title = request.title or generate_title(request.query)
    conversation = Conversation(user_id=current_user.id, title=title)
    db.add(conversation)
    await db.flush()

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.query,
        context_sources=0,
    )
    db.add(user_message)
    await db.commit()

    logger.info(f"[chat/stream] Created conversation {conversation.id} with first message")
    chat = await get_chat_service_with_db(db)

    utc_pre = await resolve_utc_pre_rag(db, request.query)
    domain = utc_pre.get("domain")

    if utc_pre.get("faq_answer"):
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content="",
            context_sources=0,
        )
        db.add(assistant_msg)
        await db.flush()
        await db.commit()
        return StreamingResponse(
            _stream_fixed_answer(
                db=db,
                conversation=conversation,
                text=utc_pre["faq_answer"],
                assistant_msg=assistant_msg,
            ),
            media_type="text/plain; charset=utf-8",
            headers=_stream_headers(conversation.id, 0, assistant_msg.id, domain=domain),
        )

    try:
        classification = classifier.classify(request.query)
    except Exception as e:
        logger.error(f"[chat/stream] Classification error: {e}")

        async def error_stream(err=e):
            yield f"Lỗi khi phân loại câu hỏi: {err!s}"

        return StreamingResponse(
            error_stream(),
            media_type="text/plain; charset=utf-8",
            headers=_stream_headers(conversation.id, 0, domain=domain),
        )

    citations_json = None
    sources_count = 0
    context_str = ""
    system_prompt = request.system_prompt
    if not system_prompt:
        system_prompt = await chat.get_system_prompt()

    if classification.needs_context:
        search_req = TextSearchRequest(
            query=request.query,
            limit=request.limit,
            use_reranker=request.use_reranker,
            rerank_top_k=request.rerank_top_k,
            score_threshold=request.score_threshold,
            use_bm25=request.use_bm25,
            bm25_top_k=request.bm25_top_k,
            bm25_weight=request.bm25_weight,
            filter=utc_pre.get("filter"),
        )
        vector_response = await search_by_text(
            collection_name=request.collection_name,
            search_req=search_req,
            current_user=current_user,
            service=vector,
            embedding=embedding,
            reranker=reranker,
        )
        results = prefer_effective(list(vector_response.results or []))
        cites = results_to_citations(results)
        citations_json = citations_header(cites) if cites else None
        sources_count = len(results)
        context_str = chat.build_context(results)
    else:
        # Greeting / chitchat: don't use RAG citation prompt
        system_prompt = UTC_CHAT_NO_CONTEXT_PROMPT

    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content="",
        context_sources=sources_count,
        citations=citations_json,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.commit()

    return StreamingResponse(
        _stream_and_persist(
            db=db,
            conversation=conversation,
            chat=chat,
            query=request.query,
            context=context_str,
            system_prompt=system_prompt,
            assistant_msg=assistant_msg,
            conversation_history=None,
            history_max_messages=0,
            history_include_system=True,
        ),
        media_type="text/plain; charset=utf-8",
        headers=_stream_headers(
            conversation.id, sources_count, assistant_msg.id, citations_json, domain
        ),
    )


@router.post("/{conversation_id}/messages", summary="Thêm message và bắt đầu chat (streaming)")
async def add_message_stream(
    conversation_id: int,
    request: AddMessageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
    classifier: QueryClassifier = Depends(get_query_classifier),
    reflection: ReflectionService = Depends(get_reflection_service),
):
    """Thêm message vào cuộc hội thoại có sẵn (UTC FAQ/OOS/RAG)."""
    query = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
        Conversation.is_deleted == 0,
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.query,
        context_sources=0,
    )
    db.add(user_message)
    await db.commit()

    logger.info(f"[chat/stream] Added message to conversation {conversation.id}")
    conversation_history = await _load_conversation_history(db, conversation.id)
    chat = await get_chat_service_with_db(db)

    utc_pre = await resolve_utc_pre_rag(db, request.query)
    domain = utc_pre.get("domain")

    if utc_pre.get("faq_answer"):
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content="",
            context_sources=0,
        )
        db.add(assistant_msg)
        await db.flush()
        await db.commit()
        return StreamingResponse(
            _stream_fixed_answer(
                db=db,
                conversation=conversation,
                text=utc_pre["faq_answer"],
                assistant_msg=assistant_msg,
            ),
            media_type="text/plain; charset=utf-8",
            headers=_stream_headers(conversation.id, 0, assistant_msg.id, domain=domain),
        )

    try:
        classification = classifier.classify(request.query)
    except Exception as e:
        logger.error(f"[chat/stream] Classification error: {e}")

        async def error_stream(err=e):
            yield f"Lỗi khi phân loại câu hỏi: {err!s}"

        return StreamingResponse(
            error_stream(),
            media_type="text/plain; charset=utf-8",
            headers=_stream_headers(conversation.id, 0, domain=domain),
        )

    reflected_query = request.query
    if classification.needs_context and request.reflection_enabled and len(conversation_history) > 0:
        try:
            reflected_query = await reflection.reflect_async(
                conversation_history=conversation_history,
                last_query=request.query,
                max_items=request.reflection_max_history,
            )
            logger.info(
                f"[Reflection] conv={conversation.id} original='{request.query}' reflected='{reflected_query}'"
            )
        except Exception as e:
            logger.warning(f"[Reflection] Failed, falling back to original: {e}")
            reflected_query = request.query

    citations_json = None
    sources_count = 0
    context_str = ""
    system_prompt = request.system_prompt
    if not system_prompt:
        system_prompt = await chat.get_system_prompt()

    if classification.needs_context:
        search_req = TextSearchRequest(
            query=reflected_query,
            limit=request.limit,
            use_reranker=request.use_reranker,
            rerank_top_k=request.rerank_top_k,
            score_threshold=request.score_threshold,
            use_bm25=request.use_bm25,
            bm25_top_k=request.bm25_top_k,
            bm25_weight=request.bm25_weight,
            filter=utc_pre.get("filter"),
        )
        vector_response = await search_by_text(
            collection_name=request.collection_name,
            search_req=search_req,
            current_user=current_user,
            service=vector,
            embedding=embedding,
            reranker=reranker,
        )
        results = prefer_effective(list(vector_response.results or []))
        cites = results_to_citations(results)
        citations_json = citations_header(cites) if cites else None
        sources_count = len(results)
        context_str = chat.build_context(results)
    else:
        system_prompt = UTC_CHAT_NO_CONTEXT_PROMPT

    assistant_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content="",
        context_sources=sources_count,
        citations=citations_json,
    )
    db.add(assistant_msg)
    await db.flush()
    await db.commit()

    return StreamingResponse(
        _stream_and_persist(
            db=db,
            conversation=conversation,
            chat=chat,
            query=reflected_query,
            context=context_str,
            system_prompt=system_prompt,
            assistant_msg=assistant_msg,
            conversation_history=conversation_history,
            history_max_messages=request.conversation_history_max_messages
            if request.conversation_history_enabled
            else 0,
            history_include_system=request.conversation_history_include_system,
        ),
        media_type="text/plain; charset=utf-8",
        headers=_stream_headers(
            conversation.id, sources_count, assistant_msg.id, citations_json, domain
        ),
    )
