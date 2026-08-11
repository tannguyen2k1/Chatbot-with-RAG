import contextvars

current_user_id: contextvars.ContextVar = contextvars.ContextVar('current_user_id', default=None)

__all__ = ['current_user_id']
