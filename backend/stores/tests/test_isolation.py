from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import DeliveryAddress
from catalog.models import Product, SellingPlan, Variant
from orders.models import Order, OrderItem
from stores.models import Customer, Store, StoreMembership, provision_store_customer
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

    def test_merchant_settings_isolation_and_encryption(self):
        # Owner A can read Store A settings
        self.client.force_login(self.owner_a)
        res_a = self.client.get("/api/merchant/stores/brewmellow/settings/")
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertEqual(res_a.data["slug"], "brewmellow")

        # Owner A updating Store A settings
        patch_res = self.client.patch(
            "/api/merchant/stores/brewmellow/settings/",
            {
                "inside_valley_shipping_minor": 15000,
                "khalti_mode": "LIVE",
                "khalti_secret_key": "live_secret_key_abcdef123456",
            },
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["inside_valley_shipping_minor"], 15000)
        self.assertEqual(patch_res.data["khalti_mode"], "LIVE")
        self.assertTrue(patch_res.data["has_custom_khalti_key"])
        self.assertTrue(patch_res.data["khalti_key_masked"].endswith("3456"))

        # Owner A accessing Store B settings -> 404
        cross_res = self.client.get("/api/merchant/stores/pahadi-honey/settings/")
        self.assertEqual(cross_res.status_code, status.HTTP_404_NOT_FOUND)

        # Owner B accessing Store A settings -> 404
        self.client.force_login(self.owner_b)
        cross_b = self.client.patch(
            "/api/merchant/stores/brewmellow/settings/",
            {"inside_valley_shipping_minor": 5000},
            format="json",
        )
        self.assertEqual(cross_b.status_code, status.HTTP_404_NOT_FOUND)

    def test_merchant_product_crud_and_cross_tenant_isolation(self):
        # Owner A creates product on Store A
        self.client.force_login(self.owner_a)
        create_res = self.client.post(
            "/api/merchant/stores/brewmellow/products/",
            {
                "name": "Winter Solstice Blend",
                "description": "Seasonal dark roast with notes of molasses and spice.",
                "initial_price_minor": 145000,
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        new_prod_id = create_res.data["id"]
        self.assertEqual(create_res.data["slug"], "winter-solstice-blend")
        self.assertEqual(len(create_res.data["variants"]), 1)
        self.assertEqual(create_res.data["variants"][0]["price_minor"], 145000)

        # Owner A patches product
        patch_res = self.client.patch(
            f"/api/merchant/stores/brewmellow/products/{new_prod_id}/",
            {"name": "Winter Solstice Blend 2026"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["name"], "Winter Solstice Blend 2026")

        # Owner A accessing Store B's product -> 404
        cross_res = self.client.get(f"/api/merchant/stores/pahadi-honey/products/{new_prod_id}/")
        self.assertEqual(cross_res.status_code, status.HTTP_404_NOT_FOUND)

        # Owner B accessing Store A's product -> 404
        self.client.force_login(self.owner_b)
        cross_b = self.client.delete(f"/api/merchant/stores/brewmellow/products/{new_prod_id}/")
        self.assertEqual(cross_b.status_code, status.HTTP_404_NOT_FOUND)

        # Owner A archiving product
        self.client.force_login(self.owner_a)
        del_res = self.client.delete(f"/api/merchant/stores/brewmellow/products/{new_prod_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)
        self.assertFalse(del_res.data["is_active"])

    def test_merchant_variant_crud_and_selling_plan_isolation(self):
        self.client.force_login(self.owner_a)

        # Get first product of Store A
        prod = Product.objects.for_store(self.store_a).first()
        self.assertIsNotNone(prod)

        # Create new variant on Store A
        res_v = self.client.post(
            f"/api/merchant/stores/brewmellow/products/{prod.id}/variants/",
            {
                "label": "1kg Big Bag",
                "price_minor": 285000,
                "in_stock": True,
                "allow_subscription": True,
            },
            format="json",
        )
        self.assertEqual(res_v.status_code, status.HTTP_201_CREATED)
        variant_id = res_v.data["id"]
        self.assertEqual(res_v.data["price_minor"], 285000)

        # Owner A patches variant
        patch_v = self.client.patch(
            f"/api/merchant/stores/brewmellow/products/{prod.id}/variants/{variant_id}/",
            {"price_minor": 290000},
            format="json",
        )
        self.assertEqual(patch_v.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_v.data["price_minor"], 290000)

        # Owner B accessing Store A's variant -> 404
        self.client.force_login(self.owner_b)
        cross_b = self.client.get(
            f"/api/merchant/stores/brewmellow/products/{prod.id}/variants/{variant_id}/"
        )
        self.assertEqual(cross_b.status_code, status.HTTP_404_NOT_FOUND)

        # Owner B accessing Store A selling plans -> 404 on cross store
        cross_plans = self.client.get("/api/merchant/stores/brewmellow/selling-plans/")
        self.assertEqual(cross_plans.status_code, status.HTTP_404_NOT_FOUND)

    def test_store_checkout_quote_and_placement_isolation(self):
        """Verify server-authoritative checkout quote, COD placement, and Khalti verify with strict multi-tenant isolation."""
        self.client.logout()
        prod = Product.objects.for_store(self.store_a).first()
        variant = prod.variants.first()

        # 1. Checkout Quote: Inside Valley Kathmandu
        res_quote = self.client.post(
            "/api/stores/brewmellow/checkout/quote/",
            {
                "items": [{"variant_id": variant.id, "quantity": 2}],
                "district": "Kathmandu",
            },
            format="json",
        )
        self.assertEqual(res_quote.status_code, status.HTTP_200_OK)
        expected_subtotal = variant.price_minor * 2
        self.assertEqual(res_quote.data["subtotal_minor"], expected_subtotal)
        self.assertEqual(res_quote.data["shipping_minor"], self.store_a.inside_valley_shipping_minor)
        self.assertEqual(res_quote.data["total_minor"], expected_subtotal + self.store_a.inside_valley_shipping_minor)

        # 2. Checkout Quote: Outside Valley Kaski
        res_quote_outside = self.client.post(
            "/api/stores/brewmellow/checkout/quote/",
            {
                "items": [{"variant_id": variant.id, "quantity": 1}],
                "district": "Kaski",
            },
            format="json",
        )
        self.assertEqual(res_quote_outside.status_code, status.HTTP_200_OK)
        self.assertEqual(res_quote_outside.data["shipping_minor"], self.store_a.outside_valley_shipping_minor)

        # 3. Order Place via COD
        shipping_payload = {
            "recipient_name": "Aayush Shrestha",
            "phone": "9841999888",
            "province": "Bagmati",
            "district": "Kathmandu",
            "municipality": "Kathmandu Metropolitan City",
            "ward": 3,
            "street_landmark": "Near Maharajgunj",
        }
        res_cod = self.client.post(
            "/api/stores/brewmellow/checkout/place/",
            {
                "customer_email": "aayush@example.com",
                "items": [{"variant_id": variant.id, "quantity": 1}],
                "shipping_address": shipping_payload,
                "payment_method": "COD",
            },
            format="json",
        )
        self.assertEqual(res_cod.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_cod.data["payment_method"], "COD")
        self.assertEqual(res_cod.data["status"], "CONFIRMED")
        cod_order_id = res_cod.data["order_id"]

        # Verify public order detail retrieval
        res_order = self.client.get(f"/api/stores/brewmellow/public-orders/{cod_order_id}/")
        self.assertEqual(res_order.status_code, status.HTTP_200_OK)
        self.assertEqual(res_order.data["order_number"], res_cod.data["order_number"])
        self.assertEqual(len(res_order.data["items"]), 1)

        # 4. Multi-Tenant Cross-Store Isolation: Store B cannot see Store A's order
        res_cross = self.client.get(f"/api/stores/himalayan-craft/public-orders/{cod_order_id}/")
        self.assertEqual(res_cross.status_code, status.HTTP_404_NOT_FOUND)

        # 5. Order Place via Khalti
        res_khalti = self.client.post(
            "/api/stores/brewmellow/checkout/place/",
            {
                "customer_email": "aayush@example.com",
                "items": [{"variant_id": variant.id, "quantity": 1}],
                "shipping_address": shipping_payload,
                "payment_method": "KHALTI",
            },
            format="json",
        )
        self.assertEqual(res_khalti.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_khalti.data["status"], "PENDING_PAYMENT")
        khalti_order_id = res_khalti.data["order_id"]
        pidx = res_khalti.data["pidx"]
        self.assertTrue(bool(pidx))

        # 6. Verify Khalti Payment
        res_verify = self.client.post(
            "/api/stores/brewmellow/checkout/khalti-verify/",
            {"pidx": pidx, "order_id": khalti_order_id},
            format="json",
        )
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)
        self.assertEqual(res_verify.data["status"], "PAID")

        # Cross store cannot verify Store A's order
        res_cross_verify = self.client.post(
            "/api/stores/himalayan-craft/checkout/khalti-verify/",
            {"pidx": pidx, "order_id": khalti_order_id},
            format="json",
        )
        self.assertEqual(res_cross_verify.status_code, status.HTTP_404_NOT_FOUND)

    def test_merchant_order_queue_and_transition_isolation(self):
        """Verify merchant order queue status tabs, transitions with COD cash confirmation, and multi-tenant security."""
        self.client.force_login(self.owner_a)

        # 1. Fetch merchant orders queue with status counts
        res_list = self.client.get("/api/merchant/stores/brewmellow/orders/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        self.assertIn("counts", res_list.data)
        self.assertIn("orders", res_list.data)

        # Create a new test order for Store A
        customer = provision_store_customer(self.store_a, self.owner_a)
        order = Order.objects.create(
            store=self.store_a,
            customer=customer,
            order_number="#BM-TEST-0099",
            status="CONFIRMED",
            payment_method="COD",
            payment_status="COD_PENDING",
            subtotal_minor=85000,
            shipping_minor=10000,
            total_minor=95000,
        )

        # 2. Advance CONFIRMED -> PROCESSING (Packed)
        res_pack = self.client.post(
            f"/api/merchant/stores/brewmellow/orders/{order.id}/transition/",
            {"to_status": "PROCESSING", "note": "All items freshly roasted and boxed."},
            format="json",
        )
        self.assertEqual(res_pack.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pack.data["status"], "PROCESSING")

        # 3. Advance PROCESSING -> SHIPPED
        res_ship = self.client.post(
            f"/api/merchant/stores/brewmellow/orders/{order.id}/transition/",
            {"to_status": "SHIPPED", "note": "Handed to Pathao Courier."},
            format="json",
        )
        self.assertEqual(res_ship.status_code, status.HTTP_200_OK)
        self.assertEqual(res_ship.data["status"], "SHIPPED")

        # 4. Advance SHIPPED -> DELIVERED (Confirms Cash on Delivery)
        res_deliver = self.client.post(
            f"/api/merchant/stores/brewmellow/orders/{order.id}/transition/",
            {"to_status": "DELIVERED"},
            format="json",
        )
        self.assertEqual(res_deliver.status_code, status.HTTP_200_OK)
        self.assertEqual(res_deliver.data["status"], "DELIVERED")
        self.assertEqual(res_deliver.data["payment_status"], "PAID")

        # 5. Non-blocking Undo: DELIVERED -> SHIPPED (Reverts cash collection)
        res_undo = self.client.post(
            f"/api/merchant/stores/brewmellow/orders/{order.id}/transition/",
            {"to_status": "SHIPPED"},
            format="json",
        )
        self.assertEqual(res_undo.status_code, status.HTTP_200_OK)
        self.assertEqual(res_undo.data["status"], "SHIPPED")
        self.assertEqual(res_undo.data["payment_status"], "COD_PENDING")

        # 6. Multi-Tenant Cross Store Access: Owner B cannot view or transition Store A's order
        self.client.force_login(self.owner_b)
        res_b_view = self.client.get(f"/api/merchant/stores/brewmellow/orders/{order.id}/")
        self.assertEqual(res_b_view.status_code, status.HTTP_404_NOT_FOUND)

        res_b_trans = self.client.post(
            f"/api/merchant/stores/brewmellow/orders/{order.id}/transition/",
            {"to_status": "DELIVERED"},
            format="json",
        )
        self.assertEqual(res_b_trans.status_code, status.HTTP_404_NOT_FOUND)
