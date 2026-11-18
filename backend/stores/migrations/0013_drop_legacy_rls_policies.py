from django.db import migrations


def forwards_drop_legacy_rls_policies(apps, schema_editor):
    """
    Drops every legacy/leftover RLS policy on tenant tables except `tenant_isolation_policy`,
    and drops any policy in `public` whose `qual` or `with_check` references `app.bypass_rls`.
    Re-applies canonical tenant policies and verifies exactly one policy remains per tenant table.
    """
    from core.tenant_context import TENANT_TABLES, apply_postgres_rls_policies

    db_conn = schema_editor.connection
    if db_conn.vendor != "postgresql":
        return

    with db_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT tablename, policyname, COALESCE(qual, ''), COALESCE(with_check, '')
            FROM pg_policies
            WHERE schemaname = 'public'
            ORDER BY tablename, policyname;
            """
        )
        rows = cursor.fetchall()

        tenant_set = set(TENANT_TABLES)
        for tablename, policyname, qual, with_check in rows:
            references_bypass = (
                "app.bypass_rls" in qual.lower() or "app.bypass_rls" in with_check.lower()
            )
            is_non_canonical_on_tenant = (
                tablename in tenant_set and policyname != "tenant_isolation_policy"
            )
            if references_bypass or is_non_canonical_on_tenant:
                q_table = schema_editor.quote_name(tablename)
                q_policy = schema_editor.quote_name(policyname)
                cursor.execute(f"DROP POLICY IF EXISTS {q_policy} ON {q_table};")

    apply_postgres_rls_policies(schema_editor=schema_editor)

    with db_conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT tablename, policyname
            FROM pg_policies
            WHERE schemaname = 'public'
              AND (
                LOWER(COALESCE(qual, '')) LIKE '%app.bypass_rls%'
                OR LOWER(COALESCE(with_check, '')) LIKE '%app.bypass_rls%'
              );
            """
        )
        leftover_bypass = cursor.fetchall()
        if leftover_bypass:
            raise RuntimeError(
                f"Found leftover bypass_rls policies after cleanup: {leftover_bypass}"
            )

        cursor.execute(
            """
            SELECT tablename, array_agg(policyname ORDER BY policyname)
            FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = ANY(%s)
            GROUP BY tablename;
            """,
            [list(TENANT_TABLES)],
        )
        policies_by_table = {tbl: names for tbl, names in cursor.fetchall()}
        for tbl in TENANT_TABLES:
            names = policies_by_table.get(tbl, [])
            if names != ["tenant_isolation_policy"]:
                raise RuntimeError(
                    f"Expected exactly ['tenant_isolation_policy'] on {tbl}, found: {names}"
                )


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("stores", "0012_store_shipping_configured_alter_store_category"),
    ]

    operations = [
        migrations.RunPython(forwards_drop_legacy_rls_policies, backwards_noop),
    ]
