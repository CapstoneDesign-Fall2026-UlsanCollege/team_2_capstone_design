import logging
import threading
from django.core.signals import request_finished
from django.db import connection, transaction
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


def set_current_tenant_id(store_id: int | str, is_local: bool = True):
    """
    Enforces PostgreSQL Row-Level Security for the current transaction/request.
    Switches to the restricted non-bypass role 'shopcraft_app' and sets
    app.current_store_id to the active store ID in a single round-trip command.

    When is_local=True (default), settings are transaction-local (SET LOCAL / set_config(..., true)),
    guaranteeing they automatically revert on COMMIT or ROLLBACK.
    """
    _thread_locals.store_id = store_id
    _thread_locals.is_local = is_local
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            if is_local:
                role_clause = "SET LOCAL ROLE shopcraft_app; " if _check_shopcraft_role(cursor) else ""
                cursor.execute(
                    f"{role_clause}SET LOCAL app.bypass_rls = 'off'; SELECT set_config('app.current_store_id', %s, true);",
                    [str(store_id)],
                )
            else:
                role_clause = "SET ROLE shopcraft_app; " if _check_shopcraft_role(cursor) else ""
                cursor.execute(
                    f"{role_clause}SET app.bypass_rls = 'off'; SELECT set_config('app.current_store_id', %s, false);",
                    [str(store_id)],
                )


def reset_current_tenant_id(database_cleanup: bool = True):
    """
    Resets the tenant context back to None on thread locals and optionally clears
    PostgreSQL session/local settings in a single transaction-local round trip.
    Only fires database cleanup if a tenant context was active and database_cleanup is True.
    """
    had_store = getattr(_thread_locals, "store_id", None) is not None
    _thread_locals.store_id = None
    _thread_locals.is_local = True

    if database_cleanup and had_store and connection.vendor == "postgresql":
        try:
            if connection.connection is not None and not getattr(connection, "needs_rollback", False):
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SET LOCAL ROLE NONE; SET LOCAL app.bypass_rls = 'off'; "
                        "SELECT set_config('app.current_store_id', '', true);"
                    )
        except Exception as conn_err:
            logger.debug(f"Connection cleanup in reset_current_tenant_id: {conn_err}")


@receiver(request_finished)
def on_request_finished_cleanup(sender, **kwargs):
    """Guarantees tenant session role and parameters are reset after every HTTP request."""
    reset_current_tenant_id()


class TenantDatabaseContext:
    """
    Context manager to scope a block of code to a specific tenant in PostgreSQL
    inside an isolated transaction.atomic() block with transaction-local RLS.
    """
    def __init__(self, store_id: int | str):
        self.store_id = store_id
        self._atomic = None

    def __enter__(self):
        _thread_locals.store_id = self.store_id
        self._atomic = transaction.atomic()
        self._atomic.__enter__()
        set_current_tenant_id(self.store_id, is_local=True)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            reset_current_tenant_id(database_cleanup=True)
            return self._atomic.__exit__(exc_type, exc_val, exc_tb)
        finally:
            self._atomic = None


class BypassRLSContext:
    """
    Context manager for system/admin operations that require bypassing RLS.
    Guarantees transaction-local settings (SET LOCAL ROLE NONE and SET LOCAL app.bypass_rls = 'on')
    inside transaction.atomic(), preventing any session-level SET/RESET ROLE leaks.
    """
    def __init__(self):
        self._atomic = None
        self._prev = None

    def __enter__(self):
        self._prev = getattr(_thread_locals, "store_id", None)
        _thread_locals.store_id = "ALL"
        self._atomic = transaction.atomic()
        self._atomic.__enter__()
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("SET LOCAL ROLE NONE; SET LOCAL app.bypass_rls = 'on';")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        _thread_locals.store_id = self._prev
        try:
            return self._atomic.__exit__(exc_type, exc_val, exc_tb)
        finally:
            self._atomic = None


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
