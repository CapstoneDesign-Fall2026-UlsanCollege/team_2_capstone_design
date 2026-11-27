"""
Adds PostgreSQL trigram (pg_trgm) GIN indexes that serve the merchant dashboard and
storefront case-insensitive substring search (`icontains`).

Django renders `icontains` on PostgreSQL as `UPPER(col::text) LIKE UPPER('%term%')`, so the
indexes are built on exactly that expression; a plain index on the column would not be used.
No-op on SQLite (dev/tests), where the extension and index method do not exist.
"""
from django.db import migrations

TRIGRAM_INDEXES = [
    ("cust_name_trgm_idx", "stores_customer", "full_name"),
    ("cust_email_trgm_idx", "stores_customer", "email"),
    ("cust_phone_trgm_idx", "stores_customer", "phone"),
    ("ord_number_trgm_idx", "orders_order", "order_number"),
    ("prod_name_trgm_idx", "catalog_product", "name"),
    ("var_sku_trgm_idx", "catalog_variant", "sku"),
]


def create_trigram_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        for name, table, column in TRIGRAM_INDEXES:
            cursor.execute(
                f"CREATE INDEX IF NOT EXISTS {name} ON {table} "
                f"USING gin (UPPER({column}::text) gin_trgm_ops);"
            )


def drop_trigram_indexes(apps, schema_editor):
    if schema_editor.connection.vendor != "postgresql":
        return
    with schema_editor.connection.cursor() as cursor:
        for name, _table, _column in TRIGRAM_INDEXES:
            cursor.execute(f"DROP INDEX IF EXISTS {name};")


class Migration(migrations.Migration):

    dependencies = [
        ("stores", "0013_drop_legacy_rls_policies"),
        ("orders", "0008_order_inventory_deducted"),
        ("catalog", "0006_variant_low_stock_threshold_variant_stock_quantity_and_more"),
    ]

    operations = [
        migrations.RunPython(create_trigram_indexes, drop_trigram_indexes),
    ]
