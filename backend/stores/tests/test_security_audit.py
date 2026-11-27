import io
import re
from datetime import timedelta
from unittest.mock import patch
from PIL import Image
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import call_command
from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, APITestCase
from rest_framework.throttling import ScopedRateThrottle

from accounts.models import EmailOTPChallenge
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


class DeactivatedUserAuthAuditTests(APITestCase):
    """Issue #74: block deactivated users from OTP login, Google login, and store creation."""

    @classmethod
    def setUpTestData(cls):
        cls.store = Store.objects.create(slug="audit74-shop", name="Audit 74 Shop", is_active=True)
        cls.inactive_user = User.objects.create_user(
            "deactivated74@example.com",
            full_name="Deactivated User",
            is_active=False,
        )

    def test_inactive_user_blocked_from_platform_otp_and_google_login(self):
        _, code = EmailOTPChallenge.issue_for_email(self.inactive_user.email, ip_address="127.0.0.1")
        otp_res = self.client.post(
            "/api/auth/otp/verify/",
            {"email": self.inactive_user.email, "code": code},
            format="json",
        )
        self.assertEqual(otp_res.status_code, status.HTTP_403_FORBIDDEN, otp_res.content)
        self.assertNotIn("_auth_user_id", self.client.session)

        with (
            patch("accounts.api.get_configured_google_client_id", return_value="test-client-id"),
            patch(
                "accounts.api.verify_google_id_token",
                return_value={"email": self.inactive_user.email, "full_name": "Deactivated User"},
            ),
        ):
            google_res = self.client.post(
                "/api/auth/google/",
                {"credential": "dummy-google-token"},
                format="json",
            )
        self.assertEqual(google_res.status_code, status.HTTP_403_FORBIDDEN, google_res.content)
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_inactive_user_blocked_from_storefront_otp_and_google_login(self):
        _, code = EmailOTPChallenge.issue_for_email(self.inactive_user.email, ip_address="127.0.0.1")
        otp_res = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/verify/",
            {"email": self.inactive_user.email, "code": code},
            format="json",
        )
        self.assertEqual(otp_res.status_code, status.HTTP_403_FORBIDDEN, otp_res.content)
        self.assertNotIn("_auth_user_id", self.client.session)

        with (
            patch("stores.storefront_account_api.get_configured_google_client_id", return_value="test-client-id"),
            patch(
                "stores.storefront_account_api.verify_google_id_token",
                return_value={"email": self.inactive_user.email, "full_name": "Deactivated User"},
            ),
        ):
            google_res = self.client.post(
                f"/api/stores/{self.store.slug}/account/google/",
                {"credential": "dummy-google-token"},
                format="json",
            )
        self.assertEqual(google_res.status_code, status.HTTP_403_FORBIDDEN, google_res.content)
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_inactive_user_blocked_from_store_creation(self):
        self.client.force_authenticate(user=self.inactive_user)
        res = self.client.post(
            "/api/stores/create/",
            {"name": "Blocked Shop 74", "slug": "blocked-shop-74"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN, res.content)
        self.assertFalse(Store.objects.filter(slug="blocked-shop-74").exists())


class ProductMediaUploadAuditTests(APITestCase):
    """Issue #75: verify images via Pillow, strip EXIF, and enforce media_upload throttle."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("audit75-owner@example.com", full_name="Owner 75")
        cls.store = Store.objects.create(slug="audit75-shop", name="Audit 75 Shop", is_active=True)
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")

    def setUp(self):
        cache.clear()
        self.client.force_authenticate(user=self.owner)

    def _tiny_png(self) -> bytes:
        buf = io.BytesIO()
        Image.new("RGB", (4, 4), color="navy").save(buf, format="PNG")
        return buf.getvalue()

    def test_rejects_svg_and_spoofed_payload_with_image_mime(self):
        svg_file = SimpleUploadedFile("xss.svg", b"<svg onload=alert(1)></svg>", content_type="image/png")
        res_svg = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/media/upload/",
            {"file": svg_file},
            format="multipart",
        )
        self.assertEqual(res_svg.status_code, status.HTTP_400_BAD_REQUEST, res_svg.content)

        spoofed = SimpleUploadedFile("fake.png", b"<script>alert(1)</script>", content_type="image/png")
        res_spoof = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/media/upload/",
            {"file": spoofed},
            format="multipart",
        )
        self.assertEqual(res_spoof.status_code, status.HTTP_400_BAD_REQUEST, res_spoof.content)

    def test_strips_exif_metadata_before_storage(self):
        buf = io.BytesIO()
        img = Image.new("RGB", (8, 8), color="teal")
        exif = img.getexif()
        exif[0x010F] = "SecretGPSCamera75"
        img.save(buf, format="JPEG", exif=exif.tobytes())
        uploaded = SimpleUploadedFile("photo.jpg", buf.getvalue(), content_type="image/jpeg")

        captured = {}

        def _fake_cloudinary_upload(*, uploaded_file, clean_store_slug, public_id, store_id):
            uploaded_file.seek(0)
            captured["bytes"] = uploaded_file.read()
            captured["name"] = uploaded_file.name
            return f"https://res.cloudinary.com/demo/image/upload/v1/{public_id}.jpg"

        with (
            patch("stores.api.is_cloudinary_configured", return_value=True),
            patch("stores.api.upload_store_image_to_cloudinary", side_effect=_fake_cloudinary_upload),
        ):
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/media/upload/",
                {"file": uploaded},
                format="multipart",
            )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.content)
        self.assertTrue(captured["name"].endswith(".jpg"))
        self.assertNotIn(b"SecretGPSCamera75", captured["bytes"])
        with Image.open(io.BytesIO(captured["bytes"])) as cleaned:
            self.assertEqual(cleaned.format, "JPEG")
            self.assertEqual(len(cleaned.getexif()), 0)

    def test_media_upload_rate_throttle_enforced(self):
        with (
            patch.dict(ScopedRateThrottle.THROTTLE_RATES, {"media_upload": "2/min"}),
            patch("stores.api.is_cloudinary_configured", return_value=True),
            patch(
                "stores.api.upload_store_image_to_cloudinary",
                return_value="https://res.cloudinary.com/demo/image/upload/v1/ok.png",
            ),
        ):
            for _ in range(2):
                f = SimpleUploadedFile("ok.png", self._tiny_png(), content_type="image/png")
                ok = self.client.post(
                    f"/api/merchant/stores/{self.store.slug}/media/upload/",
                    {"file": f},
                    format="multipart",
                )
                self.assertEqual(ok.status_code, status.HTTP_201_CREATED, ok.content)

            blocked_file = SimpleUploadedFile("ok3.png", self._tiny_png(), content_type="image/png")
            blocked = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/media/upload/",
                {"file": blocked_file},
                format="multipart",
            )
            self.assertEqual(blocked.status_code, status.HTTP_429_TOO_MANY_REQUESTS, blocked.content)


class StaffInvitePiiAuditTests(APITestCase):
    """Issue #76: never disclose or overwrite unrelated user phone/full_name on staff invite."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("audit76-owner@example.com", full_name="Owner 76")
        cls.victim = User.objects.create_user(
            "victim76@example.com",
            full_name="Victim Secret Name",
            phone="9801112233",
        )
        cls.blank_victim = User.objects.create_user(
            "blank76@example.com",
            full_name="",
            phone="9809998877",
        )
        cls.store = Store.objects.create(slug="audit76-shop", name="Audit 76 Shop", is_active=True)
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")

    def setUp(self):
        self.client.force_authenticate(user=self.owner)

    def test_staff_invite_redacts_existing_user_pii_and_does_not_overwrite_profile(self):
        res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/staff/",
            {"email": self.victim.email, "role": "STAFF"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.content)
        data = res.json()
        self.assertEqual(data["email"], self.victim.email)
        self.assertEqual(data["phone"], "")
        self.assertEqual(data["full_name"], "victim76")
        self.assertNotIn("Victim Secret Name", str(data))

        res_blank = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/staff/",
            {"email": self.blank_victim.email, "full_name": "Attacker Label", "role": "STAFF"},
            format="json",
        )
        self.assertEqual(res_blank.status_code, status.HTTP_201_CREATED, res_blank.content)
        self.assertEqual(res_blank.json()["phone"], "")
        self.assertEqual(res_blank.json()["full_name"], "Attacker Label")
        self.blank_victim.refresh_from_db()
        self.assertEqual(self.blank_victim.full_name, "")



