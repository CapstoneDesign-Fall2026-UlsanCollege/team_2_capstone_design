from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import DeliveryAddress
from catalog.models import Product, SellingPlan, Variant
from orders.models import Order, OrderItem
from stores.models import Customer, Store, StoreMembership
from subscriptions.models import Subscription

User = get_user_model()


class TenantIsolationTests(APITestCase):
    def setUp(self):
        call_command("seed_brewmellow")
        self.store_a = Store.objects.get(slug="brewmellow")
        self.owner_a = User.objects.get(email="aarav.shrestha@brewmellow.com.np")

        # Provision Store B (competitor merchant)
        self.owner_b = User.objects.create_user("roshani.gurung@pahadihoney.com.np", full_name="Roshani Gurung")
        self.store_b = Store.objects.create(
            slug="pahadi-honey",
            name="Pahadi Honey",
            theme_preset="pahadi-sage",
            inside_valley_shipping_minor=12000,
            outside_valley_shipping_minor=25000,
            is_active=True,
        )
        StoreMembership.objects.create(store=self.store_b, user=self.owner_b, role="OWNER")

        self.prod_b = Product.objects.create(
            store=self.store_b,
            slug="wild-cliff-honey",
            name="Wild Cliff Honey",
            allow_one_time=True,
            allow_subscription=True,
        )
        self.var_b = Variant.objects.create(
            store=self.store_b,
            product=self.prod_b,
            sku="ph-cliff-500g",
            label="500g",
            price_minor=85000,
            allow_one_time=True,
            allow_subscription=True,
        )
        self.cust_b = Customer.objects.create(
            store=self.store_b,
            email="shopper.b@example.com",
            full_name="Shopper B",
        )
        self.order_b = Order.objects.create(
            store=self.store_b,
            customer=self.cust_b,
            order_number="PH-2026-0001",
            subtotal_minor=85000,
            total_minor=97000,
        )

    def test_merchant_cross_store_endpoints_return_404(self):
        # 1. Unauthenticated merchant call returns 401/403
        anon_res = self.client.get("/api/merchant/stores/brewmellow/overview/")
        self.assertIn(anon_res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        # 2. Authenticate as Owner A -> probing Store B must return 404 on all 6 endpoints
        self.client.force_login(self.owner_a)
        b_endpoints = [
            ("get", "/api/merchant/stores/pahadi-honey/overview/"),
            ("get", "/api/merchant/stores/pahadi-honey/products/"),
            ("post", "/api/merchant/stores/pahadi-honey/products/"),
            ("get", "/api/merchant/stores/pahadi-honey/orders/"),
            ("get", "/api/merchant/stores/pahadi-honey/customers/"),
            ("get", "/api/merchant/stores/pahadi-honey/subscriptions/"),
        ]
        for method, url in b_endpoints:
            if method == "get":
                r = self.client.get(url)
            else:
                r = self.client.post(url, {"name": "Spy Product", "slug": "spy-product"})
            self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND, f"Failed on {method.upper()} {url}")

        # 3. Authenticate as Owner B -> probing Store A must return 404 on all 6 endpoints
        self.client.force_login(self.owner_b)
        a_endpoints = [
            ("get", "/api/merchant/stores/brewmellow/overview/"),
            ("get", "/api/merchant/stores/brewmellow/products/"),
            ("post", "/api/merchant/stores/brewmellow/products/"),
            ("get", "/api/merchant/stores/brewmellow/orders/"),
            ("get", "/api/merchant/stores/brewmellow/customers/"),
            ("get", "/api/merchant/stores/brewmellow/subscriptions/"),
        ]
        for method, url in a_endpoints:
            if method == "get":
                r = self.client.get(url)
            else:
                r = self.client.post(url, {"name": "Spy Product", "slug": "spy-product"})
            self.assertEqual(r.status_code, status.HTTP_404_NOT_FOUND, f"Failed on {method.upper()} {url}")

    def test_store_field_never_writable_from_payload(self):
        self.client.force_login(self.owner_a)
        # Attempt to inject store and store_id in payload targeting store_b
        res = self.client.post("/api/merchant/stores/brewmellow/products/", {
            "store": self.store_b.id,
            "store_id": self.store_b.id,
            "slug": "palpa-dark",
            "name": "Palpa Dark Roast",
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.for_store(self.store_b).filter(slug="palpa-dark").count(), 0)
        created_prod = Product.objects.for_store(self.store_a).get(slug="palpa-dark")
        self.assertEqual(created_prod.store, self.store_a)

    def test_global_user_provisions_isolated_per_store_customers(self):
        shopper = User.objects.create_user("anita.kc@example.com.np", full_name="Anita KC")
        self.client.force_login(shopper)

        # Call bootstrap on Store A and Store B
        res_a = self.client.post("/api/stores/brewmellow/customer/bootstrap/")
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        res_b = self.client.post("/api/stores/pahadi-honey/customer/bootstrap/")
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)

        self.assertNotEqual(res_a.data["id"], res_b.data["id"])
        self.assertEqual(Customer.objects.for_store(self.store_a).filter(email=shopper.email).count(), 1)
        self.assertEqual(Customer.objects.for_store(self.store_b).filter(email=shopper.email).count(), 1)

        # Owner B checking customer list must not see Store A's orders/customers
        self.client.force_login(self.owner_b)
        b_cust_res = self.client.get("/api/merchant/stores/pahadi-honey/customers/")
        self.assertEqual(b_cust_res.status_code, status.HTTP_200_OK)
        b_emails = [c["email"] for c in b_cust_res.data]
        self.assertIn("anita.kc@example.com.np", b_emails)
        self.assertNotIn("sita.maharjan@example.com.np", b_emails)

    def test_shopper_cross_user_order_and_address_return_404(self):
        shopper_y = User.objects.create_user("shopper.y@example.com", full_name="Shopper Y")
        cust_y = Customer.objects.create(store=self.store_a, user=shopper_y, email=shopper_y.email)
        order_y = Order.objects.create(
            store=self.store_a,
            customer=cust_y,
            order_number="BM-2026-Y001",
            subtotal_minor=65000,
            total_minor=75000,
        )
        addr_y = DeliveryAddress.objects.create(
            user=shopper_y,
            recipient_name="Shopper Y",
            phone="9841000000",
            province="Bagmati",
            district="Kathmandu",
            municipality="Kathmandu",
            ward=1,
            street_landmark="Dillibazar",
        )

        shopper_x = User.objects.create_user("shopper.x@example.com", full_name="Shopper X")
        self.client.force_login(shopper_x)

        # Shopper X attempting to read Shopper Y's order -> 404
        order_res = self.client.get(f"/api/stores/brewmellow/orders/{order_y.id}/")
        self.assertEqual(order_res.status_code, status.HTTP_404_NOT_FOUND)

        # Shopper X order list must not contain Shopper Y's order
        list_res = self.client.get("/api/stores/brewmellow/orders/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_res.data), 0)

        # Shopper X attempting to read Shopper Y's address -> 404
        addr_res = self.client.get(f"/api/auth/addresses/{addr_y.id}/")
        self.assertEqual(addr_res.status_code, status.HTTP_404_NOT_FOUND)

    def test_seed_brewmellow_double_run_idempotency_and_paisa_matrix(self):
        # Run second time
        call_command("seed_brewmellow")

        s = Store.objects.get(slug="brewmellow")
        self.assertEqual(Product.objects.for_store(s).count(), 3)
        self.assertEqual(Variant.objects.for_store(s).count(), 12)
        self.assertEqual(Variant.objects.for_store(s).filter(label="150g", allow_subscription=False).count(), 3)
        self.assertEqual(Variant.objects.for_store(s).filter(allow_subscription=True).count(), 9)
        self.assertEqual(SellingPlan.objects.for_store(s).count(), 4)
        self.assertEqual(Order.objects.for_store(s).count(), 3)
        self.assertEqual(Subscription.objects.for_store(s).count(), 2)

        # Check exact integer paisa range
        prices = Variant.objects.for_store(s).values_list("price_minor", flat=True)
        self.assertEqual(min(prices), 40000)
        self.assertEqual(max(prices), 260000)

        # Fernet round-trip test on store key
        s.set_khalti_secret_key("test_secret_key_12345")
        s.save()
        reloaded = Store.objects.get(slug="brewmellow")
        self.assertNotEqual(reloaded.khalti_secret_key_encrypted, "test_secret_key_12345")
        self.assertEqual(reloaded.get_khalti_secret_key(), "test_secret_key_12345")
