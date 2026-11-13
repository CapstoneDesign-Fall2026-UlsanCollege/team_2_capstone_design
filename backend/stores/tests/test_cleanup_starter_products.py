from io import StringIO
from unittest.mock import patch

from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import TestCase

from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order, OrderItem
from stores.models import Customer, Store


class CleanupStarterProductsCommandTests(TestCase):
    def setUp(self):
        self.store_a = Store.objects.create(name="Store A", slug="cleanup-store-a", is_active=True)
        self.store_b = Store.objects.create(name="Store B", slug="cleanup-store-b", is_active=True)

        with TenantDatabaseContext(self.store_a.id):
            self.a_starter_unlinked = Product.objects.create(
                store=self.store_a,
                slug="starter-offering",
                name="Store A Signature Offering",
                image_url="/images/products/placeholder.svg",
                is_active=True,
                is_starter_default=True,
            )
            Variant.objects.create(
                store=self.store_a,
                product=self.a_starter_unlinked,
                sku="A-ST-1",
                label="Standard",
                price_minor=125000,
            )

            self.a_starter_ordered = Product.objects.create(
                store=self.store_a,
                slug="cleanup-store-a-artisanal-reserve",
                name="Store A Artisanal Reserve",
                image_url="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
                is_active=True,
                is_starter_default=True,
            )
            v_ordered = Variant.objects.create(
                store=self.store_a,
                product=self.a_starter_ordered,
                sku="A-ORD-1",
                label="Standard",
                price_minor=85000,
            )
            cust = Customer.objects.create(
                store=self.store_a,
                email="buyer@example.com",
                full_name="Buyer",
            )
            order = Order.objects.create(
                store=self.store_a,
                customer=cust,
                order_number="ORD-CLEAN-1",
                subtotal_minor=85000,
                total_minor=95000,
            )
            OrderItem.objects.create(
                store=self.store_a,
                order=order,
                variant=v_ordered,
                product_name_snapshot=self.a_starter_ordered.name,
                variant_label_snapshot="Standard",
                unit_price_minor=85000,
                quantity=1,
                line_total_minor=85000,
            )

            self.a_real = Product.objects.create(
                store=self.store_a,
                slug="hand-painted-mug",
                name="Hand Painted Mug",
                image_url="https://res.cloudinary.com/demo/image/upload/mug.jpg",
                is_active=True,
                is_starter_default=False,
            )

        with TenantDatabaseContext(self.store_b.id):
            self.b_starter = Product.objects.create(
                store=self.store_b,
                slug="starter-offering",
                name="Store B Signature Offering",
                image_url="/images/products/placeholder.svg",
                is_active=True,
                is_starter_default=True,
            )
            Variant.objects.create(
                store=self.store_b,
                product=self.b_starter,
                sku="B-ST-1",
                label="Standard",
                price_minor=125000,
            )

    def test_dry_run_reports_deletes_and_ordered_archives_without_mutating(self):
        out = StringIO()
        call_command("cleanup_starter_products", dry_run=True, stdout=out)
        output = out.getvalue()

        self.assertIn("DRY RUN", output)
        self.assertIn(f"WOULD DELETE [store=cleanup-store-a] id={self.a_starter_unlinked.id}", output)
        self.assertIn(f"WOULD ARCHIVE [store=cleanup-store-a] id={self.a_starter_ordered.id}", output)
        self.assertIn(f"WOULD DELETE [store=cleanup-store-b] id={self.b_starter.id}", output)
        self.assertNotIn("hand-painted-mug", output)

        with TenantDatabaseContext(self.store_a.id):
            self.assertTrue(Product.objects.filter(id=self.a_starter_unlinked.id).exists())
            self.a_starter_ordered.refresh_from_db()
            self.assertTrue(self.a_starter_ordered.is_active)
            self.assertTrue(Product.objects.filter(id=self.a_real.id).exists())

        with TenantDatabaseContext(self.store_b.id):
            self.assertTrue(Product.objects.filter(id=self.b_starter.id).exists())

    def test_store_scoped_cleanup_respects_rls_and_leaves_other_store_intact(self):
        out = StringIO()
        with patch(
            "stores.management.commands.cleanup_starter_products.TenantDatabaseContext",
            wraps=TenantDatabaseContext,
        ) as mock_ctx:
            call_command("cleanup_starter_products", store="cleanup-store-a", stdout=out)
            mock_ctx.assert_called_once_with(self.store_a.id)

        output = out.getvalue()
        self.assertIn("[APPLIED] Scanned 1 store(s): deleted=1, archived=1, already_archived=0.", output)

        with TenantDatabaseContext(self.store_a.id):
            self.assertFalse(Product.objects.filter(id=self.a_starter_unlinked.id).exists())
            self.a_starter_ordered.refresh_from_db()
            self.assertFalse(self.a_starter_ordered.is_active)
            self.assertTrue(Product.objects.filter(id=self.a_real.id).exists())

        # Store B untouched when scoped to store A
        with TenantDatabaseContext(self.store_b.id):
            self.assertTrue(Product.objects.filter(id=self.b_starter.id).exists())

    def test_unknown_store_slug_raises_command_error(self):
        with self.assertRaises(CommandError):
            call_command("cleanup_starter_products", store="no-such-store")
