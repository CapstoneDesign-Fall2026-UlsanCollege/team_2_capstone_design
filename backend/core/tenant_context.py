import logging
import threading
from django.core.signals import request_finished
from django.db import connection
from django.dispatch import receiver

logger = logging.getLogger(__name__)

_thread_locals = threading.local()


def get_current_tenant_id():
    """Returns the current tenant ID active on this thread, or None."""
    return getattr(_thread_locals, "store_id", None)


TENANT_TABLES = [
    "stores_storemembership",
    "stores_customer",
    "stores_merchantauditlog",
    "catalog_product",
    "catalog_variant",
    "catalog_discount",
    "orders_order",
    "orders_orderitem",
    "orders_orderevent",
]


_shopcraft_role_exists: bool | None = None


def _check_shopcraft_role(cursor) -> bool:
    global _shopcraft_role_exists
    if _shopcraft_role_exists is None:
        cursor.execute(
            "SELECT 1 FROM pg_catalog.pg_roles WHERE rolname = 'shopcraft_app';"
        )
        _shopcraft_role_exists = bool(cursor.fetchone())
    return _shopcraft_role_exists


def set_current_tenant_id(store_id: int | str):
    """
    Enforces PostgreSQL Row-Level Security for the current session/request.
    Switches to the restricted non-bypass role 'shopcraft_app' and sets
    app.current_store_id to the active store ID.
    """
    _thread_locals.store_id = store_id
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            if _check_shopcraft_role(cursor):
                cursor.execute("SET ROLE shopcraft_app;")
            cursor.execute("SET app.bypass_rls = 'off';")
            cursor.execute("SET app.current_store_id = %s;", [str(store_id)])


def reset_current_tenant_id():
    """
    Resets the tenant session context back to empty and restores default connection role.
    """
    _thread_locals.store_id = None
    if connection.vendor == "postgresql":
        try:
            with connection.cursor() as cursor:
                try:
                    cursor.execute("SET app.current_store_id = '';")
                    cursor.execute("SET app.bypass_rls = 'off';")
                finally:
                    try:
                        cursor.execute("RESET ROLE;")
                    except Exception as e:
                        logger.debug(f"Unable to reset role: {e}")
        except Exception as conn_err:
            logger.debug(f"Connection error in reset_current_tenant_id: {conn_err}")


@receiver(request_finished)
def on_request_finished_cleanup(sender, **kwargs):
    """Guarantees tenant session role and parameters are reset after every HTTP request."""
    reset_current_tenant_id()


class TenantDatabaseContext:
    """Context manager to scope a block of code to a specific tenant in PostgreSQL."""
    def __init__(self, store_id: int | str):
        self.store_id = store_id

    def __enter__(self):
        set_current_tenant_id(self.store_id)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        reset_current_tenant_id()


class BypassRLSContext:
    """Context manager for system/admin operations that require bypassing RLS."""
    def __enter__(self):
        self._prev = getattr(_thread_locals, "store_id", None)
        _thread_locals.store_id = "ALL"
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                try:
                    cursor.execute("RESET ROLE;")
                except Exception:
                    pass
                cursor.execute("SET app.bypass_rls = 'on';")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        _thread_locals.store_id = self._prev
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("SET app.bypass_rls = 'off';")


def apply_postgres_rls_policies():
    """
    Applies PostgreSQL Row-Level Security (RLS) and tenant isolation policies
    to all tenant-owned tables in PostgreSQL.
    """
    if connection.vendor != "postgresql":
        logger.info("Database is not PostgreSQL; skipping Postgres RLS application.")
        return {"status": "skipped", "reason": "non-postgres"}

    applied_tables = []
    with connection.cursor() as cursor:
        # Ensure role shopcraft_app exists dynamically across Neon, CI, or self-hosted Postgres
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'shopcraft_app') THEN
                    CREATE ROLE shopcraft_app WITH LOGIN NOBYPASSRLS;
                END IF;
                EXECUTE format('GRANT CONNECT ON DATABASE %I TO shopcraft_app', current_database());
                EXECUTE format('GRANT shopcraft_app TO %I', current_user);
            END
            $$;
            GRANT USAGE ON SCHEMA public TO shopcraft_app;
            GRANT ALL ON ALL TABLES IN SCHEMA public TO shopcraft_app;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO shopcraft_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO shopcraft_app;
            ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO shopcraft_app;
        """)

        for tbl in TENANT_TABLES:
            cursor.execute(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY;")
            cursor.execute(f"ALTER TABLE {tbl} FORCE ROW LEVEL SECURITY;")
            cursor.execute(f"DROP POLICY IF EXISTS tenant_isolation_policy ON {tbl};")
            cursor.execute(f"""
                CREATE POLICY tenant_isolation_policy ON {tbl}
                AS PERMISSIVE
                FOR ALL
                TO PUBLIC
                USING (
                    current_setting('app.bypass_rls', true) = 'on'
                    OR
                    store_id = NULLIF(current_setting('app.current_store_id', true), '')::bigint
                )
                WITH CHECK (
                    current_setting('app.bypass_rls', true) = 'on'
                    OR
                    store_id = NULLIF(current_setting('app.current_store_id', true), '')::bigint
                );
            """)
            applied_tables.append(tbl)

    logger.info(f"Applied PostgreSQL RLS to {len(applied_tables)} tables: {applied_tables}")
    return {"status": "applied", "tables": applied_tables}
