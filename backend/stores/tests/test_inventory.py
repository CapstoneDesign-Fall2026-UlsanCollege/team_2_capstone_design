from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order
from stores.khalti import KHALTI_STATE_CANCELED, KhaltiVerifyResult
from stores.models import MerchantAuditLog, Store, StoreMembership

User = get_user_model()


class InventoryManagementTests(APITestCase):
    """
    Tests opt-in numeric stock tracking (`track_inventory`, `stock_quantity`,
    `low_stock_threshold`), split-cart oversell prevention, atomic COD/Khalti
    reservation & restocking on cancel/fail/retry, overview alert counters, and
    the /inventory/ console endpoint.
    """

    @classmethod
    def setUpTestData(cls):
        cls.owner_a = User.objects.create_user("inv-owner-a@example.com", full_name="Owner A")
        cls.staff_a = User.objects.create_user("inv-staff-a@example.com", full_name="Staff A")
        cls.owner_b = User.objects.create_user("inv-owner-b@example.com", full_name="Owner B")

        cls.store_a = Store.objects.create(
            slug="inv-store-a",
            name="Inventory Store A",
            is_active=True,
            cod_enabled=True,
            khalti_mode="TEST",
        )
        cls.store_b = Store.objects.create(
            slug="inv-store-b",
            name="Inventory Store B",
            is_active=True,
            cod_enabled=True,
        )

        with TenantDatabaseContext(cls.store_a.id):
            StoreMembership.objects.create(store=cls.store_a, user=cls.owner_a, role="OWNER")
            StoreMembership.objects.create(store=cls.store_a, user=cls.staff_a, role="STAFF")

            cls.prod_tracked = Product.objects.create(
                store=cls.store_a,
                slug="himalayan-beans",
                name="Himalayan Beans",
                is_active=True,
                allow_one_time=True,
            )
            cls.var_tracked = Variant.objects.create(
                store=cls.store_a,
                product=cls.prod_tracked,
                sku="INV-A-TRACKED",
                label="250g",
                price_minor=60000,
                in_stock=True,
                track_inventory=True,
                stock_quantity=5,
                low_stock_threshold=2,
                is_active=True,
                allow_one_time=True,
            )

            cls.var_low = Variant.objects.create(
                store=cls.store_a,
                product=cls.prod_tracked,
                sku="INV-A-LOW",
                label="500g",
                price_minor=110000,
                in_stock=True,
                track_inventory=True,
                stock_quantity=2,
                low_stock_threshold=3,
                is_active=True,
                allow_one_time=True,
            )

            cls.prod_untracked = Product.objects.create(
                store=cls.store_a,
                slug="digital-gift",
                name="Digital Gift Card",
                is_active=True,
                allow_one_time=True,
            )
            cls.var_untracked = Variant.objects.create(
                store=cls.store_a,
                product=cls.prod_untracked,
                sku="INV-A-UNTRACKED",
                label="Standard",
                price_minor=50000,
                in_stock=True,
                track_inventory=False,
                stock_quantity=0,
                low_stock_threshold=5,
                is_active=True,
                allow_one_time=True,
            )

        with TenantDatabaseContext(cls.store_b.id):
            StoreMembership.objects.create(store=cls.store_b, user=cls.owner_b, role="OWNER")

    def _checkout_payload(self, items, payment_method="COD"):
        return {
            "items": items,
            "payment_method": payment_method,
            "shipping_address": {
                "recipient_name": "Sita Gurung",
                "phone": "9811112222",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu",
                "ward": "4",
                "street_landmark": "Jhamsikhel",
                "email": "sita@example.com",
            },
        }

    def test_untracked_variants_checkout_without_stock_decrement(self):
        """Legacy untracked variants remain unlimited and do not alter stock_quantity."""
        res_quote = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/quote/",
            {"items": [{"variant_id": self.var_untracked.id, "quantity": 12}], "district": "Kathmandu"},
            format="json",
        )
        self.assertEqual(res_quote.status_code, status.HTTP_200_OK)

        res_place = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/place/",
            self._checkout_payload([{"variant_id": self.var_untracked.id, "quantity": 12}]),
            format="json",
        )
        self.assertEqual(res_place.status_code, status.HTTP_201_CREATED)

        with TenantDatabaseContext(self.store_a.id):
            self.var_untracked.refresh_from_db()
            order = Order.objects.get(id=res_place.json()["order_id"])
            self.assertFalse(order.inventory_deducted)
            self.assertTrue(self.var_untracked.in_stock)
            self.assertEqual(self.var_untracked.stock_quantity, 0)

    def test_tracked_variant_oversell_and_split_cart_rejected_atomically_restocked_on_cancel(self):
        """
        Rejects quote & place when single or split-line quantity exceeds stock_quantity.
        Selling remaining units flips stock_quantity=0 and in_stock=False.
        Cancelling the order restores exact stock_quantity and flips in_stock=True idempotently.
        """
        # 1. Quote & Place reject direct excess
        q_fail = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/quote/",
            {"items": [{"variant_id": self.var_tracked.id, "quantity": 6}], "district": "Kathmandu"},
            format="json",
        )
        self.assertEqual(q_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only 5 left", q_fail.json()["error"])

        # 2. Split cart lines for the same SKU cannot bypass 5-unit limit (3 + 3 = 6 > 5)
        split_fail = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/place/",
            self._checkout_payload([
                {"variant_id": self.var_tracked.id, "quantity": 3},
                {"variant_id": self.var_tracked.id, "quantity": 3},
            ]),
            format="json",
        )
        self.assertEqual(split_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only 5 left", split_fail.json()["error"])

        # 3. Ordering exact 5 units succeeds, sets stock_quantity=0 and in_stock=False
        place_ok = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/place/",
            self._checkout_payload([{"variant_id": self.var_tracked.id, "quantity": 5}]),
            format="json",
        )
        self.assertEqual(place_ok.status_code, status.HTTP_201_CREATED)
        order_id = place_ok.json()["order_id"]

        with TenantDatabaseContext(self.store_a.id):
            self.var_tracked.refresh_from_db()
            self.assertEqual(self.var_tracked.stock_quantity, 0)
            self.assertFalse(self.var_tracked.in_stock)
            order = Order.objects.get(id=order_id)
            self.assertTrue(order.inventory_deducted)

        # 4. Subsequent shopper sees Out of Stock
        sold_out = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/place/",
            self._checkout_payload([{"variant_id": self.var_tracked.id, "quantity": 1}]),
            format="json",
        )
        self.assertEqual(sold_out.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("out of stock", sold_out.json()["error"].lower())

        # 5. Merchant cancels the order -> restores stock_quantity=5 and in_stock=True
        self.client.force_authenticate(user=self.staff_a)
        cancel_res = self.client.post(
            f"/api/merchant/stores/{self.store_a.slug}/orders/{order_id}/transition/",
            {"to_status": "CANCELLED"},
            format="json",
        )
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)

        with TenantDatabaseContext(self.store_a.id):
            self.var_tracked.refresh_from_db()
            self.assertEqual(self.var_tracked.stock_quantity, 5)
            self.assertTrue(self.var_tracked.in_stock)
            order.refresh_from_db()
            self.assertFalse(order.inventory_deducted)

    @override_settings(KHALTI_MOCK_MODE=True, DEBUG=True)
    def test_khalti_failure_restocks_and_retry_reclaims_or_blocks_if_sold_out(self):
        """
        Khalti checkout deducts inventory upfront; failed verification releases it back;
        retrying payment / switching to COD re-reserves it, or rejects if another shopper
        bought the stock while payment was failed.
        """
        with patch(
            "stores.api.initiate_khalti_epayment",
            return_value=("pidx_inv_001", "https://khalti.test/pay", True, None),
        ):
            init_res = self.client.post(
                f"/api/stores/{self.store_a.slug}/checkout/place/",
                self._checkout_payload(
                    [{"variant_id": self.var_low.id, "quantity": 2}],
                    payment_method="KHALTI",
                ),
                format="json",
            )
        self.assertEqual(init_res.status_code, status.HTTP_201_CREATED)
        order_id = init_res.json()["order_id"]
        token = init_res.json()["token"]

        with TenantDatabaseContext(self.store_a.id):
            self.var_low.refresh_from_db()
            self.assertEqual(self.var_low.stock_quantity, 0)
            self.assertFalse(self.var_low.in_stock)

        # Khalti canceled -> stock released back to 2
        with patch(
            "stores.api.verify_khalti_epayment",
            return_value=KhaltiVerifyResult(
                state=KHALTI_STATE_CANCELED,
                total_amount_paisa=None,
                transaction_id=None,
                error=None,
            ),
        ):
            fail_res = self.client.post(
                f"/api/stores/{self.store_a.slug}/checkout/khalti-verify/",
                {"pidx": "pidx_inv_001", "order_id": order_id},
                format="json",
            )
        self.assertEqual(fail_res.status_code, status.HTTP_400_BAD_REQUEST)

        with TenantDatabaseContext(self.store_a.id):
            self.var_low.refresh_from_db()
            self.assertEqual(self.var_low.stock_quantity, 2)
            self.assertTrue(self.var_low.in_stock)

        # Another shopper buys 1 unit while first order is failed -> only 1 remains
        other_order = self.client.post(
            f"/api/stores/{self.store_a.slug}/checkout/place/",
            self._checkout_payload([{"variant_id": self.var_low.id, "quantity": 1}]),
            format="json",
        )
        self.assertEqual(other_order.status_code, status.HTTP_201_CREATED)

        # Original shopper tries switching their 2-unit failed order to COD -> rejected!
        retry_fail = self.client.post(
            f"/api/stores/{self.store_a.slug}/public-orders/{order_id}/pay/",
            {"token": token, "payment_method": "COD"},
            format="json",
        )
        self.assertEqual(retry_fail.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only 1 left", retry_fail.json()["error"])

        # Stock for var_low remains untouched at 1
        with TenantDatabaseContext(self.store_a.id):
            self.var_low.refresh_from_db()
            self.assertEqual(self.var_low.stock_quantity, 1)

    def test_merchant_inventory_console_overview_alerts_validation_and_audit(self):
        """
        Verifies:
        - Overview exposes low_stock_variants_count & out_of_stock_variants_count
        - GET /inventory/ returns summary, status filtering, search & cross-tenant 404
        - Variant PATCH syncs in_stock, validates bounds, and records INVENTORY_UPDATE audit log
        - Product POST accepts initial_* inventory fields
        """
        base_a = f"/api/merchant/stores/{self.store_a.slug}"

        # Non-member Store B owner blocked with 404
        self.client.force_authenticate(user=self.owner_b)
        self.assertEqual(self.client.get(f"{base_a}/inventory/").status_code, status.HTTP_404_NOT_FOUND)

        # Staff A can read & manage inventory
        self.client.force_authenticate(user=self.staff_a)

        ov = self.client.get(f"{base_a}/overview/")
        self.assertEqual(ov.status_code, 200)
        self.assertEqual(ov.json()["low_stock_variants_count"], 1)  # var_low (qty 2 <= thr 3)
        self.assertEqual(ov.json()["out_of_stock_variants_count"], 0)

        inv_all = self.client.get(f"{base_a}/inventory/")
        self.assertEqual(inv_all.status_code, 200)
        summary = inv_all.json()["summary"]
        self.assertEqual(summary["total_variants"], 3)
        self.assertEqual(summary["tracked_count"], 2)
        self.assertEqual(summary["low_stock_count"], 1)
        self.assertEqual(summary["out_of_stock_count"], 0)
        self.assertEqual(summary["total_units"], 7)

        inv_low = self.client.get(f"{base_a}/inventory/?status=low")
        self.assertEqual(len(inv_low.json()["items"]), 1)
        self.assertEqual(inv_low.json()["items"][0]["sku"], "INV-A-LOW")

        inv_search = self.client.get(f"{base_a}/inventory/?q=UNTRACKED")
        self.assertEqual(len(inv_search.json()["items"]), 1)

        # Bounds validation on Variant PATCH
        bad_thresh = self.client.patch(
            f"{base_a}/products/{self.prod_tracked.id}/variants/{self.var_tracked.id}/",
            {"low_stock_threshold": 40000},
            format="json",
        )
        self.assertEqual(bad_thresh.status_code, status.HTTP_400_BAD_REQUEST)

        # Updating stock_quantity to 0 auto-flips in_stock=False & logs INVENTORY_UPDATE
        zero_patch = self.client.patch(
            f"{base_a}/products/{self.prod_tracked.id}/variants/{self.var_tracked.id}/",
            {"stock_quantity": 0},
            format="json",
        )
        self.assertEqual(zero_patch.status_code, 200)
        self.assertFalse(zero_patch.json()["in_stock"])
        self.assertTrue(zero_patch.json()["is_out_of_stock"])

        # Restocking to 15 auto-flips in_stock=True
        restock_patch = self.client.patch(
            f"{base_a}/products/{self.prod_tracked.id}/variants/{self.var_tracked.id}/",
            {"stock_quantity": 15},
            format="json",
        )
        self.assertEqual(restock_patch.status_code, 200)
        self.assertTrue(restock_patch.json()["in_stock"])
        self.assertFalse(restock_patch.json()["is_out_of_stock"])

        with TenantDatabaseContext(self.store_a.id):
            inv_logs = MerchantAuditLog.objects.for_store(self.store_a).filter(action="INVENTORY_UPDATE")
            self.assertGreaterEqual(inv_logs.count(), 2)

        # Product creation supports initial tracked inventory
        prod_create = self.client.post(
            f"{base_a}/products/",
            {
                "name": "Initial Tracked Bowl",
                "slug": "tracked-bowl",
                "initial_price_minor": 150000,
                "initial_track_inventory": True,
                "initial_stock_quantity": 0,
                "initial_low_stock_threshold": 4,
            },
            format="json",
        )
        self.assertEqual(prod_create.status_code, 201)
        created_var = prod_create.json()["variants"][0]
        self.assertTrue(created_var["track_inventory"])
        self.assertEqual(created_var["stock_quantity"], 0)
        self.assertEqual(created_var["low_stock_threshold"], 4)
        self.assertFalse(created_var["in_stock"])
