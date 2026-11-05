import django.db.models.deletion
from django.db import migrations, models


def clean_subscription_orders(apps, schema_editor):
    Order = apps.get_model("orders", "Order")
    Order.objects.filter(order_type="SUBSCRIPTION_CYCLE").update(order_type="ONE_TIME")
    Order.objects.filter(subscription__isnull=False).update(subscription=None)


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    atomic = False

    dependencies = [
        ("orders", "0004_order_subscription"),
    ]

    operations = [
        migrations.RunPython(clean_subscription_orders, noop_reverse),
        migrations.RemoveField(
            model_name="order",
            name="subscription",
        ),
        migrations.AlterField(
            model_name="order",
            name="order_type",
            field=models.CharField(
                choices=[("ONE_TIME", "One-time")],
                default="ONE_TIME",
                max_length=24,
            ),
        ),
    ]
