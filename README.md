# UTC Student Chatbot

Chatbot hỗ trợ sinh viên **Trường Đại học Giao thông Vận tải (UTC)** — FAQ-first + RAG có citation, hàng chờ cán bộ, kho tri thức có metadata.

Stack: FastAPI + Next.js + PostgreSQL + Qdrant (hybrid search).

Xem ghi chú ĐATN: [`docs/UTC_DATN_NOTES.md`](docs/UTC_DATN_NOTES.md).

## Features

### RAG & Chat
- Document ingestion from **files** (PDF, DOCX, and more via Unstructured) and **databases**
- Chunking, embedding, and vector search with **Qdrant**
- Embeddings via API (**Gemini** `gemini-embedding-001` by default, or Mistral) and reranking with **Cohere** `rerank-multilingual-v3.0`
- Domain router + OOS + FAQ-first trước RAG; citation chips trên UI
- Streaming chat, feedback hữu ích / không hữu ích → staff tickets

### Administration
- **RBAC**: `student` / `staff` / `admin` / `root`
- Kho tri thức (`/admin/knowledge`), FAQ, tickets, stats
- JWT authentication with access and refresh tokens
- Audit logging for CRUD operations
- System configuration (general and chat settings)

### LLM Providers
- Pluggable provider strategy: **Gemini** (default, `gemini-2.5-flash`), **Mistral**, or **DeepSeek** (configurable via environment)

### Frontend
- Next.js 15 + React 19 + Material UI dashboard
- Chat UI with streaming responses
- API routes proxy requests to the backend (same-origin `/api/*`)

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| Backend | FastAPI, SQLAlchemy (async), Alembic, PostgreSQL |
| Vector DB | Qdrant |
| ML / NLP | Gemini Embedding API, Cohere Rerank API, BM25, Vietnamese NER |
| LLM | Gemini API, Mistral API, DeepSeek API |
| Frontend | Next.js, React, MUI, SWR |
| DevOps | Docker, Docker Compose |

## Architecture

```mermaid
flowchart LR
  Browser --> Frontend[Next.js :3000]
  Frontend -->|/api proxy| Backend[FastAPI :8000]
  Backend --> Postgres[(PostgreSQL)]
  Backend --> Qdrant[(Qdrant)]
  Backend --> LLM[Gemini / Mistral / DeepSeek]
  Backend --> Models[Embedding / Reranker API, NER]
```

## Prerequisites

- **Development:** Python 3.11+, Node.js 18+, Docker (for Postgres & Qdrant)
- **Production:** Docker & Docker Compose

## Development Setup

### 1. Start infrastructure

```bash
docker compose up -d db qdrant
```

Postgres connection: `postgresql://admin:admin123456@localhost:5432/fastapi_db`

### 2. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # edit API keys and secrets
alembic upgrade head
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: http://localhost:3000

### Default login

| Field | Value |
|-------|-------|
| Username | `root` |
| Password | `root123456` |

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "root",
  "password": "root123456"
}
```

Use the returned access token: `Authorization: Bearer <token>`

## Environment Variables

### Backend (`backend/.env`)

Copy `backend/.env.example` and configure:

- `DATABASE_URL` — PostgreSQL connection string
- `QDRANT_HOST`, `QDRANT_PORT` — Qdrant endpoints
- `JWT_SECRET_KEY`, `JWT_REFRESH_SECRET_KEY` — token signing keys
- `LLM_PROVIDER` — `gemini` (default), `mistral`, or `deepseek`
- `GEMINI_API_KEY` / `MISTRAL_API_KEY` / `DEEPSEEK_API_KEY` — LLM API credentials
- `EMBEDDING_PROVIDER` — `gemini` (default) or `mistral`
- `COHERE_API_KEY`, `RERANKER_MODEL_NAME` — reranking (skipped if no key)
- `NER_MODEL_NAME` — Vietnamese NER model

### Frontend (`frontend/.env`)

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

For local dev, point this at the backend on your host machine.

## Production (Docker)

### Build images

```bash
docker compose build
```

Or build individually:

```bash
docker build -t chat-assistant-backend ./backend
docker build -t chat-assistant-frontend ./frontend
```

### Run

```bash
docker compose up -d
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |
| Qdrant | http://localhost:6333 |

### Deploy notes

- **Backend** runs `uvicorn` inside the container; no separate Python install on the server.
- **Frontend** uses a multi-stage build with Next.js `output: 'standalone'` — the runtime image contains only the built server and static assets, not source code or full `node_modules`.
- `NEXT_PUBLIC_API_BASE_URL` is passed at **build time** via `docker-compose.yml` (`http://backend:8000` for server-side proxying inside the Docker network). Browser clients call `/api/*` with relative URLs.
- Ship images via a registry (`docker push` / `docker pull`) or `docker save` / `docker load` for offline transfer.

### Backend env in Docker

`docker-compose.yml` sets `DATABASE_URL` for the backend. For LLM keys and other secrets, extend the `environment` section or use an env file — do not commit real secrets.

## Project Structure

```
ChatAssistant/
├── backend/           # FastAPI app, services, migrations
│   ├── api/           # REST route handlers
│   ├── services/      # RAG, embedding, ingestion, LLM
│   └── database/      # SQLAlchemy models & sessions
├── frontend/          # Next.js UI
│   └── src/app/       # Pages, components, API proxy routes
└── docker-compose.yml # Postgres, Qdrant, backend, frontend
```

## Useful Commands

```bash
# New database migration
cd backend && alembic revision --autogenerate -m "description"

# Roll back one migration
alembic downgrade -1

# Stop all containers
docker compose down
```

## License

Private / graduation project — see repository owner for usage terms.
