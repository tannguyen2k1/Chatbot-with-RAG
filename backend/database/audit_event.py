from sqlalchemy import event
from database.models.audit_log import AuditLog
from datetime import datetime, timezone
from database.models.base import BaseModel
from database.database import engine
from database.context import current_user_id, current_tenant_id

# Export để có thể import từ middleware
__all__ = ['current_user_id', 'current_tenant_id', 'register_audit_events']

def create_audit_log_sync(action: str, table_name: str, record_id: int, old_value: str = None, new_value: str = None, description: str = None):
    """Helper function to create audit log using sync approach"""
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # Create a new engine and session for audit log
        engine_sync = create_engine(engine.url)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_sync)
        session = SessionLocal()
        
        user_id = current_user_id.get()
        tenant_id = current_tenant_id.get()
        
        if user_id is None:
            session.close()
            return
            
        audit_log = AuditLog(
            action=action,
            table_name=table_name,
            record_id=record_id,
            user_id=user_id,
            tenant_id=tenant_id,
            timestamp=datetime.now(timezone.utc),
            old_value=old_value,
            new_value=new_value,
            description=description
        )
        session.add(audit_log)
        session.commit()
        session.close()
    except Exception as e:
        # Log error but don't fail the main operation
        print(f"Audit log error: {e}")
        if 'session' in locals():
            session.close()

# Listener for after_delete event

def after_delete_listener(mapper, connection, target):
    if hasattr(target, '__tablename__') and target.__tablename__ != 'audit_logs':
        old_value = str({k: v for k, v in vars(target).items() if not k.startswith('_')})
        
        # Create audit log directly
        create_audit_log_sync(
            action='delete',
            table_name=target.__tablename__,
            record_id=getattr(target, 'id', None),
            old_value=old_value,
            new_value=None,
            description=f'Deleted {target.__tablename__} record'
        )

def after_insert_listener(mapper, connection, target):
    if hasattr(target, '__tablename__') and target.__tablename__ != 'audit_logs':
        new_value = str({k: v for k, v in vars(target).items() if not k.startswith('_')})
        
        # Create audit log directly
        create_audit_log_sync(
            action='create',
            table_name=target.__tablename__,
            record_id=getattr(target, 'id', None),
            old_value=None,
            new_value=new_value,
            description=f'Created {target.__tablename__} record'
        )

def after_update_listener(mapper, connection, target):
    if hasattr(target, '__tablename__') and target.__tablename__ != 'audit_logs':
        pk = getattr(target, 'id', None)
        table = mapper.local_table
        old_row = connection.execute(
            table.select().where(table.c.id == pk)
        ).fetchone()
        old_value = str(dict(old_row._mapping)) if old_row else None
        new_value = str({k: v for k, v in vars(target).items() if not k.startswith('_')})
        
        # Create audit log directly
        create_audit_log_sync(
            action='update',
            table_name=target.__tablename__,
            record_id=pk,
            old_value=old_value,
            new_value=new_value,
            description=f'Updated {target.__tablename__} record'
        )


def register_audit_events():
    for cls in BaseModel.__subclasses__():
        if hasattr(cls, '__tablename__'):
            event.listen(cls, 'after_delete', after_delete_listener)
            event.listen(cls, 'after_insert', after_insert_listener)
            event.listen(cls, 'after_update', after_update_listener)
