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
from django.db import connection
from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, APITestCase, APITransactionTestCase
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


class KhaltiLockReleaseAuditTests(APITransactionTestCase):
    """Issue #77: ensure no DB transaction or row lock is held across outbound Khalti HTTP calls."""

    def setUp(self):
        cache.clear()
        self.owner = User.objects.create_user("audit77-owner@example.com", full_name="Owner 77")
        self.store = Store.objects.create(slug="audit77-shop", name="Audit 77 Shop", is_active=True)
        self.store.set_khalti_secret_key("test_secret_key_audit77")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.product = Product.objects.create(
                store=self.store,
                name="Audit 77 Mug",
                slug="audit-77-mug",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=self.product,
                label="Default",
                price_minor=150000,
                stock_quantity=4,
                in_stock=True,
                track_inventory=True,
            )
            self.discount = Discount.objects.create(
                store=self.store,
                code="SAVE77",
                discount_type="FIXED_AMOUNT",
                value=10000,
                max_uses=5,
                used_count=0,
                is_active=True,
            )

    def test_khalti_http_calls_run_outside_db_transaction_and_release_on_failure(self):
        in_atomic_flags = []

        def _fail_initiate(*, store, order, khalti_body):
            in_atomic_flags.append(("checkout_fail_initiate", connection.in_atomic_block))
            return None, None, False, "Khalti gateway timeout"

        payload = {
            "items": [{"variant_id": self.variant.id, "quantity": 2}],
            "payment_method": "KHALTI",
            "discount_code": "SAVE77",
            "shipping_address": {
                "recipient_name": "Khalti Tester",
                "phone": "9812345678",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu",
                "ward": "4",
                "street_landmark": "Lazimpat",
                "email": "khalti77@example.com",
            },
        }
        with patch("stores.api.initiate_khalti_epayment", side_effect=_fail_initiate):
            res_fail = self.client.post(f"/api/stores/{self.store.slug}/checkout/place/", payload, format="json")
        self.assertEqual(res_fail.status_code, status.HTTP_502_BAD_GATEWAY, res_fail.content)
        with TenantDatabaseContext(self.store.id):
            self.variant.refresh_from_db()
            self.discount.refresh_from_db()
            self.assertEqual(Order.objects.for_store(self.store).count(), 0)
            self.assertEqual(self.variant.stock_quantity, 4)
            self.assertEqual(self.discount.used_count, 0)

        def _ok_initiate(*, store, order, khalti_body):
            in_atomic_flags.append(("checkout_ok_initiate", connection.in_atomic_block))
            return "pidx_audit_77", "https://test-pay.khalti.com/?pidx=pidx_audit_77", False, None

        with patch("stores.api.initiate_khalti_epayment", side_effect=_ok_initiate):
            res_ok = self.client.post(f"/api/stores/{self.store.slug}/checkout/place/", payload, format="json")
        self.assertEqual(res_ok.status_code, status.HTTP_201_CREATED, res_ok.content)
        order_data = res_ok.json()

        from stores.khalti import KHALTI_STATE_COMPLETED, KhaltiVerifyResult

        def _ok_verify(*, store, pidx, expected_pidx, mock_amount_paisa):
            in_atomic_flags.append(("verify_khalti", connection.in_atomic_block))
            return KhaltiVerifyResult(
                state=KHALTI_STATE_COMPLETED,
                total_amount_paisa=mock_amount_paisa,
                transaction_id="txn_77",
                error=None,
            )

        with patch("stores.api.verify_khalti_epayment", side_effect=_ok_verify):
            res_ver = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": "pidx_audit_77", "order_id": order_data["order_id"]},
                format="json",
            )
        self.assertEqual(res_ver.status_code, status.HTTP_200_OK, res_ver.content)

        # Test retry initiate on failed order runs outside DB transaction too.
        with TenantDatabaseContext(self.store.id):
            failed_order = Order.objects.for_store(self.store).first()
            failed_order.status = "PAYMENT_FAILED"
            failed_order.payment_status = "FAILED"
            failed_order.inventory_deducted = False
            failed_order.discount_redeemed = False
            failed_order.save()

        def _retry_initiate(*, store, order, khalti_body):
            in_atomic_flags.append(("public_pay_initiate", connection.in_atomic_block))
            return "pidx_retry_77", "https://test-pay.khalti.com/?pidx=pidx_retry_77", False, None

        with patch("stores.api.initiate_khalti_epayment", side_effect=_retry_initiate):
            res_retry = self.client.post(
                f"/api/stores/{self.store.slug}/public-orders/{failed_order.token}/pay/",
                {"payment_method": "KHALTI"},
                format="json",
            )
        self.assertEqual(res_retry.status_code, status.HTTP_200_OK, res_retry.content)

        self.assertEqual(
            in_atomic_flags,
            [
                ("checkout_fail_initiate", False),
                ("checkout_ok_initiate", False),
                ("verify_khalti", False),
                ("public_pay_initiate", False),
            ],
        )


