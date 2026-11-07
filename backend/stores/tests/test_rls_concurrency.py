import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from django.db import connection
from rest_framework import status
from rest_framework.test import APITransactionTestCase, APIClient

from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from stores.models import Store


class TenantRLSConcurrencyTests(APITransactionTestCase):
    """
    Regression test for PostgreSQL RLS tenant context isolation under concurrency:
    Runs parallel requests across multiple threads to two distinct stores with persistent
    connections enabled (CONN_MAX_AGE=600) and interleaved error paths (404s).
    Asserts zero cross-tenant leakage, zero empty catalog regressions, and zero connection state bleed.
    """

    def setUp(self):
        super().setUp()
        # Enable persistent connections during concurrency test
        self._orig_conn_max_age = connection.settings_dict.get("CONN_MAX_AGE", 0)
        connection.settings_dict["CONN_MAX_AGE"] = 600

        # Create Store Alpha
        self.store_a = Store.objects.create(
            name="Store Alpha",
            slug="store-alpha",
            is_active=True,
            currency="NPR",
        )
        with TenantDatabaseContext(self.store_a.id):
            self.prod_a1 = Product.objects.create(
                store=self.store_a,
                name="Alpha Himalayan Honey",
                slug="alpha-honey",
                is_active=True,
                sort_order=1,
            )
            Variant.objects.create(
                store=self.store_a,
                product=self.prod_a1,
                sku="alpha-500g",
                label="500g",
                price_minor=50000,
                in_stock=True,
                is_active=True,
            )
            self.prod_a2 = Product.objects.create(
                store=self.store_a,
                name="Alpha Mountain Tea",
                slug="alpha-tea",
                is_active=True,
                sort_order=2,
            )
            Variant.objects.create(
                store=self.store_a,
                product=self.prod_a2,
                sku="alpha-100g",
                label="100g",
                price_minor=30000,
                in_stock=True,
                is_active=True,
            )

        # Create Store Beta
        self.store_b = Store.objects.create(
            name="Store Beta",
            slug="store-beta",
            is_active=True,
            currency="NPR",
        )
        with TenantDatabaseContext(self.store_b.id):
            self.prod_b1 = Product.objects.create(
                store=self.store_b,
                name="Beta Yak Cheese",
                slug="beta-cheese",
                is_active=True,
                sort_order=1,
            )
            Variant.objects.create(
                store=self.store_b,
                product=self.prod_b1,
                sku="beta-250g",
                label="250g",
                price_minor=60000,
                in_stock=True,
                is_active=True,
            )
            self.prod_b2 = Product.objects.create(
                store=self.store_b,
                name="Beta Cardamom Pods",
                slug="beta-cardamom",
                is_active=True,
                sort_order=2,
            )
            Variant.objects.create(
                store=self.store_b,
                product=self.prod_b2,
                sku="beta-50g",
                label="50g",
                price_minor=40000,
                in_stock=True,
                is_active=True,
            )

    def tearDown(self):
        connection.settings_dict["CONN_MAX_AGE"] = self._orig_conn_max_age
        super().tearDown()

    def test_parallel_store_requests_preserve_strict_isolation_with_error_paths(self):
        """
        Spawns 8 concurrent worker threads firing 80 requests to Store Alpha,
        Store Beta, and invalid store routes (404 error path).
        Asserts every single response strictly contains only its own store's data,
        never leaks across stores, never returns empty catalog for valid stores,
        and cleanly isolates after 404 error paths under persistent connections.
        """
        total_requests = 80
        num_workers = 8

        # Build task list: 40% store-alpha, 40% store-beta, 20% error-path
        tasks = []
        for _ in range(total_requests):
            choice = random.random()
            if choice < 0.40:
                tasks.append(("store-alpha", "ALPHA"))
            elif choice < 0.80:
                tasks.append(("store-beta", "BETA"))
            else:
                tasks.append(("non-existent-store-slug", "404"))

        results = []

        def execute_request(slug: str, expected_type: str):
            client = APIClient()
            url = f"/api/stores/{slug}/catalog/"
            response = client.get(url)
            return {
                "slug": slug,
                "expected_type": expected_type,
                "status_code": response.status_code,
                "data": response.data if response.status_code == 200 else None,
            }

        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = [
                executor.submit(execute_request, slug, expected_type)
                for slug, expected_type in tasks
            ]
            for future in as_completed(futures):
                results.append(future.result())

        self.assertEqual(len(results), total_requests)

        alpha_count = 0
        beta_count = 0
        error_count = 0

        for r in results:
            expected = r["expected_type"]
            status_code = r["status_code"]
            data = r["data"]

            if expected == "ALPHA":
                alpha_count += 1
                self.assertEqual(
                    status_code,
                    status.HTTP_200_OK,
                    f"Expected 200 for Store Alpha, got {status_code}",
                )
                products = data.get("products", [])
                self.assertEqual(
                    len(products),
                    2,
                    f"Store Alpha must return exactly 2 products, got {len(products)}",
                )
                for p in products:
                    self.assertTrue(
                        p["name"].startswith("Alpha"),
                        f"Store Alpha response contained non-Alpha product: {p['name']}",
                    )
                    self.assertFalse(
                        p["name"].startswith("Beta"),
                        f"Cross-store leakage: Beta product found in Alpha response: {p['name']}",
                    )

            elif expected == "BETA":
                beta_count += 1
                self.assertEqual(
                    status_code,
                    status.HTTP_200_OK,
                    f"Expected 200 for Store Beta, got {status_code}",
                )
                products = data.get("products", [])
                self.assertEqual(
                    len(products),
                    2,
                    f"Store Beta must return exactly 2 products, got {len(products)}",
                )
                for p in products:
                    self.assertTrue(
                        p["name"].startswith("Beta"),
                        f"Store Beta response contained non-Beta product: {p['name']}",
                    )
                    self.assertFalse(
                        p["name"].startswith("Alpha"),
                        f"Cross-store leakage: Alpha product found in Beta response: {p['name']}",
                    )

            elif expected == "404":
                error_count += 1
                self.assertEqual(
                    status_code,
                    status.HTTP_404_NOT_FOUND,
                    f"Expected 404 for invalid store slug, got {status_code}",
                )

        # Confirm all categories ran
        self.assertGreater(alpha_count, 0)
        self.assertGreater(beta_count, 0)
        self.assertGreater(error_count, 0)
