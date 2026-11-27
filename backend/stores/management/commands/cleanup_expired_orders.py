from django.core.management.base import BaseCommand

from core.tenant_context import TenantDatabaseContext
from stores.api import _release_expired_pending_orders
from stores.models import Store


class Command(BaseCommand):
    help = "Expires abandoned PENDING_PAYMENT orders and releases their reserved stock and promo usage."

    def add_arguments(self, parser):
        parser.add_argument("--minutes", type=int, default=None, help="Override expiry age in minutes.")

    def handle(self, *args, **options):
        minutes = options.get("minutes")
        total_released = 0
        for store in Store.objects.filter(is_active=True).only("id", "slug"):
            with TenantDatabaseContext(store.id):
                total_released += _release_expired_pending_orders(store, expiry_minutes=minutes, limit=200)
        self.stdout.write(f"Released {total_released} expired pending order(s).")
