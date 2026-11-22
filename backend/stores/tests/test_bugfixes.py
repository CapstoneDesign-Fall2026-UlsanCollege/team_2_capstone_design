from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order
from stores.models import MerchantAuditLog, Store, StoreMembership

User = get_user_model()


class CheckoutAvailabilityBug60Tests(TestCase):
    """Regression tests for Issue #60: reject out-of-stock variants and archived products at checkout."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="owner.bug60@example.com",
            full_name="Bug60 Owner",
        )
        self.store = Store.objects.create(
            name="Bug60 Roastery",
            slug="bug60-roastery",
            is_active=True,
            cod_enabled=True,
            khalti_mode="TEST",
        )
        self.store.set_khalti_secret_key("test_secret_key_bug60_123456")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])

        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(
                store=self.store,
                user=self.owner,
                role="OWNER",
            )
            self.active_product = Product.objects.create(
                store=self.store,
                name="Himalayan Arabica",
                slug="himalayan-arabica",
                is_active=True,
            )
            self.in_stock_variant = Variant.objects.create(
                store=self.store,
                product=self.active_product,
                sku="B60-IN-STOCK",
                label="250g",
                price_minor=75000,
                in_stock=True,
                is_active=True,
            )
            self.out_of_stock_variant = Variant.objects.create(
                store=self.store,
                product=self.active_product,
                sku="B60-OOS",
                label="500g",
                price_minor=140000,
                in_stock=False,
                is_active=True,
            )
            self.to_archive_product = Product.objects.create(
                store=self.store,
                name="Seasonal Ilam Tea",
                slug="seasonal-ilam-tea",
                is_active=True,
            )
            self.archived_product_variant = Variant.objects.create(
                store=self.store,
                product=self.to_archive_product,
                sku="B60-ARCH",
                label="100g",
                price_minor=55000,
                in_stock=True,
                is_active=True,
            )

    def _shipping_payload(self):
        return {
            "recipient_name": "Sita Rai",
            "phone": "9801234567",
            "province": "Bagmati",
            "district": "Kathmandu",
            "municipality": "Kathmandu Metro",
            "ward": "3",
            "street_landmark": "Thamel",
        }

    def test_quote_rejects_out_of_stock_variant(self):
        res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/quote/",
            {
                "items": [{"variant_id": self.out_of_stock_variant.id, "quantity": 1}],
                "district": "Kathmandu",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("out of stock", res.json()["error"].lower())

    def test_place_rejects_out_of_stock_variant_for_cod_and_khalti(self):
        for method in ("COD", "KHALTI"):
            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/place/",
                {
                    "customer_email": "buyer@example.com",
                    "payment_method": method,
                    "items": [{"variant_id": self.out_of_stock_variant.id, "quantity": 1}],
                    "shipping_address": self._shipping_payload(),
                },
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("out of stock", res.json()["error"].lower())

        with TenantDatabaseContext(self.store.id):
            self.assertEqual(Order.objects.for_store(self.store).count(), 0)

    def test_quote_and_place_reject_archived_product_with_active_variant(self):
        self.client.force_authenticate(user=self.owner)
        del_res = self.client.delete(
            f"/api/merchant/stores/{self.store.slug}/products/{self.to_archive_product.id}/"
        )
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        with TenantDatabaseContext(self.store.id):
            self.to_archive_product.refresh_from_db()
            self.archived_product_variant.refresh_from_db()
            self.assertFalse(self.to_archive_product.is_active)
            self.assertTrue(self.archived_product_variant.is_active)

        quote_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/quote/",
            {
                "items": [{"variant_id": self.archived_product_variant.id, "quantity": 1}],
                "district": "Kathmandu",
            },
            format="json",
        )
        self.assertEqual(quote_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no longer available", quote_res.json()["error"].lower())

        place_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            {
                "customer_email": "buyer@example.com",
                "payment_method": "COD",
                "items": [{"variant_id": self.archived_product_variant.id, "quantity": 1}],
                "shipping_address": self._shipping_payload(),
            },
            format="json",
        )
        self.assertEqual(place_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("no longer available", place_res.json()["error"].lower())

        with TenantDatabaseContext(self.store.id):
            self.assertEqual(Order.objects.for_store(self.store).count(), 0)

    def test_quote_and_place_succeed_for_in_stock_active_variant(self):
        quote_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/quote/",
            {
                "items": [{"variant_id": self.in_stock_variant.id, "quantity": 2}],
                "district": "Kathmandu",
            },
            format="json",
        )
        self.assertEqual(quote_res.status_code, status.HTTP_200_OK)
        self.assertEqual(quote_res.json()["subtotal_minor"], 150000)

        place_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            {
                "customer_email": "buyer@example.com",
                "payment_method": "COD",
                "items": [{"variant_id": self.in_stock_variant.id, "quantity": 2}],
                "shipping_address": self._shipping_payload(),
            },
            format="json",
        )
        self.assertEqual(place_res.status_code, status.HTTP_201_CREATED)
        with TenantDatabaseContext(self.store.id):
            self.assertEqual(Order.objects.for_store(self.store).count(), 1)


class ProductCreateAuditLogBug63Tests(TestCase):
    """Regression tests for Issue #63: log PRODUCT_CREATE unconditionally on product creation."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="owner.bug63@example.com",
            full_name="Bug63 Owner",
        )
        self.store = Store.objects.create(
            name="Bug63 Shop",
            slug="bug63-shop",
            is_active=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(
                store=self.store,
                user=self.owner,
                role="OWNER",
            )
        self.client.force_authenticate(user=self.owner)

    def test_audit_log_created_with_valid_initial_price_minor(self):
        res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {"name": "Single Origin Roast", "initial_price_minor": 120000},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        product_id = res.json()["id"]

        with TenantDatabaseContext(self.store.id):
            logs = list(
                MerchantAuditLog.objects.for_store(self.store).filter(
                    action="PRODUCT_CREATE",
                    entity_id=str(product_id),
                )
            )
            self.assertEqual(len(logs), 1)
            self.assertEqual(logs[0].entity_type, "Product")
            self.assertEqual(logs[0].actor_id, self.owner.id)

    def test_audit_log_created_without_initial_price_minor(self):
        res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {"name": "No Price Roast"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        product_id = res.json()["id"]

        with TenantDatabaseContext(self.store.id):
            logs = list(
                MerchantAuditLog.objects.for_store(self.store).filter(
                    action="PRODUCT_CREATE",
                    entity_id=str(product_id),
                )
            )
            self.assertEqual(len(logs), 1)

    def test_audit_log_created_when_initial_price_minor_invalid(self):
        res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {"name": "Invalid Price Roast", "initial_price_minor": "not-a-number"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        product_id = res.json()["id"]

        with TenantDatabaseContext(self.store.id):
            logs = list(
                MerchantAuditLog.objects.for_store(self.store).filter(
                    action="PRODUCT_CREATE",
                    entity_id=str(product_id),
                )
            )
            self.assertEqual(len(logs), 1)
