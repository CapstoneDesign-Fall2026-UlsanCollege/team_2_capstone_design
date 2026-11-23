from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from catalog.models import Discount, Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order, OrderItem
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class ImageUrlEdgeCaseTests(TestCase):
    """Exhaustive boundary & adversarial checks for ProductSerializer.validate_image_url (Bug 1)."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="edge.img.owner@example.com",
            full_name="Image Owner",
        )
        self.store = Store.objects.create(
            name="Edge Image Store",
            slug="edge-image-store",
            is_active=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.product = Product.objects.create(
                store=self.store,
                name="Base Product",
                slug="base-product",
                image_url="https://cdn.example.com/initial.png",
                is_active=True,
            )

    def test_valid_urls_relative_paths_clearing_and_max_length_boundary(self):
        self.client.force_authenticate(user=self.owner)

        valid_cases = [
            ("/uploads/stores/1_a/pic.webp", "/uploads/stores/1_a/pic.webp"),
            ("/images/products/tea-250g.jpg", "/images/products/tea-250g.jpg"),
            ("https://res.cloudinary.com/demo/image/upload/v1/tea.png", "https://res.cloudinary.com/demo/image/upload/v1/tea.png"),
            ("http://example.com/photo.jpg", "http://example.com/photo.jpg"),
            ("", ""),
            ("   ", ""),
        ]
        for idx, (submitted, expected) in enumerate(valid_cases):
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/products/",
                {"name": f"Valid Img {idx}", "image_url": submitted},
                format="json",
            )
            self.assertEqual(
                res.status_code,
                status.HTTP_201_CREATED,
                f"Expected 201 for valid image_url={submitted!r}, got {res.status_code}: {res.json()}",
            )
            self.assertEqual(res.json()["image_url"], expected)

        # Exact 200-char valid URL allowed; 201-char URL rejected
        prefix = "https://example.com/"
        exact_200 = prefix + ("a" * (200 - len(prefix)))
        over_200 = exact_200 + "b"
        self.assertEqual(len(exact_200), 200)
        self.assertEqual(len(over_200), 201)

        ok_200 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {"name": "Max Len 200", "image_url": exact_200},
            format="json",
        )
        self.assertEqual(ok_200.status_code, status.HTTP_201_CREATED)

        bad_201 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/products/",
            {"name": "Over Len 201", "image_url": over_200},
            format="json",
        )
        self.assertEqual(bad_201.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("image_url", bad_201.json())

        # PATCH switching https -> relative -> empty clearing -> back to https
        for url in [
            "/uploads/stores/1_a/switched.webp",
            "",
            "https://cdn.example.com/final.png",
        ]:
            patch_res = self.client.patch(
                f"/api/merchant/stores/{self.store.slug}/products/{self.product.id}/",
                {"image_url": url},
                format="json",
            )
            self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
            self.assertEqual(patch_res.json()["image_url"], url)

    def test_adversarial_and_traversal_image_urls_rejected_with_400(self):
        self.client.force_authenticate(user=self.owner)
        bad_urls = [
            "/images/",
            "/uploads/",
            "/uploads/   ",
            "/uploads/a\\b.png",
            "/uploads/%2e%2e/secret.png",
            "/uploads/%2E%2E/secret.png",
            "/uploads/a%5cb.png",
            "/uploads/a%2fb.png",
            '/uploads/x"onerror=1',
            "/images/<script>.png",
            "/images/a'b.png",
            "/images/a`b.png",
            "/images/a b.png",
            "/uploads/a\nb.png",
            "//evil.com/x.png",
            "javascript:alert(1)",
            "data:image/png;base64,AAAA",
            "ftp://example.com/a.png",
            "/etc/passwd",
            "file:///etc/passwd",
            "/uploads/../etc/passwd",
        ]
        for bad_url in bad_urls:
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/products/",
                {"name": "Adversarial Image", "image_url": bad_url},
                format="json",
            )
            self.assertEqual(
                res.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Expected 400 for adversarial image_url={bad_url!r}, got {res.status_code}",
            )
            self.assertIn("image_url", res.json())


class CatalogSlugSkuCollisionEdgeCaseTests(TestCase):
    """Exhaustive boundary checks for SKU/slug collisions, initial_price_minor & tenant scoping (Bug 2)."""

    def setUp(self):
        self.client = APIClient()
        self.owner_a = User.objects.create_user(
            email="edge.sku.a@example.com",
            full_name="Owner A",
        )
        self.owner_b = User.objects.create_user(
            email="edge.sku.b@example.com",
            full_name="Owner B",
        )
        self.store_a = Store.objects.create(
            name="Edge Store A",
            slug="edge-store-a",
            is_active=True,
        )
        self.store_b = Store.objects.create(
            name="Edge Store B",
            slug="edge-store-b",
            is_active=True,
        )
        with TenantDatabaseContext(self.store_a.id):
            StoreMembership.objects.create(store=self.store_a, user=self.owner_a, role="OWNER")
            self.prod_a = Product.objects.create(
                store=self.store_a,
                name="Tea",
                slug="tea",
                is_active=True,
            )
        with TenantDatabaseContext(self.store_b.id):
            StoreMembership.objects.create(store=self.store_b, user=self.owner_b, role="OWNER")

    def test_auto_sku_skips_occupied_slots_after_deletes_and_explicit_skus(self):
        self.client.force_authenticate(user=self.owner_a)
        v1 = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/",
            {"label": "V1", "price_minor": 10000},
            format="json",
        )
        v2 = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/",
            {"label": "V2", "price_minor": 20000},
            format="json",
        )
        v3 = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/",
            {"label": "V3", "price_minor": 30000},
            format="json",
        )
        self.assertEqual(v1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(v2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(v3.status_code, status.HTTP_201_CREATED)

        # Explicitly pre-occupy the next candidate index -4 so the auto loop must jump past it
        prefix = f"{self.store_a.slug.upper()[:4]}-{self.prod_a.id}"
        explicit_v4 = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/",
            {"label": "V4-Explicit", "sku": f"{prefix}-4", "price_minor": 40000},
            format="json",
        )
        self.assertEqual(explicit_v4.status_code, status.HTTP_201_CREATED)

        # Delete first & middle variants permanently, then create another auto-SKU variant
        self.assertEqual(
            self.client.delete(
                f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/{v1.json()['id']}/?permanent=true"
            ).status_code,
            status.HTTP_204_NO_CONTENT,
        )
        self.assertEqual(
            self.client.delete(
                f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/{v2.json()['id']}/?permanent=true"
            ).status_code,
            status.HTTP_204_NO_CONTENT,
        )

        v_auto = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/",
            {"label": "V5-Auto", "price_minor": 50000},
            format="json",
        )
        self.assertEqual(v_auto.status_code, status.HTTP_201_CREATED)
        self.assertEqual(v_auto.json()["sku"], f"{prefix}-5")

        # Delete all remaining variants permanently and create again
        for vid in [v3.json()["id"], explicit_v4.json()["id"], v_auto.json()["id"]]:
            self.assertEqual(
                self.client.delete(
                    f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/{vid}/?permanent=true"
                ).status_code,
                status.HTTP_204_NO_CONTENT,
            )
        v_fresh = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/",
            {"label": "Fresh", "price_minor": 15000},
            format="json",
        )
        self.assertEqual(v_fresh.status_code, status.HTTP_201_CREATED)

    def test_non_ascii_symbol_names_generate_unique_item_fallback_slugs(self):
        self.client.force_authenticate(user=self.owner_a)
        r1 = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/",
            {"name": "हिमालयन चिया"},
            format="json",
        )
        r2 = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/",
            {"name": "!!!"},
            format="json",
        )
        r3 = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/",
            {"name": "@@@"},
            format="json",
        )
        self.assertEqual(r1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(r3.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            [r1.json()["slug"], r2.json()["slug"], r3.json()["slug"]],
            ["item", "item-1", "item-2"],
        )

    def test_initial_price_minor_validation_and_zero_price_variant_creation(self):
        self.client.force_authenticate(user=self.owner_a)

        # initial_price_minor = 0 is valid and creates a Rs. 0 variant
        zero_res = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/",
            {"name": "Free Sample", "initial_price_minor": 0},
            format="json",
        )
        self.assertEqual(zero_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(zero_res.json()["variants"]), 1)
        self.assertEqual(zero_res.json()["variants"][0]["price_minor"], 0)

        # Omitted initial_price_minor creates 0 variants
        no_var = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/",
            {"name": "Draft Item"},
            format="json",
        )
        self.assertEqual(no_var.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(no_var.json()["variants"]), 0)

        # Invalid numeric/boolean/overflow initial_price_minor inputs must return 400
        for bad_price in [-1, True, False, 12.5, 2_147_483_648]:
            res = self.client.post(
                f"/api/merchant/stores/{self.store_a.slug}/products/",
                {"name": "Bad Price Item", "initial_price_minor": bad_price},
                format="json",
            )
            self.assertEqual(
                res.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Expected 400 for initial_price_minor={bad_price!r}, got {res.status_code}",
            )

        # Unparseable non-numeric strings fall back to 0-variant product creation (Issue #63 contract)
        ignored_str = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/",
            {"name": "Ignored Str Price", "initial_price_minor": "abc"},
            format="json",
        )
        self.assertEqual(ignored_str.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(ignored_str.json()["variants"]), 0)

    def test_patch_self_update_blank_sku_negative_price_and_cross_tenant_isolation(self):
        self.client.force_authenticate(user=self.owner_a)
        v = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/",
            {"label": "Standard", "sku": "SHARED-SKU-01", "price_minor": 25000},
            format="json",
        )
        self.assertEqual(v.status_code, status.HTTP_201_CREATED)
        vid = v.json()["id"]

        # Self-update with same slug and same SKU must succeed (200)
        p_self = self.client.patch(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/",
            {"slug": "tea", "name": "Renamed Tea"},
            format="json",
        )
        self.assertEqual(p_self.status_code, status.HTTP_200_OK)

        v_self = self.client.patch(
            f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/{vid}/",
            {"sku": "SHARED-SKU-01", "label": "Standard 250g"},
            format="json",
        )
        self.assertEqual(v_self.status_code, status.HTTP_200_OK)

        # Blank or whitespace SKU on PATCH must return 400; negative price_minor must return 400
        for bad_patch in [{"sku": ""}, {"sku": "   "}, {"sku": None}, {"price_minor": -100}]:
            bad_v = self.client.patch(
                f"/api/merchant/stores/{self.store_a.slug}/products/{self.prod_a.id}/variants/{vid}/",
                bad_patch,
                format="json",
            )
            self.assertEqual(
                bad_v.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Expected 400 for variant PATCH {bad_patch!r}, got {bad_v.status_code}",
            )

        # Cross-tenant isolation: Store B can reuse identical slug & SKU
        self.client.force_authenticate(user=self.owner_b)
        prod_b = self.client.post(
            f"/api/merchant/stores/{self.store_b.slug}/products/",
            {"name": "Tea B", "slug": "tea"},
            format="json",
        )
        self.assertEqual(prod_b.status_code, status.HTTP_201_CREATED)
        var_b = self.client.post(
            f"/api/merchant/stores/{self.store_b.slug}/products/{prod_b.json()['id']}/variants/",
            {"label": "Standard", "sku": "SHARED-SKU-01", "price_minor": 30000},
            format="json",
        )
        self.assertEqual(var_b.status_code, status.HTTP_201_CREATED)


class RevenueAnalyticsSpendEdgeCaseTests(TestCase):
    """Exhaustive revenue, COD lifecycle swing, repeat customer & cancel idempotency checks (Bug 5)."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="edge.rev.owner@example.com",
            full_name="Rev Owner",
        )
        self.shopper_user = User.objects.create_user(
            email="edge.rev.shopper@example.com",
            full_name="Rev Shopper",
            phone="9800000101",
        )
        self.store = Store.objects.create(
            name="Edge Rev Store",
            slug="edge-rev-store",
            is_active=True,
            cod_enabled=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.customer = Customer.objects.create(
                store=self.store,
                user=self.shopper_user,
                full_name="Rev Shopper",
                email=self.shopper_user.email,
                phone="9800000101",
            )
            self.product = Product.objects.create(
                store=self.store,
                name="Yak Cheese",
                slug="yak-cheese",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=self.product,
                sku="YAK-100",
                label="100g",
                price_minor=50000,
                in_stock=True,
                is_active=True,
            )

    def _create_order(
        self,
        order_number: str,
        status_val: str,
        payment_method: str,
        payment_status: str,
        total_minor: int,
        qty: int = 1,
        discount=None,
        discount_redeemed: bool = False,
    ):
        order = Order.objects.create(
            store=self.store,
            customer=self.customer,
            order_number=order_number,
            status=status_val,
            payment_method=payment_method,
            payment_status=payment_status,
            subtotal_minor=total_minor,
            shipping_minor=0,
            discount_minor=0,
            discount=discount,
            discount_redeemed=discount_redeemed,
            total_minor=total_minor,
            shipping_address_snapshot={"province": "Bagmati", "district": "Kathmandu"},
        )
        OrderItem.objects.create(
            store=self.store,
            order=order,
            variant=self.variant,
            product_name_snapshot="Yak Cheese",
            variant_label_snapshot="100g",
            unit_price_minor=total_minor // max(1, qty),
            quantity=qty,
            line_total_minor=total_minor,
        )
        return order

    def test_empty_store_returns_zero_kpis_across_all_endpoints(self):
        self.client.force_authenticate(user=self.owner)
        for rng in ("7d", "30d", "90d", "all"):
            ana = self.client.get(f"/api/merchant/stores/{self.store.slug}/analytics/?range={rng}")
            self.assertEqual(ana.status_code, status.HTTP_200_OK)
            kpis = ana.json()["kpis"]
            self.assertEqual(kpis["orders_count"], 0)
            self.assertEqual(kpis["gross_sales_minor"], 0)
            self.assertEqual(kpis["paid_sales_minor"], 0)
            self.assertEqual(kpis["aov_minor"], 0)
            self.assertEqual(kpis["repeat_customer_rate_pct"], 0)
            self.assertEqual(ana.json()["top_products"], [])

        ov = self.client.get(f"/api/merchant/stores/{self.store.slug}/overview/").json()
        self.assertEqual(ov["orders_count"], 0)
        self.assertEqual(ov["revenue_minor"], 0)

        custs = self.client.get(f"/api/merchant/stores/{self.store.slug}/customers/").json()
        self.assertEqual(custs[0]["total_spent_minor"], 0)

    def test_mixed_orders_and_full_cod_delivery_undo_revenue_swing(self):
        with TenantDatabaseContext(self.store.id):
            # 1 real paid Khalti order (Rs. 500)
            self._create_order("#ED-1", "PAID", "KHALTI", "PAID", 50000, qty=1)
            # 2 cancelled paid orders (Rs. 1,000 each) -> excluded everywhere
            self._create_order("#ED-2", "CANCELLED", "KHALTI", "PAID", 100000, qty=2)
            self._create_order("#ED-3", "CANCELLED", "COD", "PAID", 100000, qty=2)
            # 2 unpaid abandoned PENDING_PAYMENT orders -> excluded everywhere
            self._create_order("#ED-4", "PENDING_PAYMENT", "KHALTI", "UNPAID", 80000, qty=1)
            self._create_order("#ED-5", "PAYMENT_FAILED", "KHALTI", "FAILED", 90000, qty=1)
            # 1 live COD order (Rs. 700) starting at CONFIRMED
            cod_order = self._create_order("#ED-6", "CONFIRMED", "COD", "COD_PENDING", 70000, qty=1)

        self.client.force_authenticate(user=self.owner)
        # Before COD delivery: orders_count=2 (paid Khalti + confirmed COD), gross=120000, paid=50000, cod_pending=70000
        ana = self.client.get(f"/api/merchant/stores/{self.store.slug}/analytics/?range=all").json()
        self.assertEqual(ana["kpis"]["orders_count"], 2)
        self.assertEqual(ana["kpis"]["gross_sales_minor"], 120000)
        self.assertEqual(ana["kpis"]["paid_sales_minor"], 50000)
        self.assertEqual(ana["kpis"]["cod_pending_minor"], 70000)
        self.assertEqual(ana["kpis"]["repeat_customers"], 1)

        ov = self.client.get(f"/api/merchant/stores/{self.store.slug}/overview/").json()
        self.assertEqual(ov["orders_count"], 2)
        self.assertEqual(ov["revenue_minor"], 50000)
        self.assertEqual(ov["cod_pending_minor"], 70000)

        # Advance COD: CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED
        for step in ("PROCESSING", "SHIPPED", "DELIVERED"):
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/orders/{cod_order.id}/transition/",
                {"to_status": step},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_200_OK)

        # After delivery: paid revenue = 50000 + 70000 = 120000, cod_pending = 0
        ana_deliv = self.client.get(f"/api/merchant/stores/{self.store.slug}/analytics/?range=30d").json()
        self.assertEqual(ana_deliv["kpis"]["paid_sales_minor"], 120000)
        self.assertEqual(ana_deliv["kpis"]["cod_pending_minor"], 0)
        ov_deliv = self.client.get(f"/api/merchant/stores/{self.store.slug}/overview/").json()
        self.assertEqual(ov_deliv["revenue_minor"], 120000)

        # Storefront shopper account GET & PATCH both show 120000 (excluding cancelled & failed orders)
        self.client.force_authenticate(user=self.shopper_user)
        acct_get = self.client.get(f"/api/stores/{self.store.slug}/account/").json()
        self.assertEqual(acct_get["customer"]["total_spent_minor"], 120000)
        acct_patch = self.client.patch(
            f"/api/stores/{self.store.slug}/account/",
            {"full_name": "Rev Shopper Updated"},
            format="json",
        )
        self.assertEqual(acct_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(acct_patch.json()["customer"]["total_spent_minor"], 120000)

        # Undo DELIVERED -> SHIPPED: reverts payment_status to COD_PENDING and drops revenue back to 50000
        self.client.force_authenticate(user=self.owner)
        undo_res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{cod_order.id}/transition/",
            {"to_status": "SHIPPED"},
            format="json",
        )
        self.assertEqual(undo_res.status_code, status.HTTP_200_OK)
        self.assertEqual(undo_res.json()["payment_status"], "COD_PENDING")
        ov_after_undo = self.client.get(f"/api/merchant/stores/{self.store.slug}/overview/").json()
        self.assertEqual(ov_after_undo["revenue_minor"], 50000)
        self.assertEqual(ov_after_undo["cod_pending_minor"], 70000)

    def test_cancel_pending_payment_twice_and_zero_used_count_safety(self):
        with TenantDatabaseContext(self.store.id):
            disc = Discount.objects.create(
                store=self.store,
                code="SAFEZERO",
                discount_type="PERCENTAGE",
                value=10,
                used_count=0,
                is_active=True,
            )
            pending_with_zero_count = self._create_order(
                "#ED-Z1",
                "PENDING_PAYMENT",
                "KHALTI",
                "UNPAID",
                50000,
                discount=disc,
                discount_redeemed=True,
            )
            pending_no_disc = self._create_order(
                "#ED-Z2",
                "PENDING_PAYMENT",
                "KHALTI",
                "UNPAID",
                50000,
                discount=None,
                discount_redeemed=False,
            )

        self.client.force_authenticate(user=self.owner)
        first_cancel = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{pending_with_zero_count.id}/transition/",
            {"to_status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(first_cancel.status_code, status.HTTP_200_OK)
        with TenantDatabaseContext(self.store.id):
            disc.refresh_from_db()
            self.assertEqual(disc.used_count, 0)

        # Second cancel on already CANCELLED order -> 400
        second_cancel = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{pending_with_zero_count.id}/transition/",
            {"to_status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(second_cancel.status_code, status.HTTP_400_BAD_REQUEST)

        # Cancel without any discount -> 200
        no_disc_cancel = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{pending_no_disc.id}/transition/",
            {"to_status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(no_disc_cancel.status_code, status.HTTP_200_OK)


class OrderTransitionStateMachineEdgeCaseTests(TestCase):
    """Exhaustive state machine, undo guard, malformed target & cross-tenant isolation tests (Bug 6)."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="edge.fsm.owner@example.com",
            full_name="FSM Owner",
        )
        self.other_owner = User.objects.create_user(
            email="edge.fsm.other@example.com",
            full_name="Other Owner",
        )
        self.store = Store.objects.create(name="FSM Store", slug="fsm-store", is_active=True)
        self.other_store = Store.objects.create(name="Other FSM", slug="other-fsm", is_active=True)
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.customer = Customer.objects.create(
                store=self.store,
                full_name="FSM Shopper",
                email="fsm.shopper@example.com",
                phone="9800000202",
            )
        with TenantDatabaseContext(self.other_store.id):
            StoreMembership.objects.create(store=self.other_store, user=self.other_owner, role="OWNER")

    def _make_order(self, num: str, st: str, pm: str, ps: str):
        with TenantDatabaseContext(self.store.id):
            return Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number=num,
                status=st,
                payment_method=pm,
                payment_status=ps,
                subtotal_minor=50000,
                shipping_minor=10000,
                discount_minor=0,
                total_minor=60000,
                shipping_address_snapshot={"province": "Bagmati", "district": "Kathmandu"},
            )

    def test_processing_undo_guards_for_all_payment_combinations(self):
        self.client.force_authenticate(user=self.owner)
        cod_unpaid = self._make_order("#FSM-1", "PROCESSING", "COD", "UNPAID")
        cod_pending = self._make_order("#FSM-2", "PROCESSING", "COD", "COD_PENDING")
        khalti_paid = self._make_order("#FSM-3", "PROCESSING", "KHALTI", "PAID")
        khalti_unpaid = self._make_order("#FSM-4", "PROCESSING", "KHALTI", "UNPAID")

        # Unpaid COD cannot undo into PAID, CAN undo into CONFIRMED
        for ord_obj in (cod_unpaid, cod_pending):
            bad = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/orders/{ord_obj.id}/transition/",
                {"to_status": "PAID"},
                format="json",
            )
            self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
            good = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/orders/{ord_obj.id}/transition/",
                {"to_status": "CONFIRMED"},
                format="json",
            )
            self.assertEqual(good.status_code, status.HTTP_200_OK)

        # Paid Khalti cannot undo into CONFIRMED, CAN undo into PAID
        bad_k = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{khalti_paid.id}/transition/",
            {"to_status": "CONFIRMED"},
            format="json",
        )
        self.assertEqual(bad_k.status_code, status.HTTP_400_BAD_REQUEST)
        good_k = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{khalti_paid.id}/transition/",
            {"to_status": "PAID"},
            format="json",
        )
        self.assertEqual(good_k.status_code, status.HTTP_200_OK)

        # Unpaid Khalti cannot undo into PAID
        bad_u = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{khalti_unpaid.id}/transition/",
            {"to_status": "PAID"},
            format="json",
        )
        self.assertEqual(bad_u.status_code, status.HTTP_400_BAD_REQUEST)

    def test_terminal_states_and_malformed_inputs_and_cod_roundtrip(self):
        self.client.force_authenticate(user=self.owner)
        pending = self._make_order("#FSM-P", "PENDING_PAYMENT", "KHALTI", "UNPAID")
        cancelled = self._make_order("#FSM-C", "CANCELLED", "KHALTI", "UNPAID")
        failed = self._make_order("#FSM-F", "PAYMENT_FAILED", "KHALTI", "FAILED")
        cod = self._make_order("#FSM-R", "CONFIRMED", "COD", "COD_PENDING")

        # From PENDING_PAYMENT every status other than CANCELLED must fail (400)
        for bad_target in ("CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "", None, 123):
            res = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/orders/{pending.id}/transition/",
                {"to_status": bad_target},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Whitespace + lowercase " cancelled " succeeds cleanly
        ok_ws = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{pending.id}/transition/",
            {"to_status": " cancelled "},
            format="json",
        )
        self.assertEqual(ok_ws.status_code, status.HTTP_200_OK)
        self.assertEqual(ok_ws.json()["status"], "CANCELLED")

        # CANCELLED and PAYMENT_FAILED accept no transitions at all
        for term in (cancelled, failed):
            for tgt in ("CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"):
                res = self.client.post(
                    f"/api/merchant/stores/{self.store.slug}/orders/{term.id}/transition/",
                    {"to_status": tgt},
                    format="json",
                )
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Full COD round-trip CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED -> SHIPPED -> PROCESSING -> PAID(400) -> CONFIRMED(200)
        for nxt in ("PROCESSING", "SHIPPED", "DELIVERED", "SHIPPED", "PROCESSING"):
            r = self.client.post(
                f"/api/merchant/stores/{self.store.slug}/orders/{cod.id}/transition/",
                {"to_status": nxt},
                format="json",
            )
            self.assertEqual(r.status_code, status.HTTP_200_OK)
        self.assertEqual(
            self.client.post(
                f"/api/merchant/stores/{self.store.slug}/orders/{cod.id}/transition/",
                {"to_status": "PAID"},
                format="json",
            ).status_code,
            status.HTTP_400_BAD_REQUEST,
        )
        self.assertEqual(
            self.client.post(
                f"/api/merchant/stores/{self.store.slug}/orders/{cod.id}/transition/",
                {"to_status": "CONFIRMED"},
                format="json",
            ).status_code,
            status.HTTP_200_OK,
        )

        # Cross-tenant owner gets 404
        self.client.force_authenticate(user=self.other_owner)
        cross = self.client.post(
            f"/api/merchant/stores/{self.other_store.slug}/orders/{cod.id}/transition/",
            {"to_status": "PROCESSING"},
            format="json",
        )
        self.assertEqual(cross.status_code, status.HTTP_404_NOT_FOUND)


class DiscountMaxedVsExpiredEdgeCaseTests(TestCase):
    """Exhaustive boundary & stateful redemption tests for promo codes (Bug 12)."""

    def setUp(self):
        self.client = APIClient()
        self.owner = User.objects.create_user(
            email="edge.disc.owner@example.com",
            full_name="Discount Owner",
        )
        self.store = Store.objects.create(
            name="Discount Edge Store",
            slug="discount-edge-store",
            is_active=True,
            cod_enabled=True,
        )
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            self.product = Product.objects.create(
                store=self.store,
                name="Pashmina Shawl",
                slug="pashmina-shawl",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=self.product,
                sku="SHAWL-1",
                label="Regular",
                price_minor=100000,
                in_stock=True,
                is_active=True,
            )

    def _place_cod(self, promo_code: str = "", qty: int = 1):
        payload = {
            "items": [{"variant_id": self.variant.id, "quantity": qty}],
            "customer_email": "promo.buyer@example.com",
            "payment_method": "COD",
            "shipping_address": {
                "recipient_name": "Sita Gurung",
                "phone": "9800000303",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metro",
                "ward": "4",
                "street_landmark": "Jhamsikhel",
            },
        }
        if promo_code:
            payload["discount_code"] = promo_code
        return self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            payload,
            format="json",
        )

    def test_simultaneous_maxed_expired_zero_cap_unlimited_and_paused_metrics(self):
        now = timezone.now()
        with TenantDatabaseContext(self.store.id):
            # Both time-expired AND maxed-out -> counts under expired_count only, not maxed_count
            Discount.objects.create(
                store=self.store,
                code="BOTHDEAD",
                discount_type="PERCENTAGE",
                value=10,
                max_uses=3,
                used_count=3,
                expires_at=now - timedelta(hours=1),
                is_active=True,
            )
            # Zero max_uses -> immediately maxed, not time-expired
            Discount.objects.create(
                store=self.store,
                code="ZEROCAP",
                discount_type="PERCENTAGE",
                value=10,
                max_uses=0,
                used_count=0,
                expires_at=now + timedelta(days=5),
                is_active=True,
            )
            # Unlimited (max_uses=None) with high used_count -> still active, not maxed
            Discount.objects.create(
                store=self.store,
                code="UNLIM",
                discount_type="PERCENTAGE",
                value=10,
                max_uses=None,
                used_count=500,
                expires_at=now + timedelta(days=5),
                is_active=True,
            )
            # Paused active-window promo -> not counted in active_count
            Discount.objects.create(
                store=self.store,
                code="PAUSED",
                discount_type="PERCENTAGE",
                value=10,
                max_uses=10,
                used_count=1,
                expires_at=now + timedelta(days=5),
                is_active=False,
            )

        self.client.force_authenticate(user=self.owner)
        res = self.client.get(f"/api/merchant/stores/{self.store.slug}/discounts/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        body = res.json()
        self.assertEqual(body["metrics"]["active_count"], 1)
        self.assertEqual(body["metrics"]["expired_count"], 1)
        self.assertEqual(body["metrics"]["maxed_count"], 1)
        self.assertEqual(body["metrics"]["total_redemptions"], 504)

        by_code = {d["code"]: d for d in body["discounts"]}
        self.assertTrue(by_code["BOTHDEAD"]["is_expired"])
        self.assertTrue(by_code["BOTHDEAD"]["is_maxed"])
        self.assertFalse(by_code["ZEROCAP"]["is_expired"])
        self.assertTrue(by_code["ZEROCAP"]["is_maxed"])
        self.assertFalse(by_code["UNLIM"]["is_expired"])
        self.assertFalse(by_code["UNLIM"]["is_maxed"])

        # ZEROCAP must be rejected at checkout
        zero_place = self._place_cod("ZEROCAP")
        self.assertEqual(zero_place.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stateful_redemption_cap_cancel_restore_and_window_boundaries(self):
        now = timezone.now()
        with TenantDatabaseContext(self.store.id):
            promo = Discount.objects.create(
                store=self.store,
                code="LASTONE",
                discount_type="FIXED_AMOUNT",
                value=15000,
                min_subtotal_minor=200000,
                max_uses=2,
                used_count=1,
                expires_at=now + timedelta(days=5),
                is_active=True,
            )
            Discount.objects.create(
                store=self.store,
                code="FUTURE",
                discount_type="PERCENTAGE",
                value=10,
                starts_at=now + timedelta(days=2),
                expires_at=now + timedelta(days=10),
                is_active=True,
            )

        # Future starts_at rejected
        self.assertEqual(self._place_cod("FUTURE", qty=2).status_code, status.HTTP_400_BAD_REQUEST)

        # Below min_subtotal (qty=1 -> 100000 < 200000) rejected
        self.assertEqual(self._place_cod("LASTONE", qty=1).status_code, status.HTTP_400_BAD_REQUEST)

        # Exact min_subtotal (qty=2 -> 200000) consumes final slot 2/2 -> becomes maxed (not expired)
        ok_first = self._place_cod("LASTONE", qty=2)
        self.assertEqual(ok_first.status_code, status.HTTP_201_CREATED)
        order_id = ok_first.json()["order_id"]

        self.client.force_authenticate(user=self.owner)
        list_mid = self.client.get(f"/api/merchant/stores/{self.store.slug}/discounts/").json()
        lastone = next(d for d in list_mid["discounts"] if d["code"] == "LASTONE")
        self.assertTrue(lastone["is_maxed"])
        self.assertFalse(lastone["is_expired"])

        # Second checkout hits redemption limit (400)
        blocked_second = self._place_cod("LASTONE", qty=2)
        self.assertEqual(blocked_second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("redemption limit", blocked_second.json()["error"].lower())

        # Cancel order_id -> restores slot 1/2 -> is_maxed=False -> third checkout succeeds
        cancel_res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/orders/{order_id}/transition/",
            {"to_status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        with TenantDatabaseContext(self.store.id):
            promo.refresh_from_db()
            self.assertEqual(promo.used_count, 1)

        ok_third = self._place_cod("LASTONE", qty=2)
        self.assertEqual(ok_third.status_code, status.HTTP_201_CREATED)


class CheckoutValidationEdgeCaseTests(TestCase):
    """Exhaustive boundary, non-dict body, integer overflow & variant validity tests (Bug 13)."""

    def setUp(self):
        self.client = APIClient()
        self.store = Store.objects.create(
            name="Checkout Edge Store",
            slug="checkout-edge-store",
            is_active=True,
            cod_enabled=True,
        )
        self.other_store = Store.objects.create(
            name="Other Checkout Store",
            slug="other-checkout-store",
            is_active=True,
        )
        with TenantDatabaseContext(self.store.id):
            self.prod = Product.objects.create(
                store=self.store,
                name="Cast Iron Pot",
                slug="cast-iron-pot",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=self.prod,
                sku="POT-1",
                label="Medium",
                price_minor=120000,
                in_stock=True,
                is_active=True,
            )
            self.huge_variant = Variant.objects.create(
                store=self.store,
                product=self.prod,
                sku="POT-HUGE",
                label="Custom Collector",
                price_minor=10_000_000,
                in_stock=True,
                is_active=True,
            )
            self.oos_variant = Variant.objects.create(
                store=self.store,
                product=self.prod,
                sku="POT-OOS",
                label="Large",
                price_minor=150000,
                in_stock=False,
                is_active=True,
            )
            self.inactive_variant = Variant.objects.create(
                store=self.store,
                product=self.prod,
                sku="POT-OFF",
                label="Archived",
                price_minor=150000,
                in_stock=True,
                is_active=False,
            )
            self.archived_prod = Product.objects.create(
                store=self.store,
                name="Old Pot",
                slug="old-pot",
                is_active=False,
            )
            self.archived_prod_variant = Variant.objects.create(
                store=self.store,
                product=self.archived_prod,
                sku="OLD-1",
                label="Std",
                price_minor=50000,
                in_stock=True,
                is_active=True,
            )
        with TenantDatabaseContext(self.other_store.id):
            other_p = Product.objects.create(
                store=self.other_store,
                name="Foreign",
                slug="foreign",
                is_active=True,
            )
            self.foreign_variant = Variant.objects.create(
                store=self.other_store,
                product=other_p,
                sku="FOR-1",
                label="One",
                price_minor=40000,
                in_stock=True,
                is_active=True,
            )

    def _place(self, items):
        return self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            {
                "items": items,
                "customer_email": "edge.buyer@example.com",
                "payment_method": "COD",
                "shipping_address": {
                    "recipient_name": "Binod Thapa",
                    "phone": "9812345678",
                    "district": "Kathmandu",
                    "municipality": "Kathmandu Metro",
                    "ward": "7",
                    "street_landmark": "Chabahil",
                },
            },
            format="json",
        )

    def test_non_dict_bodies_and_all_malformed_cart_inputs_return_400(self):
        for body in [[], "string-body", 123]:
            self.assertEqual(
                self.client.post(
                    f"/api/stores/{self.store.slug}/checkout/quote/",
                    body,
                    format="json",
                ).status_code,
                status.HTTP_400_BAD_REQUEST,
            )
            self.assertEqual(
                self.client.post(
                    f"/api/stores/{self.store.slug}/checkout/place/",
                    body,
                    format="json",
                ).status_code,
                status.HTTP_400_BAD_REQUEST,
            )

        bad_items_cases = [
            None,
            [],
            "not-a-list",
            123,
            {},
            [None],
            [123],
            ["str"],
            [{}],
            [{"variant_id": None, "quantity": 1}],
            [{"variant_id": "", "quantity": 1}],
            [{"variant_id": "   ", "quantity": 1}],
            [{"variant_id": "abc", "quantity": 1}],
            [{"variant_id": "1.5", "quantity": 1}],
            [{"variant_id": 1.5, "quantity": 1}],
            [{"variant_id": True, "quantity": 1}],
            [{"variant_id": False, "quantity": 1}],
            [{"variant_id": 0, "quantity": 1}],
            [{"variant_id": -3, "quantity": 1}],
            [{"variant_id": 99_999_999_999_999_999_999, "quantity": 1}],
            [{"variant_id": self.variant.id, "quantity": None}],
            [{"variant_id": self.variant.id, "quantity": ""}],
            [{"variant_id": self.variant.id, "quantity": "   "}],
            [{"variant_id": self.variant.id, "quantity": "bad"}],
            [{"variant_id": self.variant.id, "quantity": "1.5"}],
            [{"variant_id": self.variant.id, "quantity": 1.5}],
            [{"variant_id": self.variant.id, "quantity": 0}],
            [{"variant_id": self.variant.id, "quantity": -1}],
            [{"variant_id": self.variant.id, "quantity": True}],
            [{"variant_id": self.variant.id, "quantity": False}],
            [{"variant_id": self.variant.id, "quantity": []}],
            [{"variant_id": self.variant.id, "quantity": {}}],
            [{"variant_id": self.variant.id, "quantity": 1000}],
            [{"variant_id": self.variant.id, "quantity": 50000}],
            [{"variant_id": self.variant.id, "quantity": 99_999_999_999_999_999_999}],
            [{"variant_id": self.variant.id, "quantity": 1}] * 101,
            # Total integer overflow (10_000_000 * 300 = 3_000_000_000 > 2_147_483_647)
            [{"variant_id": self.huge_variant.id, "quantity": 300}],
            # Out-of-stock / inactive / archived / cross-tenant
            [{"variant_id": self.oos_variant.id, "quantity": 1}],
            [{"variant_id": self.inactive_variant.id, "quantity": 1}],
            [{"variant_id": self.archived_prod_variant.id, "quantity": 1}],
            [{"variant_id": self.foreign_variant.id, "quantity": 1}],
        ]

        for bad_items in bad_items_cases:
            q_res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/quote/",
                {"items": bad_items, "district": "Kathmandu"},
                format="json",
            )
            self.assertEqual(
                q_res.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Expected quote 400 for bad_items (len={len(bad_items) if isinstance(bad_items, list) else type(bad_items).__name__}), got {q_res.status_code}",
            )
            p_res = self._place(bad_items)
            self.assertEqual(
                p_res.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Expected place 400 for bad_items, got {p_res.status_code}",
            )

    def test_valid_edge_quantities_duplicate_rows_and_quote_place_parity(self):
        # Omitted quantity defaults to 1, string "2" and integral float 2.0 accepted cleanly
        edge_items = [
            {"variant_id": self.variant.id},
            {"variant_id": str(self.variant.id), "quantity": "2"},
            {"variant_id": float(self.variant.id), "quantity": 2.0},
        ]
        q_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/quote/",
            {"items": edge_items, "district": "Kathmandu"},
            format="json",
        )
        self.assertEqual(q_res.status_code, status.HTTP_200_OK)
        self.assertEqual(q_res.json()["subtotal_minor"], 5 * 120000)

        p_res = self._place(edge_items)
        self.assertEqual(p_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(p_res.json()["total_minor"], q_res.json()["total_minor"])
