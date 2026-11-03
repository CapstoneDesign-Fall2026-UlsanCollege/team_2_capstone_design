from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import Product, SellingPlan, Variant
from core.tenant_context import BypassRLSContext
from orders.models import Order
from stores.models import Customer, Store, StoreMembership
from subscriptions.models import Subscription
from subscriptions.services import (
    compute_plan_interval_days,
    create_subscription_for_item,
    execute_due_subscription_cycles,
)

User = get_user_model()


class SubscriptionEngineTests(APITestCase):
    def setUp(self):
        with BypassRLSContext():
            self.owner = User.objects.create_user(
                "roaster@ilamcraft.com.np", full_name="Kiran Rai"
            )
            self.store = Store.objects.create(
                name="Ilam Craft Roasters",
                slug="ilam-craft",
                inside_valley_shipping_minor=10000,
                outside_valley_shipping_minor=20000,
                free_shipping_threshold_minor=250000,
                khalti_mode="TEST",
                is_active=True,
            )
            StoreMembership.objects.create(
                store=self.store, user=self.owner, role="OWNER"
            )

            self.product = Product.objects.create(
                store=self.store,
                slug="misty-valley-arabica",
                name="Misty Valley Arabica",
                allow_one_time=True,
                allow_subscription=True,
                is_active=True,
            )
            self.variant = Variant.objects.create(
                store=self.store,
                product=self.product,
                sku="ic-mva-250g",
                label="250g",
                price_minor=80000,
                allow_one_time=True,
                allow_subscription=True,
                in_stock=True,
                is_active=True,
            )

            self.plan_prepaid_3 = SellingPlan.objects.create(
                store=self.store,
                code="prepaid-3m",
                name="3 Months Prepaid",
                interval_unit="MONTH",
                interval_count=1,
                commitment_cycles=3,
                discount_pct=10,
                is_prepaid=True,
                is_active=True,
            )
            self.plan_payg_biweekly = SellingPlan.objects.create(
                store=self.store,
                code="payg-2w",
                name="Bi-Weekly Renewal",
                interval_unit="WEEK",
                interval_count=2,
                commitment_cycles=1,
                discount_pct=5,
                is_prepaid=False,
                is_active=True,
            )

            self.customer = Customer.objects.create(
                store=self.store,
                email="anita@example.com.np",
                full_name="Anita Thapa",
                phone="9841556677",
            )
            self.addr = {
                "recipient_name": "Anita Thapa",
                "phone": "9841556677",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metropolitan City",
                "ward": 4,
                "street_landmark": "Baluwatar Chowk",
            }

    def test_weekly_vs_monthly_cadence_interval_calculation(self):
        self.assertEqual(compute_plan_interval_days(self.plan_prepaid_3), 30)
        self.assertEqual(compute_plan_interval_days(self.plan_payg_biweekly), 14)

    def test_prepaid_3_cycle_countdown_zero_rupee_orders_and_completion(self):
        today = timezone.now().date()
        with BypassRLSContext():
            orig_order = Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number="#IC-2026-0001",
                order_type="SUBSCRIPTION_CYCLE",
                status="PAID",
                payment_method="KHALTI",
                payment_status="PAID",
                subtotal_minor=216000,
                shipping_minor=10000,
                total_minor=226000,
                shipping_address_snapshot=self.addr,
            )
            sub = create_subscription_for_item(
                store=self.store,
                customer=self.customer,
                variant=self.variant,
                selling_plan=self.plan_prepaid_3,
                order=orig_order,
                shipping_address=self.addr,
                unit_price_minor=72000,
                status="ACTIVE",
            )
            # Cycle 1 fulfilled by orig_order -> 2 cycles remaining
            self.assertEqual(sub.cycles_total, 3)
            self.assertEqual(sub.cycles_remaining, 2)

            # Move next_delivery_date to today and run cycle 2
            sub.next_delivery_date = today
            sub.save(update_fields=["next_delivery_date"])

        res_cycle_2 = execute_due_subscription_cycles(store=self.store, target_date=today)
        self.assertEqual(res_cycle_2["orders_generated"], 1)
        self.assertEqual(res_cycle_2["completed_subscriptions"], 0)

        with BypassRLSContext():
            cycle_order_2 = res_cycle_2["orders"][0]
            self.assertEqual(cycle_order_2.total_minor, 0)
            self.assertEqual(cycle_order_2.payment_status, "PAID")
            self.assertEqual(cycle_order_2.status, "CONFIRMED")

            sub.refresh_from_db()
            self.assertEqual(sub.cycles_remaining, 1)
            self.assertEqual(sub.status, "ACTIVE")

            # Idempotency check: re-running on same target_date produces 0 duplicate orders
            sub.next_delivery_date = today
            sub.save(update_fields=["next_delivery_date"])

        dup_run = execute_due_subscription_cycles(store=self.store, target_date=today)
        self.assertEqual(dup_run["orders_generated"], 0)

        # Advance 30 days to run final cycle 3 -> status transitions to COMPLETED
        future_date = today + timedelta(days=30)
        with BypassRLSContext():
            sub.next_delivery_date = future_date
            sub.save(update_fields=["next_delivery_date"])

        res_cycle_3 = execute_due_subscription_cycles(store=self.store, target_date=future_date)
        self.assertEqual(res_cycle_3["orders_generated"], 1)
        self.assertEqual(res_cycle_3["completed_subscriptions"], 1)

        with BypassRLSContext():
            sub.refresh_from_db()
            self.assertEqual(sub.cycles_remaining, 0)
            self.assertEqual(sub.status, "COMPLETED")

    def test_pay_per_delivery_renewal_link_and_one_click_payment(self):
        with BypassRLSContext():
            sub = Subscription.objects.create(
                store=self.store,
                customer=self.customer,
                variant=self.variant,
                selling_plan=self.plan_payg_biweekly,
                status="ACTIVE",
                unit_price_minor=76000,
                next_delivery_date=timezone.now().date(),
                shipping_address_snapshot=self.addr,
            )

        self.client.force_login(self.owner)

        # 1. Merchant generates renewal link
        gen_res = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/subscriptions/{sub.id}/action/",
            {"action": "generate_renewal"},
            format="json",
        )
        self.assertEqual(gen_res.status_code, status.HTTP_200_OK)
        self.assertTrue(gen_res.data["newly_created"])
        renewal_info = gen_res.data["renewal_order"]
        self.assertEqual(renewal_info["total_minor"], 86000)  # 76000 + 10000 inside valley
        self.assertIn("Namaste Anita Thapa!", renewal_info["whatsapp_message"])

        # 2. Calling generate_renewal again while unpaid returns the SAME order (idempotent!)
        gen_res_2 = self.client.post(
            f"/api/merchant/stores/{self.store.slug}/subscriptions/{sub.id}/action/",
            {"action": "generate_renewal"},
            format="json",
        )
        self.assertEqual(gen_res_2.status_code, status.HTTP_200_OK)
        self.assertFalse(gen_res_2.data["newly_created"])
        self.assertEqual(gen_res_2.data["renewal_order"]["id"], renewal_info["id"])

        # 3. Anonymous shopper without token cannot pay renewal order (404 IDOR protection)
        self.client.logout()
        bad_pay = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{renewal_info['id']}/pay/",
            {"token": "00000000-0000-0000-0000-000000000000", "payment_method": "COD"},
            format="json",
        )
        self.assertEqual(bad_pay.status_code, status.HTTP_404_NOT_FOUND)

        # 4. Shopper with valid renewal token confirms via Cash on Delivery in 1 click
        good_pay = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{renewal_info['id']}/pay/",
            {"token": renewal_info["token"], "payment_method": "COD"},
            format="json",
        )
        self.assertEqual(good_pay.status_code, status.HTTP_200_OK)
        self.assertEqual(good_pay.data["status"], "CONFIRMED")
        self.assertEqual(good_pay.data["payment_status"], "COD_PENDING")

    def test_prepaid_bundle_blocks_cod_on_public_pay_endpoint(self):
        with BypassRLSContext():
            order = Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number="#IC-PREPAID-UNPAID",
                order_type="SUBSCRIPTION_CYCLE",
                status="PENDING_PAYMENT",
                payment_method="KHALTI",
                payment_status="UNPAID",
                subtotal_minor=216000,
                shipping_minor=10000,
                total_minor=226000,
                shipping_address_snapshot=self.addr,
            )
            create_subscription_for_item(
                store=self.store,
                customer=self.customer,
                variant=self.variant,
                selling_plan=self.plan_prepaid_3,
                order=order,
                shipping_address=self.addr,
                unit_price_minor=72000,
                status="PENDING_PAYMENT",
            )
            order_id = order.id
            order_token = str(order.token)

        # Attempting to switch a prepaid 3-cycle bundle to COD must be rejected (400)
        cod_attempt = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{order_id}/pay/",
            {"token": order_token, "payment_method": "COD"},
            format="json",
        )
        self.assertEqual(cod_attempt.status_code, status.HTTP_400_BAD_REQUEST)

        # Paying via Khalti sandbox succeeds in initiating payment URL
        khalti_attempt = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{order_id}/pay/",
            {"token": order_token, "payment_method": "KHALTI"},
            format="json",
        )
        self.assertEqual(khalti_attempt.status_code, status.HTTP_200_OK)
        self.assertIn("payment_url", khalti_attempt.data)

    def test_cli_run_subscription_cycles_command_is_rls_safe(self):
        today = timezone.now().date()
        with BypassRLSContext():
            Subscription.objects.create(
                store=self.store,
                customer=self.customer,
                variant=self.variant,
                selling_plan=self.plan_payg_biweekly,
                status="ACTIVE",
                unit_price_minor=76000,
                next_delivery_date=today,
                shipping_address_snapshot=self.addr,
            )

        call_command("run_subscription_cycles", store=self.store.slug, date=today.isoformat())

        with BypassRLSContext():
            generated = Order.objects.filter(
                store=self.store, order_type="SUBSCRIPTION_CYCLE"
            ).count()
            self.assertEqual(generated, 1)
