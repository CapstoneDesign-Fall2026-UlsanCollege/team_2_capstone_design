import json
from django.contrib.auth import get_user_model
from django.test import Client, TestCase

from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order, OrderItem
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class StorefrontAccountProfileAndOrdersTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="storeowner@nepal.np", full_name="Owner")

        # 1. Store A
        self.store_a = Store.objects.create(
            name="Kathmandu Roasters",
            slug="ktm-roasters",
            is_active=True,
        )

        # 2. Store B
        self.store_b = Store.objects.create(
            name="Pokhara Apparel",
            slug="pokhara-apparel",
            is_active=True,
        )

        # 4. Users (Alice & Bob)
        self.alice = User.objects.create_user(
            email="alice@shopper.np",
            full_name="Alice Shrestha",
            phone="9841000000",
        )
        self.bob = User.objects.create_user(email="bob@shopper.np", full_name="Bob Gurung")

        with TenantDatabaseContext(self.store_a.id):
            StoreMembership.objects.create(store=self.store_a, user=self.owner, role="OWNER")

            # 3. Products in Store A
            self.product_a = Product.objects.create(
                store=self.store_a,
                name="Dark Roast 250g",
                slug="dark-roast-250g",
                is_active=True,
            )
            self.variant_a = Variant.objects.create(
                store=self.store_a,
                product=self.product_a,
                sku="COFFEE-DARK-250",
                label="250g Whole Bean",
                price_minor=85000,
                in_stock=True,
                is_active=True,
            )

            # Alice's customer & order in Store A
            self.alice_cust_a = Customer.objects.create(
                store=self.store_a,
                user=self.alice,
                email="alice@shopper.np",
                full_name="Alice Store A",
                phone="9841111111",
            )
            self.alice_order_a = Order.objects.create(
                store=self.store_a,
                customer=self.alice_cust_a,
                order_number="ORD-ALICE-001",
                status="CONFIRMED",
                payment_method="COD",
                payment_status="PAID",
                subtotal_minor=85000,
                total_minor=85000,
            )
            OrderItem.objects.create(
                store=self.store_a,
                order=self.alice_order_a,
                variant=self.variant_a,
                product_name_snapshot="Dark Roast 250g",
                variant_label_snapshot="250g Whole Bean",
                unit_price_minor=85000,
                quantity=2,
                line_total_minor=170000,
            )

            # Bob in Store A
            self.bob_cust_a = Customer.objects.create(
                store=self.store_a,
                user=self.bob,
                email="bob@shopper.np",
                full_name="Bob Store A",
            )
            self.bob_order_a = Order.objects.create(
                store=self.store_a,
                customer=self.bob_cust_a,
                order_number="ORD-BOB-001",
                status="CONFIRMED",
                payment_method="COD",
                payment_status="PAID",
                subtotal_minor=50000,
                total_minor=50000,
            )

        # Alice's customer in Store B with DIFFERENT details
        with TenantDatabaseContext(self.store_b.id):
            self.alice_cust_b = Customer.objects.create(
                store=self.store_b,
                user=self.alice,
                email="alice@shopper.np",
                full_name="Alice Store B",
                phone="9842222222",
            )
            self.alice_order_b = Order.objects.create(
                store=self.store_b,
                customer=self.alice_cust_b,
                order_number="ORD-ALICE-B-001",
                status="PROCESSING",
                payment_method="COD",
                payment_status="COD_PENDING",
                subtotal_minor=120000,
                total_minor=120000,
            )

        self.client = Client()

    def test_account_endpoints_require_authentication(self):
        """Unauthenticated requests must be rejected with 401 or 403."""
        r1 = self.client.get(f"/api/stores/{self.store_a.slug}/account/")
        self.assertIn(r1.status_code, [401, 403])

        r2 = self.client.patch(
            f"/api/stores/{self.store_a.slug}/account/",
            data=json.dumps({"full_name": "New Name"}),
            content_type="application/json",
        )
        self.assertIn(r2.status_code, [401, 403])

        r3 = self.client.get(f"/api/stores/{self.store_a.slug}/account/orders/")
        self.assertIn(r3.status_code, [401, 403])

    def test_account_detail_get_and_cross_store_isolation(self):
        """
        GET /api/stores/<slug>/account/ returns customer profile for THAT store only.
        Alice's Store A customer profile is returned in Store A, and Store B in Store B.
        """
        self.client.force_login(self.alice)

        resp_a = self.client.get(f"/api/stores/{self.store_a.slug}/account/")
        self.assertEqual(resp_a.status_code, 200)
        data_a = resp_a.json()
        self.assertEqual(data_a["customer"]["full_name"], "Alice Store A")
        self.assertEqual(data_a["customer"]["phone"], "9841111111")
        self.assertEqual(data_a["customer"]["orders_count"], 1)
        self.assertEqual(data_a["customer"]["total_spent_minor"], 85000)

        resp_b = self.client.get(f"/api/stores/{self.store_b.slug}/account/")
        self.assertEqual(resp_b.status_code, 200)
        data_b = resp_b.json()
        self.assertEqual(data_b["customer"]["full_name"], "Alice Store B")
        self.assertEqual(data_b["customer"]["phone"], "9842222222")
        self.assertEqual(data_b["customer"]["orders_count"], 1)

    def test_account_detail_patch_validation_and_update(self):
        r"""
        PATCH /api/stores/<slug>/account/:
        - Validates phone with Nepali regex (^9[78]\d{8}$).
        - Rejects invalid phone numbers.
        - Updates customer profile for that store.
        """
        self.client.force_login(self.alice)

        bad_resp = self.client.patch(
            f"/api/stores/{self.store_a.slug}/account/",
            data=json.dumps({"phone": "12345"}),
            content_type="application/json",
        )
        self.assertEqual(bad_resp.status_code, 400)
        self.assertIn("Enter a valid 10-digit Nepali mobile number", str(bad_resp.json()))

        good_resp = self.client.patch(
            f"/api/stores/{self.store_a.slug}/account/",
            data=json.dumps({"full_name": "Alice Updated", "phone": "+977-9841999888"}),
            content_type="application/json",
        )
        self.assertEqual(good_resp.status_code, 200)
        data = good_resp.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["customer"]["full_name"], "Alice Updated")
        self.assertEqual(data["customer"]["phone"], "9841999888")

        with TenantDatabaseContext(self.store_a.id):
            self.alice_cust_a.refresh_from_db()
            self.assertEqual(self.alice_cust_a.full_name, "Alice Updated")
            self.assertEqual(self.alice_cust_a.phone, "9841999888")

        with TenantDatabaseContext(self.store_b.id):
            self.alice_cust_b.refresh_from_db()
            self.assertEqual(self.alice_cust_b.full_name, "Alice Store B")

    def test_customer_orders_list_scoping_and_privacy(self):
        """
        GET /api/stores/<slug>/account/orders/:
        - Returns ONLY orders for the logged-in customer in THIS store.
        - Alice in Store A sees only Alice's Store A order.
        - Does NOT see Bob's Store A order or Alice's Store B order.
        """
        self.client.force_login(self.alice)

        resp = self.client.get(f"/api/stores/{self.store_a.slug}/account/orders/")
        self.assertEqual(resp.status_code, 200)
        orders = resp.json()

        self.assertEqual(len(orders), 1)
        order = orders[0]
        self.assertEqual(order["order_number"], "ORD-ALICE-001")
        self.assertEqual(order["total_minor"], 85000)
        self.assertEqual(order["status"], "CONFIRMED")
        self.assertEqual(order["payment_status"], "PAID")
        self.assertIn("Dark Roast 250g (250g Whole Bean) × 2", order["items_summary"])
        self.assertEqual(order["token"], str(self.alice_order_a.token))

        order_numbers = [o["order_number"] for o in orders]
        self.assertNotIn("ORD-BOB-001", order_numbers)
        self.assertNotIn("ORD-ALICE-B-001", order_numbers)

    def test_merchant_customers_has_account_indicator(self):
        """Merchant customer list includes read-only has_account boolean without sensitive leak."""
        with TenantDatabaseContext(self.store_a.id):
            Customer.objects.create(
                store=self.store_a,
                user=None,
                email="guest.shopper@nepal.np",
                full_name="Guest Shopper",
                phone="9800000000",
            )

        client = Client()
        client.force_login(self.owner)

        resp = client.get(f"/api/merchant/stores/{self.store_a.slug}/customers/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertGreaterEqual(len(data), 2)

        customer_map = {c["email"]: c for c in data}
        self.assertIn("alice@shopper.np", customer_map)
        self.assertIn("guest.shopper@nepal.np", customer_map)

        self.assertTrue(customer_map["alice@shopper.np"]["has_account"])
        self.assertFalse(customer_map["guest.shopper@nepal.np"]["has_account"])
        self.assertEqual(customer_map["guest.shopper@nepal.np"]["city"], "")
        self.assertNotIn("password", customer_map["alice@shopper.np"])
        self.assertNotIn("token", customer_map["alice@shopper.np"])

    def test_lookup_only_does_not_autoprovision_merchant_session(self):
        """
        GET /api/stores/<slug>/account/?lookup_only=1 returns customer=None
        without auto-creating a Customer row when a merchant/platform session
        visits a storefront they have not signed into as a customer.
        """
        self.client.force_login(self.owner)
        with TenantDatabaseContext(self.store_b.id):
            self.assertFalse(Customer.objects.for_store(self.store_b).filter(user=self.owner).exists())

        resp = self.client.get(f"/api/stores/{self.store_b.slug}/account/?lookup_only=1")
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.json()["customer"])

        with TenantDatabaseContext(self.store_b.id):
            self.assertFalse(Customer.objects.for_store(self.store_b).filter(user=self.owner).exists())
