import contextvars

# Biến contextvars lưu user_id và tenant_id cho từng request
current_user_id: contextvars.ContextVar = contextvars.ContextVar('current_user_id', default=None)
current_tenant_id: contextvars.ContextVar = contextvars.ContextVar('current_tenant_id', default=None)

# Export để có thể import từ middleware
__all__ = ['current_user_id', 'current_tenant_id']
