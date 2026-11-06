from django.apps import AppConfig
from django.db.models.signals import post_migrate


class StoresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'stores'

    def ready(self):
        def _apply_rls_on_migrate(sender, **kwargs):
            from core.tenant_context import apply_postgres_rls_policies
            apply_postgres_rls_policies()

        post_migrate.connect(_apply_rls_on_migrate, sender=self)
