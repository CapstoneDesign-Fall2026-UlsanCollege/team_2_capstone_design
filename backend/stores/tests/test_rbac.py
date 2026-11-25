import io
import shutil
from PIL import Image
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import DeliveryAddress
from catalog.models import Discount, Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order
from stores.models import Customer, MerchantAuditLog, Store, StoreMembership

User = get_user_model()


def _make_png_upload(name: str = "test.png") -> SimpleUploadedFile:
    buf = io.BytesIO()
    Image.new("RGB", (16, 16), color="teal").save(buf, format="PNG")
    return SimpleUploadedFile(name, buf.getvalue(), content_type="image/png")


class MerchantRBACAndCrossTenantMatrixTests(APITestCase):
    """
    Exhaustive role-based access control (RBAC) and cross-merchant tenant isolation
    verification across every merchant console and customer isolation endpoint.
    """

    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        uploads_root = settings.BASE_DIR.parent / "frontend" / "public" / "uploads" / "stores"
        if uploads_root.exists():
            for p in uploads_root.glob("*rbac-*"):
                if p.is_dir():
                    shutil.rmtree(p, ignore_errors=True)

    @classmethod
    def setUpTestData(cls):
        # Store A & its roles
        cls.owner_a = User.objects.create_user(
            "owner-a@rbac.test",
            full_name="Owner A",
            phone="9800000001",
        )
        cls.co_owner_a = User.objects.create_user(
            "coowner-a@rbac.test",
            full_name="CoOwner A",
            phone="9800000002",
        )
        cls.staff_a = User.objects.create_user(
            "staff-a@rbac.test",
            full_name="Staff A",
            phone="9800000003",
        )
        cls.store_a = Store.objects.create(
            slug="rbac-store-a",
            name="RBAC Store A",
            is_active=True,
            khalti_mode="TEST",
            cod_enabled=True,
        )
        cls.store_a.set_khalti_secret_key("test_secret_key_rbac_store_a_1234")
        cls.store_a.save()

        # Store B (competitor store) & its roles
        cls.owner_b = User.objects.create_user(
            "owner-b@rbac.test",
            full_name="Owner B",
            phone="9800000004",
        )
        cls.staff_b = User.objects.create_user(
            "staff-b@rbac.test",
            full_name="Staff B",
            phone="9800000005",
        )
        cls.store_b = Store.objects.create(
            slug="rbac-store-b",
            name="RBAC Store B",
            is_active=True,
        )

        # Inactive store owned by owner_a
        cls.inactive_store = Store.objects.create(
            slug="rbac-inactive-store",
            name="Inactive Store",
            is_active=False,
        )

        # Shopper on Store A (NO merchant membership anywhere)
        cls.shopper_a = User.objects.create_user(
            "shopper-a@rbac.test",
            full_name="Shopper A",
            phone="9800000006",
        )
        cls.shopper_b = User.objects.create_user(
            "shopper-b@rbac.test",
            full_name="Shopper B",
            phone="9800000007",
        )

        # Django platform staff/superuser WITHOUT StoreMembership in Store A
        cls.django_staff = User.objects.create_user(
            "django-staff@rbac.test",
            full_name="Django Staff",
            is_staff=True,
        )
        cls.django_superuser = User.objects.create_user(
            "django-super@rbac.test",
            full_name="Django Super",
            is_staff=True,
            is_superuser=True,
        )

        # Deactivated user who still holds a StoreMembership row in DB
        cls.disabled_user = User.objects.create_user(
            "disabled-owner@rbac.test",
            full_name="Disabled Owner",
            is_active=False,
        )

        # Delivery address for Shopper B
        cls.addr_b = DeliveryAddress.objects.create(
            user=cls.shopper_b,
            label="Home",
            recipient_name="Shopper B",
            phone="9800000007",
            province="Bagmati",
            district="Kathmandu",
            municipality="Kathmandu Metropolitan",
            ward=26,
            street_landmark="Thamel Street 1",
        )

        with TenantDatabaseContext(cls.store_a.id):
            cls.owner_a_mem = StoreMembership.objects.create(
                store=cls.store_a, user=cls.owner_a, role="OWNER"
            )
            cls.co_owner_a_mem = StoreMembership.objects.create(
                store=cls.store_a, user=cls.co_owner_a, role="OWNER"
            )
            cls.staff_a_mem = StoreMembership.objects.create(
                store=cls.store_a, user=cls.staff_a, role="STAFF"
            )
            cls.disabled_mem = StoreMembership.objects.create(
                store=cls.store_a, user=cls.disabled_user, role="OWNER"
            )

            cls.prod_a = Product.objects.create(
                store=cls.store_a,
                slug="a-tea",
                name="Store A Tea",
                is_active=True,
                allow_one_time=True,
            )
            cls.var_a = Variant.objects.create(
                store=cls.store_a,
                product=cls.prod_a,
                sku="RBAC-A-100G",
                label="100g",
                price_minor=50000,
                in_stock=True,
                is_active=True,
                allow_one_time=True,
            )
            cls.cust_a = Customer.objects.create(
                store=cls.store_a,
                user=cls.shopper_a,
                email=cls.shopper_a.email,
                full_name="Shopper A",
                phone="9800000006",
            )
            cls.order_a = Order.objects.create(
                store=cls.store_a,
                customer=cls.cust_a,
                order_number="#RB-A-0001",
                status="CONFIRMED",
                payment_method="COD",
                payment_status="COD_PENDING",
                subtotal_minor=50000,
                shipping_minor=10000,
                total_minor=60000,
            )
            cls.discount_a = Discount.objects.create(
                store=cls.store_a,
                code="RBACA10",
                discount_type="PERCENTAGE",
                value=10,
                is_active=True,
            )
            cls.audit_a = MerchantAuditLog.objects.create(
                store=cls.store_a,
                actor=cls.owner_a,
                action="STORE_CREATE",
                entity_type="Store",
                entity_id=str(cls.store_a.id),
                details={"name": cls.store_a.name},
            )

        with TenantDatabaseContext(cls.store_b.id):
            cls.owner_b_mem = StoreMembership.objects.create(
                store=cls.store_b, user=cls.owner_b, role="OWNER"
            )
            cls.staff_b_mem = StoreMembership.objects.create(
                store=cls.store_b, user=cls.staff_b, role="STAFF"
            )
            cls.prod_b = Product.objects.create(
                store=cls.store_b,
                slug="b-honey",
                name="Store B Honey",
                is_active=True,
                allow_one_time=True,
            )
            cls.var_b = Variant.objects.create(
                store=cls.store_b,
                product=cls.prod_b,
                sku="RBAC-B-500G",
                label="500g",
                price_minor=90000,
                in_stock=True,
                is_active=True,
                allow_one_time=True,
            )
            cls.cust_b = Customer.objects.create(
                store=cls.store_b,
                user=cls.shopper_b,
                email=cls.shopper_b.email,
                full_name="Shopper B",
                phone="9800000007",
            )
            cls.order_b = Order.objects.create(
                store=cls.store_b,
                customer=cls.cust_b,
                order_number="#RB-B-0001",
                status="CONFIRMED",
                payment_method="COD",
                payment_status="COD_PENDING",
                subtotal_minor=90000,
                shipping_minor=10000,
                total_minor=100000,
            )
            cls.discount_b = Discount.objects.create(
                store=cls.store_b,
                code="RBACB15",
                discount_type="PERCENTAGE",
                value=15,
                is_active=True,
            )

        with TenantDatabaseContext(cls.inactive_store.id):
            StoreMembership.objects.create(
                store=cls.inactive_store, user=cls.owner_a, role="OWNER"
            )

    def _merchant_routes_for_store(self, slug: str, ids: dict) -> list[tuple[str, str, dict | None, str]]:
        """Returns (method, url, payload, format) for all 19 merchant console endpoints."""
        p_id = ids["product_id"]
        v_id = ids["variant_id"]
        o_id = ids["order_id"]
        c_id = ids["customer_id"]
        d_id = ids["discount_id"]
        s_id = ids["staff_id"]
        base = f"/api/merchant/stores/{slug}"
        return [
            ("get", f"{base}/overview/", None, "json"),
            ("get", f"{base}/analytics/", None, "json"),
            ("get", f"{base}/discounts/", None, "json"),
            ("post", f"{base}/discounts/", {"code": "HACK10", "discount_type": "PERCENTAGE", "value": 10}, "json"),
            ("patch", f"{base}/discounts/{d_id}/", {"is_active": False}, "json"),
            ("delete", f"{base}/discounts/{d_id}/", None, "json"),
            ("get", f"{base}/staff/", None, "json"),
            ("post", f"{base}/staff/", {"email": "evil@rbac.test", "role": "OWNER"}, "json"),
            ("patch", f"{base}/staff/{s_id}/", {"role": "STAFF"}, "json"),
            ("delete", f"{base}/staff/{s_id}/", None, "json"),
            ("get", f"{base}/settings/", None, "json"),
            ("patch", f"{base}/settings/", {"name": "Hijacked Name"}, "json"),
            ("post", f"{base}/media/upload/", {"file": _make_png_upload("p.png")}, "multipart"),
            ("post", f"{base}/media/theme/upload/", {"file": _make_png_upload("t.png"), "asset_type": "hero"}, "multipart"),
            ("get", f"{base}/audit-logs/", None, "json"),
            ("get", f"{base}/products/", None, "json"),
            ("post", f"{base}/products/", {"name": "Injected", "slug": "injected", "initial_price_minor": 10000}, "json"),
            ("get", f"{base}/products/{p_id}/", None, "json"),
            ("patch", f"{base}/products/{p_id}/", {"name": "Hijacked Product"}, "json"),
            ("delete", f"{base}/products/{p_id}/", None, "json"),
            ("post", f"{base}/products/{p_id}/variants/", {"label": "250g", "price_minor": 20000}, "json"),
            ("get", f"{base}/products/{p_id}/variants/{v_id}/", None, "json"),
            ("patch", f"{base}/products/{p_id}/variants/{v_id}/", {"price_minor": 100}, "json"),
            ("delete", f"{base}/products/{p_id}/variants/{v_id}/", None, "json"),
            ("get", f"{base}/inventory/", None, "json"),
            ("get", f"{base}/orders/", None, "json"),
            ("get", f"{base}/orders/{o_id}/", None, "json"),
            ("post", f"{base}/orders/{o_id}/transition/", {"to_status": "PROCESSING"}, "json"),
            ("get", f"{base}/customers/", None, "json"),
            ("get", f"{base}/customers/{c_id}/", None, "json"),
        ]

    def _call(self, method: str, url: str, data=None, fmt: str = "json"):
        fn = getattr(self.client, method)
        if data is not None:
            return fn(url, data, format=fmt)
        return fn(url)

    def _store_a_ids(self):
        return {
            "product_id": self.prod_a.id,
            "variant_id": self.var_a.id,
            "order_id": self.order_a.id,
            "customer_id": self.cust_a.id,
            "discount_id": self.discount_a.id,
            "staff_id": self.staff_a_mem.id,
        }

    def test_anonymous_blocked_across_all_19_merchant_routes(self):
        self.client.force_authenticate(user=None)
        for method, url, payload, fmt in self._merchant_routes_for_store(
            self.store_a.slug, self._store_a_ids()
        ):
            res = self._call(method, url, payload, fmt)
            expected = (
                status.HTTP_404_NOT_FOUND
                if "/media/theme/upload/" in url
                else status.HTTP_401_UNAUTHORIZED
            )
            self.assertEqual(
                res.status_code,
                expected,
                f"Expected {expected} for anonymous {method.upper()} {url}, got {res.status_code}",
            )

    def test_non_members_and_foreign_merchants_get_404_on_all_19_routes(self):
        """
        Proves strict cross-merchant isolation and fail-closed membership:
        - Shopper A (only a customer, no StoreMembership) -> 404 everywhere
        - Foreign Owner B (OWNER of Store B) -> 404 everywhere on Store A
        - Foreign Staff B (STAFF of Store B) -> 404 everywhere on Store A
        - Django is_staff (no StoreMembership) -> 404 everywhere on Store A
        - Django is_superuser (no StoreMembership) -> 404 everywhere on Store A
        - Disabled user (is_active=False, even with OWNER membership) -> 401/404 everywhere
        """
        blocked_actors = [
            ("shopper_a", self.shopper_a),
            ("foreign_owner_b", self.owner_b),
            ("foreign_staff_b", self.staff_b),
            ("django_staff", self.django_staff),
            ("django_superuser", self.django_superuser),
            ("disabled_user", self.disabled_user),
        ]
        for label, actor in blocked_actors:
            self.client.force_authenticate(user=actor)
            for method, url, payload, fmt in self._merchant_routes_for_store(
                self.store_a.slug, self._store_a_ids()
            ):
                res = self._call(method, url, payload, fmt)
                self.assertEqual(
                    res.status_code,
                    status.HTTP_404_NOT_FOUND,
                    f"{label} got {res.status_code} (expected 404) on {method.upper()} {url}",
                )

    def test_cross_store_resource_id_idor_blocked_with_404(self):
        """
        Owner B authenticates against their own store slug (/rbac-store-b/) while
        passing Store A resource IDs (product, variant, order, customer, discount, staff).
        Must strictly return 404 Not Found on every endpoint.
        """
        self.client.force_authenticate(user=self.owner_b)
        base_b = f"/api/merchant/stores/{self.store_b.slug}"
        idor_calls = [
            ("get", f"{base_b}/products/{self.prod_a.id}/", None),
            ("patch", f"{base_b}/products/{self.prod_a.id}/", {"name": "Stolen"}),
            ("delete", f"{base_b}/products/{self.prod_a.id}/?permanent=true", None),
            ("post", f"{base_b}/products/{self.prod_a.id}/variants/", {"label": "X", "price_minor": 1000}),
            ("get", f"{base_b}/products/{self.prod_a.id}/variants/{self.var_a.id}/", None),
            ("get", f"{base_b}/products/{self.prod_b.id}/variants/{self.var_a.id}/", None),
            ("patch", f"{base_b}/products/{self.prod_b.id}/variants/{self.var_a.id}/", {"price_minor": 500}),
            ("delete", f"{base_b}/products/{self.prod_b.id}/variants/{self.var_a.id}/?permanent=true", None),
            ("get", f"{base_b}/orders/{self.order_a.id}/", None),
            ("post", f"{base_b}/orders/{self.order_a.id}/transition/", {"to_status": "CANCELLED"}),
            ("get", f"{base_b}/customers/{self.cust_a.id}/", None),
            ("patch", f"{base_b}/discounts/{self.discount_a.id}/", {"is_active": False}),
            ("delete", f"{base_b}/discounts/{self.discount_a.id}/", None),
            ("patch", f"{base_b}/staff/{self.staff_a_mem.id}/", {"role": "OWNER"}),
            ("delete", f"{base_b}/staff/{self.staff_a_mem.id}/", None),
        ]
        for method, url, payload in idor_calls:
            res = self._call(method, url, payload, "json")
            self.assertEqual(
                res.status_code,
                status.HTTP_404_NOT_FOUND,
                f"Cross-store IDOR succeeded or leaked wrong status ({res.status_code}) on {method.upper()} {url}",
            )

    def test_inactive_store_blocked_even_for_owner_and_omitted_from_my_stores(self):
        self.client.force_authenticate(user=self.owner_a)
        res_ov = self.client.get(f"/api/merchant/stores/{self.inactive_store.slug}/overview/")
        self.assertEqual(res_ov.status_code, status.HTTP_404_NOT_FOUND)

        res_stores = self.client.get("/api/stores/my-stores/")
        self.assertEqual(res_stores.status_code, status.HTTP_200_OK)
        slugs = [s["slug"] for s in res_stores.json()["stores"]]
        self.assertIn(self.store_a.slug, slugs)
        self.assertNotIn(self.inactive_store.slug, slugs)
        self.assertIn("private", res_stores["Cache-Control"].lower())
        self.assertIn("no-store", res_stores["Cache-Control"].lower())

        # Disabled user cannot enumerate stores either
        self.client.force_authenticate(user=self.disabled_user)
        res_disabled = self.client.get("/api/stores/my-stores/")
        self.assertEqual(res_disabled.status_code, status.HTTP_200_OK)
        self.assertEqual(res_disabled.json()["stores"], [])

    @override_settings(DEBUG=True, ALLOW_LOCAL_MEDIA_UPLOADS=True)
    def test_same_store_staff_allowed_vs_denied_rbac_boundaries(self):
        """
        Verifies the full STAFF vs OWNER permission matrix inside Store A:
        - STAFF ALLOWED: overview, analytics, products/variants CRUD & soft-archive,
          product image upload, orders list/detail/transition, customers list/detail,
          discounts CRUD, GET /settings/ (without Khalti fields), GET /staff/ (other phones redacted).
        - STAFF DENIED (403): PATCH /settings/ (any field), POST /media/theme/upload/,
          GET /audit-logs/, POST/PATCH/DELETE /staff/, and ?permanent=true product/variant deletes.
        """
        self.client.force_authenticate(user=self.staff_a)
        base = f"/api/merchant/stores/{self.store_a.slug}"

        # 1. Read-only operational views work
        ov = self.client.get(f"{base}/overview/")
        self.assertEqual(ov.status_code, 200)
        self.assertEqual(ov.json()["member_role"], "STAFF")
        self.assertIn("no-store", ov["Cache-Control"].lower())

        self.assertEqual(self.client.get(f"{base}/analytics/").status_code, 200)
        self.assertEqual(self.client.get(f"{base}/orders/").status_code, 200)
        self.assertEqual(self.client.get(f"{base}/orders/{self.order_a.id}/").status_code, 200)
        self.assertEqual(self.client.get(f"{base}/customers/").status_code, 200)
        self.assertEqual(self.client.get(f"{base}/customers/{self.cust_a.id}/").status_code, 200)
        self.assertEqual(self.client.get(f"{base}/products/").status_code, 200)
        self.assertEqual(self.client.get(f"{base}/discounts/").status_code, 200)

        # 2. GET /settings/ omits gateway secrets/mode for STAFF
        settings_res = self.client.get(f"{base}/settings/")
        self.assertEqual(settings_res.status_code, 200)
        s_json = settings_res.json()
        self.assertEqual(s_json["member_role"], "STAFF")
        self.assertNotIn("khalti_mode", s_json)
        self.assertNotIn("has_custom_khalti_key", s_json)
        self.assertNotIn("khalti_key_masked", s_json)

        # 3. GET /staff/ redacts other members' phone numbers for STAFF, keeps own phone
        staff_res = self.client.get(f"{base}/staff/")
        self.assertEqual(staff_res.status_code, 200)
        members_by_email = {m["email"]: m for m in staff_res.json()["members"]}
        self.assertEqual(members_by_email[self.owner_a.email]["phone"], "")
        self.assertEqual(members_by_email[self.staff_a.email]["phone"], "9800000003")

        # 4. STAFF operational mutations work
        # Product media upload allowed
        up_prod = self.client.post(
            f"{base}/media/upload/",
            {"file": _make_png_upload("staff-item.png")},
            format="multipart",
        )
        self.assertEqual(up_prod.status_code, 201)

        # Create/edit/soft-archive product & variant allowed
        prod_create = self.client.post(
            f"{base}/products/",
            {"name": "Staff Created Cake", "slug": "staff-cake", "initial_price_minor": 45000},
            format="json",
        )
        self.assertEqual(prod_create.status_code, 201)
        new_pid = prod_create.json()["id"]

        var_create = self.client.post(
            f"{base}/products/{new_pid}/variants/",
            {"label": "Large", "price_minor": 75000},
            format="json",
        )
        self.assertEqual(var_create.status_code, 201)
        new_vid = var_create.json()["id"]

        # Create promo code allowed
        disc_res = self.client.post(
            f"{base}/discounts/",
            {"code": "STAFF10", "discount_type": "PERCENTAGE", "value": 10},
            format="json",
        )
        self.assertEqual(disc_res.status_code, 201)

        # Order transition allowed
        trans_res = self.client.post(
            f"{base}/orders/{self.order_a.id}/transition/",
            {"to_status": "PROCESSING"},
            format="json",
        )
        self.assertEqual(trans_res.status_code, 200)

        # 5. STAFF DENIED (403) on EVERY OWNER-only mutation/view:
        # 5a. PATCH /settings/ blocked for ALL fields (not just Khalti)
        settings_payloads = [
            {"name": "Renamed By Staff"},
            {"cod_enabled": False},
            {"inside_valley_shipping_minor": 0, "outside_valley_shipping_minor": 0},
            {"theme_preset": "midnight-ink"},
            {"tagline": "Unauthorized slogan"},
            {"banner_url": ""},
            {"khalti_secret_key": "live_secret_key_attacker"},
            {"custom_domain": "evil.com"},
        ]
        for payload in settings_payloads:
            r = self.client.patch(f"{base}/settings/", payload, format="json")
            self.assertEqual(
                r.status_code,
                status.HTTP_403_FORBIDDEN,
                f"STAFF unexpectedly allowed to PATCH settings with {payload} (status {r.status_code})",
            )

        # 5b. Theme media upload blocked (both hero & logo)
        for asset_type in ("hero", "logo"):
            r = self.client.post(
                f"{base}/media/theme/upload/",
                {"file": _make_png_upload(f"{asset_type}.png"), "asset_type": asset_type},
                format="multipart",
            )
            self.assertEqual(r.status_code, status.HTTP_403_FORBIDDEN)

        # 5c. Security audit logs blocked
        r_audit = self.client.get(f"{base}/audit-logs/")
        self.assertEqual(r_audit.status_code, status.HTTP_403_FORBIDDEN)

        # 5d. Staff invite / self-promotion / demotion / removal blocked
        self.assertEqual(
            self.client.post(
                f"{base}/staff/", {"email": "friend@rbac.test", "role": "STAFF"}, format="json"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        # Self-escalation attempt
        self.assertEqual(
            self.client.patch(
                f"{base}/staff/{self.staff_a_mem.id}/", {"role": "OWNER"}, format="json"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        # Owner demotion attempt
        self.assertEqual(
            self.client.patch(
                f"{base}/staff/{self.owner_a_mem.id}/", {"role": "STAFF"}, format="json"
            ).status_code,
            status.HTTP_403_FORBIDDEN,
        )
        # Removal attempt
        self.assertEqual(
            self.client.delete(f"{base}/staff/{self.owner_a_mem.id}/").status_code,
            status.HTTP_403_FORBIDDEN,
        )

        # 5e. Permanent deletion blocked with 403 for STAFF
        r_perm_var = self.client.delete(
            f"{base}/products/{new_pid}/variants/{new_vid}/?permanent=true"
        )
        self.assertEqual(r_perm_var.status_code, status.HTTP_403_FORBIDDEN)
        r_perm_prod = self.client.delete(f"{base}/products/{new_pid}/?permanent=true")
        self.assertEqual(r_perm_prod.status_code, status.HTTP_403_FORBIDDEN)

        # Soft-archive still succeeds for STAFF
        r_soft_var = self.client.delete(f"{base}/products/{new_pid}/variants/{new_vid}/")
        self.assertEqual(r_soft_var.status_code, status.HTTP_200_OK)
        r_soft_prod = self.client.delete(f"{base}/products/{new_pid}/")
        self.assertEqual(r_soft_prod.status_code, status.HTTP_200_OK)

        # Verify database state remained untouched on owner-only fields
        self.store_a.refresh_from_db()
        self.assertEqual(self.store_a.name, "RBAC Store A")
        self.assertTrue(self.store_a.cod_enabled)

        # 6. OWNER can perform all owner-only actions & audit log captures them
        self.client.force_authenticate(user=self.owner_a)
        self.assertEqual(self.client.get(f"{base}/audit-logs/").status_code, 200)
        self.assertEqual(
            self.client.patch(f"{base}/settings/", {"tagline": "Owner Verified"}, format="json").status_code,
            200,
        )
        r_theme_up = self.client.post(
            f"{base}/media/theme/upload/",
            {"file": _make_png_upload("owner-hero.png"), "asset_type": "hero"},
            format="multipart",
        )
        self.assertEqual(r_theme_up.status_code, 201)

        self.assertEqual(
            self.client.delete(
                f"{base}/products/{new_pid}/variants/{new_vid}/?permanent=true"
            ).status_code,
            204,
        )
        self.assertEqual(
            self.client.delete(f"{base}/products/{new_pid}/?permanent=true").status_code,
            204,
        )
        with TenantDatabaseContext(self.store_a.id):
            actions = list(
                MerchantAuditLog.objects.for_store(self.store_a).values_list("action", flat=True)
            )
        self.assertIn("VARIANT_PERMANENT_DELETE", actions)
        self.assertIn("PRODUCT_PERMANENT_DELETE", actions)
        self.assertIn("SETTINGS_UPDATE", actions)

    def test_realtime_demotion_and_revocation_and_staff_invite_hygiene(self):
        """
        Verifies:
        - Malformed staff invite emails rejected with 400.
        - Newly invited user gets an unusable password.
        - Demoting co-owner to STAFF immediately drops owner permissions (403 on audit-logs/settings).
        - Removing membership immediately revokes all access (404) & removes store from /my-stores/.
        """
        base = f"/api/merchant/stores/{self.store_a.slug}"
        self.client.force_authenticate(user=self.owner_a)

        # 1. Invalid email rejected
        bad_email_res = self.client.post(
            f"{base}/staff/",
            {"email": "not-an-email@invalid", "role": "STAFF"},
            format="json",
        )
        self.assertEqual(bad_email_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Invite brand new user -> unusable password
        inv_res = self.client.post(
            f"{base}/staff/",
            {"email": "fresh-hire@rbac.test", "full_name": "Fresh Hire", "role": "STAFF"},
            format="json",
        )
        self.assertEqual(inv_res.status_code, status.HTTP_201_CREATED)
        fresh_user = User.objects.get(email="fresh-hire@rbac.test")
        self.assertFalse(fresh_user.has_usable_password())

        # 3. Co-owner starts with owner access
        self.client.force_authenticate(user=self.co_owner_a)
        self.assertEqual(self.client.get(f"{base}/audit-logs/").status_code, 200)

        # Owner A demotes co-owner to STAFF
        self.client.force_authenticate(user=self.owner_a)
        demote = self.client.patch(
            f"{base}/staff/{self.co_owner_a_mem.id}/",
            {"role": "STAFF"},
            format="json",
        )
        self.assertEqual(demote.status_code, 200)

        # Co-owner immediately loses owner rights -> 403
        self.client.force_authenticate(user=self.co_owner_a)
        self.assertEqual(self.client.get(f"{base}/audit-logs/").status_code, 403)
        self.assertEqual(
            self.client.patch(f"{base}/settings/", {"name": "Blocked"}, format="json").status_code,
            403,
        )

        # Owner A removes demoted member completely
        self.client.force_authenticate(user=self.owner_a)
        self.assertEqual(
            self.client.delete(f"{base}/staff/{self.co_owner_a_mem.id}/").status_code, 200
        )

        # Removed member immediately receives 404 & store disappears from /my-stores/
        self.client.force_authenticate(user=self.co_owner_a)
        self.assertEqual(self.client.get(f"{base}/overview/").status_code, 404)
        self.assertEqual(self.client.get("/api/stores/my-stores/").json()["stores"], [])

    def test_shopper_and_delivery_address_cross_user_isolation(self):
        """Merchant A cannot access Shopper B's saved delivery addresses or Store B's orders."""
        self.client.force_authenticate(user=self.owner_a)

        # Delivery address belongs strictly to Shopper B
        self.assertEqual(
            self.client.patch(
                f"/api/auth/addresses/{self.addr_b.id}/", {"label": "Hacked"}, format="json"
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.delete(f"/api/auth/addresses/{self.addr_b.id}/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        list_res = self.client.get("/api/auth/addresses/")
        self.assertEqual(list_res.status_code, 200)
        self.assertEqual(list_res.json(), [])

        # Shopper B's order in Store B cannot be fetched by integer ID by Owner A without UUID token
        res_order = self.client.get(
            f"/api/stores/{self.store_b.slug}/public-orders/{self.order_b.id}/"
        )
        self.assertEqual(res_order.status_code, status.HTTP_404_NOT_FOUND)
