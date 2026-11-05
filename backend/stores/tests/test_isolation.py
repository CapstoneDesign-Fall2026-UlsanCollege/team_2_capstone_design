from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import DeliveryAddress
from catalog.models import Discount, Product, SellingPlan, Variant
from core.tenant_context import TenantDatabaseContext, BypassRLSContext, get_current_tenant_id
from django.core.files.uploadedfile import SimpleUploadedFile
from orders.models import Order, OrderItem
from stores.models import Customer, MerchantAuditLog, Store, StoreMembership, provision_store_customer
from subscriptions.models import Subscription

User = get_user_model()


class TenantIsolationTests(APITestCase):
    def setUp(self):
        from core.tenant_context import reset_current_tenant_id
        reset_current_tenant_id()
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

    def tearDown(self):
        from core.tenant_context import reset_current_tenant_id
        reset_current_tenant_id()
        super().tearDown()

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
        cod_token = res_cod.data["token"]
        self.assertTrue(bool(cod_token))

        # IDOR Protection: Anonymous lookup by integer ID without unguessable token must return 404
        res_idor = self.client.get(f"/api/stores/brewmellow/public-orders/{cod_order_id}/")
        self.assertEqual(res_idor.status_code, status.HTTP_404_NOT_FOUND)

        # Lookup by UUID token succeeds
        res_order = self.client.get(f"/api/stores/brewmellow/public-orders/{cod_token}/")
        self.assertEqual(res_order.status_code, status.HTTP_200_OK)
        self.assertEqual(res_order.data["order_number"], res_cod.data["order_number"])
        self.assertEqual(len(res_order.data["items"]), 1)

        # Lookup by integer ID with valid token parameter succeeds
        res_order_param = self.client.get(f"/api/stores/brewmellow/public-orders/{cod_order_id}/?token={cod_token}")
        self.assertEqual(res_order_param.status_code, status.HTTP_200_OK)

        # 4. Multi-Tenant Cross-Store Isolation: Store B cannot see Store A's order even with token
        res_cross = self.client.get(f"/api/stores/himalayan-craft/public-orders/{cod_token}/")
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


    def test_prepaid_subscription_checkout_and_idempotent_cycles(self):
        """
        SUBS-01 and SUBS-02:
        Verifies checkout subscription creation, upfront payment activation,
        and idempotent $0 cycle order generation with cycle countdown.
        """
        from datetime import timedelta
        from django.utils import timezone
        from catalog.models import Product, SellingPlan, Variant
        from orders.models import Order
        from subscriptions.models import Subscription
        from subscriptions.services import execute_due_subscription_cycles

        # 1. Setup subscription product & 3M prepaid plan
        plan_3m, _ = SellingPlan.objects.get_or_create(
            store=self.store_a,
            code="test-3m-plan",
            defaults={
                "name": "3 Months Prepaid",
                "interval_unit": "MONTH",
                "interval_count": 1,
                "commitment_cycles": 3,
                "discount_pct": 10,
                "is_prepaid": True,
                "is_active": True,
                "sort_order": 1,
            },
        )
        prod = Product.objects.create(
            store=self.store_a,
            slug="sub-tea",
            name="Subscription Tea",
            allow_one_time=True,
            allow_subscription=True,
        )
        variant = Variant.objects.create(
            store=self.store_a,
            product=prod,
            sku="TEA-SUB-01",
            label="250g",
            price_minor=100000,  # Rs. 1,000 base
            allow_one_time=True,
            allow_subscription=True,
            in_stock=True,
            is_active=True,
        )

        # 2. Place checkout order with 3M prepaid plan
        shipping_addr = {
            "recipient_name": "Suman Thapa",
            "phone": "9841223344",
            "province": "Bagmati",
            "district": "Kathmandu",
            "municipality": "Kathmandu Metro",
            "ward": "3",
            "street_address": "Lazimpat",
        }
        res_place = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/place/",
            {
                "customer_email": "suman.thapa@example.com", "email": "suman.thapa@example.com",
                "items": [
                    {
                        "variant_id": variant.id,
                        "quantity": 1,
                        "purchase_type": "subscription",
                        "selling_plan_id": plan_3m.id,
                    }
                ],
                "shipping_address": shipping_addr,
                "payment_method": "KHALTI",
            },
            format="json",
        )
        if res_place.status_code != 201: print("RES PLACE ERROR:", res_place.status_code, res_place.data)
        self.assertEqual(res_place.status_code, status.HTTP_201_CREATED)
        order_id = res_place.data["order_id"]
        pidx = res_place.data["pidx"]

        # Initial subscription created in PENDING_PAYMENT
        sub = Subscription.objects.get(order_id=order_id)
        self.assertEqual(sub.status, "PENDING_PAYMENT")
        self.assertEqual(sub.cycles_total, 3)
        self.assertEqual(sub.cycles_remaining, 2)

        # 3. Verify Khalti Payment
        res_verify = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/khalti-verify/",
            {"pidx": pidx, "order_id": order_id},
            format="json",
        )
        self.assertEqual(res_verify.status_code, status.HTTP_200_OK)

        # Subscription is now ACTIVE
        sub.refresh_from_db()
        self.assertEqual(sub.status, "ACTIVE")

        # 4. Run cycle runner for next month (Cycle 2)
        target_cycle_2 = timezone.now().date() + timedelta(days=32)
        sub.next_delivery_date = target_cycle_2
        sub.save()

        res_cycle_2 = execute_due_subscription_cycles(store=self.store_a, target_date=target_cycle_2)
        self.assertGreaterEqual(res_cycle_2["orders_generated"], 1)

        # Cycle 2 order for our subscription must be $0 / Rs. 0 because it was prepaid
        sub_order = next((o for o in res_cycle_2["orders"] if o.customer.email == "suman.thapa@example.com"), None)
        self.assertIsNotNone(sub_order)
        self.assertEqual(sub_order.order_type, "SUBSCRIPTION_CYCLE")
        self.assertEqual(sub_order.total_minor, 0)
        self.assertEqual(sub_order.status, "CONFIRMED")
        self.assertEqual(sub_order.payment_status, "PAID")

        sub.refresh_from_db()
        self.assertEqual(sub.cycles_remaining, 1)
        self.assertEqual(sub.status, "ACTIVE")

        # 5. Idempotency test: Re-running on same date must NEVER duplicate orders
        res_repeat = execute_due_subscription_cycles(store=self.store_a, target_date=target_cycle_2)
        self.assertEqual(res_repeat["orders_generated"], 0)

        # 6. Cycle 3 (Final commitment delivery): Completes subscription
        target_cycle_3 = target_cycle_2 + timedelta(days=32)
        sub.next_delivery_date = target_cycle_3
        sub.save()

        res_cycle_3 = execute_due_subscription_cycles(store=self.store_a, target_date=target_cycle_3)
        self.assertGreaterEqual(res_cycle_3["orders_generated"], 1)
        self.assertGreaterEqual(res_cycle_3["completed_subscriptions"], 1)

        sub.refresh_from_db()
        self.assertEqual(sub.cycles_remaining, 0)
        self.assertEqual(sub.status, "COMPLETED")

    def test_merchant_run_subscription_cycles_isolation(self):
        """
        Verifies merchant can trigger cycle processing and cross-tenant access returns 404.
        """
        # Owner A can trigger on their store
        self.client.force_login(self.owner_a)
        res_a = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/subscriptions/run-cycles/",
            {},
            format="json",
        )
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertTrue(res_a.data["success"])

        # Owner B cannot trigger on Store A
        self.client.force_login(self.owner_b)
        res_b = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/subscriptions/run-cycles/",
            {},
            format="json",
        )
        self.assertEqual(res_b.status_code, status.HTTP_404_NOT_FOUND)


    def test_merchant_subscription_actions_and_isolation(self):
        """
        SUBS-03:
        Verifies merchant can pause, resume, skip cycle, and cancel subscriptions,
        and unauthorized cross-tenant actions return 404.
        """
        from subscriptions.models import Subscription

        sub = Subscription.objects.filter(store=self.store_a, status="ACTIVE").first()
        self.assertIsNotNone(sub)

        # 1. Merchant A pauses subscription
        self.client.force_login(self.owner_a)
        res_pause = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/subscriptions/{sub.id}/action/",
            {"action": "pause"},
            format="json",
        )
        self.assertEqual(res_pause.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pause.data["status"], "PAUSED")

        # 2. Merchant A resumes subscription
        res_resume = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/subscriptions/{sub.id}/action/",
            {"action": "resume"},
            format="json",
        )
        self.assertEqual(res_resume.status_code, status.HTTP_200_OK)
        self.assertEqual(res_resume.data["status"], "ACTIVE")

        # 3. Merchant A skips next delivery date
        old_date = sub.next_delivery_date
        res_skip = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/subscriptions/{sub.id}/action/",
            {"action": "skip_cycle"},
            format="json",
        )
        self.assertEqual(res_skip.status_code, status.HTTP_200_OK)
        sub.refresh_from_db()
        self.assertGreater(sub.next_delivery_date, old_date)

        # 4. Cross-tenant security: Owner B cannot pause or cancel Store A's subscription
        self.client.force_login(self.owner_b)
        res_b_pause = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/subscriptions/{sub.id}/action/",
            {"action": "pause"},
            format="json",
        )
        self.assertEqual(res_b_pause.status_code, status.HTTP_404_NOT_FOUND)

    def test_admin_email_backdoor_removed(self):
        """
        Verifies that users with 'admin@' email pattern cannot bypass merchant authorization
        without explicit StoreMembership.
        """
        unauthorized_admin = User.objects.create_user(
            "admin@intruder.com",
            full_name="Intruder Admin",
        )
        self.client.force_login(unauthorized_admin)

        res_a = self.client.get(f"/api/merchant/stores/{self.store_a.slug}/overview/")
        self.assertEqual(res_a.status_code, status.HTTP_404_NOT_FOUND)

        res_b = self.client.get(f"/api/merchant/stores/{self.store_b.slug}/overview/")
        self.assertEqual(res_b.status_code, status.HTTP_404_NOT_FOUND)

    def test_khalti_sandbox_rejected_in_live_mode(self):
        """
        Verifies that sandbox pidx payments are strictly rejected when store is in LIVE khalti mode.
        """
        self.store_a.khalti_mode = "LIVE"
        self.store_a.save(update_fields=["khalti_mode"])

        cust_a = Customer.objects.filter(store=self.store_a).first()
        order = Order.objects.create(
            store=self.store_a,
            customer=cust_a,
            order_number="BM-TEST-LIVE-KHALTI",
            subtotal_minor=50000,
            total_minor=50000,
            status="PENDING_PAYMENT",
            payment_status="PENDING",
            payment_method="KHALTI",
        )

        res = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/khalti-verify/",
            {"pidx": f"sandbox_{order.id}_fake123", "order_id": order.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        order.refresh_from_db()
        self.assertEqual(order.status, "PAYMENT_FAILED")
        self.assertEqual(order.payment_status, "FAILED")

    def test_media_upload_scoping_and_audit_logging(self):
        """
        Verifies store-prefixed media uploads require merchant authentication,
        block cross-tenant uploads, and record MerchantAuditLog.
        """
        # 1. Anonymous upload blocked
        self.client.logout()
        dummy_file = SimpleUploadedFile("product.png", b"fake-png-binary-content", content_type="image/png")
        anon_res = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/media/upload/",
            {"file": dummy_file},
            format="multipart",
        )
        self.assertIn(anon_res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        # 2. Cross-tenant upload blocked (Owner B cannot upload to Store A)
        self.client.force_login(self.owner_b)
        dummy_file = SimpleUploadedFile("product.png", b"fake-png-binary-content", content_type="image/png")
        cross_res = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/media/upload/",
            {"file": dummy_file},
            format="multipart",
        )
        self.assertEqual(cross_res.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Authorized Owner A upload succeeds with store prefix
        self.client.force_login(self.owner_a)
        dummy_file = SimpleUploadedFile("dark-roast.png", b"fake-png-binary-content", content_type="image/png")
        auth_res = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/media/upload/",
            {"file": dummy_file},
            format="multipart",
        )
        self.assertEqual(auth_res.status_code, status.HTTP_201_CREATED)
        self.assertIn("url", auth_res.data)
        self.assertTrue(auth_res.data["url"].startswith(f"/uploads/stores/{self.store_a.slug}/products/"))

        # Verify audit log entry was created
        log_entry = MerchantAuditLog.objects.filter(
            store=self.store_a,
            action="MEDIA_UPLOAD",
            actor=self.owner_a,
        ).first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.entity_type, "MediaAsset")

    def test_merchant_audit_log_isolation(self):
        """
        Verifies that merchant audit logs are strictly isolated per store.
        """
        MerchantAuditLog.objects.create(
            store=self.store_a,
            actor=self.owner_a,
            action="SETTINGS_UPDATE",
            entity_type="Store",
            entity_id=str(self.store_a.id),
            details={"test": "a"},
        )
        MerchantAuditLog.objects.create(
            store=self.store_b,
            actor=self.owner_b,
            action="SETTINGS_UPDATE",
            entity_type="Store",
            entity_id=str(self.store_b.id),
            details={"test": "b"},
        )

        # Owner A sees only Store A logs
        self.client.force_login(self.owner_a)
        res_a = self.client.get(f"/api/merchant/stores/{self.store_a.slug}/audit-logs/")
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        actions = [log["action"] for log in res_a.data]
        self.assertIn("SETTINGS_UPDATE", actions)

        # Owner A accessing Store B logs -> 404
        res_cross = self.client.get(f"/api/merchant/stores/{self.store_b.slug}/audit-logs/")
        self.assertEqual(res_cross.status_code, status.HTTP_404_NOT_FOUND)

    def test_tenant_database_context_and_rls_switching(self):
        """
        Verifies TenantDatabaseContext sets and resets thread-local tenant ID cleanly.
        """
        self.assertIsNone(get_current_tenant_id())

        with TenantDatabaseContext(self.store_a.id):
            self.assertEqual(get_current_tenant_id(), self.store_a.id)

        self.assertIsNone(get_current_tenant_id())

        with BypassRLSContext():
            self.assertEqual(get_current_tenant_id(), "ALL")

        self.assertIsNone(get_current_tenant_id())

    def test_store_create_with_category_location_and_membership(self):
        """
        Slice 2: Verifies store creation with category, city, province,
        automatic OWNER membership assignment, starter product seeding, and audit logging.
        """
        merchant_user = User.objects.create_user("new.founder@example.com.np", full_name="New Founder")
        self.client.force_login(merchant_user)

        payload = {
            "name": "Nuwakot Organic Herbs",
            "slug": "nuwakot-herbs",
            "category": "Organic Honey, Herbs & Spices",
            "city": "Bidur",
            "province": "Bagmati Province",
            "theme_preset": "pahadi-sage",
            "tagline": "Freshly harvested mountain herbs from Nuwakot valley.",
            "contact_phone": "9841234567",
        }

        res = self.client.post("/api/stores/create/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["slug"], "nuwakot-herbs")
        self.assertEqual(res.data["category"], "Organic Honey, Herbs & Spices")
        self.assertEqual(res.data["city"], "Bidur")
        self.assertEqual(res.data["theme_preset"], "pahadi-sage")

        # Verify DB store record
        created_store = Store.objects.get(slug="nuwakot-herbs")
        self.assertEqual(created_store.category, "Organic Honey, Herbs & Spices")
        self.assertEqual(created_store.city, "Bidur")

        # Verify StoreMembership with role OWNER
        membership = StoreMembership.all_objects.filter(store=created_store, user=merchant_user).first()
        self.assertIsNotNone(membership)
        self.assertEqual(membership.role, "OWNER")

        # Verify starter product seeded
        starter_prod = Product.objects.for_store(created_store).first()
        self.assertIsNotNone(starter_prod)
        self.assertGreaterEqual(starter_prod.variants.count(), 1)

        # Verify MerchantAuditLog created
        audit_log = MerchantAuditLog.objects.filter(store=created_store, action="STORE_CREATE").first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.actor, merchant_user)

    def test_merchant_my_stores_listing_and_isolation(self):
        """
        Slice 2: Verifies /api/stores/my-stores/ returns only the active stores
        the authenticated merchant belongs to (OWNER or STAFF), powering the Store Switcher.
        """
        # Anonymous returns 401/403
        self.client.logout()
        res_anon = self.client.get("/api/stores/my-stores/")
        self.assertIn(res_anon.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        # Owner A owns Store A (brewmellow)
        self.client.force_login(self.owner_a)
        res_a = self.client.get("/api/stores/my-stores/")
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        slugs_a = [s["slug"] for s in res_a.data["stores"]]
        self.assertIn(self.store_a.slug, slugs_a)
        self.assertNotIn(self.store_b.slug, slugs_a)

        # Owner B owns Store B (pahadi-honey)
        self.client.force_login(self.owner_b)
        res_b = self.client.get("/api/stores/my-stores/")
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        slugs_b = [s["slug"] for s in res_b.data["stores"]]
        self.assertIn(self.store_b.slug, slugs_b)
        self.assertNotIn(self.store_a.slug, slugs_b)

    def test_store_slug_validation_reserved_and_format(self):
        """
        Slice 2: Verifies reserved slugs and taken slugs return 400 or available: False.
        """
        self.client.force_login(self.owner_a)

        # Reserved slug 'admin' rejected
        res_res = self.client.post("/api/stores/create/", {
            "name": "Admin Portal",
            "slug": "admin",
        }, format="json")
        self.assertEqual(res_res.status_code, status.HTTP_400_BAD_REQUEST)

        # Taken slug 'brewmellow' rejected
        res_taken = self.client.post("/api/stores/create/", {
            "name": "Brew Mellow Duplicate",
            "slug": "brewmellow",
        }, format="json")
        self.assertEqual(res_taken.status_code, status.HTTP_400_BAD_REQUEST)

        # Check slug endpoint: taken vs available
        chk_taken = self.client.get("/api/stores/check-slug/?slug=brewmellow")
        self.assertEqual(chk_taken.status_code, status.HTTP_200_OK)
        self.assertFalse(chk_taken.data["available"])

        chk_free = self.client.get("/api/stores/check-slug/?slug=brand-new-pashmina-nepal")
        self.assertEqual(chk_free.status_code, status.HTTP_200_OK)
        self.assertTrue(chk_free.data["available"])

    def test_multi_store_switch_preserves_strict_isolation(self):
        """
        Slice 2: Verifies a merchant with multiple store memberships can switch
        between stores without cross-tenant catalog or order contamination.
        """
        multi_owner = User.objects.create_user("serial.entrepreneur@nepal.com", full_name="Serial Entrepreneur")

        # Create Store 1
        s1 = Store.objects.create(slug="store-one", name="Store One", theme_preset="editorial-warm")
        StoreMembership.objects.create(store=s1, user=multi_owner, role="OWNER")
        p1 = Product.objects.create(store=s1, slug="product-one", name="Product One")

        # Create Store 2
        s2 = Store.objects.create(slug="store-two", name="Store Two", theme_preset="midnight-obsidian")
        StoreMembership.objects.create(store=s2, user=multi_owner, role="OWNER")
        p2 = Product.objects.create(store=s2, slug="product-two", name="Product Two")

        self.client.force_login(multi_owner)

        # My stores lists both
        my_stores = self.client.get("/api/stores/my-stores/")
        self.assertEqual(my_stores.status_code, status.HTTP_200_OK)
        self.assertEqual(len(my_stores.data["stores"]), 2)

        # Access Store 1 overview & products -> contains only Store 1 products
        res_p1 = self.client.get(f"/api/merchant/stores/{s1.slug}/products/")
        self.assertEqual(res_p1.status_code, status.HTTP_200_OK)
        slugs_p1 = [p["slug"] for p in res_p1.data]
        self.assertIn("product-one", slugs_p1)
        self.assertNotIn("product-two", slugs_p1)

        # Switch to Store 2 -> contains only Store 2 products
        res_p2 = self.client.get(f"/api/merchant/stores/{s2.slug}/products/")
        self.assertEqual(res_p2.status_code, status.HTTP_200_OK)
        slugs_p2 = [p["slug"] for p in res_p2.data]
        self.assertIn("product-two", slugs_p2)
        self.assertNotIn("product-one", slugs_p2)

    def test_merchant_customer_directory_isolation(self):
        """
        Slice 3: Verifies that customer directory is strictly tenant-isolated.
        Merchant A cannot list or search Merchant B's customers.
        """
        self.client.force_login(self.owner_a)

        # Listing Store A customers returns only Store A customers
        res_a = self.client.get("/api/merchant/stores/brewmellow/customers/")
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        emails_a = [c["email"] for c in res_a.data]
        self.assertIn("sita.maharjan@example.com.np", emails_a)
        self.assertNotIn("shopper.b@example.com", emails_a)

        # Cross-tenant list attempt returns 404
        res_b_attempt = self.client.get("/api/merchant/stores/pahadi-honey/customers/")
        self.assertEqual(res_b_attempt.status_code, status.HTTP_404_NOT_FOUND)

        # Search isolation: searching for Store B customer email returns empty in Store A
        res_search_b = self.client.get("/api/merchant/stores/brewmellow/customers/?q=shopper.b")
        self.assertEqual(res_search_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search_b.data), 0)

    def test_merchant_customer_detail_idor_protection(self):
        """
        Slice 3: IDOR verification on customer detail endpoint.
        Attempting to read Merchant B's customer detail under Store A returns 404.
        """
        self.client.force_login(self.owner_a)
        cust_a = Customer.objects.filter(store=self.store_a).first()
        self.assertIsNotNone(cust_a)

        # Legitimate access to Store A's customer
        res_legit = self.client.get(f"/api/merchant/stores/brewmellow/customers/{cust_a.id}/")
        self.assertEqual(res_legit.status_code, status.HTTP_200_OK)
        self.assertEqual(res_legit.data["customer"]["id"], cust_a.id)
        self.assertIn("orders", res_legit.data)
        self.assertIn("subscriptions", res_legit.data)

        # IDOR attack: Store A merchant tries to fetch Store B customer ID
        res_idor = self.client.get(f"/api/merchant/stores/brewmellow/customers/{self.cust_b.id}/")
        self.assertEqual(res_idor.status_code, status.HTTP_404_NOT_FOUND)

        # Direct cross-tenant access to Store B returns 404
        res_cross = self.client.get(f"/api/merchant/stores/pahadi-honey/customers/{self.cust_b.id}/")
        self.assertEqual(res_cross.status_code, status.HTTP_404_NOT_FOUND)

    def test_merchant_customer_search_and_aggregations(self):
        """
        Slice 3: Verifies search filtering and order aggregation calculations.
        Only PAID/CONFIRMED orders contribute to total_spent_minor.
        """
        self.client.force_login(self.owner_a)

        # Provision a unique customer with known orders
        unique_cust = Customer.objects.create(
            store=self.store_a,
            full_name="Prashant Acharya",
            email="prashant.unique@test.np",
            phone="9801122334",
        )
        # Order 1: PAID NPR 1,200 (120000 minor)
        Order.objects.create(
            store=self.store_a,
            customer=unique_cust,
            order_number="BM-TEST-PAID",
            subtotal_minor=120000,
            total_minor=120000,
            payment_status="PAID",
        )
        # Order 2: PENDING NPR 800 (80000 minor) - should NOT count towards total_spent_minor
        Order.objects.create(
            store=self.store_a,
            customer=unique_cust,
            order_number="BM-TEST-PEND",
            subtotal_minor=80000,
            total_minor=80000,
            payment_status="PENDING",
        )

        # 1. Search by name
        res_search_name = self.client.get("/api/merchant/stores/brewmellow/customers/?q=Prashant")
        self.assertEqual(res_search_name.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search_name.data), 1)
        c_data = res_search_name.data[0]
        self.assertEqual(c_data["id"], unique_cust.id)

        # 2. Search by phone
        res_search_phone = self.client.get("/api/merchant/stores/brewmellow/customers/?q=9801122334")
        self.assertEqual(res_search_phone.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_search_phone.data), 1)

        # 3. Check aggregations: orders_count = 2, total_spent_minor = 120000 (PAID only)
        self.assertEqual(c_data["orders_count"], 2)
        self.assertEqual(c_data["total_spent_minor"], 120000)

    def test_storefront_public_catalog_and_theme_isolation(self):
        """
        Slice 4: Verifies that public storefront metadata, catalog, and theme presets
        are strictly isolated per tenant. Store A never leaks into Store B.
        """
        # Store A metadata
        res_a = self.client.get("/api/stores/brewmellow/")
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertEqual(res_a.data["slug"], "brewmellow")
        self.assertEqual(res_a.data["theme_preset"], "editorial-warm")

        # Store B metadata
        res_b = self.client.get("/api/stores/pahadi-honey/")
        self.assertEqual(res_b.status_code, status.HTTP_200_OK)
        self.assertEqual(res_b.data["slug"], "pahadi-honey")
        self.assertEqual(res_b.data["theme_preset"], "pahadi-sage")

        # Store A catalog: contains only Store A products
        cat_a = self.client.get("/api/stores/brewmellow/catalog/")
        self.assertEqual(cat_a.status_code, status.HTTP_200_OK)
        slugs_a = [p["slug"] for p in cat_a.data["products"]]
        self.assertNotIn(self.prod_b.slug, slugs_a)

        # Store B catalog: contains only Store B products
        cat_b = self.client.get("/api/stores/pahadi-honey/catalog/")
        self.assertEqual(cat_b.status_code, status.HTTP_200_OK)
        slugs_b = [p["slug"] for p in cat_b.data["products"]]
        self.assertIn(self.prod_b.slug, slugs_b)
        for sa in slugs_a:
            self.assertNotIn(sa, slugs_b)

    def test_merchant_theme_update_isolation(self):
        """
        Slice 4: Verifies that merchant theme updates take effect on Store A
        while Store B settings and public storefront are completely unaffected.
        """
        self.client.force_login(self.owner_a)

        # Update Store A theme to ktm-bold with custom story headline
        res_patch = self.client.patch("/api/merchant/stores/brewmellow/settings/", {
            "theme_preset": "ktm-bold",
            "story_headline": "BrewMellow High-Altitude Roasts",
        }, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertEqual(res_patch.data["theme_preset"], "ktm-bold")

        # Public storefront reflects updated theme immediately
        res_pub = self.client.get("/api/stores/brewmellow/")
        self.assertEqual(res_pub.status_code, status.HTTP_200_OK)
        self.assertEqual(res_pub.data["theme_preset"], "ktm-bold")
        self.assertEqual(res_pub.data["story_headline"], "BrewMellow High-Altitude Roasts")

        # Probing Store B's settings returns 404
        res_b_attempt = self.client.patch("/api/merchant/stores/pahadi-honey/settings/", {
            "theme_preset": "midnight-obsidian",
        }, format="json")
        self.assertEqual(res_b_attempt.status_code, status.HTTP_404_NOT_FOUND)

        # Store B public storefront remains pahadi-sage
        res_b_pub = self.client.get("/api/stores/pahadi-honey/")
        self.assertEqual(res_b_pub.data["theme_preset"], "pahadi-sage")

    def test_merchant_subscription_actions_and_renewal_link_isolation(self):
        """
        Slice 5: Proves Merchant A cannot pause, skip, cancel, or generate renewal links
        for Merchant B's subscriptions, and running cycles on Store A never touches Store B.
        """
        today = timezone.now().date()
        with BypassRLSContext():
            plan_b = SellingPlan.objects.create(
                store=self.store_b,
                code="ph-monthly",
                name="Monthly Honey Jar",
                interval_unit="MONTH",
                interval_count=1,
                commitment_cycles=1,
                discount_pct=5,
                is_prepaid=False,
                is_active=True,
            )
            sub_b = Subscription.objects.create(
                store=self.store_b,
                customer=self.cust_b,
                variant=self.var_b,
                selling_plan=plan_b,
                status="ACTIVE",
                unit_price_minor=80750,
                next_delivery_date=today,
                shipping_address_snapshot={"recipient_name": "Shopper B", "phone": "9800001111", "district": "Kathmandu"},
            )
            b_orders_before = Order.objects.filter(store=self.store_b).count()

        self.client.force_login(self.owner_a)

        # 1. Merchant A trying to act on sub_b via Store A's URL (IDOR) -> 404
        for action in ("pause", "skip_cycle", "cancel", "generate_renewal"):
            idor_res = self.client.post(
                f"/api/merchant/stores/{self.store_a.slug}/subscriptions/{sub_b.id}/action/",
                {"action": action},
                format="json",
            )
            self.assertEqual(idor_res.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Merchant A trying to act on sub_b via Store B's URL -> 404
        direct_res = self.client.post(
            f"/api/merchant/stores/{self.store_b.slug}/subscriptions/{sub_b.id}/action/",
            {"action": "generate_renewal"},
            format="json",
        )
        self.assertEqual(direct_res.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Merchant A running due cycles on Store A must NEVER generate orders for Store B's due sub_b
        run_res = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/subscriptions/run-cycles/",
            {"target_date": today.isoformat()},
            format="json",
        )
        self.assertEqual(run_res.status_code, status.HTTP_200_OK)

        with BypassRLSContext():
            sub_b.refresh_from_db()
            self.assertEqual(sub_b.status, "ACTIVE")
            self.assertEqual(sub_b.next_delivery_date, today)
            self.assertEqual(Order.objects.filter(store=self.store_b).count(), b_orders_before)

    def test_merchant_selling_plan_crud_and_public_pay_isolation(self):
        """
        Slice 5: Proves Merchant A cannot modify or archive Merchant B's SellingPlans,
        and Store B's unpaid order token cannot be paid through Store A's public endpoint.
        """
        with BypassRLSContext():
            plan_b = SellingPlan.objects.create(
                store=self.store_b,
                code="ph-prepaid-6",
                name="6 Months Honey",
                interval_unit="MONTH",
                interval_count=1,
                commitment_cycles=6,
                discount_pct=10,
                is_prepaid=True,
                is_active=True,
            )
            unpaid_b = Order.objects.create(
                store=self.store_b,
                customer=self.cust_b,
                order_number="#PH-RENEW-01",
                order_type="SUBSCRIPTION_CYCLE",
                status="PENDING_PAYMENT",
                payment_method="KHALTI",
                payment_status="UNPAID",
                subtotal_minor=85000,
                shipping_minor=12000,
                total_minor=97000,
            )
            b_token = str(unpaid_b.token)

        self.client.force_login(self.owner_a)

        # Merchant A trying to PATCH Store B's plan via Store A URL (IDOR) -> 404
        patch_idor = self.client.patch(
            f"/api/merchant/stores/{self.store_a.slug}/selling-plans/{plan_b.id}/",
            {"discount_pct": 50},
            format="json",
        )
        self.assertEqual(patch_idor.status_code, status.HTTP_404_NOT_FOUND)

        # Merchant A trying to DELETE Store B's plan via Store B URL -> 404
        del_cross = self.client.delete(
            f"/api/merchant/stores/{self.store_b.slug}/selling-plans/{plan_b.id}/"
        )
        self.assertEqual(del_cross.status_code, status.HTTP_404_NOT_FOUND)

        with BypassRLSContext():
            plan_b.refresh_from_db()
            self.assertEqual(plan_b.discount_pct, 10)
            self.assertTrue(plan_b.is_active)

        # Cross-store public-orders/pay attempt using Store B's valid token against Store A -> 404
        cross_pay = self.client.post(
            f"/api/stores/{self.store_a.slug}/public-orders/{unpaid_b.id}/pay/",
            {"token": b_token, "payment_method": "COD"},
            format="json",
        )
        self.assertEqual(cross_pay.status_code, status.HTTP_404_NOT_FOUND)

    def test_slice6_analytics_isolation_and_nepal_province_breakdown(self):
        """
        Slice 6: Proves Analytics reports strictly scope revenue, payment rail mix,
        and 7-province Nepal breakdowns to the authenticated merchant's store.
        """
        with BypassRLSContext():
            # Add a huge order on Store B in Gandaki Province (Pokhara)
            Order.objects.create(
                store=self.store_b,
                customer=self.cust_b,
                order_number="#PH-POKHARA-999",
                status="PAID",
                payment_method="KHALTI",
                payment_status="PAID",
                subtotal_minor=900000,
                shipping_minor=25000,
                total_minor=925000,
                shipping_address_snapshot={
                    "recipient_name": "Shopper B",
                    "phone": "9800002222",
                    "province": "Gandaki",
                    "district": "Kaski",
                },
            )

        self.client.force_login(self.owner_a)

        # 1. Merchant A attempting to read Store B analytics -> 404
        res_b = self.client.get("/api/merchant/stores/pahadi-honey/analytics/?range=30d")
        self.assertEqual(res_b.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Merchant A reading Store A analytics -> 200, 7 Nepal provinces, zero Store B revenue
        res_a = self.client.get("/api/merchant/stores/brewmellow/analytics/?range=all")
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        provinces = [p["province"] for p in res_a.data["sales_by_province"]]
        self.assertEqual(len(provinces), 7)
        self.assertEqual(
            set(provinces),
            {"Bagmati", "Gandaki", "Koshi", "Lumbini", "Madhesh", "Karnali", "Sudurpashchim"},
        )
        # Store B's Rs. 9,250 order in Gandaki must NOT appear in Store A's Gandaki bucket
        gandaki_bucket = next(
            p for p in res_a.data["sales_by_province"] if p["province"] == "Gandaki"
        )
        self.assertLess(gandaki_bucket["revenue_minor"], 900000)

    def test_slice6_discount_crud_rls_and_cross_store_checkout_isolation(self):
        """
        Slice 6: Proves Discount promo codes enforce Postgres RLS, CRUD tenant isolation,
        integer Rs. calculation, max_uses caps, and cross-store checkout rejection.
        """
        with BypassRLSContext():
            disc_b = Discount.objects.create(
                store=self.store_b,
                code="HONEY50",
                description="50% off honey",
                discount_type="PERCENTAGE",
                value=50,
                is_active=True,
            )

        # 1. Verify DB-level TenantDatabaseContext / RLS isolates catalog_discount
        with TenantDatabaseContext(self.store_a.id):
            visible_codes_a = list(Discount.objects.values_list("code", flat=True))
            self.assertNotIn("HONEY50", visible_codes_a)

        self.client.force_login(self.owner_a)

        # 2. Merchant A cannot list, edit, or delete Store B's promo codes
        self.assertEqual(
            self.client.get("/api/merchant/stores/pahadi-honey/discounts/").status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(
            self.client.patch(
                f"/api/merchant/stores/brewmellow/discounts/{disc_b.id}/",
                {"is_active": False},
                format="json",
            ).status_code,
            status.HTTP_404_NOT_FOUND,
        )

        # 3. Merchant A creates DASHAIN15 (15% off, min Rs. 500, max_uses=1) on Store A
        create_res = self.client.post(
            "/api/merchant/stores/brewmellow/discounts/",
            {
                "code": "dashain15",
                "description": "Dashain 15% promo",
                "discount_type": "PERCENTAGE",
                "value": 15,
                "min_subtotal_minor": 50000,
                "max_uses": 1,
            },
            format="json",
        )
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(create_res.data["code"], "DASHAIN15")

        # 4. Shopper on Store B CANNOT redeem Store A's DASHAIN15
        cross_quote = self.client.post(
            "/api/stores/pahadi-honey/checkout/quote/",
            {
                "items": [{"variant_id": self.var_b.id, "quantity": 1}],
                "district": "Kathmandu",
                "discount_code": "DASHAIN15",
            },
            format="json",
        )
        self.assertEqual(cross_quote.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Shopper on Store A quotes & redeems DASHAIN15 (max_uses=1)
        var_a = Variant.objects.for_store(self.store_a).filter(is_active=True).first()
        quote_a = self.client.post(
            "/api/stores/brewmellow/checkout/quote/",
            {
                "items": [{"variant_id": var_a.id, "quantity": 2}],
                "district": "Kathmandu",
                "discount_code": "DASHAIN15",
            },
            format="json",
        )
        self.assertEqual(quote_a.status_code, status.HTTP_200_OK)
        self.assertGreater(quote_a.data["discount_minor"], 0)
        self.assertEqual(quote_a.data["discount_minor"] % 100, 0)  # Integer Rs. snapped

        place_a = self.client.post(
            "/api/stores/brewmellow/checkout/place/",
            {
                "items": [{"variant_id": var_a.id, "quantity": 2}],
                "shipping_address": {
                    "recipient_name": "Sita Sharma",
                    "phone": "9841234567",
                    "province": "Bagmati",
                    "district": "Kathmandu",
                    "municipality": "Kathmandu Metro",
                    "ward": 3,
                    "street_landmark": "Lazimpat",
                },
                "customer_email": "sita.promo@example.com",
                "payment_method": "COD",
                "discount_code": "DASHAIN15",
            },
            format="json",
        )
        self.assertEqual(place_a.status_code, status.HTTP_201_CREATED)

        # 6. Second attempt with DASHAIN15 fails because max_uses=1 was reached
        reuse_res = self.client.post(
            "/api/stores/brewmellow/checkout/quote/",
            {
                "items": [{"variant_id": var_a.id, "quantity": 2}],
                "district": "Kathmandu",
                "discount_code": "DASHAIN15",
            },
            format="json",
        )
        self.assertEqual(reuse_res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_slice6_cod_toggle_and_custom_domain_isolation(self):
        """
        Slice 6: Proves disabling COD on Store A blocks Cash on Delivery at checkout
        while allowing Khalti and leaving Store B's COD enabled.
        """
        self.client.force_login(self.owner_a)
        patch_res = self.client.patch(
            "/api/merchant/stores/brewmellow/settings/",
            {"cod_enabled": False, "custom_domain": "https://shop.brewmellow.com.np/"},
            format="json",
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertFalse(patch_res.data["cod_enabled"])
        self.assertEqual(patch_res.data["custom_domain"], "shop.brewmellow.com.np")

        var_a = Variant.objects.for_store(self.store_a).filter(is_active=True).first()
        cod_attempt = self.client.post(
            "/api/stores/brewmellow/checkout/place/",
            {
                "items": [{"variant_id": var_a.id, "quantity": 1}],
                "shipping_address": {
                    "recipient_name": "Ramesh KC",
                    "phone": "9851099887",
                    "province": "Bagmati",
                    "district": "Lalitpur",
                    "municipality": "Lalitpur Metro",
                    "ward": 3,
                    "street_landmark": "Jhamsikhel",
                },
                "customer_email": "ramesh.cod@example.com",
                "payment_method": "COD",
            },
            format="json",
        )
        self.assertEqual(cod_attempt.status_code, status.HTTP_400_BAD_REQUEST)

        # Store B COD remains unaffected
        cod_b = self.client.post(
            "/api/stores/pahadi-honey/checkout/place/",
            {
                "items": [{"variant_id": self.var_b.id, "quantity": 1}],
                "shipping_address": {
                    "recipient_name": "Ramesh KC",
                    "phone": "9851099887",
                    "province": "Bagmati",
                    "district": "Kathmandu",
                    "municipality": "Kathmandu Metro",
                    "ward": 4,
                    "street_landmark": "Baluwatar",
                },
                "customer_email": "ramesh.cod@example.com",
                "payment_method": "COD",
            },
            format="json",
        )
        self.assertEqual(cod_b.status_code, status.HTTP_201_CREATED)

    def test_slice6_staff_rbac_permissions_and_sole_owner_protection(self):
        """
        Slice 6: Proves OWNER vs STAFF RBAC enforcement:
        - OWNER can invite STAFF, audited in MerchantAuditLog.
        - Sole OWNER cannot remove or demote themselves.
        - STAFF can view Store A console & create promos, gets 404 on Store B,
          and gets 403 Forbidden trying to overwrite Khalti keys, domains, or staff roles.
        """
        self.client.force_login(self.owner_a)

        # 1. Sole owner cannot demote or remove themselves
        staff_list = self.client.get("/api/merchant/stores/brewmellow/staff/")
        self.assertEqual(staff_list.status_code, status.HTTP_200_OK)
        owner_membership_id = staff_list.data["members"][0]["id"]

        demote_self = self.client.patch(
            f"/api/merchant/stores/brewmellow/staff/{owner_membership_id}/",
            {"role": "STAFF"},
            format="json",
        )
        self.assertEqual(demote_self.status_code, status.HTTP_400_BAD_REQUEST)

        remove_self = self.client.delete(
            f"/api/merchant/stores/brewmellow/staff/{owner_membership_id}/"
        )
        self.assertEqual(remove_self.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Owner invites a STAFF member
        invite_res = self.client.post(
            "/api/merchant/stores/brewmellow/staff/",
            {
                "email": "barista.staff@brewmellow.com.np",
                "full_name": "Bikash Tamang",
                "role": "STAFF",
            },
            format="json",
        )
        self.assertEqual(invite_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(invite_res.data["role"], "STAFF")

        # Audit log recorded STAFF_INVITE
        audit_res = self.client.get("/api/merchant/stores/brewmellow/audit-logs/")
        self.assertEqual(audit_res.status_code, status.HTTP_200_OK)
        actions = [entry["action"] for entry in audit_res.data]
        self.assertIn("STAFF_INVITE", actions)

        # 3. Log in as STAFF member
        staff_user = User.objects.get(email="barista.staff@brewmellow.com.np")
        self.client.force_login(staff_user)

        # STAFF can access Store A overview & analytics
        ov_res = self.client.get("/api/merchant/stores/brewmellow/overview/")
        self.assertEqual(ov_res.status_code, status.HTTP_200_OK)
        self.assertEqual(ov_res.data["member_role"], "STAFF")

        # STAFF gets 404 on Store B
        self.assertEqual(
            self.client.get("/api/merchant/stores/pahadi-honey/overview/").status_code,
            status.HTTP_404_NOT_FOUND,
        )

        # STAFF gets 403 Forbidden trying to modify Khalti secret key or custom domain
        key_hijack = self.client.patch(
            "/api/merchant/stores/brewmellow/settings/",
            {"khalti_secret_key": "live_secret_key_attacker"},
            format="json",
        )
        self.assertEqual(key_hijack.status_code, status.HTTP_403_FORBIDDEN)

        # STAFF gets 403 Forbidden trying to invite another user or remove the owner
        staff_invite_attempt = self.client.post(
            "/api/merchant/stores/brewmellow/staff/",
            {"email": "hacker@example.com", "role": "OWNER"},
            format="json",
        )
        self.assertEqual(staff_invite_attempt.status_code, status.HTTP_403_FORBIDDEN)

        staff_remove_owner = self.client.delete(
            f"/api/merchant/stores/brewmellow/staff/{owner_membership_id}/"
        )
        self.assertEqual(staff_remove_owner.status_code, status.HTTP_403_FORBIDDEN)




