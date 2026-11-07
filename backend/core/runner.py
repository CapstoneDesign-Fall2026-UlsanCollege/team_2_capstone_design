from django.conf import settings
from django.db import connection
from django.test.runner import DiscoverRunner


class PostgresRLSDiscoverRunner(DiscoverRunner):
    """
    Custom test runner that guarantees PostgreSQL RLS policies, unprivileged roles ('shopcraft_app'),
    and table grants are applied to the test database after database setup.
    Defaults test email delivery to synchronous Django locmem-compatible SMTP transport unless
    explicitly overridden per test with @override_settings.
    """
    def setup_test_environment(self, **kwargs):
        super().setup_test_environment(**kwargs)
        settings.EMAIL_TRANSPORT = "smtp"
        settings.EMAIL_SEND_ASYNC = False

    def setup_databases(self, **kwargs):
        config = super().setup_databases(**kwargs)
        if connection.vendor == "postgresql":
            from core.tenant_context import apply_postgres_rls_policies
            apply_postgres_rls_policies()
        return config
