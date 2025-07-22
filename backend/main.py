from fastapi import FastAPI
import logging
from logging.handlers import TimedRotatingFileHandler
import os
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database.database import engine, SessionLocal
from database.models.base import Base
from database.models.auth_models import User
from services.user import UserService, UserCreate
from api import auth, users, demos, rbac

log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
log_filename = os.path.join(log_dir, f"app_{datetime.now().strftime('%Y%m%d')}.log")
handler = TimedRotatingFileHandler(log_filename, when="midnight", interval=1, backupCount=7, encoding="utf-8")
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
handler.setFormatter(formatter)
handler.suffix = "%Y%m%d"
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)
if not root_logger.handlers:
    root_logger.addHandler(handler)



from database.seeds.rbac_seed import seed_rbac_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)
    # Auto seed RBAC (roles, modules, permissions)
    db = SessionLocal()
    try:
        seed_rbac_data(db)
    finally:
        db.close()
    # Then seed root & admin user + mapping role
    db = SessionLocal()
    try:
        from passlib.context import CryptContext
        from database.models.auth_models import User, Role, UserRole
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        # Root user
        root_user = db.query(User).filter_by(username="root").first()
        root_role = db.query(Role).filter_by(name="root").first()
        if not root_user:
            hashed_password = pwd_context.hash("admin123456")
            user = User(
                username="root",
                email="root@admin.com",
                hashed_password=hashed_password,
                full_name="Super Admin",
                phone=None,
                is_active=1,
                role="root"
            )
            db.add(user)
            db.commit()
            root_user = user
            print("✅ Created root admin user")
        # Gán role root cho user root
        if root_user and root_role:
            if not db.query(UserRole).filter_by(user_id=root_user.id, role_id=root_role.id).first():
                db.add(UserRole(user_id=root_user.id, role_id=root_role.id))
                db.commit()
        # Admin user
        admin_user = db.query(User).filter_by(username="admin").first()
        admin_role = db.query(Role).filter_by(name="admin").first()
        if not admin_user:
            hashed_password = pwd_context.hash("admin123456")
            user = User(
                username="admin",
                email="admin@admin.com",
                hashed_password=hashed_password,
                full_name="Admin",
                phone=None,
                is_active=1,
                role="admin"
            )
            db.add(user)
            db.commit()
            admin_user = user
            print("✅ Created admin user")
        # Gán role admin cho user admin
        if admin_user and admin_role:
            if not db.query(UserRole).filter_by(user_id=admin_user.id, role_id=admin_role.id).first():
                db.add(UserRole(user_id=admin_user.id, role_id=admin_role.id))
                db.commit()
        else:
            print("ℹ️ Root/admin user already exists")
    except Exception as e:
        print(f"❌ Error creating root/admin user: {e}")
        db.rollback()
    finally:
        db.close()
    yield

# --- App creation ---
app = FastAPI(
    title="FastAPI User Management Base Project",
    description="""
    🚀 **FastAPI Base Project với JWT Authentication & RBAC**
    ## 🔐 Cách sử dụng:
    1. **Login:** POST `/auth/login` với `{"username": "root", "password": "admin123456"}`
    2. **Copy token** từ response 
    3. **Authorize:** Click nút "Authorize" và nhập: `Bearer YOUR_TOKEN`
    ## 👤 Tài khoản mặc định:
    - Username: `root`  
    - Password: `admin123456`
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
    **Các loại quyền:** `manage`, `view`, `create`, `update`, `delete`
    **Modules:** `demo`, `user`, `role`, v.v.
    """,
    version="1.0.0",
    lifespan=lifespan
)


# --- CORS config (must be before routers) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # no trailing slash
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(demos.router)
# ...removed user_module_permissions router registration...
app.include_router(rbac.router)


# --- FastAPI logging middleware ---
from fastapi import Request
import time

from jose import jwt, JWTError
from config.settings import settings

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    user_agent = request.headers.get("user-agent", "-")
    client_ip = request.client.host if request.client else "-"
    user_id = "-"
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub", "-")
        except JWTError:
            user_id = "invalid_token"
    logging.info(f"{request.method} {request.url.path} {response.status_code} {process_time:.2f}ms UA={user_agent} IP={client_ip} user_id={user_id}")
    return response

# --- Root endpoint ---
@app.get("/")
def root():
    return {"message": "Welcome to the API"}