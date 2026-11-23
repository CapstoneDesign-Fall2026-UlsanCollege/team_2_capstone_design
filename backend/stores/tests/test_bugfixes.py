from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Discount, Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order, OrderItem
from stores.khalti import KHALTI_STATE_CANCELED, KhaltiVerifyResult
from stores.models import Customer, MerchantAuditLog, Store, StoreMembership

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


class ProductImageUrlBugTests(TestCase):
    """Regression tests for Bug 1: allow relative store asset paths in ProductSerializer.image_url."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="owner.imgurl@example.com",
            full_name="ImgUrl Owner",
        )
        self.store = Store.objects.create(
            name="ImgUrl Store",
            slug="imgurl-store",
            is_active=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.seeded_product = Product.objects.create(
                store=self.store,
                name="Gulmi Reserve",
                slug="gulmi-reserve",
                image_url="/images/products/gulmi-reserve.svg",
                is_active=True,
            )

    def test_patch_seeded_product_with_relative_image_url_succeeds(self):
        self.client.force_authenticate(user=self.owner)
        res = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/products/{self.seeded_product.id}/",
            {
                "name": "Gulmi Reserve Updated",
                "image_url": "/images/products/gulmi-reserve.svg",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["name"], "Gulmi Reserve Updated")
        self.assertEqual(res.json()["image_url"], "/images/products/gulmi-reserve.svg")

    def test_create_product_with_local_upload_and_https_url_succeeds(self):
        self.client.force_authenticate(user=self.owner)
        res_local = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {
                "name": "Local Upload Product",
                "image_url": f"/uploads/stores/{self.store.slug}/products/prod_1.jpg",
                "initial_price_minor": 50000,
            },
            format="json",
        )
        self.assertEqual(res_local.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            res_local.json()["image_url"],
            f"/uploads/stores/{self.store.slug}/products/prod_1.jpg",
        )

        res_https = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {
                "name": "Cloud Product",
                "image_url": "https://res.cloudinary.com/demo/image/upload/item.jpg",
                "initial_price_minor": 60000,
            },
            format="json",
        )
        self.assertEqual(res_https.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            res_https.json()["image_url"],
            "https://res.cloudinary.com/demo/image/upload/item.jpg",
        )

    def test_rejects_unsafe_and_invalid_image_urls(self):
        self.client.force_authenticate(user=self.owner)
        invalid_urls = [
            "javascript:alert(1)",
            "//evil.com/x.png",
            "/uploads/../etc/passwd",
            "not-a-url",
        ]
        for bad_url in invalid_urls:
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/products/",
                {
                    "name": "Bad Image Product",
                    "image_url": bad_url,
                },
                format="json",
            )
            self.assertEqual(
                res.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Expected 400 for image_url={bad_url!r}, got {res.status_code}",
            )
            self.assertIn("image_url", res.json())


class VariantSkuAndProductSlugCollisionBugTests(TestCase):
    """Regression tests for Bug 2: prevent variant SKU collisions after delete and return 400 on duplicate SKU/slug."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="owner.sku@example.com",
            full_name="SKU Owner",
        )
        self.store = Store.objects.create(
            name="SKU Store",
            slug="sku-store",
            is_active=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.product = Product.objects.create(
                store=self.store,
                name="Himalayan Tea",
                slug="himalayan-tea",
                is_active=True,
            )
            self.other_product = Product.objects.create(
                store=self.store,
                name="Green Tea",
                slug="green-tea",
                is_active=True,
            )

    def test_auto_generated_variant_sku_does_not_collide_after_permanent_delete(self):
        self.client.force_authenticate(user=self.owner)
        v1 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/",
            {"label": "100g", "price_minor": 40000},
            format="json",
        )
        self.assertEqual(v1.status_code, status.HTTP_201_CREATED)
        v2 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/",
            {"label": "250g", "price_minor": 85000},
            format="json",
        )
        self.assertEqual(v2.status_code, status.HTTP_201_CREATED)

        # Permanently delete the first variant (leaves -2 in DB while count drops to 1)
        del_res = self.client.delete(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/{v1.json()['id']}/?permanent=true"
        )
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

        # Adding a 3rd variant without an explicit SKU must pick a unique SKU instead of crashing with 500
        v3 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/",
            {"label": "500g", "price_minor": 150000},
            format="json",
        )
        self.assertEqual(v3.status_code, status.HTTP_201_CREATED)
        self.assertNotEqual(v3.json()["sku"], v2.json()["sku"])

    def test_duplicate_explicit_sku_and_product_slug_return_400(self):
        self.client.force_authenticate(user=self.owner)
        v1 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/",
            {"label": "Pack A", "sku": "UNIQUE-SKU-1", "price_minor": 50000},
            format="json",
        )
        self.assertEqual(v1.status_code, status.HTTP_201_CREATED)

        v2 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/",
            {"label": "Pack B", "sku": "UNIQUE-SKU-2", "price_minor": 60000},
            format="json",
        )
        self.assertEqual(v2.status_code, status.HTTP_201_CREATED)

        # Duplicate explicit SKU on POST -> 400
        dup_post = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/",
            {"label": "Pack C", "sku": "UNIQUE-SKU-1", "price_minor": 70000},
            format="json",
        )
        self.assertEqual(dup_post.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sku", dup_post.json())

        # Duplicate explicit SKU on PATCH -> 400
        dup_patch = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/variants/{v2.json()['id']}/",
            {"sku": "UNIQUE-SKU-1"},
            format="json",
        )
        self.assertEqual(dup_patch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sku", dup_patch.json())

        # Duplicate explicit product slug on POST -> 400
        dup_prod_post = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {"name": "Duplicate Slug Tea", "slug": "himalayan-tea"},
            format="json",
        )
        self.assertEqual(dup_prod_post.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("slug", dup_prod_post.json())

        # Duplicate explicit product slug on PATCH -> 400
        dup_prod_patch = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/products/{self.other_product.id}/",
            {"slug": "himalayan-tea"},
            format="json",
        )
        self.assertEqual(dup_prod_patch.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("slug", dup_prod_patch.json())


class AnalyticsAndRevenueAccuracyBugTests(TestCase):
    """Regression tests for Bug 5: exclude unpaid PENDING_PAYMENT and cancelled paid orders from revenue/analytics."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="owner.rev@example.com",
            full_name="Revenue Owner",
        )
        self.shopper_user = User.objects.create_user(
            email="shopper.rev@example.com",
            full_name="Shopper Rev",
            phone="9801112233",
        )
        self.store = Store.objects.create(
            name="Revenue Roasters",
            slug="revenue-roasters",
            is_active=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.customer = Customer.objects.create(
                store=self.store,
                user=self.shopper_user,
                email=self.shopper_user.email,
                full_name=self.shopper_user.full_name,
                phone=self.shopper_user.phone,
            )
            self.product = Product.objects.create(
                store=self.store,
                name="Ilam Gold",
                slug="ilam-gold",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=self.product,
                sku="REV-250",
                label="250g",
                price_minor=100000,
                in_stock=True,
                is_active=True,
            )
            self.discount = Discount.objects.create(
                store=self.store,
                code="ABANDON10",
                discount_type="PERCENTAGE",
                value=10,
                used_count=1,
                is_active=True,
            )
            # 1) Legitimate paid Khalti order (Rs. 1,000)
            self.paid_order = Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number="#REV-PAID-1",
                status="PAID",
                payment_method="KHALTI",
                payment_status="PAID",
                subtotal_minor=100000,
                shipping_minor=0,
                discount_minor=0,
                total_minor=100000,
                shipping_address_snapshot={"province": "Bagmati", "district": "Kathmandu"},
            )
            OrderItem.objects.create(
                store=self.store,
                order=self.paid_order,
                variant=self.variant,
                product_name_snapshot="Ilam Gold",
                variant_label_snapshot="250g",
                unit_price_minor=100000,
                quantity=1,
                line_total_minor=100000,
            )
            # 2) Abandoned PENDING_PAYMENT / UNPAID Khalti checkout (Rs. 2,000) with promo held
            self.pending_order = Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number="#REV-PEND-2",
                status="PENDING_PAYMENT",
                payment_method="KHALTI",
                payment_status="UNPAID",
                subtotal_minor=200000,
                shipping_minor=0,
                discount_minor=0,
                discount=self.discount,
                discount_redeemed=True,
                total_minor=200000,
                shipping_address_snapshot={"province": "Bagmati", "district": "Kathmandu"},
            )
            OrderItem.objects.create(
                store=self.store,
                order=self.pending_order,
                variant=self.variant,
                product_name_snapshot="Ilam Gold",
                variant_label_snapshot="250g",
                unit_price_minor=100000,
                quantity=2,
                line_total_minor=200000,
            )
            # 3) Cancelled Khalti order that still has payment_status="PAID" (Rs. 3,000)
            self.cancelled_paid_order = Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number="#REV-CANC-3",
                status="CANCELLED",
                payment_method="KHALTI",
                payment_status="PAID",
                subtotal_minor=300000,
                shipping_minor=0,
                discount_minor=0,
                total_minor=300000,
                shipping_address_snapshot={"province": "Bagmati", "district": "Kathmandu"},
            )
            OrderItem.objects.create(
                store=self.store,
                order=self.cancelled_paid_order,
                variant=self.variant,
                product_name_snapshot="Ilam Gold",
                variant_label_snapshot="250g",
                unit_price_minor=100000,
                quantity=3,
                line_total_minor=300000,
            )

    def test_analytics_overview_and_customer_spend_count_only_real_paid_order(self):
        self.client.force_authenticate(user=self.owner)

        # Merchant Analytics
        ana_res = self.client.get(f"/api/merchant/stores/{self.store.slug}/analytics/?range=30d")
        self.assertEqual(ana_res.status_code, status.HTTP_200_OK)
        ana = ana_res.json()
        self.assertEqual(ana["kpis"]["orders_count"], 1)
        self.assertEqual(ana["kpis"]["gross_sales_minor"], 100000)
        self.assertEqual(ana["kpis"]["paid_sales_minor"], 100000)
        self.assertEqual(ana["kpis"]["repeat_customers"], 0)
        self.assertEqual(ana["top_products"][0]["units_sold"], 1)
        self.assertEqual(ana["top_products"][0]["revenue_minor"], 100000)

        # Merchant Overview
        ov_res = self.client.get(f"/api/merchant/stores/{self.store.slug}/overview/")
        self.assertEqual(ov_res.status_code, status.HTTP_200_OK)
        ov = ov_res.json()
        self.assertEqual(ov["orders_count"], 1)
        self.assertEqual(ov["revenue_minor"], 100000)
        self.assertEqual(ov["today_orders_count"], 1)
        self.assertEqual(ov["today_sales_minor"], 100000)
        self.assertEqual(ov["daily_sales_7d"][-1]["orders_count"], 1)
        self.assertEqual(ov["daily_sales_7d"][-1]["revenue_minor"], 100000)

        # Merchant Customer List & Detail
        cust_list_res = self.client.get(f"/api/merchant/stores/{self.store.slug}/customers/")
        self.assertEqual(cust_list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cust_list_res.json()[0]["total_spent_minor"], 100000)

        cust_detail_res = self.client.get(
            f"/api/merchant/stores/{self.store.slug}/customers/{self.customer.id}/"
        )
        self.assertEqual(cust_detail_res.status_code, status.HTTP_200_OK)
        self.assertEqual(cust_detail_res.json()["customer"]["total_spent_minor"], 100000)

        # Storefront Customer Account Profile
        self.client.force_authenticate(user=self.shopper_user)
        acct_res = self.client.get(f"/api/stores/{self.store.slug}/account/")
        self.assertEqual(acct_res.status_code, status.HTTP_200_OK)
        self.assertEqual(acct_res.json()["customer"]["total_spent_minor"], 100000)

    def test_merchant_can_cancel_abandoned_pending_payment_order_and_release_promo(self):
        self.client.force_authenticate(user=self.owner)
        res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{self.pending_order.id}/transition/",
            {"to_status": "CANCELLED", "note": "Abandoned Khalti checkout"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["status"], "CANCELLED")
        with TenantDatabaseContext(self.store.id):
            self.discount.refresh_from_db()
            self.pending_order.refresh_from_db()
            self.assertEqual(self.discount.used_count, 0)
            self.assertFalse(self.pending_order.discount_redeemed)