class CheckoutEmailAndCustomerProtectionTests(APITestCase):
    """Issue #78: validate checkout email format and protect user-linked Customer profiles."""

    @classmethod
    def setUpTestData(cls):
        cls.store = Store.objects.create(
            slug="audit78-shop",
            name="Audit 78 Shop",
            cod_enabled=True,
            is_active=True,
        )
        cls.linked_user = User.objects.create_user("linked78@example.com", full_name="Linked User")
        with TenantDatabaseContext(cls.store.id):
            cls.product = Product.objects.create(
                store=cls.store,
                name="Audit 78 Scarf",
                slug="audit-78-scarf",
                is_active=True,
            )
            cls.variant = Variant.objects.create(
                store=cls.store,
                product=cls.product,
                label="One Size",
                price_minor=120000,
                stock_quantity=10,
                in_stock=True,
                track_inventory=True,
            )
            cls.linked_customer = Customer.objects.create(
                store=cls.store,
                user=cls.linked_user,
                email=cls.linked_user.email,
                full_name="",
                phone="",
            )
            cls.guest_customer = Customer.objects.create(
                store=cls.store,
                user=None,
                email="guest78@example.com",
                full_name="",
                phone="",
            )

    def setUp(self):
        cache.clear()

    def _payload(self, email: str, recipient_name: str = "Guest Name", phone: str = "9812345678"):
        return {
            "items": [{"variant_id": self.variant.id, "quantity": 1}],
            "payment_method": "COD",
            "shipping_address": {
                "recipient_name": recipient_name,
                "phone": phone,
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu",
                "ward": "5",
                "street_landmark": "Patan",
                "email": email,
            },
        }

    def test_rejects_invalid_email_and_protects_linked_customer_profile(self):
        bad_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._payload("not-a-valid-email"),
            format="json",
        )
        self.assertEqual(bad_res.status_code, status.HTTP_400_BAD_REQUEST, bad_res.content)

        # Unauthenticated guest checkout using linked customer's email must not overwrite profile fields.
        linked_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._payload(self.linked_user.email, recipient_name="Spoofed Name", phone="9800001111"),
            format="json",
        )
        self.assertEqual(linked_res.status_code, status.HTTP_201_CREATED, linked_res.content)
        with TenantDatabaseContext(self.store.id):
            self.linked_customer.refresh_from_db()
            self.assertEqual(self.linked_customer.full_name, "")
            self.assertEqual(self.linked_customer.phone, "")

        # Unlinked guest customer still receives missing profile field backfill.
        guest_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._payload("guest78@example.com", recipient_name="Real Guest", phone="9811112222"),
            format="json",
        )
        self.assertEqual(guest_res.status_code, status.HTTP_201_CREATED, guest_res.content)
        with TenantDatabaseContext(self.store.id):
            self.guest_customer.refresh_from_db()
            self.assertEqual(self.guest_customer.full_name, "Real Guest")
            self.assertEqual(self.guest_customer.phone, "9811112222")


