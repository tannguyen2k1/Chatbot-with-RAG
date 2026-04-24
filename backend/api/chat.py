from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from api.vector import get_vector_service, search_by_text
from dependencies import get_current_user
from schemas.chat import ChatResponse, ContextChatRequest, ContextChatResponse
from schemas.vector import TextSearchRequest
from services.chat import ChatService, get_chat_service
from services.embedding import EmbeddingService, get_embedding_service
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
    chat: ChatService = Depends(get_chat_service),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
):
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
    chat: ChatService = Depends(get_chat_service),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
):
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
    chat: ChatService = Depends(get_chat_service),
    vector: VectorService = Depends(get_vector_service),
    embedding: EmbeddingService = Depends(get_embedding_service),
    reranker: RerankService = Depends(get_rerank_service),
):
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
