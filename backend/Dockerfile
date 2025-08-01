FROM python:3.11 as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy toàn bộ source để build binary
COPY . .
RUN pyinstaller run_app.py --hidden-import=passlib.handlers.bcrypt -y

FROM python:3.11-slim
WORKDIR /app
# Chỉ copy file thực thi và các file cấu hình cần thiết, KHÔNG copy source code Python
COPY --from=builder /app/dist/run_app /app/run_app
COPY --from=builder /app/config /app/config
COPY --from=builder /app/database /app/database
COPY --from=builder /app/alembic.ini /app/alembic.ini
EXPOSE 8000
CMD ["/app/run_app/run_app"]