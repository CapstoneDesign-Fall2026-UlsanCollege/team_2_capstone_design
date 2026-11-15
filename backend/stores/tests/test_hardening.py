import os
import re
from unittest.mock import MagicMock, patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection, transaction
from django.test import TestCase, override_settings
from rest_framework.test import APIClient, APITransactionTestCase
from PIL import Image
import io

from catalog.models import Product, Variant
from core.settings import (
    DEFAULT_DEV_FERNET_KEY,
    DEFAULT_DEV_SECRET_KEY,
    validate_production_security_settings,
)
from core.tenant_context import (
    TENANT_TABLES,
    TenantDatabaseContext,
    UserMembershipContext,
    _check_shopcraft_role,
    set_current_tenant_id,
)
from orders.models import Order
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class PostgresForceRLSAndPooledTransactionTests(APITransactionTestCase):
    """
    Runs outside outer TestCase savepoints (real PostgreSQL transactions) to verify:
    1. Test database role is strictly NOSUPERUSER and NOBYPASSRLS (table owner cannot bypass RLS).
    2. All 9 tenant tables have ENABLE ROW LEVEL SECURITY + FORCE ROW LEVEL SECURITY + policy.
    3. set_current_tenant_id forbids session-level SET (is_local=False) and forbids SET LOCAL
       outside an active transaction.atomic() block.
    4. Two-tenant sequential requests over the same pooled/persistent connection never leak state.
    """

    def setUp(self):
        super().setUp()
        self._orig_conn_max_age = connection.settings_dict.get("CONN_MAX_AGE", 0)
        connection.settings_dict["CONN_MAX_AGE"] = 600

        self.store_a = Store.objects.create(name="Tenant One", slug="tenant-one", is_active=True)
        self.store_b = Store.objects.create(name="Tenant Two", slug="tenant-two", is_active=True)

        with TenantDatabaseContext(self.store_a.id):
            p_a = Product.objects.create(
                store=self.store_a,
                name="Tenant One Exclusive Coffee",
                slug="t1-coffee",
                is_active=True,
            )
            Variant.objects.create(
                store=self.store_a,
                product=p_a,
                sku="T1-COF-1",
                label="250g",
                price_minor=75000,
                in_stock=True,
                is_active=True,
            )

        with TenantDatabaseContext(self.store_b.id):
            p_b = Product.objects.create(
                store=self.store_b,
                name="Tenant Two Secret Tea",
                slug="t2-tea",
                is_active=True,
            )
            Variant.objects.create(
                store=self.store_b,
                product=p_b,
                sku="T2-TEA-1",
                label="100g",
                price_minor=55000,
                in_stock=True,
                is_active=True,
            )

    def tearDown(self):
        connection.settings_dict["CONN_MAX_AGE"] = self._orig_conn_max_age
        super().tearDown()

    def test_force_rls_and_non_superuser_role_verified_on_postgres(self):
        if connection.vendor != "postgresql":
            if os.getenv("CI"):
                self.fail("PostgreSQL FORCE RLS verification must run on PostgreSQL in CI.")
            self.skipTest("PostgreSQL-specific catalog inspection.")

        with connection.cursor() as cursor:
            from core.tenant_context import _check_shopcraft_role
            target_role = "shopcraft_app" if _check_shopcraft_role(cursor) else None
            if target_role:
                cursor.execute(
                    "SELECT rolname, rolsuper, rolbypassrls FROM pg_catalog.pg_roles WHERE rolname = %s;",
                    [target_role],
                )
            else:
                cursor.execute(
                    "SELECT rolname, rolsuper, rolbypassrls FROM pg_catalog.pg_roles WHERE rolname = current_user;"
                )
            rolname, rolsuper, rolbypassrls = cursor.fetchone()
            self.assertFalse(
                rolsuper,
                f"PostgreSQL test role '{rolname}' must be NOSUPERUSER so RLS is enforced.",
            )
            self.assertFalse(
                rolbypassrls,
                f"PostgreSQL test role '{rolname}' must be NOBYPASSRLS so RLS is enforced.",
            )

            for table_name in TENANT_TABLES:
                cursor.execute(
                    "SELECT relrowsecurity, relforcerowsecurity FROM pg_catalog.pg_class WHERE relname = %s;",
                    [table_name],
                )
                row = cursor.fetchone()
                self.assertIsNotNone(row, f"Missing tenant table {table_name}")
                relrowsecurity, relforcerowsecurity = row
                self.assertTrue(relrowsecurity, f"RLS not enabled on {table_name}")
                self.assertTrue(
                    relforcerowsecurity,
                    f"FORCE ROW LEVEL SECURITY not enabled on {table_name}",
                )

                cursor.execute(
                    "SELECT COUNT(*) FROM pg_catalog.pg_policies WHERE tablename = %s AND policyname = 'tenant_isolation_policy';",
                    [table_name],
                )
                self.assertEqual(
                    cursor.fetchone()[0],
                    1,
                    f"Missing tenant_isolation_policy on {table_name}",
                )

    def test_all_store_fk_tables_in_database_enforce_rls(self):
        """
        Dynamically inspects PostgreSQL information_schema to find every single table in
        the database that has a Foreign Key referencing stores_store(id).
        Guarantees:
        1. Every discovered table is registered in TENANT_TABLES.
        2. Every discovered table has both relrowsecurity=True and relforcerowsecurity=True in pg_class.
        3. Fails immediately if any future migration adds a table with a store FK without FORCE RLS.
        """
        if connection.vendor != "postgresql":
            self.skipTest("PostgreSQL-specific dynamic schema check.")

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT tc.table_name
                FROM information_schema.table_constraints AS tc
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = 'stores_store'
                  AND tc.table_schema = 'public'
                GROUP BY tc.table_name
                ORDER BY tc.table_name;
            """)
            db_fk_tables = sorted([r[0] for r in cursor.fetchall()])
            self.assertGreater(len(db_fk_tables), 0, "Expected at least 1 table with FK to stores_store.")

            for tbl in db_fk_tables:
                self.assertIn(
                    tbl,
                    TENANT_TABLES,
                    f"Table '{tbl}' has a Foreign Key to stores_store but is missing from TENANT_TABLES!",
                )

            for tbl in db_fk_tables:
                cursor.execute(
                    "SELECT relrowsecurity, relforcerowsecurity FROM pg_catalog.pg_class WHERE relname = %s;",
                    [tbl],
                )
                row = cursor.fetchone()
                self.assertIsNotNone(row, f"Table '{tbl}' missing from pg_class")
                relrowsecurity, relforcerowsecurity = row
                self.assertTrue(relrowsecurity, f"Table '{tbl}' lacks ENABLE ROW LEVEL SECURITY!")
                self.assertTrue(relforcerowsecurity, f"Table '{tbl}' lacks FORCE ROW LEVEL SECURITY!")

    def test_set_local_atomic_guard_and_two_tenant_pooled_connection_isolation(self):
        with self.assertRaises(RuntimeError):
            set_current_tenant_id(self.store_a.id, is_local=False)

        if connection.vendor == "postgresql":
            self.assertFalse(connection.in_atomic_block)
            with self.assertRaises(RuntimeError):
                set_current_tenant_id(self.store_a.id, is_local=True)

            # Unprivileged app role querying outside tenant context sees 0 rows because FORCE RLS is active!
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if _check_shopcraft_role(cursor):
                        cursor.execute("SET LOCAL ROLE shopcraft_app;")
                    self.assertEqual(Product.objects.count(), 0)

        client = APIClient()

        # Request 1 -> Tenant One
        res_a1 = client.get(f"/api/stores/{self.store_a.slug}/catalog/")
        self.assertEqual(res_a1.status_code, 200)
        names_a1 = [p["name"] for p in res_a1.json()["products"]]
        self.assertEqual(names_a1, ["Tenant One Exclusive Coffee"])

        # Inspect pooled connection immediately after Request 1 commit: zero leaked tenant state
        if connection.vendor == "postgresql":
            with connection.cursor() as cursor:
                cursor.execute("SELECT current_setting('app.current_store_id', true);")
                self.assertIn(cursor.fetchone()[0], ("", None))
                cursor.execute("SELECT current_user;")
                self.assertNotEqual(cursor.fetchone()[0], "shopcraft_app")
            with transaction.atomic():
                with connection.cursor() as cursor:
                    if _check_shopcraft_role(cursor):
                        cursor.execute("SET LOCAL ROLE shopcraft_app;")
                    self.assertEqual(Product.objects.count(), 0)

        # Request 2 on the SAME connection -> Tenant Two
        res_b = client.get(f"/api/stores/{self.store_b.slug}/catalog/")
        self.assertEqual(res_b.status_code, 200)
        names_b = [p["name"] for p in res_b.json()["products"]]
        self.assertEqual(names_b, ["Tenant Two Secret Tea"])

        # Request 3 -> non-existent store (404 rollback) followed by Request 4 -> Tenant One
        res_404 = client.get("/api/stores/does-not-exist-xyz/catalog/")
        self.assertEqual(res_404.status_code, 404)

        res_a2 = client.get(f"/api/stores/{self.store_a.slug}/catalog/")
        self.assertEqual(res_a2.status_code, 200)
        self.assertEqual(
            [p["name"] for p in res_a2.json()["products"]],
            ["Tenant One Exclusive Coffee"],
        )


class ProductionHardeningAndKhaltiSafetyTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="merchant.hardening@example.com", full_name="Owner")
        self.store = Store.objects.create(
            name="Himalayan Goods",
            slug="himalayan-goods",
            is_active=True,
            cod_enabled=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            prod = Product.objects.create(
                store=self.store,
                name="Handwoven Shawl",
                slug="handwoven-shawl",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=prod,
                sku="SHAWL-01",
                label="Standard",
                price_minor=150000,
                in_stock=True,
                is_active=True,
            )
            self.customer = Customer.objects.create(
                store=self.store,
                email="buyer.hardening@example.com",
                full_name="Buyer",
                phone="9841223344",
            )
        self.client = APIClient()

    def _checkout_payload(self):
        return {
            "customer_email": "buyer.hardening@example.com",
            "payment_method": "KHALTI",
            "items": [{"variant_id": self.variant.id, "quantity": 1}],
            "shipping_address": {
                "recipient_name": "Buyer",
                "phone": "9841223344",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metro",
                "ward": "3",
                "street_landmark": "Lazimpat",
            },
        }

    def test_checkout_rejects_empty_municipality_ward_and_landmark(self):
        for bad_address_patch in (
            {"municipality": ""},
            {"municipality": "   "},
            {"ward": ""},
            {"ward": "0"},
            {"ward": "36"},
            {"ward": "abc"},
            {"street_landmark": ""},
        ):
            payload = self._checkout_payload()
            payload["payment_method"] = "COD"
            payload["shipping_address"] = {
                **payload["shipping_address"],
                **bad_address_patch,
            }
            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/place/",
                payload,
                format="json",
            )
            self.assertEqual(res.status_code, 400, f"Expected 400 for {bad_address_patch}")

        with TenantDatabaseContext(self.store.id):
            self.assertEqual(Order.objects.for_store(self.store).count(), 0)

    def test_khalti_defaults_to_sandbox_and_live_requires_explicit_env_flag(self):
        self.assertEqual(self.store.khalti_mode, "TEST")
        self.assertFalse(settings.KHALTI_LIVE_ENABLED)

        self.client.force_login(self.owner)
        res = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/settings/",
            {
                "khalti_mode": "LIVE",
                "khalti_secret_key": "live_secret_key_placeholder_for_test_only",
            },
            format="json",
        )
        self.assertEqual(res.status_code, 400)
        self.store.refresh_from_db()
        self.assertEqual(self.store.khalti_mode, "TEST")

        # Even if DB has LIVE set, runtime blocks checkout when KHALTI_LIVE_ENABLED=False
        self.store.khalti_mode = "LIVE"
        self.store.set_khalti_secret_key("live_secret_key_placeholder_for_test_only")
        self.store.save(update_fields=["khalti_mode", "khalti_secret_key_encrypted"])

        checkout_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(checkout_res.status_code, 400)

    @override_settings(
        KHALTI_LIVE_ENABLED=True,
        KHALTI_PLATFORM_SANDBOX_KEY="test_secret_key_platform_sandbox_0001",
    )
    def test_khalti_sandbox_keys_and_tokens_rejected_in_live_mode(self):
        self.client.force_login(self.owner)

        # 1. Sandbox keys rejected when switching settings to LIVE
        for bad_key in (
            "test_secret_key_abc12345",
            "Key sandbox_key_abc12345",
            "test_secret_key_platform_sandbox_0001",
            "",
        ):
            res = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {"khalti_mode": "LIVE", "khalti_secret_key": bad_key},
                format="json",
            )
            self.assertEqual(res.status_code, 400)

        # 2. Checkout initiation rejects sandbox key in LIVE mode and creates 0 orders
        self.store.khalti_mode = "LIVE"
        self.store.set_khalti_secret_key("test_secret_key_abc12345")
        self.store.save(update_fields=["khalti_mode", "khalti_secret_key_encrypted"])

        place_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(place_res.status_code, 400)
        with TenantDatabaseContext(self.store.id):
            self.assertEqual(Order.objects.for_store(self.store).count(), 0)

        # 3. Verify rejects sandbox/test tokens in LIVE mode even with a valid live key
        self.store.set_khalti_secret_key("live_secret_key_valid_fixture_9999")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])
        with TenantDatabaseContext(self.store.id):
            order = Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number="#HG-LIVE-0001",
                status="PENDING_PAYMENT",
                payment_method="KHALTI",
                payment_status="UNPAID",
                subtotal_minor=150000,
                total_minor=150000,
                is_test=False,
            )

        for bad_pidx in (f"sandbox_{order.id}_abcd", "test_pidx_12345"):
            verify_res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": bad_pidx, "order_id": order.id},
                format="json",
            )
            self.assertEqual(verify_res.status_code, 400)

        with TenantDatabaseContext(self.store.id):
            order.refresh_from_db()
            self.assertEqual(order.status, "PAYMENT_FAILED")
            self.assertEqual(order.payment_status, "FAILED")

    def test_khalti_live_keys_and_tokens_rejected_in_sandbox_mode(self):
        self.assertEqual(self.store.khalti_mode, "TEST")
        self.client.force_login(self.owner)

        # 1. Live keys rejected in merchant settings while in TEST (sandbox) mode
        for live_key in ("live_secret_key_abc12345", "Key live_public_key_xyz987"):
            res = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {"khalti_mode": "TEST", "khalti_secret_key": live_key},
                format="json",
            )
            self.assertEqual(res.status_code, 400)

        # 2. Checkout initiation rejects live key in TEST mode
        self.store.set_khalti_secret_key("live_secret_key_abc12345")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])

        place_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(place_res.status_code, 400)

        # 3. Verify rejects live pidx token in TEST mode
        self.store.set_khalti_secret_key("")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])
        with TenantDatabaseContext(self.store.id):
            order = Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number="#HG-SBX-0001",
                status="PENDING_PAYMENT",
                payment_method="KHALTI",
                payment_status="UNPAID",
                subtotal_minor=150000,
                total_minor=150000,
                is_test=True,
            )

        verify_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": "live_pidx_token_9999", "order_id": order.id},
            format="json",
        )
        self.assertEqual(verify_res.status_code, 400)
        with TenantDatabaseContext(self.store.id):
            order.refresh_from_db()
            self.assertEqual(order.status, "PAYMENT_FAILED")

    @override_settings(
        SECURE_SSL_REDIRECT=True,
        SECURE_HSTS_SECONDS=86400,
        SECURE_HSTS_INCLUDE_SUBDOMAINS=False,
        SECURE_HSTS_PRELOAD=False,
        SESSION_COOKIE_SECURE=True,
        CSRF_COOKIE_SECURE=True,
        CSRF_COOKIE_HTTPONLY=False,
        SESSION_COOKIE_SAMESITE="Lax",
        CSRF_COOKIE_SAMESITE="Lax",
    )
    def test_health_check_zero_db_queries_ssl_exemption_hsts_and_cookies(self):
        # 1. Health check over plain HTTP is exempt from SSL redirect AND touches 0 DB queries
        with self.assertNumQueries(0):
            health_res = self.client.get("/api/health/")
        self.assertEqual(health_res.status_code, 200)
        self.assertEqual(health_res.json()["status"], "ok")
        self.assertNotIn("database", health_res.json())

        # 2. Normal API endpoint over plain HTTP redirects to HTTPS (301)
        http_csrf = self.client.get("/api/auth/csrf/")
        self.assertEqual(http_csrf.status_code, 301)

        # 3. Normal API endpoint behind Heroku router (X-Forwarded-Proto: https) returns 200 + HSTS + cookies
        https_csrf = self.client.get("/api/auth/csrf/", HTTP_X_FORWARDED_PROTO="https")
        self.assertEqual(https_csrf.status_code, 200)
        hsts = https_csrf["Strict-Transport-Security"]
        self.assertEqual(hsts, "max-age=86400")
        self.assertNotIn("includeSubDomains", hsts)
        self.assertNotIn("preload", hsts)

        csrf_cookie = https_csrf.cookies["csrftoken"]
        self.assertTrue(csrf_cookie["secure"])
        self.assertEqual(csrf_cookie["samesite"], "Lax")
        self.assertFalse(bool(csrf_cookie["httponly"]))

    def test_hashed_client_ip_verification_log_masks_ip(self):
        # Off by default -> nothing logged
        with self.assertNoLogs("shopcraft.security", level="INFO"):
            self.client.get(
                "/api/auth/csrf/",
                HTTP_X_FORWARDED_FOR="198.51.100.77, 203.0.113.10",
            )

        # Enabled via env flag -> logs only 12-char salted hash of rightmost X-Forwarded-For, never raw IP
        with override_settings(
            LOG_HASHED_CLIENT_IP=True,
            TRUSTED_PROXY_HEADER="HTTP_X_FORWARDED_FOR",
        ):
            with self.assertLogs("shopcraft.security", level="INFO") as captured:
                self.client.get(
                    "/api/auth/csrf/",
                    HTTP_X_FORWARDED_FOR="10.0.0.1, 203.0.113.10",
                )
                self.client.get(
                    "/api/auth/csrf/",
                    HTTP_X_FORWARDED_FOR="10.9.9.9, 203.0.113.10",
                )
                self.client.get(
                    "/api/auth/csrf/",
                    HTTP_X_FORWARDED_FOR="198.51.100.22",
                )

            joined = "\n".join(captured.output)
            self.assertNotIn("203.0.113.10", joined)
            self.assertNotIn("198.51.100.22", joined)
            self.assertNotIn("10.0.0.1", joined)

            hashes = re.findall(r"ip_hash=([0-9a-f]{12})", joined)
            self.assertEqual(len(hashes), 3)
            self.assertEqual(hashes[0], hashes[1])  # Same device matches
            self.assertNotEqual(hashes[0], hashes[2])  # Different device differs

    def test_production_startup_secret_validation_fails_closed(self):
        valid_secret = "prod-strong-random-key-with-more-than-32-characters-xyz"
        valid_fernet = "OTg3NjU0MzIxMDk4NzY1NDMyMTA5ODc2NTQzMjEwOTg="

        validate_production_security_settings(
            debug=False,
            secret_key=valid_secret,
            field_encryption_key=valid_fernet,
            allowed_hosts=["api.example.com"],
        )

        for bad_secret in ("", DEFAULT_DEV_SECRET_KEY, "django-insecure-abcdef12345678901234567890123456", "short-key"):
            with self.assertRaises(ImproperlyConfigured):
                validate_production_security_settings(
                    debug=False,
                    secret_key=bad_secret,
                    field_encryption_key=valid_fernet,
                    allowed_hosts=["api.example.com"],
                )

        with self.assertRaises(ImproperlyConfigured):
            validate_production_security_settings(
                debug=False,
                secret_key=valid_secret,
                field_encryption_key=DEFAULT_DEV_FERNET_KEY,
                allowed_hosts=["api.example.com"],
            )

        with self.assertRaises(ImproperlyConfigured):
            validate_production_security_settings(
                debug=False,
                secret_key=valid_secret,
                field_encryption_key=valid_fernet,
                allowed_hosts=[],
            )

    def test_cloudinary_signed_upload_and_ephemeral_fs_guard(self):
        self.client.force_login(self.owner)

        # In production without Cloudinary configured (ALLOW_LOCAL_MEDIA_UPLOADS=False), returns 503
        with override_settings(
            ALLOW_LOCAL_MEDIA_UPLOADS=False,
            CLOUDINARY_CLOUD_NAME="",
            CLOUDINARY_API_KEY="",
            CLOUDINARY_API_SECRET="",
        ):
            img = SimpleUploadedFile("item.png", b"png-bytes", content_type="image/png")
            res_503 = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/media/upload/",
                {"file": img},
                format="multipart",
            )
            self.assertEqual(res_503.status_code, 503)

        # With Cloudinary configured, signs upload and returns HTTPS Cloudinary secure_url
        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "secure_url": "https://res.cloudinary.com/demo-cloud/image/upload/v1700000/shopcraft/stores/himalayan-goods/products/prod_1.png"
        }
        mock_session.post.return_value = mock_resp

        with override_settings(
            ALLOW_LOCAL_MEDIA_UPLOADS=False,
            CLOUDINARY_CLOUD_NAME="demo-cloud",
            CLOUDINARY_API_KEY="123456789",
            CLOUDINARY_API_SECRET="cloudinary-unit-test-placeholder",
        ), patch("stores.cloudinary_upload.get_shared_http_session", return_value=mock_session):
            img2 = SimpleUploadedFile("shawl.png", b"png-bytes", content_type="image/png")
            res_ok = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/media/upload/",
                {"file": img2},
                format="multipart",
            )
            self.assertEqual(res_ok.status_code, 201)
            self.assertTrue(res_ok.json()["url"].startswith("https://res.cloudinary.com/demo-cloud/"))
            mock_session.post.assert_called_once()


class ThemeMediaSignedUploadTests(APITransactionTestCase):
    """
    Tests for Cloudinary signed uploads of theme media (hero image and logo):
    - Authenticated store members only (404 otherwise, RLS intact)
    - Key strictly includes store ID
    - Image format verification with Pillow (JPEG, PNG, WebP only; rejects SVG & spoofed files)
    - File size limits (hero: 5MB, logo: 2MB)
    - Local media uploads cannot be on in production (DEBUG=False)
    - Strict CDN host & folder validation on settings update with field-level 400s
    - Unchanged legacy URLs do not block saving other settings
    - Best-effort asset deletion on replace strictly scoped to current store folder
    """
    def setUp(self):
        self.owner = User.objects.create_user("theme.owner@example.com", full_name="Theme Owner")
        self.other_user = User.objects.create_user("theme.other@example.com", full_name="Other User")
        self.store = Store.objects.create(name="Himalayan Teas", slug="himalayan-teas", is_active=True)
        self.other_store = Store.objects.create(name="Other Store", slug="other-store", is_active=True)

        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
        with TenantDatabaseContext(self.other_store.id):
            StoreMembership.objects.create(store=self.other_store, user=self.other_user, role="OWNER")

        self.client = APIClient()
        self.client.force_authenticate(user=self.owner)

    @staticmethod
    def _make_image(fmt="PNG", color="red", size=(50, 50)):
        buf = io.BytesIO()
        img = Image.new("RGB", size, color=color)
        img.save(buf, format=fmt)
        return buf.getvalue()

    def test_unauthenticated_and_non_member_access_returns_404(self):
        img_bytes = self._make_image("PNG")
        upload = SimpleUploadedFile("hero.png", img_bytes, content_type="image/png")

        # 1. Anonymous client returns 404
        anon_client = APIClient()
        res_anon = anon_client.post(
            f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
            {"file": upload, "asset_type": "hero"},
            format="multipart",
        )
        self.assertEqual(res_anon.status_code, 404)

        # 2. Member of another store returns 404
        other_client = APIClient()
        other_client.force_authenticate(user=self.other_user)
        upload.seek(0)
        res_other = other_client.post(
            f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
            {"file": upload, "asset_type": "hero"},
            format="multipart",
        )
        self.assertEqual(res_other.status_code, 404)

    def test_key_includes_store_id_and_returns_f_auto_q_auto_cloudinary_url(self):
        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "secure_url": f"https://res.cloudinary.com/demo-cloud/image/upload/v1700000/shopcraft/stores/{self.store.id}_himalayan-teas/theme/store_{self.store.id}_hero_1.png"
        }
        mock_session.post.return_value = mock_resp

        img_bytes = self._make_image("PNG")
        upload = SimpleUploadedFile("hero.png", img_bytes, content_type="image/png")

        with override_settings(
            ALLOW_LOCAL_MEDIA_UPLOADS=False,
            CLOUDINARY_CLOUD_NAME="demo-cloud",
            CLOUDINARY_API_KEY="123456789",
            CLOUDINARY_API_SECRET="test-secret",
        ), patch("stores.cloudinary_upload.get_shared_http_session", return_value=mock_session):
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
                {"file": upload, "asset_type": "hero"},
                format="multipart",
            )
            self.assertEqual(res.status_code, 201)
            data = res.json()
            self.assertTrue(data["success"])
            self.assertIn("f_auto,q_auto", data["url"])
            self.assertIn(f"shopcraft/stores/{self.store.id}_himalayan-teas/theme", data["public_id"])

            # Verify parameters sent to Cloudinary API include store ID in folder and public_id
            call_kwargs = mock_session.post.call_args[1]
            post_data = call_kwargs["data"]
            self.assertEqual(post_data["folder"], f"shopcraft/stores/{self.store.id}_himalayan-teas/theme")
            self.assertTrue(post_data["public_id"].startswith(f"store_{self.store.id}_hero_"))
            self.assertTrue(bool(post_data["signature"]))

    def test_pillow_image_verification_rejects_spoofed_and_svg(self):
        # 1. Spoofed text file posing as PNG
        spoofed = SimpleUploadedFile("fake.png", b"Not a real image binary", content_type="image/png")
        res_spoofed = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
            {"file": spoofed, "asset_type": "hero"},
            format="multipart",
        )
        self.assertEqual(res_spoofed.status_code, 400)
        self.assertIn("Invalid or corrupted image file.", res_spoofed.json()["error"])

        # 2. SVG file rejected
        svg = SimpleUploadedFile("vector.svg", b"<svg><circle r='10'/></svg>", content_type="image/svg+xml")
        res_svg = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
            {"file": svg, "asset_type": "logo"},
            format="multipart",
        )
        self.assertEqual(res_svg.status_code, 400)
        self.assertIn("SVG", res_svg.json()["error"])

        # 3. Invalid asset_type rejected
        img_bytes = self._make_image("PNG")
        valid_img = SimpleUploadedFile("test.png", img_bytes, content_type="image/png")
        res_invalid_type = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
            {"file": valid_img, "asset_type": "invalid_type"},
            format="multipart",
        )
        self.assertEqual(res_invalid_type.status_code, 400)

    def test_size_limits_hero_and_logo(self):
        # 1. Hero > 5MB
        huge_hero = SimpleUploadedFile("hero.png", b"x" * (5 * 1024 * 1024 + 10), content_type="image/png")
        res_hero = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
            {"file": huge_hero, "asset_type": "hero"},
            format="multipart",
        )
        self.assertEqual(res_hero.status_code, 400)
        self.assertIn("5MB limit", res_hero.json()["error"])

        # 2. Logo > 2MB
        huge_logo = SimpleUploadedFile("logo.png", b"x" * (2 * 1024 * 1024 + 10), content_type="image/png")
        res_logo = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
            {"file": huge_logo, "asset_type": "logo"},
            format="multipart",
        )
        self.assertEqual(res_logo.status_code, 400)
        self.assertIn("2MB limit", res_logo.json()["error"])

    def test_production_guard_blocks_local_uploads_when_debug_false(self):
        img_bytes = self._make_image("PNG")
        upload = SimpleUploadedFile("hero.png", img_bytes, content_type="image/png")

        with override_settings(
            DEBUG=False,
            IS_TEST_COMMAND=False,
            ALLOW_LOCAL_MEDIA_UPLOADS=True,
            CLOUDINARY_CLOUD_NAME="",
            CLOUDINARY_API_KEY="",
            CLOUDINARY_API_SECRET="",
        ):
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
                {"file": upload, "asset_type": "hero"},
                format="multipart",
            )
            self.assertEqual(res.status_code, 503)

    def test_settings_strict_cdn_validation_field_level_400(self):
        with override_settings(
            CLOUDINARY_CLOUD_NAME="demo-cloud",
            CLOUDINARY_API_KEY="123456789",
            CLOUDINARY_API_SECRET="test-secret",
        ):
            # 1. Attempt to set banner_url from another store's folder -> 400 with banner_url error
            res_wrong_store = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {
                    "banner_url": f"https://res.cloudinary.com/demo-cloud/image/upload/v1/shopcraft/stores/{self.other_store.id}_other-store/theme/banner.jpg"
                },
                format="json",
            )
            self.assertEqual(res_wrong_store.status_code, 400)
            self.assertIn("banner_url", res_wrong_store.json())

            # 2. Attempt to set logo_url from external host -> 400 with logo_url error
            res_external = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {
                    "logo_url": "https://external-cdn.com/logo.png"
                },
                format="json",
            )
            self.assertEqual(res_external.status_code, 400)
            self.assertIn("logo_url", res_external.json())

            # 3. Unchanged legacy URL does NOT block editing other settings
            self.store.banner_url = "https://images.unsplash.com/legacy-banner.jpg"
            self.store.save()

            res_legacy_ok = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {
                    "tagline": "Updated organic specialty tea tagline."
                },
                format="json",
            )
            self.assertEqual(res_legacy_ok.status_code, 200)
            self.store.refresh_from_db()
            self.assertEqual(self.store.tagline, "Updated organic specialty tea tagline.")
            self.assertEqual(self.store.banner_url, "https://images.unsplash.com/legacy-banner.jpg")

            # 4. Valid CDN URL inside this store's folder succeeds
            valid_banner = f"https://res.cloudinary.com/demo-cloud/image/upload/v1/shopcraft/stores/{self.store.id}_himalayan-teas/theme/banner.jpg"
            res_valid = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {
                    "banner_url": valid_banner
                },
                format="json",
            )
            self.assertEqual(res_valid.status_code, 200)
            self.store.refresh_from_db()
            self.assertEqual(self.store.banner_url, valid_banner)

    def test_deletion_on_replace_strictly_scoped_to_own_store(self):
        old_banner = f"https://res.cloudinary.com/demo-cloud/image/upload/v1/shopcraft/stores/{self.store.id}_himalayan-teas/theme/old_banner.jpg"
        self.store.banner_url = old_banner
        self.store.save()

        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"result": "ok"}
        mock_session.post.return_value = mock_resp

        new_banner = f"https://res.cloudinary.com/demo-cloud/image/upload/v1/shopcraft/stores/{self.store.id}_himalayan-teas/theme/new_banner.jpg"

        with override_settings(
            CLOUDINARY_CLOUD_NAME="demo-cloud",
            CLOUDINARY_API_KEY="123456789",
            CLOUDINARY_API_SECRET="test-secret",
        ), patch("stores.cloudinary_upload.get_shared_http_session", return_value=mock_session):
            res = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {"banner_url": new_banner},
                format="json",
            )
            self.assertEqual(res.status_code, 200)
            mock_session.post.assert_called_once()
            call_kwargs = mock_session.post.call_args[1]
            self.assertEqual(
                call_kwargs["data"]["public_id"],
                f"shopcraft/stores/{self.store.id}_himalayan-teas/theme/old_banner",
            )

        # Verify: If old URL had another store's asset, deletion must NOT be triggered
        self.store.banner_url = f"https://res.cloudinary.com/demo-cloud/image/upload/v1/shopcraft/stores/{self.other_store.id}_other-store/theme/foreign_banner.jpg"
        self.store.save()

        mock_session_2 = MagicMock()
        with override_settings(
            CLOUDINARY_CLOUD_NAME="demo-cloud",
            CLOUDINARY_API_KEY="123456789",
            CLOUDINARY_API_SECRET="test-secret",
        ), patch("stores.cloudinary_upload.get_shared_http_session", return_value=mock_session_2):
            res_foreign = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/settings/",
                {"banner_url": new_banner},
                format="json",
            )
            self.assertEqual(res_foreign.status_code, 200)
            # Destroy endpoint must NOT be called for the foreign asset!
            mock_session_2.post.assert_not_called()

    def test_per_user_rate_limiting_enforced(self):
        from django.core.cache import cache
        cache.clear()

        mock_session = MagicMock()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "secure_url": f"https://res.cloudinary.com/demo-cloud/image/upload/v1/shopcraft/stores/{self.store.id}_himalayan-teas/theme/store_{self.store.id}_hero_1.png"
        }
        mock_session.post.return_value = mock_resp

        img_bytes = self._make_image("PNG")

        with override_settings(
            CLOUDINARY_CLOUD_NAME="demo-cloud",
            CLOUDINARY_API_KEY="123456789",
            CLOUDINARY_API_SECRET="test-secret",
        ), patch("stores.cloudinary_upload.get_shared_http_session", return_value=mock_session):
            for i in range(30):
                upload = SimpleUploadedFile(f"hero_{i}.png", img_bytes, content_type="image/png")
                res = self.client.post(
                    f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
                    {"file": upload, "asset_type": "hero"},
                    format="multipart",
                )
                self.assertEqual(res.status_code, 201)

            # 31st request from same authenticated user hits rate limit
            upload_31 = SimpleUploadedFile("hero_31.png", img_bytes, content_type="image/png")
            res_31 = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/media/theme/upload/",
                {"file": upload_31, "asset_type": "hero"},
                format="multipart",
            )
            self.assertEqual(res_31.status_code, 429)



class UserMembershipContextAndPoolerLeakageTests(APITransactionTestCase):
    """
    Verifies that UserMembershipContext scopes access strictly to request.user.id,
    and proves that neither app.current_user_id nor app.bypass_rls leaks to subsequent
    queries on pooled connections across commits, rollbacks, and nested atomic blocks.
    """
    def setUp(self):
        self.user_a = User.objects.create_user("user.a@example.com", full_name="User A")
        self.user_b = User.objects.create_user("user.b@example.com", full_name="User B")
        self.store_a = Store.objects.create(name="Store A", slug="store-a-leakage", is_active=True)
        self.store_b = Store.objects.create(name="Store B", slug="store-b-leakage", is_active=True)
        with TenantDatabaseContext(self.store_a.id):
            StoreMembership.objects.create(store=self.store_a, user=self.user_a, role="OWNER")
        with TenantDatabaseContext(self.store_b.id):
            StoreMembership.objects.create(store=self.store_b, user=self.user_b, role="OWNER")

    def test_user_membership_context_requires_positive_integer_user_id(self):
        with self.assertRaises(ValueError):
            UserMembershipContext(0)
        with self.assertRaises(ValueError):
            UserMembershipContext(-5)
        with self.assertRaises(ValueError):
            UserMembershipContext("not-an-int")  # type: ignore

    def test_user_membership_policy_allows_own_memberships_only(self):
        """User A sees only Store A membership; User B sees only Store B membership."""
        if connection.vendor != "postgresql":
            self.skipTest("PostgreSQL-specific RLS check.")

        with UserMembershipContext(self.user_a.id):
            mems = list(StoreMembership.all_objects.filter(user=self.user_a))
            self.assertEqual(len(mems), 1)
            self.assertEqual(mems[0].store_id, self.store_a.id)

            # Attempting to query User B's membership while User A context is active returns 0
            mems_b = list(StoreMembership.all_objects.filter(user=self.user_b))
            self.assertEqual(len(mems_b), 0)

    def test_user_membership_context_cleans_up_on_commit_and_does_not_leak(self):
        """After exiting UserMembershipContext, app.current_user_id is completely cleared."""
        if connection.vendor != "postgresql":
            self.skipTest("PostgreSQL-specific setting check.")

        with UserMembershipContext(self.user_a.id):
            with connection.cursor() as cursor:
                cursor.execute("SELECT current_setting('app.current_user_id', true);")
                self.assertEqual(cursor.fetchone()[0], str(self.user_a.id))

        # Immediately check on the same connection after context exit: must be empty
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('app.current_user_id', true);")
            val = cursor.fetchone()[0]
            self.assertIn(val, ("", None), "app.current_user_id leaked on connection after exit!")

    def test_user_membership_context_nested_atomic_and_rollback_leakage(self):
        """Verifies that an inner atomic block rollback clears app.current_user_id."""
        if connection.vendor != "postgresql":
            self.skipTest("PostgreSQL-specific setting check.")

        try:
            with transaction.atomic():
                with UserMembershipContext(self.user_a.id):
                    with connection.cursor() as cursor:
                        cursor.execute("SELECT current_setting('app.current_user_id', true);")
                        self.assertEqual(cursor.fetchone()[0], str(self.user_a.id))
                    # Force an unexpected rollback
                    raise RuntimeError("Forced rollback inside nested atomic block")
        except RuntimeError:
            pass

        # Verify on same connection that setting is cleared and does not leak
        with connection.cursor() as cursor:
            cursor.execute("SELECT current_setting('app.current_user_id', true);")
            val = cursor.fetchone()[0]
            self.assertIn(val, ("", None), "app.current_user_id leaked on connection after rollback!")

    def test_set_local_bypass_rls_on_does_not_reveal_other_tenants_data(self):
        """
        Critical test: executing SET LOCAL app.bypass_rls = 'on' must NOT reveal
        any tenant rows, because app.bypass_rls has been completely removed from policies.
        """
        if connection.vendor != "postgresql":
            self.skipTest("PostgreSQL-specific RLS check.")

        with transaction.atomic():
            with connection.cursor() as cursor:
                # Malicious or legacy attempt to set app.bypass_rls = 'on'
                cursor.execute(
                    "SET LOCAL ROLE shopcraft_app; "
                    "SET LOCAL app.bypass_rls = 'on'; "
                    "SELECT set_config('app.current_store_id', '', true); "
                    "SELECT set_config('app.current_user_id', '', true);"
                )
                # Verify across tenant models that 0 rows are returned
                for model in (StoreMembership, Customer, Product, Variant, Order):
                    count = model.objects.count()
                    self.assertEqual(
                        count,
                        0,
                        f"Model {model._meta.db_table} revealed rows when app.bypass_rls='on' was set!",
                    )
                cursor.execute("SET LOCAL ROLE NONE;")


class StoreCreationConcurrencyTests(APITransactionTestCase):
    """
    Verifies that select_for_update() row locking in StoreCreateView serializes
    concurrent requests for the same merchant, preventing any race condition
    from exceeding the 3-store cap.
    """
    def test_concurrent_store_creations_serialize_under_select_for_update_cap(self):
        if connection.vendor != "postgresql":
            self.skipTest("Row locking select_for_update concurrency requires PostgreSQL.")
        import concurrent.futures
        from django.db import connections

        user = User.objects.create_user("concurrent.merchant@example.com", full_name="Concurrent Merchant")
        client_ip = "198.51.100.210"

        def create_store(idx):
            # Create a separate API client and run request
            c = APIClient()
            c.force_authenticate(user=user)
            resp = c.post(
                "/api/stores/create/",
                {
                    "name": f"Concurrent Store {idx}",
                    "slug": f"concurrent-store-{idx}",
                    "category": "Retail",
                    "city": "Kathmandu",
                    "province": "Bagmati",
                },
                format="json",
                REMOTE_ADDR=f"198.51.100.{idx + 211}",
            )
            # Close thread connection cleanly
            connections.close_all()
            return resp.status_code, resp.json()

        # Run 4 simultaneous store creations for this user (cap is 3)
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            futures = [executor.submit(create_store, i) for i in range(1, 5)]
            results = [f.result() for f in futures]

        status_codes = [r[0] for r in results]
        success_count = status_codes.count(201)
        rejected_count = status_codes.count(400)

        self.assertEqual(success_count, 3, f"Expected exactly 3 successes, got {success_count}. Statuses: {status_codes}")
        self.assertEqual(rejected_count, 1, f"Expected 1 rejection, got {rejected_count}. Statuses: {status_codes}")

        # Assert total stores owned by this user in database is exactly 3
        with UserMembershipContext(user.id):
            total_owned = StoreMembership.all_objects.filter(user=user, role="OWNER").count()
            self.assertEqual(total_owned, 3)


class GatewayKeyExposureAndFernetScannerTests(TestCase):
    """
    Ensures that gateway secrets and Fernet ciphertext (prefix 'gAAAA') never leak in
    any public or merchant response body, and that staff roles never see gateway fields.
    """
    def setUp(self):
        self.owner = User.objects.create_user("owner@secstore.com", full_name="Store Owner")
        self.staff = User.objects.create_user("staff@secstore.com", full_name="Store Staff")
        self.store = Store.objects.create(
            name="Security Test Store",
            slug="sec-test-store",
            is_active=True,
            khalti_mode="TEST",
        )
        self.store.set_khalti_secret_key("test_secret_key_khalti_super_secret_9988")
        self.store.save()

        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            StoreMembership.objects.create(store=self.store, user=self.staff, role="STAFF")
            Product.objects.create(store=self.store, name="Security Product", slug="sec-prod", is_active=True)

    def test_scan_responses_for_fernet_ciphertext_prefix_gAAAA(self):
        """Scans public and merchant responses to guarantee 'gAAAA' Fernet tokens never leak."""
        client = APIClient()

        # 1. Public Store Detail
        res_detail = client.get(f"/api/stores/{self.store.slug}/")
        self.assertEqual(res_detail.status_code, 200)
        self.assertNotIn("gAAAA", res_detail.content.decode("utf-8"))
        self.assertNotIn("khalti_secret_key", res_detail.json())
        self.assertNotIn("khalti_mode", res_detail.json())

        # 2. Public Store Catalog
        res_cat = client.get(f"/api/stores/{self.store.slug}/catalog/")
        self.assertEqual(res_cat.status_code, 200)
        self.assertNotIn("gAAAA", res_cat.content.decode("utf-8"))

        # 3. Store Creation Response
        client.force_authenticate(user=self.owner)
        res_create = client.post(
            "/api/stores/create/",
            {"name": "No Leak Store", "slug": "no-leak-store"},
            format="json",
            REMOTE_ADDR="198.51.100.188",
        )
        self.assertEqual(res_create.status_code, 201)
        self.assertNotIn("gAAAA", res_create.content.decode("utf-8"))
        self.assertNotIn("khalti_secret_key", res_create.json())

    def test_merchant_settings_role_based_gateway_visibility(self):
        """Owner receives masked gateway key; Staff role never sees any gateway fields."""
        client = APIClient()

        # As OWNER:
        client.force_authenticate(user=self.owner)
        res_owner = client.get(f"/api/merchant/stores/{self.store.slug}/settings/")
        self.assertEqual(res_owner.status_code, 200)
        owner_data = res_owner.json()
        self.assertIn("has_custom_khalti_key", owner_data)
        self.assertTrue(owner_data["has_custom_khalti_key"])
        self.assertIn("khalti_key_masked", owner_data)
        self.assertTrue(owner_data["khalti_key_masked"].endswith("9988"))
        self.assertNotIn("test_secret_key", res_owner.content.decode("utf-8"))
        self.assertNotIn("gAAAA", res_owner.content.decode("utf-8"))

        # As STAFF:
        client.force_authenticate(user=self.staff)
        res_staff = client.get(f"/api/merchant/stores/{self.store.slug}/settings/")
        self.assertEqual(res_staff.status_code, 200)
        staff_data = res_staff.json()
        # Staff MUST NOT see any gateway fields
        self.assertNotIn("has_custom_khalti_key", staff_data)
        self.assertNotIn("khalti_mode", staff_data)
        self.assertNotIn("khalti_key_masked", staff_data)
        self.assertNotIn("khalti_secret_key", staff_data)
        self.assertNotIn("gAAAA", res_staff.content.decode("utf-8"))

    def test_gateway_secrets_are_never_logged(self):
        """Verifies that gateway secret keys and Fernet strings are never logged."""
        import logging
        from io import StringIO

        log_stream = StringIO()
        handler = logging.StreamHandler(log_stream)
        handler.setLevel(logging.DEBUG)
        root_logger = logging.getLogger()
        root_logger.addHandler(handler)

        try:
            secret = "live_secret_key_strictly_confidential_776655"
            client = APIClient()
            client.force_authenticate(user=self.owner)
            with override_settings(KHALTI_LIVE_ENABLED=True):
                res = client.patch(
                    f"/api/merchant/stores/{self.store.slug}/settings/",
                    {"khalti_secret_key": secret, "khalti_mode": "LIVE"},
                    format="json",
                )
                self.assertEqual(res.status_code, 200)

            logged_output = log_stream.getvalue()
            self.assertNotIn(secret, logged_output, "Raw gateway secret key was logged!")
            self.assertNotIn("gAAAA", logged_output, "Fernet encrypted gateway ciphertext was logged!")
        finally:
            root_logger.removeHandler(handler)


class ActionRateLimitCleanupTests(TestCase):
    """Verifies that ActionRateLimit purge logic cleans up rows older than 24 hours."""
    def test_cleanup_expired_and_management_command(self):
        from datetime import timedelta
        from django.core.management import call_command
        from django.utils import timezone
        from stores.models import ActionRateLimit
        from io import StringIO

        now = timezone.now()
        # Create 3 expired rows (25h, 30h, 48h old)
        r1 = ActionRateLimit.objects.create(action="check_slug", ip_hash="hash1")
        r2 = ActionRateLimit.objects.create(action="check_slug", ip_hash="hash2")
        r3 = ActionRateLimit.objects.create(action="store_create", ip_hash="hash3")
        ActionRateLimit.objects.filter(id__in=[r1.id, r2.id, r3.id]).update(
            created_at=now - timedelta(hours=26)
        )

        # Create 2 recent rows (10 minutes old)
        ActionRateLimit.objects.create(action="check_slug", ip_hash="recent_hash1")
        ActionRateLimit.objects.create(action="store_create", ip_hash="recent_hash2")

        self.assertEqual(ActionRateLimit.objects.count(), 5)

        # Execute management command
        out = StringIO()
        call_command("cleanup_rate_limits", "--hours", "24", stdout=out)
        self.assertIn("Successfully purged 3 ActionRateLimit row(s)", out.getvalue())

        # Assert only the 2 recent rows remain
        self.assertEqual(ActionRateLimit.objects.count(), 2)
