from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("stores", "0006_store_cod_enabled_store_custom_domain"),
    ]

    operations = [
        migrations.AddField(
            model_name="store",
            name="support_email",
            field=models.EmailField(blank=True, default="", max_length=254),
        ),
    ]
