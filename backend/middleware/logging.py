import logging
from fastapi import Request
import os
import time
from jose import jwt, JWTError
from logging.handlers import TimedRotatingFileHandler
from datetime import datetime
from config.settings import settings
from database.audit_event import current_user_id, current_tenant_id

# Đường dẫn thư mục log
log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
os.makedirs(log_dir, exist_ok=True)
log_filename = os.path.join(log_dir, f"app_{datetime.now().strftime('%Y%m%d')}.log")

# Handler xoay vòng theo ngày
handler = TimedRotatingFileHandler(log_filename, when="midnight", interval=1, backupCount=7, encoding="utf-8")
formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
handler.setFormatter(formatter)
handler.suffix = "%Y%m%d"

# Logger chính cho ứng dụng
app_logger = logging.getLogger("app")
app_logger.setLevel(logging.INFO)
if not app_logger.handlers:
    app_logger.addHandler(handler)

# Logger cho SQLAlchemy (giảm log SQL)
for logger_name in ["sqlalchemy.engine"]:
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.WARNING)
    if not logger.handlers:
        logger.addHandler(handler)

async def log_requests(request: Request, call_next):
    start_time = time.time()
    user_agent = request.headers.get("user-agent", "-")
    client_ip = request.client.host if request.client else "-"
    user_id = "-"
    tenant_id = "-"
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ", 1)[1]
        try:
            payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
            user_id = payload.get("sub", "-")
            tenant_id = payload.get("tenant_id", "-")
        except JWTError:
            user_id = "invalid_token"
            tenant_id = "invalid_token"
    # Set user_id và tenant_id vào contextvars cho audit log
    current_user_id.set(user_id)
    current_tenant_id.set(tenant_id)
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    app_logger.info(f"{request.method} {request.url.path} {response.status_code} {process_time:.2f}ms UA={user_agent} IP={client_ip} user_id={user_id} tenant_id={tenant_id}")
    return response