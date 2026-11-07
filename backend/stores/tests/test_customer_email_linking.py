import json
from django.contrib.auth import get_user_model
from django.test import Client, TestCase
from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order
from stores.models import Customer, Store, StoreMembership, provision_store_customer

User = get_user_model()


class CustomerEmailLinkingAndCheckoutTests(TestCase):
    def setUp(self):
        # 1. Store Owner & Store
        self.owner = User.objects.create_user(email="owner@teststore.np", full_name="Store Owner")
        self.store = Store.objects.create(
            name="Kathmandu Craft",
            slug="ktm-craft",
            is_active=True,
            cod_enabled=True,
        )

        # 3. Two separate customer users
        self.victim = User.objects.create_user(email="victim@customer.np", full_name="Victim Shopper")
        self.attacker = User.objects.create_user(email="attacker@customer.np", full_name="Attacker User")

        with TenantDatabaseContext(self.store.id):
            StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")

            # 2. Product & Active Variant
            self.product = Product.objects.create(
                store=self.store,
                name="Handmade Hemp Bag",
                slug="hemp-bag",
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=self.product,
                sku="HEMP-NAT",
                label="Natural",
                price_minor=120000,
                in_stock=True,
                is_active=True,
            )

            # 4. Pre-existing victim customer profile in the store
            self.victim_customer = Customer.objects.create(
                store=self.store,
                email="victim@customer.np",
                full_name="Victim Shopper",
                phone="9841000001",
                user=self.victim,
            )

            # Pre-existing victim order
            self.victim_order = Order.objects.create(
                store=self.store,
                customer=self.victim_customer,
                order_number="ORD-VICTIM-001",
                status="CONFIRMED",
                payment_method="COD",
                payment_status="COD_PENDING",
                subtotal_minor=120000,
                total_minor=120000,
            )

        self.client = Client()

    def test_email_normalization_on_save(self):
        """User and Customer emails must be automatically lowercase and stripped on save."""
        user = User.objects.create_user(email="  UPPER.case@Example.Com  ")
        self.assertEqual(user.email, "upper.case@example.com")

        with TenantDatabaseContext(self.store.id):
            cust = Customer.objects.create(
                store=self.store,
                email="  Cust.MIXED@Test.Com  ",
                full_name="Mixed Case",
            )
            self.assertEqual(cust.email, "cust.mixed@test.com")

    def test_provision_store_customer_never_overwrites_existing_user(self):
        """provision_store_customer must refuse to reassign customer.user to a different user."""
        another_user = User.objects.create_user(email="other@test.np")
        with TenantDatabaseContext(self.store.id):
            cust = provision_store_customer(self.store, another_user, full_name="Other Person")
            self.assertEqual(cust.user, another_user)

            self.victim_customer.refresh_from_db()
            self.assertEqual(self.victim_customer.user, self.victim)

    def test_logged_in_user_entering_another_email_at_checkout_does_not_gain_access(self):
        """
        Security check:
        When a logged-in user (Attacker) enters Victim's email at checkout:
        1. It must NOT overwrite or link victim_customer.user to Attacker.
        2. Attacker querying /api/stores/<slug>/orders/ must see 0 of Victim's orders.
        """
        self.client.force_login(self.attacker)

        checkout_payload = {
            "shipping_address": {
                "recipient_name": "Attacker Impersonator",
                "phone": "9841999999",
                "email": "victim@customer.np",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metropolitan City",
                "ward": "4",
                "street_landmark": "Baluwatar",
            },
            "payment_method": "COD",
            "items": [
                {
                    "variant_id": self.variant.id,
                    "quantity": 1,
                }
            ],
        }

        resp = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            data=json.dumps(checkout_payload),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)

        with TenantDatabaseContext(self.store.id):
            self.victim_customer.refresh_from_db()
            self.assertEqual(self.victim_customer.user, self.victim)
            self.assertNotEqual(self.victim_customer.user, self.attacker)

        orders_resp = self.client.get(f"/api/stores/{self.store.slug}/orders/")
        self.assertEqual(orders_resp.status_code, 200)
        orders_data = orders_resp.json()

        attacker_order_ids = [o["id"] for o in orders_data]
        self.assertNotIn(self.victim_order.id, attacker_order_ids)
        self.assertEqual(len(orders_data), 0)

    def test_logged_in_user_using_own_email_links_order_to_customer(self):
        """
        When logged-in user (Attacker) uses their own email at checkout:
        Their store customer profile is linked to them and their order appears in their orders list.
        """
        self.client.force_login(self.attacker)

        checkout_payload = {
            "shipping_address": {
                "recipient_name": "Attacker Own Order",
                "phone": "9841999999",
                "email": "attacker@customer.np",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metropolitan City",
                "ward": "4",
                "street_landmark": "Baluwatar",
            },
            "payment_method": "COD",
            "items": [
                {
                    "variant_id": self.variant.id,
                    "quantity": 1,
                }
            ],
        }

        resp = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            data=json.dumps(checkout_payload),
            content_type="application/json",
        )
        self.assertEqual(resp.status_code, 201)

        orders_resp = self.client.get(f"/api/stores/{self.store.slug}/orders/")
        self.assertEqual(orders_resp.status_code, 200)
        orders_data = orders_resp.json()

        self.assertEqual(len(orders_data), 1)
        self.assertEqual(orders_data[0]["order_number"], resp.json()["order_number"])
