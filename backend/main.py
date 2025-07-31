from fastapi import FastAPI, APIRouter
from middleware import log_requests
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, SessionLocal
from database.models.base import Base
from api import auth, rbac, demo, user
from database.audit_event import register_audit_events  # Đăng ký audit event listener


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Đăng ký audit event listener cho tất cả các bảng
    register_audit_events()
    # Auto seed RBAC (roles, modules, permissions)
    db = SessionLocal()
    try:
        from database.seeds.auto_seed_data import auto_seed_all
        auto_seed_all()
    finally:
        db.close()
    yield

app = FastAPI(
    title="FastAPI User Management Base Project",
    description="""
    🚀 **FastAPI Base Project với JWT Authentication & RBAC**
    ## 🔐 Cách sử dụng:
    1. **Login:** POST `/api/auth/login`
    2. **Copy token** từ response 
    3. **Authorize:** Click nút "Authorize" và nhập: `Bearer YOUR_TOKEN`
    ## 👤 Tài khoản mặc định:
    - Username: `root`  
    - Password: `root123456`
    ## 🎯 Hệ thống phân quyền Module:
    **Gán quyền user abcd quản lý module demo:**
    ```json
    POST /user-module-permissions/grant
    {
        "user_id": 2,
        "module_name": "demo",
        "permissions": "manage"
    }
    ```
    **Các loại quyền:**  `view`, `create`, `update`, `delete`
    **Modules:** `demo`, `user`, `role`, v.v.
    """,
    version="1.0.0",
    lifespan=lifespan
)


# --- Root endpoint ---
@app.get("/")
def root():
    return {"message": "Welcome to the API"}

# --- API Router with prefix /api ---
api_router = APIRouter(prefix="/api")
 
# --- Routers ---
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(demo.router)
api_router.include_router(rbac.router)
app.include_router(api_router)


# --- CORS config (must be before routers) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],  # no trailing slash
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.middleware("http")(log_requests)