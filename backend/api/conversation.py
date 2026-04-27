from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import List
import logging

logger = logging.getLogger(__name__)

from database.models.user import User
from database.models.conversation import Conversation, Message
from schemas.conversation import (
    ConversationResponse,
    ConversationListResponse,
    ConversationCreate,
    ConversationUpdate,
    MessageResponse,
    CreateConversationWithMessageRequest,
    AddMessageRequest,
)
from schemas.chat import ChatResponse
from dependencies import get_current_user
from dependencies.database import get_db
from services.chat import get_chat_service_with_db
from api.vector import search_by_text
from services.embedding import EmbeddingService, get_embedding_service
from services.rerank import RerankService, get_rerank_service
from services.query_classifier import QueryClassifier, get_query_classifier
from services.vector import VectorService, get_vector_service
from schemas.vector import TextSearchRequest

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


@router.get("", response_model=List[ConversationListResponse], summary="Lấy danh sách cuộc hội thoại")
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
        .order_by(desc(Conversation.updated_at))
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
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=count or 0,
            last_message=last_messages.get(conv.id),
        )
        for conv, count in rows
    ]


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
        user_id=conversation.user_id,
        title=conversation.title,
        is_deleted=conversation.is_deleted,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageResponse(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                context_sources=m.context_sources,
                created_at=m.created_at,
            )
            for m in messages
        ],
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


@router.put("/{conversation_id}/title", response_model=ConversationResponse, summary="Cập nhật tiêu đề cuộc hội thoại")
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
    """
    Tạo cuộc hội thoại mới với message đầu tiên của user.
    Trả về streaming response và tự động lưu user message vào DB.
    """
    # Tạo conversation
    title = request.title or generate_title(request.query)
    conversation = Conversation(
        user_id=current_user.id,
        title=title,
    )
    db.add(conversation)
    await db.flush()  # Lấy ID của conversation

    # Lưu user message vào DB
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

    try:
        classification = classifier.classify(request.query)
    except Exception as e:
        logger.error(f"[chat/stream] Classification error: {e}")
        from fastapi.responses import StreamingResponse

        async def error_stream():
            yield f"Lỗi khi phân loại câu hỏi: {str(e)}"

        return StreamingResponse(
            error_stream(),
            media_type="text/plain; charset=utf-8",
            headers={
                "X-Conversation-Id": str(conversation.id),
                "X-Context-Sources": "0",
            },
        )

    if not classification.needs_context:
        context = ""
        system_prompt = await chat.get_system_prompt()

        async def stream_generator():
            answer_content = ""
            assistant_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content="",
                context_sources=0,
            )
            db.add(assistant_msg)
            await db.flush()

            try:
                async for chunk in chat.stream_answer(request.query, context, system_prompt):
                    answer_content += chunk
                    yield chunk

                # Lưu complete answer
                assistant_msg.content = answer_content
                await db.commit()
            except Exception as e:
                logger.error(f"[chat/stream] Error in stream: {e}")
                assistant_msg.content = f"Lỗi khi tạo response: {str(e)}"
                await db.commit()

        from fastapi.responses import StreamingResponse

        return StreamingResponse(
            stream_generator(),
            media_type="text/plain; charset=utf-8",
            headers={
                "X-Conversation-Id": str(conversation.id),
                "X-Context-Sources": "0",
            },
        )

    search_req = TextSearchRequest(
        query=request.query,
        limit=request.limit,
        use_reranker=request.use_reranker,
        rerank_top_k=request.rerank_top_k,
        score_threshold=request.score_threshold,
    )

    vector_response = await search_by_text(
        collection_name=request.collection_name,
        search_req=search_req,
        current_user=current_user,
        service=vector,
        embedding=embedding,
        reranker=reranker,
    )

    context_str = chat.build_context(vector_response.results)
    system_prompt = await chat.get_system_prompt()

    async def stream_generator():
        answer_content = ""
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content="",
            context_sources=vector_response.count,
        )
        db.add(assistant_msg)
        await db.flush()

        try:
            async for chunk in chat.stream_answer(request.query, context_str, system_prompt):
                answer_content += chunk
                yield chunk

            # Lưu complete answer
            assistant_msg.content = answer_content
            await db.commit()
        except Exception as e:
            logger.error(f"[chat/stream] Error in stream: {e}")
            assistant_msg.content = f"Lỗi khi tạo response: {str(e)}"
            await db.commit()

    from fastapi.responses import StreamingResponse

    return StreamingResponse(
        stream_generator(),
        media_type="text/plain; charset=utf-8",
        headers={
            "X-Conversation-Id": str(conversation.id),
            "X-Context-Sources": str(vector_response.count),
        },
    )


