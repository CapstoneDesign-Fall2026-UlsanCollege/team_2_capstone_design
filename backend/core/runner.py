from django.test.runner import DiscoverRunner
from django.db import connection


class PostgresRLSDiscoverRunner(DiscoverRunner):
    """
    Custom test runner that guarantees PostgreSQL RLS policies, unprivileged roles ('shopcraft_app'),
    and table grants are applied to the test database after database setup.
    """
    def setup_databases(self, **kwargs):
        config = super().setup_databases(**kwargs)
        if connection.vendor == "postgresql":
            from core.tenant_context import apply_postgres_rls_policies
            apply_postgres_rls_policies()
        return config
