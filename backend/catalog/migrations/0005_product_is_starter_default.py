from django.db import migrations, models


def backfill_starter_default_products(apps, schema_editor):
    from catalog.starter_patterns import is_untouched_starter_product
    from core.tenant_context import TenantDatabaseContext

    Store = apps.get_model("stores", "Store")
    Product = apps.get_model("catalog", "Product")

    for store in Store.objects.all().only("id", "slug", "name"):
        with TenantDatabaseContext(store.id):
            matched_ids = [
                p.id
                for p in Product.objects.filter(store_id=store.id).only("id", "slug", "name", "image_url")
                if is_untouched_starter_product(
                    store_slug=store.slug,
                    store_name=store.name,
                    product_slug=p.slug,
                    product_name=p.name,
                    image_url=p.image_url,
                )
            ]
            if matched_ids:
                Product.objects.filter(store_id=store.id, id__in=matched_ids).update(is_starter_default=True)


def backwards_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0004_discount_disc_store_act_created_idx_and_more'),
        ('stores', '0011_remove_bypass_rls_and_add_user_membership_policy'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='is_starter_default',
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(backfill_starter_default_products, backwards_noop),
    ]