class AnalyticsSqlAggregationTests(APITestCase):
    """Issue #79: MerchantAnalyticsView aggregates metrics in SQL rather than full Order hydration."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("audit79-owner@example.com", full_name="Owner 79")
        cls.store = Store.objects.create(slug="audit79-shop", name="Audit 79 Shop", is_active=True)
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")
            c1 = Customer.objects.create(store=cls.store, email="c1@example.com", full_name="Repeat Buyer")
            c2 = Customer.objects.create(store=cls.store, email="c2@example.com", full_name="OneTime Buyer")
            p = Product.objects.create(store=cls.store, name="Analytics Tea", slug="analytics-tea", is_active=True)
            v = Variant.objects.create(store=cls.store, product=p, label="100g", price_minor=50000)

            o1 = Order.objects.create(
                store=cls.store,
                customer=c1,
                order_number="#A79-001",
                status="PAID",
                payment_method="KHALTI",
                payment_status="PAID",
                subtotal_minor=100000,
                discount_minor=10000,
                total_minor=90000,
                shipping_address_snapshot={"district": "Kathmandu", "province": "Bagmati"},
            )
            o2 = Order.objects.create(
                store=cls.store,
                customer=c1,
                order_number="#A79-002",
                status="CONFIRMED",
                payment_method="COD",
                payment_status="COD_PENDING",
                subtotal_minor=50000,
                discount_minor=0,
                total_minor=50000,
                shipping_address_snapshot={"district": "Kaski", "province": "Gandaki"},
            )
            # Cancelled & unpaid pending orders must be excluded from KPIs.
            o_cancelled = Order.objects.create(
                store=cls.store,
                customer=c2,
                order_number="#A79-003",
                status="CANCELLED",
                payment_method="COD",
                payment_status="UNPAID",
                subtotal_minor=99900,
                total_minor=99900,
                shipping_address_snapshot={"district": "Kathmandu", "province": "Bagmati"},
            )
            Order.objects.create(
                store=cls.store,
                customer=c2,
                order_number="#A79-004",
                status="PENDING_PAYMENT",
                payment_method="KHALTI",
                payment_status="UNPAID",
                subtotal_minor=88800,
                total_minor=88800,
            )
            OrderItem.objects.create(
                store=cls.store,
                order=o1,
                variant=v,
                product_name_snapshot="Analytics Tea",
                variant_label_snapshot="100g",
                unit_price_minor=50000,
                quantity=2,
                line_total_minor=100000,
            )
            OrderItem.objects.create(
                store=cls.store,
                order=o2,
                variant=v,
                product_name_snapshot="Analytics Tea",
                variant_label_snapshot="100g",
                unit_price_minor=50000,
                quantity=1,
                line_total_minor=50000,
            )
            OrderItem.objects.create(
                store=cls.store,
                order=o_cancelled,
                variant=v,
                product_name_snapshot="Cancelled Item",
                variant_label_snapshot="100g",
                unit_price_minor=99900,
                quantity=1,
                line_total_minor=99900,
            )

    def setUp(self):
        self.client.force_authenticate(user=self.owner)

    def test_sql_aggregations_match_expected_kpis_and_breakdowns(self):
        from django.test.utils import CaptureQueriesContext

        with CaptureQueriesContext(connection) as ctx:
            res = self.client.get(f"/api/merchant/stores/{self.store.slug}/analytics/?range=30d")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.content)
        self.assertLessEqual(len(ctx), 15)
        data = res.json()
        kpis = data["kpis"]
        self.assertEqual(kpis["gross_sales_minor"], 140000)
        self.assertEqual(kpis["paid_sales_minor"], 90000)
        self.assertEqual(kpis["cod_pending_minor"], 50000)
        self.assertEqual(kpis["discounts_given_minor"], 10000)
        self.assertEqual(kpis["orders_count"], 2)
        self.assertEqual(kpis["aov_minor"], 70000)
        self.assertEqual(kpis["total_customers"], 1)
        self.assertEqual(kpis["repeat_customers"], 1)
        self.assertEqual(kpis["repeat_customer_rate_pct"], 100)

        self.assertEqual(len(data["top_products"]), 1)
        self.assertEqual(data["top_products"][0]["product_name"], "Analytics Tea")
        self.assertEqual(data["top_products"][0]["units_sold"], 3)

        mix = {row["method"]: row for row in data["payment_mix"]}
        self.assertEqual(mix["KHALTI"]["revenue_minor"], 90000)
        self.assertEqual(mix["KHALTI"]["orders_count"], 1)
        self.assertEqual(mix["COD"]["revenue_minor"], 50000)
        self.assertEqual(mix["COD"]["orders_count"], 1)


class SettingsAndDiscountBoundsAuditTests(APITestCase):
    """Issue #80: enforce integer bounds, length limits, hex colors, and emails on settings/discounts."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("audit80-owner@example.com", full_name="Owner 80")
        cls.store = Store.objects.create(slug="audit80-shop", name="Audit 80 Shop", is_active=True)
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")

    def setUp(self):
        self.client.force_authenticate(user=self.owner)

    def test_settings_rejects_overflow_shipping_invalid_accent_email_and_lengths(self):
        url = f"/api/merchant/stores/{self.store.slug}/settings/"
        bad = self.client.patch(
            url,
            {
                "name": "A" * 121,
                "accent_color": "red; background:url(x)",
                "contact_email": "not-an-email",
                "inside_valley_shipping_minor": 2_147_483_648,
                "free_shipping_threshold_minor": -10,
                "theme_preset": "nonexistent-preset",
            },
            format="json",
        )
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST, bad.content)
        err = bad.json()
        for key in (
            "name",
            "accent_color",
            "contact_email",
            "inside_valley_shipping_minor",
            "free_shipping_threshold_minor",
            "theme_preset",
        ):
            self.assertIn(key, err)

        ok = self.client.patch(
            url,
            {
                "name": "Audit 80 Updated",
                "accent_color": "#1E40AF",
                "contact_email": "hello@audit80.example.com",
                "inside_valley_shipping_minor": 15000,
                "free_shipping_threshold_minor": 250000,
            },
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK, ok.content)

    def test_discounts_reject_integer_overflow_and_invalid_bounds(self):
        create_url = f"/api/merchant/stores/{self.store.slug}/discounts/"
        for payload in (
            {"code": "OVERFLOW1", "discount_type": "FIXED_AMOUNT", "value": 2_147_483_648},
            {"code": "OVERFLOW2", "discount_type": "FIXED_AMOUNT", "value": 500, "min_subtotal_minor": 2_147_483_648},
            {"code": "OVERFLOW3", "discount_type": "FIXED_AMOUNT", "value": 500, "max_uses": 0},
            {"code": "BADDATE1", "discount_type": "PERCENTAGE", "value": 10, "expires_at": "not-a-date"},
        ):
            res = self.client.post(create_url, payload, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, f"{payload}: {res.content}")

        created = self.client.post(
            create_url,
            {"code": "VALID80", "discount_type": "FIXED_AMOUNT", "value": 1000},
            format="json",
        )
        self.assertEqual(created.status_code, status.HTTP_201_CREATED, created.content)
        disc_id = created.json()["id"]

        bad_patch = self.client.patch(
            f"{create_url}{disc_id}/",
            {"value": 2_147_483_648},
            format="json",
        )
        self.assertEqual(bad_patch.status_code, status.HTTP_400_BAD_REQUEST, bad_patch.content)
        bad_patch_min = self.client.patch(
            f"{create_url}{disc_id}/",
            {"min_subtotal_minor": -5},
            format="json",
        )
        self.assertEqual(bad_patch_min.status_code, status.HTTP_400_BAD_REQUEST, bad_patch_min.content)


