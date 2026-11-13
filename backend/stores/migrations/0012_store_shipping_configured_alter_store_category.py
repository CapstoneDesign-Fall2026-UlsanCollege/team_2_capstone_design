from django.db import migrations, models


def backfill_shipping_configured(apps, schema_editor):
    from core.tenant_context import TenantDatabaseContext

    Store = apps.get_model("stores", "Store")
    Order = apps.get_model("orders", "Order")

    to_enable = []
    for store in Store.objects.all().only(
        "id",
        "inside_valley_shipping_minor",
        "outside_valley_shipping_minor",
    ):
        custom_rates = (
            store.inside_valley_shipping_minor != 10000
            or store.outside_valley_shipping_minor != 20000
        )
        if custom_rates:
            to_enable.append(store.id)
            continue

        with TenantDatabaseContext(store.id):
            if Order.objects.filter(store_id=store.id).exists():
                to_enable.append(store.id)

    if to_enable:
        Store.objects.filter(id__in=to_enable).update(shipping_configured=True)


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('stores', '0011_remove_bypass_rls_and_add_user_membership_policy'),
        ('orders', '0006_order_ord_store_created_idx_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='store',
            name='shipping_configured',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='store',
            name='category',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
        migrations.RunPython(backfill_shipping_configured, backwards_noop),
    ]
