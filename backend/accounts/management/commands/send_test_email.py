from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.core.validators import validate_email

from core.email_transport import send_transactional_email


class Command(BaseCommand):
    help = "Sends a synchronous verification test email through the configured real transport."

    def add_arguments(self, parser):
        parser.add_argument("address", type=str, help="Recipient email address")

    def handle(self, *args, **options):
        address = (options.get("address") or "").strip().lower()
        try:
            validate_email(address)
        except ValidationError as exc:
            raise CommandError("Invalid recipient email address.") from exc

        subject = "ShopCraft transport verification"
        text_body = (
            "This is a synchronous transport verification email.\n\n"
            "If you received this message, your configured EMAIL_TRANSPORT is working.\n"
        )
        html_body = (
            "<!DOCTYPE html><html lang=\"en\"><body style=\"font-family:sans-serif;color:#111318;\">"
            "<p>This is a synchronous transport verification email.</p>"
            "<p>If you received this message, your configured <code>EMAIL_TRANSPORT</code> is working.</p>"
            "</body></html>"
        )

        try:
            send_transactional_email(
                to_email=address,
                subject=subject,
                text_body=text_body,
                html_body=html_body,
                sender_name="ShopCraft",
                force_real_smtp=True,
            )
        except Exception as exc:
            self.stderr.write(f"FAILURE ({exc.__class__.__name__})")
            raise CommandError("Test email delivery failed.") from exc

        self.stdout.write(self.style.SUCCESS("SUCCESS"))