# =============================================================================
# Streaming Chat API - Thêm message vào conversation có sẵn
# =============================================================================

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
):
    """
    Thêm message vào cuộc hội thoại có sẵn.
    Trả về streaming response và tự động lưu user message vào DB.
    """
    # Kiểm tra conversation tồn tại và thuộc về user
    query = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id,
        Conversation.is_deleted == 0,
    )
    result = await db.execute(query)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Lưu user message vào DB
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=request.query,
        context_sources=0,
    )
    db.add(user_message)
    await db.commit()  # Commit immediately to ensure user message is saved

    logger.info(f"[chat/stream] Added message to conversation {conversation.id}")

    chat = await get_chat_service_with_db(db)

    try:
        classification = classifier.classify(request.query)
    except Exception as e:
        logger.error(f"[chat/stream] Classification error: {e}")
        from fastapi.responses import StreamingResponse

        async def error_stream():
            yield f"Lỗi khi phân loại câu hỏi: {str(e)}"

        return StreamingResponse(
            error_stream(),
            media_type="text/plain; charset=utf-8",
            headers={
                "X-Conversation-Id": str(conversation.id),
                "X-Context-Sources": "0",
            },
        )

    if not classification.needs_context:
        context = ""
        system_prompt = await chat.get_system_prompt()

        async def stream_generator():
            answer_content = ""
            assistant_msg = Message(
                conversation_id=conversation.id,
                role="assistant",
                content="",
                context_sources=0,
            )
            db.add(assistant_msg)
            await db.flush()

            try:
                async for chunk in chat.stream_answer(request.query, context, system_prompt):
                    answer_content += chunk
                    yield chunk

                # Lưu complete answer
                assistant_msg.content = answer_content
                await db.commit()
            except Exception as e:
                logger.error(f"[chat/stream] Error in stream: {e}")
                assistant_msg.content = f"Lỗi khi tạo response: {str(e)}"
                await db.commit()

        from fastapi.responses import StreamingResponse

        return StreamingResponse(
            stream_generator(),
            media_type="text/plain; charset=utf-8",
            headers={
                "X-Conversation-Id": str(conversation.id),
                "X-Context-Sources": "0",
            },
        )

    search_req = TextSearchRequest(
        query=request.query,
        limit=request.limit,
        use_reranker=request.use_reranker,
        rerank_top_k=request.rerank_top_k,
        score_threshold=request.score_threshold,
    )

    vector_response = await search_by_text(
        collection_name=request.collection_name,
        search_req=search_req,
        current_user=current_user,
        service=vector,
        embedding=embedding,
        reranker=reranker,
    )

    context_str = chat.build_context(vector_response.results)
    system_prompt = await chat.get_system_prompt()

    async def stream_generator():
        answer_content = ""
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content="",
            context_sources=vector_response.count,
        )
        db.add(assistant_msg)
        await db.flush()

        try:
            async for chunk in chat.stream_answer(request.query, context_str, system_prompt):
                answer_content += chunk
                yield chunk

            # Lưu complete answer
            assistant_msg.content = answer_content
            await db.commit()
        except Exception as e:
            logger.error(f"[chat/stream] Error in stream: {e}")
            assistant_msg.content = f"Lỗi khi tạo response: {str(e)}"
            await db.commit()

    from fastapi.responses import StreamingResponse

    return StreamingResponse(
        stream_generator(),
        media_type="text/plain; charset=utf-8",
        headers={
            "X-Conversation-Id": str(conversation.id),
            "X-Context-Sources": str(vector_response.count),
        },
    )
