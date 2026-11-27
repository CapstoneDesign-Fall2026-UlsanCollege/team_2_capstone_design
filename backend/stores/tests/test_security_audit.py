import re
from datetime import timedelta
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, APITestCase
from rest_framework.throttling import ScopedRateThrottle

from catalog.models import Discount, Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order, OrderItem
from stores.api import _resolve_safe_khalti_return_url
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class CorsCsrfOriginAuditTests(SimpleTestCase):
    """Issue #69: never trust arbitrary *.vercel.app origins for credentialed CORS/CSRF."""

    def test_wildcard_vercel_origins_are_not_trusted(self):
        evil_origin = "https://attacker-phishing.vercel.app"
        self.assertNotIn("https://*.vercel.app", settings.CSRF_TRUSTED_ORIGINS)
        self.assertFalse(
            any(re.match(pattern, evil_origin) for pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES),
            "Arbitrary *.vercel.app origins must not match CORS_ALLOWED_ORIGIN_REGEXES",
        )
        self.assertTrue(
            any(re.match(pattern, "https://shop.shopcraft.me") for pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES),
        )


class SocialUrlAndStoreCreateValidationTests(APITestCase):
    """Issue #70: block stored javascript: URLs and validate StoreCreateView banner/theme inputs."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("audit70-owner@example.com", full_name="Owner 70")
        cls.store = Store.objects.create(slug="audit70-shop", name="Audit 70 Shop", is_active=True)
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")

    def setUp(self):
        self.client.force_authenticate(user=self.owner)

    def test_settings_rejects_javascript_social_urls_and_accepts_https(self):
        bad_ig = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/settings/",
            {"instagram_url": "javascript:alert(document.cookie)"},
            format="json",
        )
        self.assertEqual(bad_ig.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("instagram_url", bad_ig.json())

        bad_fb = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/settings/",
            {"facebook_url": "data:text/html,<script>alert(1)</script>"},
            format="json",
        )
        self.assertEqual(bad_fb.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facebook_url", bad_fb.json())

        ok = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/settings/",
            {
                "instagram_url": "https://instagram.com/himalayan.roast",
                "facebook_url": "https://facebook.com/himalayan.roast",
            },
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        self.assertEqual(ok.json()["instagram_url"], "https://instagram.com/himalayan.roast")

    def test_store_create_rejects_invalid_theme_and_unsafe_banner_url(self):
        bad_theme = self.client.post(
            "/api/stores/create/",
            {"name": "Theme Check", "slug": "theme-check-70", "theme_preset": "evil-preset"},
            format="json",
        )
        self.assertEqual(bad_theme.status_code, status.HTTP_400_BAD_REQUEST)

        for bad_banner in ("javascript:alert(1)", "https://evil.com/phish.jpg", "/images/../secret.jpg"):
            res = self.client.post(
                "/api/stores/create/",
                {
                    "name": "Banner Check",
                    "slug": "banner-check-70",
                    "theme_preset": "editorial-warm",
                    "banner_url": bad_banner,
                },
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, bad_banner)

        ok_res = self.client.post(
            "/api/stores/create/",
            {
                "name": "Valid Shop 70",
                "slug": "valid-shop-70",
                "theme_preset": "pahadi-sage",
                "banner_url": "/images/themes/sage-hero.jpg",
            },
            format="json",
        )
        self.assertEqual(ok_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ok_res.json()["banner_url"], "/images/themes/sage-hero.jpg")


class KhaltiReturnUrlAuditTests(APITestCase):
    """Issue #72: only allow allowlisted origins and exact return path in Khalti return_url."""

    @classmethod
    def setUpTestData(cls):
        cls.store = Store.objects.create(slug="khalti-url-72", name="Khalti Shop 72", is_active=True)

    def _req(self, return_url):
        req = APIRequestFactory().post("/checkout/place/", {"return_url": return_url}, format="json")
        req.data = {"return_url": return_url}
        return req

    def test_untrusted_origin_or_wrong_path_falls_back_to_canonical(self):
        canonical_suffix = f"/s/{self.store.slug}/checkout/khalti-return/"
        for evil in (
            "https://attacker.com/s/khalti-url-72/checkout/khalti-return/",
            "https://evil.vercel.app/s/khalti-url-72/checkout/khalti-return/",
            "https://shop.shopcraft.me/steal-token",
            "https://shop.shopcraft.me/s/khalti-url-72/checkout/khalti-return/?evil=1",
            "javascript:alert(1)",
        ):
            resolved = _resolve_safe_khalti_return_url(self._req(evil), self.store)
            self.assertTrue(resolved.endswith(canonical_suffix), evil)
            self.assertNotIn("attacker.com", resolved)
            self.assertNotIn("evil.vercel.app", resolved)
            self.assertNotIn("evil=1", resolved)

    def test_allowlisted_frontend_origin_with_exact_path_is_preserved(self):
        good = "https://shop.shopcraft.me/s/khalti-url-72/checkout/khalti-return/"
        self.assertEqual(_resolve_safe_khalti_return_url(self._req(good), self.store), good)


