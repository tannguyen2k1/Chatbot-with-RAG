# FastAPI Backend Template (DEV ONLY)

## 1. Tạo môi trường ảo

```bash
python -m venv .venv
.venv\Scripts\activate
```

## 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

## 3. Tạo file .env

```env
DATABASE_URL=postgresql://admin:admin123456@localhost:5432/fastapi_db
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_MINUTES=10080
```

## 4. Khởi động PostgreSQL (DEV) và qdrant

```bash
docker-compose up -d db qdrant
```

## 5. Chạy migrations

```bash
alembic upgrade head
```

## 6. Khởi động ứng dụng (DEV)

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Sử dụng

- API Docs: http://127.0.0.1:8000/docs
- Tài khoản mặc định: `root` / `root123456` / `default` (tenant mặc định)
- Đăng nhập tại `/api/auth/login` để lấy token

### Đăng nhập:

```json
POST /api/auth/login
{
    "username": "root",
    "password": "root123456",
    "tenant_code": "default"  // Bắt buộc: Code của tenant
}
```

**Lưu ý:** `tenant_code` là bắt buộc để xác định user thuộc tenant nào.

### Sử dụng token:

- Header: `Authorization: Bearer YOUR_TOKEN`
- Token sẽ chứa thông tin tenant_id để xác định context
- Không cần API Key nữa!

## Hệ thống Multi-Tenant & RBAC

### 🏢 Multi-Tenant:

- Mỗi user thuộc về một tenant
- API calls tự động filter theo tenant context
- Admin có thể quản lý tất cả tenants

### 🎯 RBAC (Role-Based Access Control):

- **Cấu trúc:** User → Role → Permission → Module
- **Quyền:** `view`, `create`, `update`, `delete`
- **Modules:** `tenant`, `user`, `role`, `permission`, `demo`, `audit_log`

### 📊 Audit Logging:

- Tự động log tất cả thay đổi CRUD
- Xem tại: `/api/audit-logs`

## Một số lệnh hữu ích

```bash
# Tạo migration mới
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1

# Dừng database
docker-compose down
```
