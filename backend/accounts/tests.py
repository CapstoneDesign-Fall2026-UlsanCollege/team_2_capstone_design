from datetime import timedelta
import io
import json
import os
from unittest.mock import MagicMock, patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.core.management.base import CommandError
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import EmailOTPChallenge
from accounts.otp import get_client_ip
from core.email_transport import (
    RESEND_API_URL,
    get_email_executor,
    get_shared_http_session,
    validate_email_transport_settings,
)

User = get_user_model()


@override_settings(DEBUG=True)
class EmailOTPAuthTests(APITestCase):
    def setUp(self):
        self.email = "maya.gurung@example.com"
        mail.outbox.clear()
        cache.clear()

    def test_happy_path_otp_request_and_verify(self):
        with self.captureOnCommitCallbacks(execute=True):
            req_res = self.client.post("/api/auth/otp/request/", {"email": self.email})
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        self.assertIn("dev_otp_hint", req_res.data)
        otp_code = req_res.data["dev_otp_hint"]

        # Verify email was sent via transaction.on_commit
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(otp_code, mail.outbox[0].body)
        self.assertIn("expires in 10 minutes", mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, [self.email])
        self.assertEqual(len(mail.outbox[0].alternatives), 1)
        self.assertIn(otp_code, mail.outbox[0].alternatives[0][0])

        # Verify OTP
        verify_res = self.client.post("/api/auth/otp/verify/", {
            "email": self.email,
            "code": otp_code,
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_res.data["user"]["email"], self.email)
        self.assertIn("sessionid", self.client.cookies)
        self.assertTrue(self.client.cookies["sessionid"]["httponly"])

        # Check /api/auth/me/
        me_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertTrue(me_res.data["authenticated"])
        self.assertEqual(me_res.data["user"]["email"], self.email)

        # Patch profile
        patch_res = self.client.patch("/api/auth/me/", {
            "full_name": "Maya Gurung",
            "phone": "9841234567",
        })
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["user"]["full_name"], "Maya Gurung")
        self.assertEqual(patch_res.data["user"]["phone"], "9841234567")

        # Logout
        logout_res = self.client.post("/api/auth/logout/")
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # Verify anonymous me
        me_after_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_after_res.status_code, status.HTTP_200_OK)
        self.assertFalse(me_after_res.data["authenticated"])
        self.assertIsNone(me_after_res.data["user"])

    def test_five_wrong_attempts_locks_out_challenge(self):
        with self.captureOnCommitCallbacks(execute=True):
            req_res = self.client.post("/api/auth/otp/request/", {"email": self.email})
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        correct_code = req_res.data["dev_otp_hint"]

        for _ in range(5):
            res = self.client.post("/api/auth/otp/verify/", {
                "email": self.email,
                "code": "000000" if correct_code != "000000" else "111111",
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                res.data["detail"],
                "That code didn't match or expired. Request a fresh 6-digit code.",
            )

        lockout_res = self.client.post("/api/auth/otp/verify/", {
            "email": self.email,
            "code": correct_code,
        })
        self.assertEqual(lockout_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            lockout_res.data["detail"],
            "That code didn't match or expired. Request a fresh 6-digit code.",
        )

    def test_expired_challenge_rejected(self):
        with self.captureOnCommitCallbacks(execute=True):
            req_res = self.client.post("/api/auth/otp/request/", {"email": self.email})
        correct_code = req_res.data["dev_otp_hint"]

        EmailOTPChallenge.objects.filter(email=self.email).update(
            expires_at=timezone.now() - timedelta(seconds=1)
        )

        res = self.client.post("/api/auth/otp/verify/", {
            "email": self.email,
            "code": correct_code,
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["detail"],
            "That code didn't match or expired. Request a fresh 6-digit code.",
        )

    @override_settings(DEBUG=False)
    def test_dev_otp_hint_suppressed_and_no_otp_in_response_or_logs(self):
        target_email = "prashant@example.com"
        with self.captureOnCommitCallbacks(execute=True):
            res = self.client.post("/api/auth/otp/request/", {"email": target_email})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotIn("dev_otp_hint", res.data)
        self.assertNotIn("email", res.data)
        self.assertEqual(res.data["detail"], "If this email is valid, a verification code has been sent.")
        raw_json = json.dumps(res.data)
        self.assertNotIn(target_email, raw_json)

    @override_settings(
        DEBUG=False,
        EMAIL_TRANSPORT="resend_api",
        RESEND_API_KEY="re_test_dummy_secret",
        DEFAULT_FROM_EMAIL="auth@send.example.com",
        EMAIL_SEND_ASYNC=False,
    )
    def test_resend_transport_failure_masks_logs_and_returns_generic_200(self):
        target_email = "secret.recipient@example.com"
        mock_resp = MagicMock(status_code=503)
        with patch("core.email_transport.get_shared_http_session") as mock_sess_fn:
            mock_sess_fn.return_value.post.return_value = mock_resp
            with self.assertLogs("core.email_transport", level="ERROR") as captured:
                with self.captureOnCommitCallbacks(execute=True):
                    res = self.client.post("/api/auth/otp/request/", {"email": target_email})

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotIn("dev_otp_hint", res.data)
        joined_logs = "\n".join(captured.output)
        self.assertIn("EmailTransportError", joined_logs)
        self.assertIn("store_id=platform", joined_logs)
        self.assertNotIn(target_email, joined_logs)
        self.assertNotIn("re_test_dummy_secret", joined_logs)

    @override_settings(TRUSTED_PROXY_HEADER="HTTP_X_FORWARDED_FOR")
    def test_heroku_rightmost_x_forwarded_for_extraction(self):
        req = self.client.request().wsgi_request
        req.META["HTTP_X_FORWARDED_FOR"] = "203.0.113.9, 198.51.100.42"
        req.META["REMOTE_ADDR"] = "10.0.0.1"
        self.assertEqual(get_client_ip(req), "198.51.100.42")

    def test_email_transport_startup_validation_fails_closed_in_prod(self):
        with self.assertRaises(ImproperlyConfigured):
            validate_email_transport_settings(
                debug=False,
                email_transport="resend_api",
                default_from_email="auth@send.example.com",
                resend_api_key="",
                resend_timeout=4.5,
                email_host="",
                email_port=587,
                email_use_ssl=False,
                email_use_tls=True,
                email_host_user="",
                email_host_password="",
                email_timeout=10,
            )

        with self.assertRaises(ImproperlyConfigured):
            validate_email_transport_settings(
                debug=False,
                email_transport="smtp",
                default_from_email="auth@send.example.com",
                resend_api_key="",
                resend_timeout=4.5,
                email_host="",
                email_port=587,
                email_use_ssl=False,
                email_use_tls=True,
                email_host_user="",
                email_host_password="",
                email_timeout=10,
            )

        with self.assertRaises(ImproperlyConfigured):
            validate_email_transport_settings(
                debug=False,
                email_transport="resend_api",
                default_from_email="auth@send.example.com",
                resend_api_key="re_live_dummy",
                resend_timeout=6.0,  # > 5s must fail
                email_host="",
                email_port=587,
                email_use_ssl=False,
                email_use_tls=True,
                email_host_user="",
                email_host_password="",
                email_timeout=10,
            )

    @override_settings(
        EMAIL_TRANSPORT="resend_api",
        RESEND_API_KEY="re_cmd_secret_value",
        DEFAULT_FROM_EMAIL="auth@send.example.com",
    )
    def test_send_test_email_command_masks_key_and_reports_status(self):
        out = io.StringIO()
        err = io.StringIO()
        with patch("core.email_transport.get_shared_http_session") as mock_sess_fn:
            mock_sess_fn.return_value.post.return_value = MagicMock(status_code=200)
            call_command("send_test_email", "verify@example.com", stdout=out, stderr=err)
            call_kwargs = mock_sess_fn.return_value.post.call_args
            self.assertEqual(call_kwargs[0][0], RESEND_API_URL)

        self.assertIn("SUCCESS", out.getvalue())
        self.assertNotIn("re_cmd_secret_value", out.getvalue())
        self.assertNotIn("re_cmd_secret_value", err.getvalue())

        out_fail = io.StringIO()
        err_fail = io.StringIO()
        with patch("core.email_transport.get_shared_http_session") as mock_sess_fn:
            mock_sess_fn.return_value.post.return_value = MagicMock(status_code=401)
            with self.assertRaises(CommandError):
                call_command("send_test_email", "verify@example.com", stdout=out_fail, stderr=err_fail)

        self.assertIn("FAILURE", err_fail.getvalue())
        self.assertNotIn("re_cmd_secret_value", err_fail.getvalue())
        self.assertNotIn("verify@example.com", err_fail.getvalue())

    def test_shared_session_and_executor_post_fork_reinit(self):
        sess1 = get_shared_http_session()
        exec1 = get_email_executor()
        adapter = sess1.get_adapter("https://api.resend.com")
        self.assertEqual(adapter.max_retries.total, 0)
        self.assertEqual(exec1._max_workers, 2)

        with patch("core.email_transport.os.getpid", return_value=os.getpid() + 99999):
            sess2 = get_shared_http_session()
            exec2 = get_email_executor()
            self.assertIsNot(sess1, sess2)
            self.assertIsNot(exec1, exec2)

    def test_csrf_token_endpoint(self):
        res = self.client.get("/api/auth/csrf/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("csrfToken", res.data)
        self.assertTrue(len(res.data["csrfToken"]) > 0)


class GoogleOAuthTests(APITestCase):
    def setUp(self):
        self.client_id = "test-google-client-id.apps.googleusercontent.com"
        cache.clear()

    @patch.dict(os.environ, {"GOOGLE_OAUTH_CLIENT_ID": "test-google-client-id.apps.googleusercontent.com"})
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_valid_google_token_authenticates_user(self, mock_verify):
        mock_verify.return_value = {
            "iss": "accounts.google.com",
            "email": "bikash.shrestha@example.com",
            "email_verified": True,
            "name": "Bikash Shrestha",
        }

        res = self.client.post("/api/auth/google/", {"credential": "fake-valid-jwt"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["user"]["email"], "bikash.shrestha@example.com")
        self.assertEqual(res.data["user"]["full_name"], "Bikash Shrestha")
        self.assertIn("sessionid", self.client.cookies)
        self.assertTrue(self.client.cookies["sessionid"]["httponly"])

        me_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertTrue(me_res.data["authenticated"])
        self.assertEqual(me_res.data["user"]["email"], "bikash.shrestha@example.com")

    @patch.dict(os.environ, {"GOOGLE_OAUTH_CLIENT_ID": "test-google-client-id.apps.googleusercontent.com"})
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_unverified_email_rejected(self, mock_verify):
        mock_verify.return_value = {
            "iss": "accounts.google.com",
            "email": "unverified@example.com",
            "email_verified": False,
        }

        res = self.client.post("/api/auth/google/", {"credential": "fake-jwt"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data["detail"], "Google email is unverified or missing.")

    @patch.dict(os.environ, {"GOOGLE_OAUTH_CLIENT_ID": "test-google-client-id.apps.googleusercontent.com"})
    @patch("google.oauth2.id_token.verify_oauth2_token")
    def test_invalid_token_rejected(self, mock_verify):
        mock_verify.side_effect = ValueError("Invalid token signature")

        res = self.client.post("/api/auth/google/", {"credential": "invalid-token"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data["detail"], "Invalid Google credential token.")

    @patch.dict(os.environ, {"GOOGLE_OAUTH_CLIENT_ID": ""})
    def test_unconfigured_oauth_returns_503(self):
        res = self.client.post("/api/auth/google/", {"credential": "some-token"})
        self.assertEqual(res.status_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class DeliveryAddressAPITests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.shopper_x = User.objects.create_user("shopper.x@example.com")
        cls.shopper_y = User.objects.create_user("shopper.y@example.com")

    def setUp(self):
        self.address_payload_1 = {
            "recipient_name": "Prakash Adhikari",
            "phone": "9841567890",
            "province": "Bagmati",
            "district": "Kathmandu",
            "municipality": "Kirtipur Municipality",
            "ward": 5,
            "street_landmark": "Naya Bazaar Chowk near Bagh Bhairab",
        }
        self.address_payload_2 = {
            "recipient_name": "Aayush Maharjan",
            "phone": "9749876543",
            "province": "Gandaki",
            "district": "Kaski",
            "municipality": "Pokhara Metropolitan City",
            "ward": 6,
            "street_landmark": "Lakeside Hallan Chowk",
            "is_default": True,
        }

    def test_unauthenticated_request_rejected(self):
        res = self.client.get("/api/auth/addresses/")
        self.assertIn(res.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_create_and_manage_addresses_atomic_default(self):
        self.client.force_login(self.shopper_x)

        res1 = self.client.post("/api/auth/addresses/", self.address_payload_1)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        addr1_id = res1.data["id"]
        self.assertTrue(res1.data["is_default"])

        res2 = self.client.post("/api/auth/addresses/", self.address_payload_2)
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        addr2_id = res2.data["id"]
        self.assertTrue(res2.data["is_default"])

        list_res = self.client.get("/api/auth/addresses/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        items = list_res.data
        self.assertEqual(len(items), 2)
        by_id = {item["id"]: item for item in items}
        self.assertTrue(by_id[addr2_id]["is_default"])
        self.assertFalse(by_id[addr1_id]["is_default"])

        del_res = self.client.delete(f"/api/auth/addresses/{addr2_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_200_OK)

        list_after = self.client.get("/api/auth/addresses/")
        self.assertEqual(len(list_after.data), 1)
        self.assertTrue(list_after.data[0]["is_default"])
        self.assertEqual(list_after.data[0]["id"], addr1_id)

    def test_invalid_phone_numbers_rejected(self):
        self.client.force_login(self.shopper_x)

        for invalid_phone in ["9612345678", "9812345", "1234567890"]:
            bad_payload = dict(self.address_payload_1, phone=invalid_phone)
            res = self.client.post("/api/auth/addresses/", bad_payload)
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertIn("phone", res.data)
            self.assertIn("Enter a 10-digit number starting with 98 or 97.", str(res.data["phone"]))

    def test_cross_shopper_isolation_returns_404(self):
        self.client.force_login(self.shopper_y)
        res_y = self.client.post("/api/auth/addresses/", self.address_payload_1)
        y_addr_id = res_y.data["id"]

        self.client.force_login(self.shopper_x)

        get_res = self.client.get(f"/api/auth/addresses/{y_addr_id}/")
        self.assertEqual(get_res.status_code, status.HTTP_404_NOT_FOUND)

        patch_res = self.client.patch(f"/api/auth/addresses/{y_addr_id}/", {"recipient_name": "Hacked Name"})
        self.assertEqual(patch_res.status_code, status.HTTP_404_NOT_FOUND)

        del_res = self.client.delete(f"/api/auth/addresses/{y_addr_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)

        self.client.force_login(self.shopper_y)
        check_y = self.client.get(f"/api/auth/addresses/{y_addr_id}/")
        self.assertEqual(check_y.status_code, status.HTTP_200_OK)
        self.assertEqual(check_y.data["recipient_name"], "Prakash Adhikari")
