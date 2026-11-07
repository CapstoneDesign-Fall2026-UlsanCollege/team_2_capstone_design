import json
import os
from django.contrib.auth import get_user_model
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIClient

from accounts.models import EmailOTPChallenge
from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order, OrderEvent, OrderItem
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class HotEndpointPerformanceAndCachingTests(TestCase):
    """
    Audits hot storefront and merchant endpoints for O(1) query scaling (zero N+1 queries)
    and verifies Cache-Control + Vary headers on public vs private routes.
    """

    def setUp(self):
        self.owner = User.objects.create_user(
            email="perf.owner@example.com",
            full_name="Perf Owner",
        )
        self.store = Store.objects.create(
            name="Mustang Craft",
            slug="mustang-craft",
            tagline="Pure Himalayan Goods",
            is_active=True,
            cod_enabled=True,
            inside_valley_shipping_minor=10000,
            outside_valley_shipping_minor=20000,
        )

        self.variants = []
        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")
            for idx in range(1, 9):
                p = Product.objects.create(
                    store=self.store,
                    name=f"Artisan Item {idx}",
                    slug=f"artisan-item-{idx}",
                    is_active=True,
                    sort_order=idx,
                )
                v1 = Variant.objects.create(
                    store=self.store,
                    product=p,
                    sku=f"MC-{idx}-A",
                    label="250g",
                    price_minor=50000 + idx * 1000,
                    in_stock=True,
                    is_active=True,
                    sort_order=1,
                )
                Variant.objects.create(
                    store=self.store,
                    product=p,
                    sku=f"MC-{idx}-B",
                    label="500g",
                    price_minor=90000 + idx * 1000,
                    in_stock=True,
                    is_active=True,
                    sort_order=2,
                )
                self.variants.append(v1)

            for c_idx in range(1, 7):
                cust = Customer.objects.create(
                    store=self.store,
                    email=f"shopper{c_idx}@example.com",
                    full_name=f"Shopper {c_idx}",
                    phone=f"984100000{c_idx}",
                )
                order = Order.objects.create(
                    store=self.store,
                    customer=cust,
                    order_number=f"#MC-2026-000{c_idx}",
                    status="CONFIRMED" if c_idx % 2 == 0 else "PAID",
                    payment_method="COD",
                    payment_status="COD_PENDING" if c_idx % 2 == 0 else "PAID",
                    subtotal_minor=51000,
                    shipping_minor=10000,
                    total_minor=61000,
                    shipping_address_snapshot={
                        "recipient_name": cust.full_name,
                        "phone": cust.phone,
                        "district": "Kathmandu",
                    },
                )
                OrderItem.objects.create(
                    store=self.store,
                    order=order,
                    variant=self.variants[0],
                    product_name_snapshot="Artisan Item 1",
                    variant_label_snapshot="250g",
                    unit_price_minor=51000,
                    quantity=1,
                    line_total_minor=51000,
                )
                OrderEvent.objects.create(
                    store=self.store,
                    order=order,
                    from_status="",
                    to_status=order.status,
                    note="Seeded order",
                )
                if c_idx == 1:
                    self.tracked_order = order

        self.client = APIClient()

    def _count_queries(self, fn):
        with CaptureQueriesContext(connection) as ctx:
            resp = fn()
        sql_queries = [
            q["sql"]
            for q in ctx.captured_queries
            if not q["sql"].strip().upper().startswith(
                ("SAVEPOINT", "RELEASE SAVEPOINT", "BEGIN", "COMMIT", "ROLLBACK")
            )
        ]
        return resp, len(sql_queries)

    def test_public_storefront_reads_query_counts_and_cache_headers(self):
        # 1. Store metadata GET
        res_store, q_store = self._count_queries(
            lambda: self.client.get(f"/api/stores/{self.store.slug}/")
        )
        self.assertEqual(res_store.status_code, 200)
        self.assertLessEqual(q_store, 5)
        self.assertIn("public", res_store["Cache-Control"])
        self.assertIn("s-maxage=60", res_store["Cache-Control"])
        self.assertNotIn("Cookie", res_store.get("Vary", ""))

        # 2. Store catalog GET (8 products x 2 variants = 16 variants -> strictly O(1), no N+1)
        res_cat, q_cat_8 = self._count_queries(
            lambda: self.client.get(f"/api/stores/{self.store.slug}/catalog/")
        )
        self.assertEqual(res_cat.status_code, 200)
        self.assertEqual(len(res_cat.json()["products"]), 8)
        self.assertLessEqual(q_cat_8, 7)
        self.assertIn("public", res_cat["Cache-Control"])
        self.assertNotIn("Cookie", res_cat.get("Vary", ""))

        # Add 6 more products + 12 variants and prove query count stays IDENTICAL (zero N+1)
        with TenantDatabaseContext(self.store.id):
            for extra in range(20, 26):
                p = Product.objects.create(
                    store=self.store,
                    name=f"Extra Item {extra}",
                    slug=f"extra-item-{extra}",
                    is_active=True,
                )
                Variant.objects.create(
                    store=self.store,
                    product=p,
                    sku=f"EX-{extra}-1",
                    label="Standard",
                    price_minor=45000,
                    is_active=True,
                )

        res_cat_14, q_cat_14 = self._count_queries(
            lambda: self.client.get(f"/api/stores/{self.store.slug}/catalog/")
        )
        self.assertEqual(len(res_cat_14.json()["products"]), 14)
        self.assertEqual(q_cat_8, q_cat_14)

        # 3. Single product detail GET + related products
        res_pdp, q_pdp = self._count_queries(
            lambda: self.client.get(f"/api/stores/{self.store.slug}/products/artisan-item-1/")
        )
        self.assertEqual(res_pdp.status_code, 200)
        self.assertEqual(res_pdp.json()["product"]["slug"], "artisan-item-1")
        self.assertEqual(len(res_pdp.json()["related_products"]), 3)
        self.assertLessEqual(q_pdp, 9)
        self.assertIn("public", res_pdp["Cache-Control"])
        self.assertNotIn("Cookie", res_pdp.get("Vary", ""))
        if os.environ.get("REPORT_QUERY_COUNTS") == "1":
            print("PERF_PUBLIC_READS=" + json.dumps({
                "store_detail": q_store,
                "catalog_8_products": q_cat_8,
                "catalog_14_products": q_cat_14,
                "product_detail": q_pdp,
            }))

    def test_cart_quote_checkout_and_order_tracking_constant_queries_and_no_store(self):
        # 1. Cart quote with 1 item vs 6 items -> identical query count (select_related("product"))
        res_q1, q_quote_1 = self._count_queries(
            lambda: self.client.post(
                f"/api/stores/{self.store.slug}/checkout/quote/",
                {"items": [{"variant_id": self.variants[0].id, "quantity": 1}], "district": "Kathmandu"},
                format="json",
            )
        )
        self.assertEqual(res_q1.status_code, 200)
        self.assertIn("no-store", res_q1["Cache-Control"])

        res_q6, q_quote_6 = self._count_queries(
            lambda: self.client.post(
                f"/api/stores/{self.store.slug}/checkout/quote/",
                {
                    "items": [{"variant_id": v.id, "quantity": 2} for v in self.variants[:6]],
                    "district": "Kathmandu",
                },
                format="json",
            )
        )
        self.assertEqual(res_q6.status_code, 200)
        self.assertEqual(q_quote_1, q_quote_6)
        self.assertLessEqual(q_quote_6, 7)

        # 2. Guest COD checkout with 1 item vs 6 items -> identical query count (bulk_create)
        def place_order(email_addr, item_variants):
            return self.client.post(
                f"/api/stores/{self.store.slug}/checkout/place/",
                {
                    "customer_email": email_addr,
                    "payment_method": "COD",
                    "items": [{"variant_id": v.id, "quantity": 1} for v in item_variants],
                    "shipping_address": {
                        "recipient_name": "Guest Buyer",
                        "phone": "9841556677",
                        "province": "Bagmati",
                        "district": "Kathmandu",
                        "municipality": "Kathmandu",
                        "ward": "4",
                        "street_landmark": "Baluwatar",
                    },
                },
                format="json",
            )

        res_p1, q_place_1 = self._count_queries(
            lambda: place_order("guest.one@example.com", self.variants[:1])
        )
        self.assertEqual(res_p1.status_code, 201)
        self.assertIn("no-store", res_p1["Cache-Control"])

        res_p6, q_place_6 = self._count_queries(
            lambda: place_order("guest.six@example.com", self.variants[:6])
        )
        self.assertEqual(res_p6.status_code, 201)
        self.assertEqual(q_place_1, q_place_6)
        self.assertLessEqual(q_place_6, 16)

        # 3. Public order tracking by unguessable UUID token -> bounded queries + private, no-store
        res_track, q_track = self._count_queries(
            lambda: self.client.get(
                f"/api/stores/{self.store.slug}/public-orders/{self.tracked_order.token}/"
            )
        )
        self.assertEqual(res_track.status_code, 200)
        self.assertLessEqual(q_track, 9)
        self.assertIn("private", res_track["Cache-Control"])
        self.assertIn("no-store", res_track["Cache-Control"])
        if os.environ.get("REPORT_QUERY_COUNTS") == "1":
            print("PERF_CHECKOUT_FLOWS=" + json.dumps({
                "cart_quote_1_item": q_quote_1,
                "cart_quote_6_items": q_quote_6,
                "checkout_cod_1_item": q_place_1,
                "checkout_cod_6_items": q_place_6,
                "order_tracking": q_track,
            }))

    def test_otp_request_verify_and_merchant_lists_query_bounds(self):
        # 1. Storefront OTP request
        res_otp_req, q_otp_req = self._count_queries(
            lambda: self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                {"email": "fast.shopper@example.com"},
                format="json",
            )
        )
        self.assertEqual(res_otp_req.status_code, 200)
        self.assertIn("no-store", res_otp_req["Cache-Control"])
        self.assertLessEqual(q_otp_req, 12)

        # 2. Storefront OTP verify
        _, raw_code = EmailOTPChallenge.issue_for_email("verify.shopper@example.com", ip_address="127.0.0.1")
        res_otp_ver, q_otp_ver = self._count_queries(
            lambda: self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/verify/",
                {"email": "verify.shopper@example.com", "code": raw_code},
                format="json",
            )
        )
        self.assertEqual(res_otp_ver.status_code, 200)
        self.assertIn("no-store", res_otp_ver["Cache-Control"])
        self.assertLessEqual(q_otp_ver, 18)

        # 3. Merchant orders list & customers list -> O(1) queries with 6 orders & 6 customers
        self.client.force_login(self.owner)
        res_m_orders, q_m_orders = self._count_queries(
            lambda: self.client.get(f"/api/merchant/stores/{self.store.slug}/orders/")
        )
        self.assertEqual(res_m_orders.status_code, 200)
        self.assertEqual(res_m_orders.json()["counts"]["all"], 6)
        self.assertIn("private", res_m_orders["Cache-Control"])
        self.assertIn("no-store", res_m_orders["Cache-Control"])
        self.assertLessEqual(q_m_orders, 12)

        res_m_custs, q_m_custs = self._count_queries(
            lambda: self.client.get(f"/api/merchant/stores/{self.store.slug}/customers/")
        )
        self.assertEqual(res_m_custs.status_code, 200)
        self.assertEqual(len(res_m_custs.json()), 7)
        self.assertIn("no-store", res_m_custs["Cache-Control"])
        self.assertLessEqual(q_m_custs, 10)
        if os.environ.get("REPORT_QUERY_COUNTS") == "1":
            print("PERF_OTP_MERCHANT=" + json.dumps({
                "otp_request": q_otp_req,
                "otp_verify": q_otp_ver,
                "merchant_orders_list": q_m_orders,
                "merchant_customers_list": q_m_custs,
            }))
