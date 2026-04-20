from fastapi import FastAPI, APIRouter
from middleware import log_requests
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from database.database import engine, AsyncSessionLocal
from database.models.base import Base
from api import auth, rbac, demo, user, audit_log, tenant
from database.audit_event import register_audit_events  # Đăng ký audit event listener


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Thiết lập Row Level Security cho multi-tenancy
    from database.rls import setup_rls

    await setup_rls(engine)

    # Đăng ký audit event listener cho tất cả các bảng
    register_audit_events()

    # Auto seed RBAC (roles, modules, permissions)
    async with AsyncSessionLocal() as db:
        try:
            from database.seeds.auto_seed_data import auto_seed_all

            await auto_seed_all(db)
        except Exception as e:
            print(f"Error during seeding: {e}")
    yield


app = FastAPI(
    title="FastAPI User Management Base Project",
    description="""
    🚀 **FastAPI Base Project với JWT Authentication & RBAC**
    
    ## 🔐 Cách sử dụng:
    1. **Login:** POST `/api/auth/login` (cần tenant_id)
    2. **Copy token** từ response 
    3. **Authorize:** Click nút "Authorize" và nhập: `Bearer YOUR_TOKEN`
    
    ## 👤 Tài khoản mặc định:
    - Username: `root`  
    - Password: `root123456`
    - Tenant Code: `default` (tenant mặc định)
    
    ## 🏢 Hệ thống Multi-Tenant:
    - Mỗi user thuộc về một tenant
    - API calls tự động filter theo tenant context
    - Admin có thể quản lý tất cả tenants
    
    ## 🎯 Hệ thống phân quyền RBAC:
    **Cấu trúc:** User → Role → Permission → Module
    
    **Các loại quyền:** `view`, `create`, `update`, `delete`
    
    **Modules chính:** 
    - `tenant` - Quản lý tenant
    - `user` - Quản lý user  
    - `role` - Quản lý role
    - `permission` - Quản lý permission
    - `demo` - Module demo
    - `audit_log` - Xem audit logs
    
    **Ví dụ gán quyền:**
    ```json
    POST /api/rbac/assign-permission
    {
        "role_id": 1,
        "module_id": 1,
        "permission_id": 1
    }
    ```
    
    ## 📊 Audit Logging:
    - Tự động log tất cả thay đổi CRUD
    - Xem tại: `/api/audit-logs`
    """,
    version="1.0.0",
    lifespan=lifespan,
)


# --- Root endpoint ---
@app.get("/")
async def root():
    return {"message": "Welcome to the API"}


# --- API Router with prefix /api ---
api_router = APIRouter(prefix="/api")

# --- Routers ---
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(demo.router)
api_router.include_router(rbac.router)
api_router.include_router(audit_log.router)
api_router.include_router(tenant.router)
app.include_router(api_router)


# --- CORS config (must be before routers) ---

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^http://([a-zA-Z0-9-]+\.)?localhost:3000$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.middleware("http")(log_requests)
