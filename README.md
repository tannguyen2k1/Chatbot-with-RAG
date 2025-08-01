# Hướng dẫn chạy DEV và PRODUCTION

## 1. Chạy DEV (phát triển, hot reload, sửa code trực tiếp)

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

### Database (Postgres)

```bash
docker-compose up db
# hoặc
docker compose up db
```

Kết nối tới Postgres: `postgresql://admin:admin123456@localhost:5432/fastapi_db`

---

## 2. Build & Deploy PRODUCTION (không lộ source, chạy Docker)

### Build image production

```bash
docker-compose build
# hoặc build từng service
docker build -t my-backend ./backend
docker build -t my-frontend ./frontend
```

### Đưa image lên server

- Nếu server cùng mạng LAN: dùng `docker save`/`docker load` hoặc copy image qua USB.
- Nếu server ở xa: push lên Docker Registry (Docker Hub, GitLab, Harbor...)

### Deploy trên server

1. Cài Docker, Docker Compose trên server.
2. Copy file `docker-compose.yml` (và các file cấu hình cần thiết) lên server.
3. Kéo image về (nếu dùng registry):
   ```bash
   docker pull your-registry/my-backend:latest
   docker pull your-registry/my-frontend:latest
   ```
4. Chạy production:
   ```bash
   docker-compose up -d
   ```

### Lưu ý bảo mật source code

- Backend: Dockerfile chỉ copy file thực thi build từ PyInstaller, không lộ source Python.
- Frontend: Dockerfile chỉ copy file build Next.js (.next, public...), không lộ source JS/TS.
- Không cần copy source code lên server, chỉ cần image đã build.
