from django.core.management.base import BaseCommand
from stores.models import ActionRateLimit


class Command(BaseCommand):
    help = "Cleans up expired ActionRateLimit tracking entries older than the specified hours (default 24h)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--hours",
            type=int,
            default=24,
            help="Purge records older than this many hours (default: 24).",
        )

    def handle(self, *args, **options):
        hours = options["hours"]
        deleted = ActionRateLimit.cleanup_expired(cutoff_hours=hours)
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully purged {deleted} ActionRateLimit row(s) older than {hours} hour(s)."
            )
        )
