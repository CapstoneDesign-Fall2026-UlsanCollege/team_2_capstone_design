from django.core.management.base import BaseCommand
from core.tenant_context import apply_postgres_rls_policies, TENANT_TABLES
from django.db import connection


class Command(BaseCommand):
    help = "Enable PostgreSQL Row-Level Security (RLS) on all multi-tenant tables."

    def handle(self, *args, **options):
        self.stdout.write("Applying PostgreSQL Row-Level Security (RLS)...")
        result = apply_postgres_rls_policies()
        if result["status"] == "skipped":
            self.stdout.write(self.style.WARNING(f"Skipped: {result.get('reason')}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Successfully enabled RLS on {len(result['tables'])} tables:"))
        for tbl in result["tables"]:
            self.stdout.write(f"  ✓ {tbl}")

        # Verification check
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT tablename, rowsecurity
                FROM pg_tables
                WHERE schemaname = 'public' AND tablename = ANY(%s);
            """, [TENANT_TABLES])
            rows = cursor.fetchall()
            all_secured = all(r[1] for r in rows)
            if all_secured:
                self.stdout.write(self.style.SUCCESS(f"\nAll {len(TENANT_TABLES)} tenant tables verified with rowsecurity=True."))
            else:
                self.stdout.write(self.style.ERROR(f"\nWarning: Some tables not secured: {rows}"))
