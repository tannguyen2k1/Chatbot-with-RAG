"""
PostgreSQL Row Level Security (RLS) cho Multi-Tenancy

Tự động lọc dữ liệu theo tenant_id ở tầng database.
Mọi câu lệnh SQL (kể cả subquery) đều được filter tự động
mà code Python không cần thêm điều kiện tenant_id.

Cách hoạt động:
1. Startup: Tạo role app_user (không phải superuser) → RLS có hiệu lực
2. Mỗi request tenant: SET ROLE app_user + SET app.current_tenant_id = X
3. PostgreSQL RLS policy tự động filter: WHERE tenant_id = current_setting(...)
4. Khi xong: RESET ROLE + RESET variable

Tại sao cần SET ROLE?
- Superuser (như admin) LUÔN bypass RLS, dù có FORCE ROW LEVEL SECURITY
- SET ROLE app_user → chuyển sang role không phải superuser → RLS hoạt động
- RESET ROLE → quay lại admin cho migration/seed operations
"""

from sqlalchemy import text, event
from sqlalchemy.ext.asyncio import AsyncEngine

# Role name cho app (không phải superuser, để RLS hoạt động)
APP_ROLE = "app_tenant_user"


def get_rls_tables():
    """
    Tự động lấy danh sách các bảng có cột tenant_id từ SQLAlchemy MetaData.
    Điều này giúp tránh việc phải khai báo thủ công mỗi khi thêm model mới.
    """
    import database.models  # Đảm bảo tất cả models đã được import để đăng ký vào MetaData
    from database.models.base import Base

    tables = []
    for table_name, table in Base.metadata.tables.items():
        if "tenant_id" in table.columns:
            tables.append(table_name)
    return tables


def register_pool_events(engine: AsyncEngine):
    """
    Đăng ký event trên connection pool:
    - Khi connection trả về pool → RESET ROLE và RESET biến tenant
    """

    @event.listens_for(engine.sync_engine, "checkin")
    def reset_on_checkin(dbapi_connection, connection_record):
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("RESET ROLE")
            cursor.execute("RESET app.current_tenant_id")
            cursor.close()
        except Exception:
            pass


async def setup_rls(engine: AsyncEngine):
    """
    Thiết lập Row Level Security cho tất cả bảng có tenant_id.
    Chạy một lần khi khởi động ứng dụng.

    Bước 1: Tạo role app_tenant_user (NOSUPERUSER) nếu chưa có
    Bước 2: Grant quyền cho role này trên tất cả bảng
    Bước 3: Enable RLS + tạo policy trên từng bảng
    """
    print("[RLS] Dang thiet lap Row Level Security...")

    async with engine.begin() as conn:
        # ===== BƯỚC 1: Tạo role không phải superuser =====
        try:
            # Kiểm tra role đã tồn tại chưa
            result = await conn.execute(
                text(f"SELECT 1 FROM pg_roles WHERE rolname = '{APP_ROLE}'")
            )
            role_exists = result.scalar() is not None

            if not role_exists:
                await conn.execute(text(f"CREATE ROLE {APP_ROLE} NOSUPERUSER NOLOGIN"))
                print(f"  [OK] Tao role: {APP_ROLE}")
            else:
                print(f"  [OK] Role da ton tai: {APP_ROLE}")
        except Exception as e:
            print(f"  [WARN] Loi tao role: {e}")

        # ===== BƯỚC 2: Grant quyền =====
        try:
            # Grant quyền trên tất cả bảng hiện có
            await conn.execute(
                text(
                    f"GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO {APP_ROLE}"
                )
            )
            # Grant quyền trên sequences (cho INSERT với auto-increment)
            await conn.execute(
                text(
                    f"GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO {APP_ROLE}"
                )
            )
            # Grant quyền cho bảng tạo trong tương lai
            await conn.execute(
                text(
                    f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {APP_ROLE}"
                )
            )
            await conn.execute(
                text(
                    f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {APP_ROLE}"
                )
            )
            print(f"  [OK] Da grant quyen cho {APP_ROLE}")
        except Exception as e:
            print(f"  [WARN] Loi grant quyen: {e}")

        # ===== BƯỚC 3: Enable RLS + tạo policy =====
        rls_tables = get_rls_tables()
        for table in rls_tables:
            try:
                # Enable RLS
                await conn.execute(
                    text(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
                )

                # Force RLS cho table owner
                await conn.execute(
                    text(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
                )

                # Drop policy cũ
                await conn.execute(
                    text(f"DROP POLICY IF EXISTS tenant_isolation_policy ON {table}")
                )

                # Tạo policy mới
                # Logic:
                # - current_setting rỗng/NULL → cho xem tất cả (global access cho admin/seed)
                # - current_setting có giá trị → chỉ xem rows theo tenant_id
                await conn.execute(
                    text(f"""
                    CREATE POLICY tenant_isolation_policy ON {table}
                        FOR ALL
                        USING (
                            COALESCE(current_setting('app.current_tenant_id', true), '') = ''
                            OR tenant_id = current_setting('app.current_tenant_id', true)::bigint
                        )
                        WITH CHECK (
                            COALESCE(current_setting('app.current_tenant_id', true), '') = ''
                            OR tenant_id = current_setting('app.current_tenant_id', true)::bigint
                        )
                """)
                )

                print(f"  [OK] RLS enabled: {table}")
            except Exception as e:
                print(f"  [WARN] RLS failed for {table}: {e}")

    print("[RLS] Row Level Security setup hoan tat!")