class ThrottlingAndOrderExpiryAuditTests(APITestCase):
    """Issue #73: DRF throttles active + abandoned PENDING_PAYMENT orders auto-release stock & promos."""

    @classmethod
    def setUpTestData(cls):
        cls.store = Store.objects.create(
            slug="expiry-shop-73",
            name="Expiry Shop 73",
            is_active=True,
            cod_enabled=True,
        )
        with TenantDatabaseContext(cls.store.id):
            cls.customer = Customer.objects.create(
                store=cls.store,
                email="buyer73@example.com",
                full_name="Buyer 73",
                phone="9800000073",
            )
            cls.product = Product.objects.create(
                store=cls.store, slug="tea-73", name="Ilam Tea 73", is_active=True
            )
            cls.variant = Variant.objects.create(
                store=cls.store,
                product=cls.product,
                sku="SKU-73",
                label="250g",
                price_minor=50000,
                in_stock=False,
                track_inventory=True,
                stock_quantity=0,
                is_active=True,
            )
            cls.discount = Discount.objects.create(
                store=cls.store,
                code="ONCE73",
                discount_type="PERCENTAGE",
                value=10,
                max_uses=1,
                used_count=1,
                is_active=True,
            )
            cls.abandoned = Order.objects.create(
                store=cls.store,
                customer=cls.customer,
                order_number="#EX-2026-0001",
                status="PENDING_PAYMENT",
                payment_method="KHALTI",
                payment_status="UNPAID",
                subtotal_minor=100000,
                discount=cls.discount,
                discount_redeemed=True,
                inventory_deducted=True,
                total_minor=100000,
            )
            OrderItem.objects.create(
                store=cls.store,
                order=cls.abandoned,
                variant=cls.variant,
                product_name_snapshot=cls.product.name,
                variant_label_snapshot=cls.variant.label,
                unit_price_minor=50000,
                quantity=2,
                line_total_minor=100000,
            )
            Order.objects.filter(id=cls.abandoned.id).update(
                created_at=timezone.now() - timedelta(minutes=45)
            )

    def setUp(self):
        cache.clear()

    def test_drf_global_throttle_classes_configured(self):
        classes = settings.REST_FRAMEWORK.get("DEFAULT_THROTTLE_CLASSES", [])
        self.assertIn("rest_framework.throttling.AnonRateThrottle", classes)
        self.assertIn("rest_framework.throttling.UserRateThrottle", classes)

    def test_storefront_otp_and_checkout_throttles_enforce_429(self):
        with patch.dict(
            ScopedRateThrottle.THROTTLE_RATES,
            {"checkout_quote": "2/min", "storefront_otp_verify": "2/min"},
        ):
            cache.clear()
            for idx in range(3):
                r = self.client.post(
                    f"/api/stores/{self.store.slug}/checkout/quote/",
                    {"items": []},
                    format="json",
                )
                expected = status.HTTP_429_TOO_MANY_REQUESTS if idx == 2 else status.HTTP_400_BAD_REQUEST
                self.assertEqual(r.status_code, expected)

            cache.clear()
            for idx in range(3):
                r = self.client.post(
                    f"/api/stores/{self.store.slug}/account/otp/verify/",
                    {"email": "nobody@example.com", "code": "000000"},
                    format="json",
                )
                expected = status.HTTP_429_TOO_MANY_REQUESTS if idx == 2 else status.HTTP_400_BAD_REQUEST
                self.assertEqual(r.status_code, expected)

    def test_expired_pending_order_releases_stock_and_promo_on_new_checkout(self):
        res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            {
                "items": [{"variant_id": self.variant.id, "quantity": 1}],
                "payment_method": "COD",
                "discount_code": "ONCE73",
                "shipping_address": {
                    "recipient_name": "Fresh Shopper",
                    "phone": "9812345678",
                    "province": "Bagmati",
                    "district": "Kathmandu",
                    "municipality": "Kathmandu",
                    "ward": "5",
                    "street_landmark": "Thamel",
                    "email": "fresh73@example.com",
                },
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.content)
        with TenantDatabaseContext(self.store.id):
            self.abandoned.refresh_from_db()
            self.variant.refresh_from_db()
            self.discount.refresh_from_db()
            self.assertEqual(self.abandoned.status, "PAYMENT_FAILED")
            self.assertEqual(self.abandoned.payment_status, "FAILED")
            self.assertFalse(self.abandoned.inventory_deducted)
            self.assertFalse(self.abandoned.discount_redeemed)
            # 2 restored from abandoned order, 1 reserved by fresh COD order -> 1 left
            self.assertEqual(self.variant.stock_quantity, 1)
            self.assertTrue(self.variant.in_stock)
            self.assertEqual(self.discount.used_count, 1)

    def test_cleanup_expired_orders_command_releases_pending_orders(self):
        call_command("cleanup_expired_orders", "--minutes", "30")
        with TenantDatabaseContext(self.store.id):
            self.abandoned.refresh_from_db()
            self.variant.refresh_from_db()
            self.assertEqual(self.abandoned.status, "PAYMENT_FAILED")
            self.assertEqual(self.variant.stock_quantity, 2)
            self.assertTrue(self.variant.in_stock)
