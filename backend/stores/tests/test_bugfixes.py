from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Discount, Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order
from stores.khalti import KHALTI_STATE_CANCELED, KhaltiVerifyResult
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


class PromoDiscountKhaltiReleaseBug64Tests(TestCase):
    """Regression tests for Issue #64: release promo used_count on Khalti failure/cancel and reclaim on retry."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="owner.bug64@example.com",
            full_name="Bug64 Owner",
        )
        self.store = Store.objects.create(
            name="Bug64 Shop",
            slug="bug64-shop",
            is_active=True,
            cod_enabled=True,
            khalti_mode="TEST",
            inside_valley_shipping_minor=0,
            outside_valley_shipping_minor=0,
        )
        self.store.set_khalti_secret_key("test_secret_key_bug64_123456")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])

        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(
                store=self.store,
                user=self.owner,
                role="OWNER",
            )
            product = Product.objects.create(
                store=self.store,
                name="Bug64 Coffee",
                slug="bug64-coffee",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=product,
                sku="B64-250",
                label="250g",
                price_minor=100000,
                in_stock=True,
                is_active=True,
            )
            self.discount = Discount.objects.create(
                store=self.store,
                code="ONEUSE",
                discount_type="PERCENTAGE",
                value=10,
                max_uses=1,
                is_active=True,
            )

    def _place_khalti_order_with_promo(self, email="buyer.bug64@example.com", pidx="pidx_bug64_1"):
        with patch(
            "stores.api.resolve_khalti_initiation_config",
            return_value=("Key test", "https://dev.khalti.com/api/v2/epayment/initiate/", None),
        ), patch(
            "stores.api.initiate_khalti_epayment",
            return_value=(pidx, "https://test-pay.khalti.com/?pidx=" + pidx, False, None),
        ):
            return self.client.post(
                f"/api/stores/{self.store.slug}/checkout/place/",
                {
                    "customer_email": email,
                    "payment_method": "KHALTI",
                    "discount_code": "ONEUSE",
                    "items": [{"variant_id": self.variant.id, "quantity": 1}],
                    "shipping_address": {
                        "recipient_name": "Sita Rai",
                        "phone": "9801234567",
                        "province": "Bagmati",
                        "district": "Kathmandu",
                        "municipality": "KMC",
                        "ward": "3",
                        "street_landmark": "Thamel",
                    },
                },
                format="json",
            )

    def test_khalti_cancel_releases_used_count_and_allows_reapply(self):
        place_res = self._place_khalti_order_with_promo(pidx="pidx_cancel_1")
        self.assertEqual(place_res.status_code, status.HTTP_201_CREATED)
        order_id = place_res.json()["order_id"]

        with TenantDatabaseContext(self.store.id):
            self.discount.refresh_from_db()
            self.assertEqual(self.discount.used_count, 1)

        with patch(
            "stores.api.verify_khalti_epayment",
            return_value=KhaltiVerifyResult(KHALTI_STATE_CANCELED, None, None, None),
        ):
            verify_res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": "pidx_cancel_1", "order_id": order_id},
                format="json",
            )
        self.assertEqual(verify_res.status_code, status.HTTP_400_BAD_REQUEST)

        with TenantDatabaseContext(self.store.id):
            self.discount.refresh_from_db()
            order = Order.objects.for_store(self.store).get(id=order_id)
            self.assertEqual(self.discount.used_count, 0)
            self.assertEqual(order.discount_id, self.discount.id)
            self.assertFalse(order.discount_redeemed)

        quote_again = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/quote/",
            {
                "items": [{"variant_id": self.variant.id, "quantity": 1}],
                "district": "Kathmandu",
                "discount_code": "ONEUSE",
            },
            format="json",
        )
        self.assertEqual(quote_again.status_code, status.HTTP_200_OK)
        self.assertEqual(quote_again.json()["discount_minor"], 10000)

    def test_retry_khalti_and_cod_fallback_reclaim_or_block_when_exhausted(self):
        place_res = self._place_khalti_order_with_promo(pidx="pidx_retry_1")
        order_id = place_res.json()["order_id"]
        token = place_res.json()["token"]

        with patch(
            "stores.api.verify_khalti_epayment",
            return_value=KhaltiVerifyResult(KHALTI_STATE_CANCELED, None, None, None),
        ):
            self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": "pidx_retry_1", "order_id": order_id},
                format="json",
            )

        # Retry via Khalti re-claims the promo slot
        with patch(
            "stores.api.resolve_khalti_initiation_config",
            return_value=("Key test", "https://dev.khalti.com/api/v2/epayment/initiate/", None),
        ), patch(
            "stores.api.initiate_khalti_epayment",
            return_value=("pidx_retry_2", "https://test-pay.khalti.com/?pidx=pidx_retry_2", False, None),
        ):
            retry_res = self.client.post(
                f"/api/stores/{self.store.slug}/public-orders/{order_id}/pay/",
                {"token": token, "payment_method": "KHALTI"},
                format="json",
            )
        self.assertEqual(retry_res.status_code, status.HTTP_200_OK)

        with TenantDatabaseContext(self.store.id):
            self.discount.refresh_from_db()
            order = Order.objects.for_store(self.store).get(id=order_id)
            self.assertEqual(self.discount.used_count, 1)
            self.assertTrue(order.discount_redeemed)

        # Fail the retry, then let another shopper claim the single slot
        with patch(
            "stores.api.verify_khalti_epayment",
            return_value=KhaltiVerifyResult(KHALTI_STATE_CANCELED, None, None, None),
        ):
            self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": "pidx_retry_2", "order_id": order_id},
                format="json",
            )

        other_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            {
                "customer_email": "other.buyer@example.com",
                "payment_method": "COD",
                "discount_code": "ONEUSE",
                "items": [{"variant_id": self.variant.id, "quantity": 1}],
                "shipping_address": {
                    "recipient_name": "Ram",
                    "phone": "9801234568",
                    "province": "Bagmati",
                    "district": "Kathmandu",
                    "municipality": "KMC",
                    "ward": "3",
                    "street_landmark": "Patan",
                },
            },
            format="json",
        )
        self.assertEqual(other_res.status_code, status.HTTP_201_CREATED)

        # Now original shopper cannot switch failed discounted order to COD because promo is exhausted
        cod_retry_res = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{order_id}/pay/",
            {"token": token, "payment_method": "COD"},
            format="json",
        )
        self.assertEqual(cod_retry_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("redemption limit", cod_retry_res.json()["error"].lower())

    def test_failed_khalti_retry_gateway_502_rolls_back_reclaim(self):
        place_res = self._place_khalti_order_with_promo(pidx="pidx_gw_1")
        order_id = place_res.json()["order_id"]
        token = place_res.json()["token"]

        with patch(
            "stores.api.verify_khalti_epayment",
            return_value=KhaltiVerifyResult(KHALTI_STATE_CANCELED, None, None, None),
        ):
            self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": "pidx_gw_1", "order_id": order_id},
                format="json",
            )

        with patch(
            "stores.api.resolve_khalti_initiation_config",
            return_value=("Key test", "https://dev.khalti.com/api/v2/epayment/initiate/", None),
        ), patch(
            "stores.api.initiate_khalti_epayment",
            return_value=(None, None, False, "Khalti unreachable"),
        ):
            retry_502 = self.client.post(
                f"/api/stores/{self.store.slug}/public-orders/{order_id}/pay/",
                {"token": token, "payment_method": "KHALTI"},
                format="json",
            )
        self.assertEqual(retry_502.status_code, status.HTTP_502_BAD_GATEWAY)

        with TenantDatabaseContext(self.store.id):
            self.discount.refresh_from_db()
            order = Order.objects.for_store(self.store).get(id=order_id)
            self.assertEqual(self.discount.used_count, 0)
            self.assertFalse(order.discount_redeemed)

    def test_merchant_cancel_releases_used_count_and_discount_delete_preserves_order(self):
        place_cod = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            {
                "customer_email": "cod.bug64@example.com",
                "payment_method": "COD",
                "discount_code": "ONEUSE",
                "items": [{"variant_id": self.variant.id, "quantity": 1}],
                "shipping_address": {
                    "recipient_name": "Hari",
                    "phone": "9801234569",
                    "province": "Bagmati",
                    "district": "Kathmandu",
                    "municipality": "KMC",
                    "ward": "5",
                    "street_landmark": "Baneshwor",
                },
            },
            format="json",
        )
        self.assertEqual(place_cod.status_code, status.HTTP_201_CREATED)
        order_id = place_cod.json()["order_id"]

        self.client.force_authenticate(user=self.owner)
        cancel_res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{order_id}/transition/",
            {"to_status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)

        with TenantDatabaseContext(self.store.id):
            self.discount.refresh_from_db()
            order = Order.objects.for_store(self.store).get(id=order_id)
            self.assertEqual(self.discount.used_count, 0)
            self.assertFalse(order.discount_redeemed)

        # Since used_count is 0, merchant delete permanently removes Discount while SET_NULL preserves Order
        del_res = self.client.delete(
            f"/api/merchant/stores/{self.store.slug}/discounts/{self.discount.id}/"
        )
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        with TenantDatabaseContext(self.store.id):
            self.assertFalse(Discount.objects.for_store(self.store).filter(id=self.discount.id).exists())
            order = Order.objects.for_store(self.store).get(id=order_id)
            self.assertIsNone(order.discount_id)
