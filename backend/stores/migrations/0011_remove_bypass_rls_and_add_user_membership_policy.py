from django.db import migrations


def forwards_update_rls_policies(apps, schema_editor):
    """
    Rewrites PostgreSQL Row-Level Security policies on all tenant tables:
    - Removes `app.bypass_rls = 'on'` completely from all tenant tables.
    - Installs user-scoped membership access on `stores_storemembership`
      permitting `user_id = NULLIF(current_setting('app.current_user_id', true), '')::bigint`.
    """
    from core.tenant_context import apply_postgres_rls_policies

    apply_postgres_rls_policies(schema_editor=schema_editor)


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("stores", "0010_actionratelimit"),
    ]

    operations = [
        migrations.RunPython(forwards_update_rls_policies, backwards_noop),
    ]
