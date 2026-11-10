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

    Strictly requires is_local=True and an active transaction.atomic() block on PostgreSQL
    because SET LOCAL is a no-op outside a transaction block and session-level SET leaks
    across Neon's pooled connections.
    """
    if not is_local:
        raise RuntimeError(
            "Session-level tenant context (is_local=False) is forbidden on pooled connections; "
            "use is_local=True inside transaction.atomic()."
        )

    if connection.vendor == "postgresql" and not connection.in_atomic_block:
        raise RuntimeError(
            "set_current_tenant_id(is_local=True) requires an active transaction.atomic() block; "
            "SET LOCAL is a no-op outside a transaction."
        )

    _thread_locals.store_id = store_id
    _thread_locals.is_local = True
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            role_clause = "SET LOCAL ROLE shopcraft_app; " if _check_shopcraft_role(cursor) else ""
            cursor.execute(
                f"{role_clause}SELECT set_config('app.current_store_id', %s, true);",
                [str(store_id)],
            )


def reset_current_tenant_id(database_cleanup: bool = True):
    """
    Resets the tenant context back to None on thread locals and clears
    PostgreSQL transaction-local settings when still inside an active atomic block
    (e.g., savepoints or nested contexts). Post-commit connections automatically
    clear SET LOCAL settings at COMMIT/ROLLBACK.
    """
    had_store = getattr(_thread_locals, "store_id", None) is not None
    _thread_locals.store_id = None
    _thread_locals.is_local = True

    if database_cleanup and had_store and connection.vendor == "postgresql":
        try:
            if (
                connection.connection is not None
                and connection.in_atomic_block
                and not getattr(connection, "needs_rollback", False)
            ):
                with connection.cursor() as cursor:
                    cursor.execute(
                        "SET LOCAL ROLE NONE; "
                        "SELECT set_config('app.current_store_id', '', true); "
                        "SELECT set_config('app.current_user_id', '', true);"
                    )
        except Exception as conn_err:
            logger.debug("Connection cleanup in reset_current_tenant_id: %s", type(conn_err).__name__)


@receiver(request_finished)
def on_request_finished_cleanup(sender, **kwargs):
    """Guarantees thread-local tenant state is reset after every HTTP request."""
    reset_current_tenant_id()


class TenantDatabaseContext:
    """
    Context manager to scope a block of code to a specific tenant in PostgreSQL
    inside an isolated transaction.atomic() block with transaction-local RLS.
    """
    def __init__(self, store_id: int | str):
        self.store_id = store_id
        self._atomic = None
        self._prev = None

    def __enter__(self):
        self._prev = getattr(_thread_locals, "store_id", None)
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
            if self._prev not in (None, "ALL"):
                if (
                    connection.vendor != "postgresql"
                    or (connection.in_atomic_block and not getattr(connection, "needs_rollback", False))
                ):
                    set_current_tenant_id(self._prev, is_local=True)
            elif self._prev == "ALL":
                _thread_locals.store_id = "ALL"
                if (
                    connection.vendor == "postgresql"
                    and connection.in_atomic_block
                    and not getattr(connection, "needs_rollback", False)
                ):
                    with connection.cursor() as cursor:
                        cursor.execute("SET LOCAL ROLE NONE; SET LOCAL app.bypass_rls = 'on';")


class UserMembershipContext:
    """
    Context manager for user-scoped membership operations (e.g. store listing and ownership counting).
    Guarantees transaction-local setting (SET LOCAL app.current_user_id = '<user_id>')
    inside transaction.atomic(). Enforces that current_user_id comes only from a valid positive integer user ID.
    On exit or rollback, clears app.current_user_id.
    """
    def __init__(self, user_id: int):
        if not isinstance(user_id, int) or user_id <= 0:
            raise ValueError(f"UserMembershipContext requires a valid positive integer user_id, got: {user_id!r}")
        self.user_id = user_id
        self._atomic = None

    def __enter__(self):
        self._atomic = transaction.atomic()
        self._atomic.__enter__()
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                role_clause = "SET LOCAL ROLE shopcraft_app; " if _check_shopcraft_role(cursor) else ""
                cursor.execute(
                    f"{role_clause}SELECT set_config('app.current_user_id', %s, true);",
                    [str(self.user_id)],
                )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            return self._atomic.__exit__(exc_type, exc_val, exc_tb)
        finally:
            self._atomic = None
            if (
                connection.vendor == "postgresql"
                and connection.in_atomic_block
                and not getattr(connection, "needs_rollback", False)
            ):
                with connection.cursor() as cursor:
                    cursor.execute("SELECT set_config('app.current_user_id', '', true);")


def apply_postgres_rls_policies(schema_editor=None):
    """
    Applies PostgreSQL Row-Level Security (RLS), FORCE ROW LEVEL SECURITY,
    and tenant isolation policies to all tenant-owned tables in PostgreSQL.
    """
    db_conn = schema_editor.connection if schema_editor is not None else connection
    if db_conn.vendor != "postgresql":
        logger.info("Database is not PostgreSQL; skipping Postgres RLS application.")
        return {"status": "skipped", "reason": "non-postgres"}

    applied_tables = []
    with db_conn.cursor() as cursor:
        cursor.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'shopcraft_app') THEN
                    CREATE ROLE shopcraft_app WITH LOGIN NOBYPASSRLS;
                END IF;
                EXECUTE format('GRANT CONNECT ON DATABASE %I TO shopcraft_app', current_database());
                IF NOT pg_has_role(current_user, 'shopcraft_app', 'MEMBER') THEN
                    EXECUTE format('GRANT shopcraft_app TO %I', current_user);
                END IF;
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
            if tbl == "stores_storemembership":
                cursor.execute(f"""
                    CREATE POLICY tenant_isolation_policy ON {tbl}
                    AS PERMISSIVE
                    FOR ALL
                    TO PUBLIC
                    USING (
                        store_id = NULLIF(current_setting('app.current_store_id', true), '')::bigint
                        OR
                        user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint
                    )
                    WITH CHECK (
                        store_id = NULLIF(current_setting('app.current_store_id', true), '')::bigint
                    );
                """)
            else:
                cursor.execute(f"""
                    CREATE POLICY tenant_isolation_policy ON {tbl}
                    AS PERMISSIVE
                    FOR ALL
                    TO PUBLIC
                    USING (
                        store_id = NULLIF(current_setting('app.current_store_id', true), '')::bigint
                    )
                    WITH CHECK (
                        store_id = NULLIF(current_setting('app.current_store_id', true), '')::bigint
                    );
                """)
            applied_tables.append(tbl)

    global _shopcraft_role_exists
    _shopcraft_role_exists = True
    logger.info("Applied PostgreSQL FORCE RLS to %d tables.", len(applied_tables))
    return {"status": "applied", "tables": applied_tables}
