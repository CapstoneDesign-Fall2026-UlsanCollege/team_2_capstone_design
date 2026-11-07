import os
import re
from unittest.mock import MagicMock, patch

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ImproperlyConfigured
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import connection
from django.test import TestCase, override_settings
from rest_framework.test import APIClient, APITransactionTestCase

from catalog.models import Product, Variant
from core.settings import (
    DEFAULT_DEV_FERNET_KEY,
    DEFAULT_DEV_SECRET_KEY,
    validate_production_security_settings,
)
from core.tenant_context import (
    TENANT_TABLES,
    TenantDatabaseContext,
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

            # Table owner querying outside tenant context sees 0 rows because FORCE RLS is active!
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