class AuditLogClientIpTests(APITestCase):
    """Issue #81: MerchantAuditLog records real client IP via get_client_ip(request)."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("audit81-owner@example.com", full_name="Owner 81")
        cls.store = Store.objects.create(slug="audit81-shop", name="Audit 81 Shop", is_active=True)
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")

    def setUp(self):
        self.client.force_authenticate(user=self.owner)

    def test_audit_log_stores_forwarded_client_ip(self):
        from django.test import override_settings
        from stores.models import MerchantAuditLog

        # Without TRUSTED_PROXY_HEADER configured, spoofed X-Forwarded-For is ignored.
        with override_settings(TRUSTED_PROXY_HEADER=None):
            untrusted = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {"tagline": "Untrusted Proxy Tagline"},
                format="json",
                HTTP_X_FORWARDED_FOR="198.51.100.77",
                REMOTE_ADDR="127.0.0.1",
            )
        self.assertEqual(untrusted.status_code, status.HTTP_200_OK, untrusted.content)

        # With TRUSTED_PROXY_HEADER configured, rightmost valid X-Forwarded-For entry is recorded.
        with override_settings(TRUSTED_PROXY_HEADER="HTTP_X_FORWARDED_FOR"):
            res = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {"tagline": "Forwarded IP Tagline"},
                format="json",
                HTTP_X_FORWARDED_FOR="10.0.0.1, 203.0.113.42",
                REMOTE_ADDR="127.0.0.1",
            )
            self.assertEqual(res.status_code, status.HTTP_200_OK, res.content)

            disc_res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/discounts/",
                {"code": "IPCHECK81", "discount_type": "PERCENTAGE", "value": 10},
                format="json",
                HTTP_X_FORWARDED_FOR="10.0.0.2, 203.0.113.99",
                REMOTE_ADDR="127.0.0.1",
            )
            self.assertEqual(disc_res.status_code, status.HTTP_201_CREATED, disc_res.content)

        with TenantDatabaseContext(self.store.id):
            settings_logs = list(
                MerchantAuditLog.objects.for_store(self.store)
                .filter(action="SETTINGS_UPDATE")
                .order_by("id")
            )
            discount_log = (
                MerchantAuditLog.objects.for_store(self.store)
                .filter(action="DISCOUNT_CREATE")
                .order_by("-id")
                .first()
            )
        self.assertEqual(len(settings_logs), 2)
        self.assertEqual(settings_logs[0].ip_address, "127.0.0.1")
        self.assertEqual(settings_logs[1].ip_address, "203.0.113.42")
        self.assertIsNotNone(discount_log)
        self.assertEqual(discount_log.ip_address, "203.0.113.99")








