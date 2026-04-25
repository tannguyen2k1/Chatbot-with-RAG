from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
import logging

logger = logging.getLogger(__name__)

from api.vector import get_vector_service, search_by_text
from database.models.user import User
from dependencies import get_current_user
from schemas.chat import ChatResponse, ContextChatRequest, ContextChatResponse
from schemas.vector import TextSearchRequest
from services.chat import ChatService, get_chat_service
from services.embedding import EmbeddingService, get_embedding_service
from services.query_classifier import QueryClassifier, get_query_classifier
from services.rerank import RerankService, get_rerank_service
from services.vector import VectorService

router = APIRouter(
    prefix="/chat",
    tags=["Chat & LLM"],
    dependencies=[Depends(get_current_user)],
)


@router.post("/context", response_model=ContextChatResponse, summary="Xay dung Context cho LLM")
async def context_chat_endpoint(
    request: ContextChatRequest,
    current_user: User = Depends(get_current_user),
    chat: ChatService = Depends(get_chat_service),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
    classifier: QueryClassifier = Depends(get_query_classifier),
):
    classification = classifier.classify(request.query)
    if not classification.needs_context:
        return ContextChatResponse(
            query=request.query,
            context="",
            raw_results_count=0,
            prompt_preview=classification.reason,
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
    prompt_preview = chat.generate_prompt_preview(request.query, context_str)

    return ContextChatResponse(
        query=request.query,
        context=context_str,
        raw_results_count=vector_response.count,
        prompt_preview=prompt_preview,
    )


@router.post("/ask", response_model=ChatResponse, summary="Tro chuyen voi AI")
async def chat_endpoint(
    request: ContextChatRequest,
    current_user: User = Depends(get_current_user),
    chat: ChatService = Depends(get_chat_service),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
    classifier: QueryClassifier = Depends(get_query_classifier),
):
    classification = classifier.classify(request.query)
    if not classification.needs_context:
        answer = await chat.generate_simple_answer(request.query)
        return ChatResponse(
            query=request.query,
            answer=answer,
            context_sources=0,
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
    answer = await chat.generate_answer(request.query, context_str)

    return ChatResponse(
        query=request.query,
        answer=answer,
        context_sources=vector_response.count,
    )


@router.post("/ask/stream", summary="Tro chuyen voi AI theo dang streaming")
async def chat_stream_endpoint(
    request: ContextChatRequest,
    current_user: User = Depends(get_current_user),
    chat: ChatService = Depends(get_chat_service),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
    classifier: QueryClassifier = Depends(get_query_classifier),
):
    logger.info(f"[chat/stream] Received request: query={request.query!r}, collection={request.collection_name}")

    try:
        classification = classifier.classify(request.query)
    except Exception as e:
        logger.error(f"[chat/stream] Classification error: {e}")
        return StreamingResponse(
            iter([f"Lỗi khi phân loại câu hỏi: {str(e)}"]),
            media_type="text/plain; charset=utf-8",
            headers={"X-Context-Sources": "0"},
        )

    if not classification.needs_context:
        headers = {"X-Context-Sources": "0"}
        return StreamingResponse(
            chat.stream_simple_answer(request.query),
            media_type="text/plain; charset=utf-8",
            headers=headers,
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

    async def stream_generator():
        async for chunk in chat.stream_answer(request.query, context_str):
            yield chunk

    headers = {"X-Context-Sources": str(vector_response.count)}
    return StreamingResponse(
        stream_generator(),
        media_type="text/plain; charset=utf-8",
        headers=headers,
    )
