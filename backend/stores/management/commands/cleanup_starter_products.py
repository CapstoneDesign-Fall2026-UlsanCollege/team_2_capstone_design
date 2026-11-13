from django.core.management.base import BaseCommand, CommandError

from catalog.models import Product
from core.tenant_context import TenantDatabaseContext
from orders.models import OrderItem
from stores.models import Store


class Command(BaseCommand):
    help = (
        "Deletes untouched starter default products (is_starter_default=True) per store "
        "within tenant RLS boundaries. Products referenced by any order item are skipped "
        "from deletion and unlisted (is_active=False) instead."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Report starter products that would be deleted or archived without modifying the database.",
        )
        parser.add_argument(
            "--store",
            type=str,
            default="",
            help="Optional store slug to scope cleanup to a single store.",
        )

    def handle(self, *args, **options):
        dry_run = bool(options["dry_run"])
        store_slug = (options.get("store") or "").strip()

        stores_qs = Store.objects.all().order_by("id")
        if store_slug:
            stores_qs = stores_qs.filter(slug=store_slug)
            if not stores_qs.exists():
                raise CommandError(f"Store with slug '{store_slug}' not found.")

        stores = list(stores_qs)
        total_deleted = 0
        total_archived = 0
        total_already_inactive = 0

        for store in stores:
            with TenantDatabaseContext(store.id):
                starters = list(
                    Product.objects.for_store(store)
                    .filter(is_starter_default=True)
                    .order_by("id")
                )
                for product in starters:
                    referenced_by_order = OrderItem.objects.for_store(store).filter(
                        variant__product_id=product.id
                    ).exists()

                    if referenced_by_order:
                        if product.is_active:
                            total_archived += 1
                            action_label = "WOULD ARCHIVE" if dry_run else "ARCHIVED"
                            if not dry_run:
                                product.is_active = False
                                product.save(update_fields=["is_active"])
                        else:
                            total_already_inactive += 1
                            action_label = "SKIPPED (already archived)"

                        self.stdout.write(
                            f"{action_label} [store={store.slug}] "
                            f"id={product.id} slug={product.slug} name={product.name!r} "
                            "(referenced by order items)"
                        )
                    else:
                        total_deleted += 1
                        action_label = "WOULD DELETE" if dry_run else "DELETED"
                        self.stdout.write(
                            f"{action_label} [store={store.slug}] "
                            f"id={product.id} slug={product.slug} name={product.name!r}"
                        )
                        if not dry_run:
                            product.delete()

        mode = "DRY RUN" if dry_run else "APPLIED"
        self.stdout.write(
            self.style.SUCCESS(
                f"[{mode}] Scanned {len(stores)} store(s): "
                f"deleted={total_deleted}, archived={total_archived}, "
                f"already_archived={total_already_inactive}."
            )
        )
