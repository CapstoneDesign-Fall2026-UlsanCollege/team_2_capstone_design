from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order
from stores.models import Customer, Store, StoreMembership

User = get_user_model()

ORDER_COUNT = 120          # 40 customers x 3 orders
CUSTOMER_COUNT = 130       # 40 with orders, 90 without
ORDERS_PER_BUYER = 3
BUYERS = 40


class MerchantListPaginationTests(APITestCase):
    """
    Orders and customers lists must be bounded: server-side pages with a hard cap, stable
    ordering (no duplicated / skipped rows across pages), store-wide KPIs that do not depend on
    which page was loaded, and no cross-store leakage in totals.
    """

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("pg-owner@example.com", full_name="Owner")
        cls.other_owner = User.objects.create_user("pg-other@example.com", full_name="Other Owner")
        cls.store = Store.objects.create(slug="pg-store", name="Pagination Store", is_active=True)
        cls.other_store = Store.objects.create(slug="pg-other-store", name="Other Store", is_active=True)

        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")
            customers = Customer.all_objects.bulk_create([
                Customer(store=cls.store, email=f"shopper{i:03d}@example.com", full_name=f"Shopper {i:03d}", phone=f"98000{i:05d}")
                for i in range(CUSTOMER_COUNT)
            ])
            cls.customer_ids = list(
                Customer.all_objects.filter(store=cls.store).order_by("id").values_list("id", flat=True)
            )
            number = 0
            orders = []
            for idx in range(BUYERS):
                cid = cls.customer_ids[idx]
                for status_value, total in (("DELIVERED", 1000), ("CONFIRMED", 2000), ("CANCELLED", 5000)):
                    orders.append(Order(
                        store=cls.store, customer_id=cid, order_number=f"PG-{number:04d}",
                        status=status_value, payment_status="PAID",
                        subtotal_minor=total, total_minor=total,
                    ))
                    number += 1
            Order._base_manager.bulk_create(orders)

        with TenantDatabaseContext(cls.other_store.id):
            StoreMembership.objects.create(store=cls.other_store, user=cls.other_owner, role="OWNER")
            Customer.all_objects.bulk_create([
                Customer(store=cls.other_store, email=f"foreign{i}@example.com", full_name=f"Shopper 00{i}")
                for i in range(5)
            ])
            foreign_ids = list(Customer.all_objects.filter(store=cls.other_store).values_list("id", flat=True))
            Order._base_manager.bulk_create([
                Order(store=cls.other_store, customer_id=fid, order_number=f"FX-{n}-{fid}", status="DELIVERED",
                      payment_status="PAID", subtotal_minor=9999, total_minor=9999)
                for fid in foreign_ids for n in range(2)
            ])

    def setUp(self):
        self.client.force_authenticate(user=self.owner)
        self.base = f"/api/merchant/stores/{self.store.slug}"

    # ---------------------------------------------------------------- orders
    def _orders(self, query=""):
        res = self.client.get(f"{self.base}/orders/{query}")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.content)
        return res.json()

    def test_orders_default_page_is_bounded(self):
        body = self._orders()
        self.assertEqual(len(body["orders"]), 50)
        self.assertEqual(body["pagination"], {"total": ORDER_COUNT, "page": 1, "page_size": 50, "has_more": True})

    def test_orders_pages_cover_everything_exactly_once(self):
        seen = []
        for page in (1, 2, 3):
            body = self._orders(f"?page={page}")
            seen.extend(o["id"] for o in body["orders"])
        self.assertEqual(len(seen), ORDER_COUNT)
        self.assertEqual(len(set(seen)), ORDER_COUNT, "an order appeared on two pages or was skipped")
        last = self._orders("?page=3")
        self.assertFalse(last["pagination"]["has_more"])
        self.assertEqual(len(last["orders"]), 20)

    def test_orders_page_beyond_end_is_empty_not_error(self):
        body = self._orders("?page=999")
        self.assertEqual(body["orders"], [])
        self.assertFalse(body["pagination"]["has_more"])
        self.assertEqual(body["pagination"]["total"], ORDER_COUNT)

    def test_orders_page_size_is_clamped_and_garbage_is_ignored(self):
        cases = {
            "?page_size=99999": 200,
            "?page_size=0": 1,
            "?page_size=-5": 1,
            "?page_size=abc": 50,
            "?page_size=": 50,
            "?page_size=7": 7,
        }
        for query, expected in cases.items():
            body = self._orders(query)
            self.assertEqual(body["pagination"]["page_size"], expected, query)
            self.assertEqual(len(body["orders"]), min(expected, ORDER_COUNT), query)
        for query in ("?page=0", "?page=-3", "?page=abc", "?page="):
            self.assertEqual(self._orders(query)["pagination"]["page"], 1, query)

    def test_orders_counts_are_store_wide_regardless_of_page(self):
        first = self._orders("?page_size=3")
        self.assertEqual(first["counts"]["all"], ORDER_COUNT)
        self.assertEqual(first["counts"]["delivered"], BUYERS)
        self.assertEqual(first["counts"]["new"], BUYERS)

    def test_orders_status_filter_and_pagination_total_agree(self):
        body = self._orders("?status=delivered&page_size=15")
        self.assertEqual(body["pagination"]["total"], BUYERS)
        self.assertEqual(len(body["orders"]), 15)
        self.assertTrue(all(o["status"] == "DELIVERED" for o in body["orders"]))

    def test_orders_search_is_paginated(self):
        # PG-0100 .. PG-0119 contain "PG-01"
        page_one = self._orders("?search=PG-01&page_size=5")
        self.assertEqual(page_one["pagination"]["total"], 20)
        ids = []
        for page in (1, 2, 3, 4):
            ids += [o["id"] for o in self._orders(f"?search=PG-01&page_size=5&page={page}")["orders"]]
        self.assertEqual(len(ids), 20)
        self.assertEqual(len(set(ids)), 20)

    def test_orders_never_include_other_store(self):
        body = self._orders("?page_size=200")
        numbers = {o["order_number"] for o in body["orders"]}
        self.assertFalse(any(n.startswith("FX-") for n in numbers))
        self.assertEqual(body["pagination"]["total"], ORDER_COUNT)

    # ------------------------------------------------------------- customers
    def _customers(self, query=""):
        res = self.client.get(f"{self.base}/customers/{query}")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.content)
        return res

    def test_customers_body_is_still_a_plain_list_with_page_headers(self):
        res = self._customers()
        body = res.json()
        self.assertIsInstance(body, list)
        self.assertEqual(len(body), 50)
        self.assertEqual(res["X-Total-Count"], str(CUSTOMER_COUNT))
        self.assertEqual(res["X-Page"], "1")
        self.assertEqual(res["X-Page-Size"], "50")
        self.assertEqual(res["X-Has-More"], "1")

    def test_customers_pages_cover_everything_exactly_once(self):
        ids = []
        for page in (1, 2, 3):
            res = self._customers(f"?page={page}")
            ids += [c["id"] for c in res.json()]
            if page == 3:
                self.assertEqual(res["X-Has-More"], "0")
        self.assertEqual(len(ids), CUSTOMER_COUNT)
        self.assertEqual(len(set(ids)), CUSTOMER_COUNT)

    def test_customers_beyond_last_page_and_bad_params(self):
        self.assertEqual(self._customers("?page=999").json(), [])
        self.assertEqual(self._customers("?page_size=99999")["X-Page-Size"], "200")
        self.assertEqual(self._customers("?page_size=abc")["X-Page-Size"], "50")
        self.assertEqual(self._customers("?page=0")["X-Page"], "1")

    def test_customer_kpis_are_store_wide_not_per_page(self):
        small = self._customers("?page_size=2")
        big = self._customers("?page_size=200")
        # 40 buyers with 3 orders each; paid & not cancelled: 1000 + 2000 per buyer
        for res in (small, big):
            self.assertEqual(res["X-Repeat-Customers"], str(BUYERS))
            self.assertEqual(res["X-Total-Spent-Minor"], str(BUYERS * 3000))

    def test_customer_search_scopes_total_and_kpis(self):
        res = self._customers("?q=Shopper 00")  # Shopper 000..009 -> 10 customers, all buyers
        self.assertEqual(res["X-Total-Count"], "10")
        self.assertEqual(len(res.json()), 10)
        self.assertEqual(res["X-Repeat-Customers"], "10")
        self.assertEqual(res["X-Total-Spent-Minor"], str(10 * 3000))

    def test_customer_row_values_are_correct_on_later_pages(self):
        rows = {c["id"]: c for page in (1, 2, 3) for c in self._customers(f"?page={page}").json()}
        buyer = rows[self.customer_ids[0]]
        self.assertEqual(buyer["orders_count"], ORDERS_PER_BUYER)
        self.assertEqual(buyer["total_spent_minor"], 3000)
        non_buyer = rows[self.customer_ids[BUYERS + 5]]
        self.assertEqual(non_buyer["orders_count"], 0)
        self.assertEqual(non_buyer["total_spent_minor"], 0)

    def test_customers_never_include_or_count_other_store(self):
        res = self._customers("?page_size=200")
        emails = {c["email"] for c in res.json()}
        self.assertFalse(any(e.startswith("foreign") for e in emails))
        self.assertEqual(res["X-Total-Count"], str(CUSTOMER_COUNT))
        self.assertEqual(res["X-Total-Spent-Minor"], str(BUYERS * 3000))

    def test_non_member_cannot_read_pages_or_totals(self):
        self.client.force_authenticate(user=self.other_owner)
        for path in ("orders/", "customers/"):
            res = self.client.get(f"{self.base}/{path}?page=1")
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
            self.assertNotIn("X-Total-Count", res)

    def test_anonymous_cannot_read_lists(self):
        self.client.force_authenticate(user=None)
        for path in ("orders/", "customers/", "products/", "inventory/"):
            res = self.client.get(f"{self.base}/{path}")
            self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))


