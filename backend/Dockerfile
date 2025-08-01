FROM python:3.11 as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN pyinstaller run_app.py --hidden-import=passlib.handlers.bcrypt

FROM python:3.11-slim
WORKDIR /app
# Copy file thực thi và các file tĩnh cần thiết
COPY --from=builder /app/dist/run_app /app/run_app
COPY --from=builder /app/alembic /app/alembic
COPY --from=builder /app/alembic.ini /app/alembic.ini
COPY --from=builder /app/config /app/config
COPY --from=builder /app/database /app/database
COPY --from=builder /app/requirements.txt /app/requirements.txt
COPY --from=builder /app/static /app/static
COPY --from=builder /app/templates /app/templates
EXPOSE 8000
CMD ["/app/run_app"]