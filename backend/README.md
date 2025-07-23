# FastAPI Backend Template

## Cấu hình

### 1. Tạo môi trường ảo

```bash
python -m venv .venv
.venv\Scripts\activate
```

### 2. Cài đặt dependencies

```bash
pip install -r requirements.txt
```

### 3. Tạo file .env

```env
DATABASE_URL=postgresql://admin:admin123456@localhost:5432/fastapi_db
JWT_SECRET_KEY=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_MINUTES=1440
```

### 4. Khởi động PostgreSQL

```bash
docker-compose up -d
```

### 5. Chạy migrations

```bash
alembic upgrade head
```

### 6. Khởi động ứng dụng

```bash
uvicorn main:app --reload
```

## Sử dụng

- API Docs: http://127.0.0.1:8000/docs
- Tài khoản mặc định: `root` / root123456
- Đăng nhập tại `/auth/login` để lấy token
- Sử dụng token với header: `Authorization: Bearer YOUR_TOKEN`

## Commands

```bash
# Tạo migration
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1

# Dừng database
docker-compose down
```

# Triển khai Production với Docker

## 1. Build Docker image cho backend

```bash
docker build -t my-fastapi-backend .
```

## 2. Sửa file `.env` cho production

- Đảm bảo các biến như `DATABASE_URL`, JWT key... đã đúng và bảo mật.
- Ví dụ:
  ```
  DATABASE_URL=postgresql://admin:admin123456@db:5432/fastapi_db
  ```

## 3. Thêm service backend vào `docker-compose.yml` (nếu chưa có)

```yaml
backend:
  build: .
  depends_on:
    - db
  environment:
    - DATABASE_URL=postgresql://admin:admin123456@db:5432/fastapi_db
    - JWT_SECRET_KEY=your-super-secret-jwt-key-here
    - JWT_REFRESH_SECRET_KEY=your-super-secret-refresh-key-here
    - JWT_ALGORITHM=HS256
    - ACCESS_TOKEN_EXPIRE_MINUTES=30
    - REFRESH_TOKEN_EXPIRE_MINUTES=1440
  ports:
    - "8000:8000"
```

## 4. Chạy production bằng docker-compose

```bash
docker-compose up --build -d
```

## 5. Chạy migration trong container backend

```bash
docker-compose exec backend alembic upgrade head
```

Sau khi hoàn thành:

- API sẽ chạy ở: http://localhost:8000
- Database PostgreSQL ở: localhost:5432 (chỉ nên mở port này khi cần thiết)