class CatalogProductInventoryPaginationTests(APITestCase):
    """
    Covers pagination, store-wide summary/count consistency, search filtering, parameter
    clamping, and tenant isolation for StoreCatalogView, MerchantProductListCreateView, and
    MerchantInventoryListView.
    """

    ACTIVE_PRODUCTS = 65
    DRAFT_PRODUCTS = 10

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("catpg-owner@example.com", full_name="Catalog Owner")
        cls.other_owner = User.objects.create_user("catpg-other@example.com", full_name="Other Owner")
        cls.store = Store.objects.create(slug="catpg-store", name="Catalog Pagination Store", is_active=True)
        cls.other_store = Store.objects.create(slug="catpg-other", name="Foreign Store", is_active=True)

        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")
            created_products = []
            for idx in range(cls.ACTIVE_PRODUCTS):
                created_products.append(
                    Product(
                        store=cls.store,
                        slug=f"active-prod-{idx:03d}",
                        name=f"Tea Lot {idx:03d}",
                        description="High-mountain harvest" if idx < 12 else "Classic blend",
                        is_active=True,
                        sort_order=idx,
                    )
                )
            for idx in range(cls.DRAFT_PRODUCTS):
                created_products.append(
                    Product(
                        store=cls.store,
                        slug=f"draft-prod-{idx:03d}",
                        name=f"Draft Tea {idx:03d}",
                        is_active=False,
                        sort_order=500 + idx,
                    )
                )
            Product._base_manager.bulk_create(created_products)
            cls.all_products = list(Product._base_manager.filter(store=cls.store).order_by("id"))

            variants = []
            for p in cls.all_products:
                variants.append(
                    Variant(
                        store=cls.store,
                        product=p,
                        sku=f"CATPG-{p.id}",
                        label="250g",
                        price_minor=45000,
                        in_stock=True,
                        track_inventory=True,
                        stock_quantity=2 if p.is_active else 10,
                        low_stock_threshold=5,
                        is_active=True,
                    )
                )
            Variant._base_manager.bulk_create(variants)

        with TenantDatabaseContext(cls.other_store.id):
            StoreMembership.objects.create(store=cls.other_store, user=cls.other_owner, role="OWNER")
            foreign_p = Product.objects.create(
                store=cls.other_store,
                slug="foreign-tea",
                name="Foreign Secret Tea",
                is_active=True,
            )
            Variant.objects.create(
                store=cls.other_store,
                product=foreign_p,
                sku="FOREIGN-SKU",
                label="1kg",
                price_minor=99000,
                is_active=True,
            )

    def setUp(self):
        self.client.force_authenticate(user=self.owner)
        self.public_catalog = f"/api/stores/{self.store.slug}/catalog/"
        self.merchant_base = f"/api/merchant/stores/{self.store.slug}"

    def test_storefront_catalog_paginates_default_48_and_covers_active_only(self):
        self.client.force_authenticate(user=None)
        res1 = self.client.get(self.public_catalog)
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        body1 = res1.json()
        self.assertEqual(len(body1["products"]), 48)
        self.assertEqual(
            body1["pagination"],
            {"total": self.ACTIVE_PRODUCTS, "page": 1, "page_size": 48, "has_more": True},
        )

        res2 = self.client.get(f"{self.public_catalog}?page=2")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        body2 = res2.json()
        self.assertFalse(body2["pagination"]["has_more"])
        ids = [p["id"] for p in body1["products"]] + [p["id"] for p in body2["products"]]
        self.assertEqual(len(ids), self.ACTIVE_PRODUCTS)
        self.assertEqual(len(set(ids)), self.ACTIVE_PRODUCTS)
        self.assertTrue(all(p["is_active"] for p in body1["products"] + body2["products"]))
        self.assertFalse(any(p["name"] == "Foreign Secret Tea" for p in body1["products"] + body2["products"]))

    def test_storefront_catalog_search_and_clamping(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(f"{self.public_catalog}?q=High-mountain&page_size=5")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.json()["pagination"]["total"], 12)
        self.assertEqual(len(res.json()["products"]), 5)

        capped = self.client.get(f"{self.public_catalog}?page_size=9999")
        self.assertEqual(capped.json()["pagination"]["page_size"], 200)
        beyond = self.client.get(f"{self.public_catalog}?page=99")
        self.assertEqual(beyond.json()["products"], [])
        self.assertFalse(beyond.json()["pagination"]["has_more"])

    def test_merchant_products_list_paginates_with_store_wide_headers(self):
        res1 = self.client.get(f"{self.merchant_base}/products/")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertIsInstance(res1.json(), list)
        self.assertEqual(len(res1.json()), 50)
        total_products = self.ACTIVE_PRODUCTS + self.DRAFT_PRODUCTS
        self.assertEqual(res1["X-Total-Count"], str(total_products))
        self.assertEqual(res1["X-All-Count"], str(total_products))
        self.assertEqual(res1["X-Active-Count"], str(self.ACTIVE_PRODUCTS))
        self.assertEqual(res1["X-Draft-Count"], str(self.DRAFT_PRODUCTS))
        self.assertEqual(res1["X-Has-More"], "1")

        res2 = self.client.get(f"{self.merchant_base}/products/?page=2")
        self.assertEqual(res2["X-Has-More"], "0")
        ids = [p["id"] for p in res1.json()] + [p["id"] for p in res2.json()]
        self.assertEqual(len(ids), total_products)
        self.assertEqual(len(set(ids)), total_products)

    def test_merchant_products_status_filter_and_search(self):
        drafts = self.client.get(f"{self.merchant_base}/products/?status=draft")
        self.assertEqual(drafts.status_code, status.HTTP_200_OK)
        self.assertEqual(len(drafts.json()), self.DRAFT_PRODUCTS)
        self.assertEqual(drafts["X-Total-Count"], str(self.DRAFT_PRODUCTS))
        self.assertEqual(drafts["X-All-Count"], str(self.ACTIVE_PRODUCTS + self.DRAFT_PRODUCTS))

        matched = self.client.get(f"{self.merchant_base}/products/?q=High-mountain&page_size=5")
        self.assertEqual(matched["X-Total-Count"], "12")
        self.assertEqual(len(matched.json()), 5)

    def test_merchant_inventory_paginates_while_summary_stays_store_wide(self):
        res1 = self.client.get(f"{self.merchant_base}/inventory/")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        body1 = res1.json()
        self.assertEqual(len(body1["items"]), 50)
        self.assertEqual(
            body1["pagination"],
            {"total": self.ACTIVE_PRODUCTS, "page": 1, "page_size": 50, "has_more": True},
        )
        self.assertEqual(body1["summary"]["total_variants"], self.ACTIVE_PRODUCTS)
        self.assertEqual(body1["summary"]["low_stock_count"], self.ACTIVE_PRODUCTS)

        res2 = self.client.get(f"{self.merchant_base}/inventory/?page=2")
        body2 = res2.json()
        self.assertFalse(body2["pagination"]["has_more"])
        ids = [row["id"] for row in body1["items"]] + [row["id"] for row in body2["items"]]
        self.assertEqual(len(ids), self.ACTIVE_PRODUCTS)
        self.assertEqual(len(set(ids)), self.ACTIVE_PRODUCTS)
        self.assertFalse(any(row["sku"] == "FOREIGN-SKU" for row in body1["items"] + body2["items"]))

    def test_non_member_cannot_read_paginated_products_or_inventory(self):
        self.client.force_authenticate(user=self.other_owner)
        for path in ("products/", "inventory/"):
            res = self.client.get(f"{self.merchant_base}/{path}?page=1")
            self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
            self.assertNotIn("X-Total-Count", res)

    def test_default_test_cache_is_configured(self):
        self.assertIn("BACKEND", settings.CACHES["default"])

