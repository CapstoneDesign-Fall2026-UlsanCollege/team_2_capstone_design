from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import requests
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from catalog.models import Product, Variant
from core.tenant_context import TenantDatabaseContext
from orders.models import Order, OrderEvent
from stores.khalti import (
    KHALTI_LIVE_BASE_URL,
    KHALTI_SANDBOX_BASE_URL,
    initiate_khalti_epayment,
    is_khalti_mock_mode_enabled,
)
from stores.models import Customer, Store


def _mock_response(*, status_code=200, json_data=None, json_exc=None):
    resp = MagicMock()
    resp.status_code = status_code
    if json_exc is not None:
        resp.json.side_effect = json_exc
    else:
        resp.json.return_value = json_data if json_data is not None else {}
    return resp


class KhaltiHardenedIntegrationTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="khalti.buyer@example.com",
            full_name="Aarav Shrestha",
        )
        self.store = Store.objects.create(
            name="Kathmandu Craft",
            slug="ktm-craft",
            is_active=True,
            cod_enabled=True,
            khalti_mode="TEST",
            inside_valley_shipping_minor=0,
            outside_valley_shipping_minor=0,
        )
        self.store.set_khalti_secret_key("test_secret_key_store_sandbox_123456")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])

        self.other_store = Store.objects.create(
            name="Pokhara Loom",
            slug="pokhara-loom",
            is_active=True,
            cod_enabled=True,
            khalti_mode="TEST",
        )
        self.other_store.set_khalti_secret_key("test_secret_key_other_sandbox_999999")
        self.other_store.save(update_fields=["khalti_secret_key_encrypted"])

        with TenantDatabaseContext(self.store.id):
            product = Product.objects.create(
                store=self.store,
                name="Handspun Scarf",
                slug="handspun-scarf",
                is_active=True,
            )
            # Rs. 1,300 -> 130000 paisa
            self.variant = Variant.objects.create(
                store=self.store,
                product=product,
                sku="SCARF-1300",
                label="Natural",
                price_minor=130000,
                in_stock=True,
                is_active=True,
            )
            self.customer = Customer.objects.create(
                store=self.store,
                user=self.user,
                email=self.user.email,
                full_name="Aarav Shrestha",
                phone="9801122334",
            )

        self._order_seq = 0
        self.client = APIClient()

    def _checkout_payload(self):
        return {
            "customer_email": self.user.email,
            "payment_method": "KHALTI",
            "items": [{"variant_id": self.variant.id, "quantity": 1}],
            "shipping_address": {
                "recipient_name": "Aarav Shrestha",
                "phone": "9801122334",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metro",
                "ward": "5",
                "street_landmark": "Patan Dhoka",
            },
        }

    def _create_unpaid_khalti_order(self, *, pidx="real_pidx_abc123", total_minor=130000, status_val="PENDING_PAYMENT", payment_status_val="UNPAID"):
        self._order_seq += 1
        with TenantDatabaseContext(self.store.id):
            return Order.objects.create(
                store=self.store,
                customer=self.customer,
                order_number=f"#KC-2026-{self._order_seq:04d}",
                order_type="ONE_TIME",
                status=status_val,
                payment_method="KHALTI",
                payment_status=payment_status_val,
                payment_ref=pidx,
                subtotal_minor=total_minor,
                total_minor=total_minor,
                currency="NPR",
                shipping_address_snapshot={
                    "recipient_name": "Aarav Shrestha",
                    "phone": "9801122334",
                },
                is_test=True,
            )

    @patch("stores.khalti.get_shared_http_session")
    def test_initiate_sandbox_success_and_paisa_units(self, mock_get_session):
        fake_session = MagicMock()
        fake_session.post.return_value = _mock_response(
            status_code=200,
            json_data={
                "pidx": "bZQLD9w3rK9m2x",
                "payment_url": "https://test-pay.khalti.com/?pidx=bZQLD9w3rK9m2x",
            },
        )
        mock_get_session.return_value = fake_session

        res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        data = res.json()
        self.assertEqual(data["pidx"], "bZQLD9w3rK9m2x")
        self.assertEqual(data["payment_url"], "https://test-pay.khalti.com/?pidx=bZQLD9w3rK9m2x")
        self.assertTrue(data["is_test"])

        fake_session.post.assert_called_once()
        call_args = fake_session.post.call_args
        self.assertEqual(call_args.args[0], f"{KHALTI_SANDBOX_BASE_URL}/epayment/initiate/")
        sent_body = call_args.kwargs["json"]
        self.assertEqual(sent_body["amount"], 130000)
        self.assertEqual(sent_body["purchase_order_id"], str(data["order_id"]))
        self.assertIn("/s/ktm-craft/checkout/khalti-return/", sent_body["return_url"])
        self.assertEqual(
            call_args.kwargs["headers"]["Authorization"],
            "Key test_secret_key_store_sandbox_123456",
        )

        with TenantDatabaseContext(self.store.id):
            order = Order.objects.get(id=data["order_id"])
            self.assertEqual(order.payment_ref, "bZQLD9w3rK9m2x")
            self.assertTrue(order.is_test)

    @patch("stores.khalti.get_shared_http_session")
    def test_initiate_failures_return_502_with_atomic_rollback_and_no_fake_url(self, mock_get_session):
        scenarios = [
            _mock_response(status_code=500, json_data={"detail": "upstream error"}),
            requests.Timeout("timed out"),
            _mock_response(status_code=200, json_data={"payment_url": "https://test-pay.khalti.com/?pidx=only_url"}),
            _mock_response(status_code=200, json_data={"pidx": "only_pidx"}),
        ]
        for outcome in scenarios:
            fake_session = MagicMock()
            if isinstance(outcome, Exception):
                fake_session.post.side_effect = outcome
            else:
                fake_session.post.return_value = outcome
            mock_get_session.return_value = fake_session

            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/place/",
                self._checkout_payload(),
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_502_BAD_GATEWAY)
            data = res.json()
            self.assertNotIn("pidx", data)
            self.assertNotIn("payment_url", data)
            with TenantDatabaseContext(self.store.id):
                self.assertEqual(Order.objects.for_store(self.store).count(), 0)

    def test_initiate_in_test_mode_without_key_fails_closed_when_mock_off(self):
        self.store.set_khalti_secret_key("")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])

        res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        with TenantDatabaseContext(self.store.id):
            self.assertEqual(Order.objects.for_store(self.store).count(), 0)

        pidx, url, is_mock, err = initiate_khalti_epayment(
            store=self.store,
            order=SimpleNamespace(id=1, total_minor=130000),
            khalti_body={},
        )
        self.assertIsNone(pidx)
        self.assertIsNone(url)
        self.assertFalse(is_mock)
        self.assertTrue(bool(err))

    @override_settings(KHALTI_MOCK_MODE=True)
    @patch("stores.khalti.get_shared_http_session")
    def test_mock_mode_flow_and_strict_enforcement(self, mock_get_session):
        self.store.set_khalti_secret_key("")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])

        place_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(place_res.status_code, status.HTTP_201_CREATED)
        data = place_res.json()
        self.assertTrue(data["pidx"].startswith(f"mock_{data['order_id']}_"))
        self.assertTrue(data["payment_url"].startswith(f"/s/{self.store.slug}/checkout/khalti-return/"))
        self.assertTrue(data["is_test"])
        self.assertTrue(data.get("is_mock"))
        mock_get_session.assert_not_called()

        # Matching mock pidx verifies and marks PAID
        verify_ok = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": data["pidx"], "order_id": data["order_id"]},
            format="json",
        )
        self.assertEqual(verify_ok.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_ok.json()["status"], "PAID")

        # Mismatched / non-mock pidx rejected while mock mode is on
        other_order = self._create_unpaid_khalti_order(pidx="sandbox_fake_token")
        verify_non_mock = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": "sandbox_fake_token", "order_id": other_order.id},
            format="json",
        )
        self.assertEqual(verify_non_mock.status_code, status.HTTP_400_BAD_REQUEST)
        with TenantDatabaseContext(self.store.id):
            other_order.refresh_from_db()
            self.assertEqual(other_order.payment_status, "FAILED")

    def test_mock_mode_rejected_in_non_debug_non_test_environment(self):
        with override_settings(
            KHALTI_MOCK_MODE=True,
            DEBUG=False,
            IS_TEST_COMMAND=False,
            IS_TEST_RUNNER_ACTIVE=False,
        ):
            self.assertFalse(is_khalti_mock_mode_enabled())

    def test_mock_sandbox_and_test_tokens_rejected_when_mock_mode_off(self):
        for idx, token in enumerate(("mock_1_abcd", "sandbox_1_abcd", "test_1_abcd"), start=1):
            with TenantDatabaseContext(self.store.id):
                order = Order.objects.create(
                    store=self.store,
                    customer=self.customer,
                    order_number=f"#KC-FAKE-{idx}",
                    status="PENDING_PAYMENT",
                    payment_method="KHALTI",
                    payment_status="UNPAID",
                    payment_ref=token,
                    subtotal_minor=130000,
                    total_minor=130000,
                    is_test=True,
                )
            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": token, "order_id": order.id},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            with TenantDatabaseContext(self.store.id):
                order.refresh_from_db()
                self.assertEqual(order.payment_status, "FAILED")
                self.assertNotEqual(order.status, "PAID")

    @override_settings(KHALTI_PLATFORM_SANDBOX_KEY="test_secret_key_platform_demo_777")
    @patch("stores.khalti.get_shared_http_session")
    def test_platform_sandbox_key_for_demos_never_used_in_live(self, mock_get_session):
        self.store.set_khalti_secret_key("")
        self.store.save(update_fields=["khalti_secret_key_encrypted"])

        pub_res = self.client.get(f"/api/stores/{self.store.slug}/")
        self.assertEqual(pub_res.status_code, status.HTTP_200_OK)
        self.assertIs(pub_res.json()["has_khalti"], True)
        self.assertNotIn("platform_demo_777", pub_res.content.decode("utf-8"))

        fake_session = MagicMock()
        fake_session.post.return_value = _mock_response(
            status_code=200,
            json_data={
                "pidx": "platformSbxPidx123",
                "payment_url": "https://test-pay.khalti.com/?pidx=platformSbxPidx123",
            },
        )
        mock_get_session.return_value = fake_session

        place_res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(place_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            fake_session.post.call_args.kwargs["headers"]["Authorization"],
            "Key test_secret_key_platform_demo_777",
        )

        # LIVE mode must never inherit platform sandbox key
        with override_settings(KHALTI_LIVE_ENABLED=True):
            self.store.khalti_mode = "LIVE"
            self.store.save(update_fields=["khalti_mode"])
            live_pub = self.client.get(f"/api/stores/{self.store.slug}/")
            self.assertIs(live_pub.json()["has_khalti"], False)
            live_place = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/place/",
                self._checkout_payload(),
                format="json",
            )
            self.assertEqual(live_place.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_completed_match_ignores_tampered_client_fields(self, mock_get_session):
        order = self._create_unpaid_khalti_order(pidx="pidxRealCompleted1", total_minor=130000)
        fake_session = MagicMock()
        fake_session.post.return_value = _mock_response(
            status_code=200,
            json_data={
                "pidx": "pidxRealCompleted1",
                "total_amount": 130000,
                "status": "Completed",
                "transaction_id": "TXN-KHALTI-8899",
            },
        )
        mock_get_session.return_value = fake_session

        res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {
                "pidx": "pidxRealCompleted1",
                "order_id": order.id,
                "status": "User canceled",
                "amount": 100,
                "transaction_id": "CLIENT-SPOOFED-TXN",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["status"], "PAID")

        fake_session.post.assert_called_once()
        self.assertEqual(
            fake_session.post.call_args.args[0],
            f"{KHALTI_SANDBOX_BASE_URL}/epayment/lookup/",
        )

        with TenantDatabaseContext(self.store.id):
            order.refresh_from_db()
            self.assertEqual(order.status, "PAID")
            self.assertEqual(order.payment_status, "PAID")
            ev = OrderEvent.objects.filter(order=order, to_status="PAID").first()
            self.assertIsNotNone(ev)
            self.assertIn("TXN-KHALTI-8899", ev.note)
            self.assertNotIn("CLIENT-SPOOFED-TXN", ev.note)

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_amount_mismatch_marks_payment_failed(self, mock_get_session):
        order = self._create_unpaid_khalti_order(pidx="pidxMismatch1", total_minor=130000)
        fake_session = MagicMock()
        fake_session.post.return_value = _mock_response(
            status_code=200,
            json_data={
                "pidx": "pidxMismatch1",
                "total_amount": 5000,
                "status": "Completed",
                "transaction_id": "TXN-PARTIAL",
            },
        )
        mock_get_session.return_value = fake_session

        res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": "pidxMismatch1", "order_id": order.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        with TenantDatabaseContext(self.store.id):
            order.refresh_from_db()
            self.assertEqual(order.status, "PAYMENT_FAILED")
            self.assertEqual(order.payment_status, "FAILED")
            ev = OrderEvent.objects.filter(order=order, to_status="PAYMENT_FAILED").first()
            self.assertIsNotNone(ev)
            self.assertIn("130000", ev.note)
            self.assertIn("5000", ev.note)

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_pending_and_initiated_return_202_without_failing_order(self, mock_get_session):
        for idx, khalti_status in enumerate(("Pending", "Initiated"), start=1):
            order = self._create_unpaid_khalti_order(pidx=f"pidxPend{idx}")
            fake_session = MagicMock()
            fake_session.post.return_value = _mock_response(
                status_code=200,
                json_data={"pidx": f"pidxPend{idx}", "total_amount": 130000, "status": khalti_status},
            )
            mock_get_session.return_value = fake_session

            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": f"pidxPend{idx}", "order_id": order.id},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_202_ACCEPTED)
            self.assertEqual(res.json()["state"], "pending")
            self.assertIs(res.json()["success"], False)
            with TenantDatabaseContext(self.store.id):
                order.refresh_from_db()
                self.assertEqual(order.status, "PENDING_PAYMENT")
                self.assertEqual(order.payment_status, "UNPAID")
                self.assertEqual(OrderEvent.objects.filter(order=order).count(), 0)

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_canceled_expired_refunded_mark_payment_failed(self, mock_get_session):
        for idx, khalti_status in enumerate(("User canceled", "Expired", "Refunded"), start=1):
            order = self._create_unpaid_khalti_order(pidx=f"pidxFail{idx}")
            fake_session = MagicMock()
            fake_session.post.return_value = _mock_response(
                status_code=200,
                json_data={"pidx": f"pidxFail{idx}", "total_amount": 130000, "status": khalti_status},
            )
            mock_get_session.return_value = fake_session

            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": f"pidxFail{idx}", "order_id": order.id},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            with TenantDatabaseContext(self.store.id):
                order.refresh_from_db()
                self.assertEqual(order.status, "PAYMENT_FAILED")
                self.assertEqual(order.payment_status, "FAILED")
                ev = OrderEvent.objects.filter(order=order, to_status="PAYMENT_FAILED").first()
                self.assertIsNotNone(ev)

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_unknown_error_network_malformed_returns_503_unchanged(self, mock_get_session):
        bad_responses = [
            requests.Timeout("lookup timed out"),
            _mock_response(status_code=502, json_data={}),
            _mock_response(status_code=200, json_exc=ValueError("bad json")),
            _mock_response(status_code=200, json_data={"status": "UnexpectedStatus", "total_amount": 130000}),
        ]
        for idx, outcome in enumerate(bad_responses, start=1):
            order = self._create_unpaid_khalti_order(pidx=f"pidxErr{idx}")
            fake_session = MagicMock()
            if isinstance(outcome, Exception):
                fake_session.post.side_effect = outcome
            else:
                fake_session.post.return_value = outcome
            mock_get_session.return_value = fake_session

            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": f"pidxErr{idx}", "order_id": order.id},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)
            with TenantDatabaseContext(self.store.id):
                order.refresh_from_db()
                self.assertEqual(order.status, "PENDING_PAYMENT")
                self.assertEqual(order.payment_status, "UNPAID")

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_rejects_pidx_mismatch_and_sandbox_x_without_modifying_order(self, mock_get_session):
        order = self._create_unpaid_khalti_order(pidx="expectedRealPidx999")

        for submitted in ("differentRealPidx111", "sandbox_x"):
            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": submitted, "order_id": order.id},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        mock_get_session.assert_not_called()
        with TenantDatabaseContext(self.store.id):
            order.refresh_from_db()
            self.assertEqual(order.status, "PENDING_PAYMENT")
            self.assertEqual(order.payment_status, "UNPAID")

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_idempotency_and_forward_status_preservation(self, mock_get_session):
        order = self._create_unpaid_khalti_order(pidx="pidxIdem1")
        fake_session = MagicMock()
        fake_session.post.return_value = _mock_response(
            status_code=200,
            json_data={
                "pidx": "pidxIdem1",
                "total_amount": 130000,
                "status": "Completed",
                "transaction_id": "TXN-IDEM-1",
            },
        )
        mock_get_session.return_value = fake_session

        res1 = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": "pidxIdem1", "order_id": order.id},
            format="json",
        )
        res2 = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": "pidxIdem1", "order_id": order.id},
            format="json",
        )
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(fake_session.post.call_count, 1)

        with TenantDatabaseContext(self.store.id):
            self.assertEqual(OrderEvent.objects.filter(order=order, to_status="PAID").count(), 1)

        # Already progressed statuses must never move backwards to PAID
        for idx, progressed_status in enumerate(("PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"), start=1):
            prog_order = self._create_unpaid_khalti_order(
                pidx=f"pidxProg{idx}",
                status_val=progressed_status,
                payment_status_val="PAID",
            )
            res = self.client.post(
                f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
                {"pidx": f"pidxProg{idx}", "order_id": prog_order.id},
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertEqual(res.json()["status"], progressed_status)
            with TenantDatabaseContext(self.store.id):
                prog_order.refresh_from_db()
                self.assertEqual(prog_order.status, progressed_status)

    @patch("stores.khalti.get_shared_http_session")
    def test_verify_cross_tenant_returns_404(self, mock_get_session):
        order = self._create_unpaid_khalti_order(pidx="pidxTenantA1")
        res = self.client.post(
            f"/api/stores/{self.other_store.slug}/checkout/khalti-verify/",
            {"pidx": "pidxTenantA1", "order_id": order.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        mock_get_session.assert_not_called()

    @patch("stores.khalti.get_shared_http_session")
    def test_public_order_pay_retry_flow_and_guards(self, mock_get_session):
        order = self._create_unpaid_khalti_order(
            pidx="oldFailedPidx1",
            total_minor=130000,
            status_val="PAYMENT_FAILED",
            payment_status_val="FAILED",
        )

        # 1. Unauthenticated / missing token cannot retry
        unauth = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{order.id}/pay/",
            {"payment_method": "KHALTI"},
            format="json",
        )
        self.assertEqual(unauth.status_code, status.HTTP_404_NOT_FOUND)

        # 2. Wrong token cannot retry
        wrong_tok = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{order.id}/pay/?token=00000000-0000-0000-0000-000000000000",
            {"payment_method": "KHALTI"},
            format="json",
        )
        self.assertEqual(wrong_tok.status_code, status.HTTP_404_NOT_FOUND)

        # 3. Valid token re-initiates Khalti
        fake_session = MagicMock()
        fake_session.post.side_effect = [
            _mock_response(
                status_code=200,
                json_data={
                    "pidx": "newRetryPidx2",
                    "payment_url": "https://test-pay.khalti.com/?pidx=newRetryPidx2",
                },
            ),
            _mock_response(
                status_code=200,
                json_data={
                    "pidx": "newRetryPidx2",
                    "total_amount": 130000,
                    "status": "Completed",
                    "transaction_id": "TXN-RETRY-OK",
                },
            ),
        ]
        mock_get_session.return_value = fake_session

        retry_res = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{order.id}/pay/?token={order.token}",
            {"payment_method": "KHALTI"},
            format="json",
        )
        self.assertEqual(retry_res.status_code, status.HTTP_200_OK)
        self.assertEqual(retry_res.json()["pidx"], "newRetryPidx2")
        self.assertEqual(retry_res.json()["status"], "PENDING_PAYMENT")

        initiate_sent = fake_session.post.call_args_list[0].kwargs["json"]
        self.assertEqual(initiate_sent["amount"], 130000)
        self.assertEqual(initiate_sent["purchase_order_id"], str(order.id))

        with TenantDatabaseContext(self.store.id):
            order.refresh_from_db()
            self.assertEqual(order.payment_ref, "newRetryPidx2")
            self.assertEqual(order.status, "PENDING_PAYMENT")
            self.assertEqual(order.payment_status, "UNPAID")
            ev = OrderEvent.objects.filter(order=order, to_status="PENDING_PAYMENT").first()
            self.assertIsNotNone(ev)
            self.assertIn("retry", ev.note.lower())

        # Old pidx is now rejected
        old_verify = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": "oldFailedPidx1", "order_id": order.id},
            format="json",
        )
        self.assertEqual(old_verify.status_code, status.HTTP_400_BAD_REQUEST)

        # New pidx succeeds
        new_verify = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/khalti-verify/",
            {"pidx": "newRetryPidx2", "order_id": order.id},
            format="json",
        )
        self.assertEqual(new_verify.status_code, status.HTTP_200_OK)
        self.assertEqual(new_verify.json()["status"], "PAID")

        # 4. Already PAID order refuses retry
        self.client.force_authenticate(user=self.user)
        refuse_paid = self.client.post(
            f"/api/stores/{self.store.slug}/public-orders/{order.id}/pay/",
            {"payment_method": "KHALTI"},
            format="json",
        )
        self.assertEqual(refuse_paid.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(user=None)

    @override_settings(KHALTI_LIVE_ENABLED=True)
    @patch("stores.khalti.get_shared_http_session")
    def test_live_mode_targets_production_khalti_url(self, mock_get_session):
        self.store.khalti_mode = "LIVE"
        self.store.set_khalti_secret_key("live_secret_key_test_fixture_only")
        self.store.save(update_fields=["khalti_mode", "khalti_secret_key_encrypted"])

        fake_session = MagicMock()
        fake_session.post.return_value = _mock_response(
            status_code=200,
            json_data={
                "pidx": "prodPidxReal987",
                "payment_url": "https://pay.khalti.com/?pidx=prodPidxReal987",
            },
        )
        mock_get_session.return_value = fake_session

        res = self.client.post(
            f"/api/stores/{self.store.slug}/checkout/place/",
            self._checkout_payload(),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.json()["is_test"])
        self.assertEqual(
            fake_session.post.call_args.args[0],
            f"{KHALTI_LIVE_BASE_URL}/epayment/initiate/",
        )
