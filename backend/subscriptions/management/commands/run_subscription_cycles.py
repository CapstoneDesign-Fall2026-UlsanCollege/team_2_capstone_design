from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from stores.models import Store
from subscriptions.services import execute_due_subscription_cycles


class Command(BaseCommand):
    help = "Idempotently processes due recurring subscription cycles and generates fulfillment orders."

    def add_arguments(self, parser):
        parser.add_argument(
            "--store",
            type=str,
            default=None,
            help="Filter execution to a specific store slug.",
        )
        parser.add_argument(
            "--date",
            type=str,
            default=None,
            help="Target execution date (YYYY-MM-DD). Defaults to today.",
        )

    def handle(self, *args, **options):
        store_slug = options.get("store")
        date_str = options.get("date")

        store = None
        if store_slug:
            try:
                store = Store.objects.get(slug=store_slug)
            except Store.DoesNotExist:
                raise CommandError(f"Store with slug '{store_slug}' does not exist.")

        target_date = timezone.now().date()
        if date_str:
            try:
                target_date = datetime.strptime(date_str.strip(), "%Y-%m-%d").date()
            except ValueError:
                raise CommandError("Invalid date format. Please use YYYY-MM-DD.")

        self.stdout.write(
            f"Running subscription cycles for target date {target_date.isoformat()} "
            f"(Store: {store.name if store else 'ALL STORES'})..."
        )

        result = execute_due_subscription_cycles(store=store, target_date=target_date)

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully generated {result['orders_generated']} recurring cycle orders. "
                f"({result['completed_subscriptions']} subscriptions completed their commitment)."
            )
        )
