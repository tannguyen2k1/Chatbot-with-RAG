from sqlalchemy import event
from sqlalchemy.orm import Session
from database.models.audit_log import AuditLog
from datetime import datetime, timezone
from database.models.base import Base

# Listener for after_delete event

def after_delete_listener(mapper, connection, target):
    if hasattr(target, '__tablename__') and target.__tablename__ != 'audit_logs':
        # Lấy tất cả thuộc tính của target thành dict
        old_value = str({k: v for k, v in vars(target).items() if not k.startswith('_')})
        connection.execute(
            AuditLog.__table__.insert(),
            {
                'action': 'delete',
                'table_name': target.__tablename__,
                'record_id': getattr(target, 'id', None),
                'user_id': None,  # TODO: pass user_id from context
                'timestamp': datetime.now(timezone.utc),
                'old_value': old_value,
                'new_value': None,
                'description': f'Deleted {target.__tablename__} record'
            }
        )

def after_insert_listener(mapper, connection, target):
    if hasattr(target, '__tablename__') and target.__tablename__ != 'audit_logs':
        new_value = str({k: v for k, v in vars(target).items() if not k.startswith('_')})
        connection.execute(
            AuditLog.__table__.insert(),
            {
                'action': 'create',
                'table_name': target.__tablename__,
                'record_id': getattr(target, 'id', None),
                'user_id': None,  # TODO: pass user_id from context
                'timestamp': datetime.now(timezone.utc),
                'old_value': None,
                'new_value': new_value,
                'description': f'Created {target.__tablename__} record'
            }
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
        connection.execute(
            AuditLog.__table__.insert(),
            {
                'action': 'update',
                'table_name': target.__tablename__,
                'record_id': pk,
                'user_id': None,  # TODO: pass user_id from context
                'timestamp': datetime.now(timezone.utc),
                'old_value': old_value,
                'new_value': new_value,
                'description': f'Updated {target.__tablename__} record'
            }
        )


def register_audit_events():
    for cls in Base.__subclasses__():
        # Bỏ qua AuditLog để tránh log chính nó
        if hasattr(cls, '__tablename__') and cls.__tablename__ != 'audit_logs':
            event.listen(cls, 'after_delete', after_delete_listener)
            event.listen(cls, 'after_insert', after_insert_listener)
            event.listen(cls, 'after_update', after_update_listener)
