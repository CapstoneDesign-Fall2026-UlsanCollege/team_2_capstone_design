from django.db import migrations


def forwards_force_rls(apps, schema_editor):
    """
    Ensures all tenant-scoped tables explicitly enable and FORCE ROW LEVEL SECURITY
    with the tenant_isolation_policy during standard `manage.py migrate` runs.
    """
    from core.tenant_context import apply_postgres_rls_policies

    apply_postgres_rls_policies(schema_editor=schema_editor)


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("stores", "0007_store_support_email"),
        ("catalog", "0003_remove_product_allow_subscription_and_more"),
        ("orders", "0005_remove_subscription_fields"),
    ]

    operations = [
        migrations.RunPython(forwards_force_rls, backwards_noop),
    ]
