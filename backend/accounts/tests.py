import os
from datetime import timedelta
from unittest.mock import patch
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import DeliveryAddress, EmailOTPChallenge

User = get_user_model()


@override_settings(DEBUG=True)
class EmailOTPAuthTests(APITestCase):
    def setUp(self):
        self.email = "maya.gurung@example.com"
        mail.outbox.clear()

    def test_happy_path_otp_request_and_verify(self):
        # 1. Request OTP
        req_res = self.client.post("/api/auth/otp/request/", {"email": self.email})
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        self.assertIn("dev_otp_hint", req_res.data)
        otp_code = req_res.data["dev_otp_hint"]

        # Also verify email was sent to outbox
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn(otp_code, mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, [self.email])

        # 2. Verify OTP
        verify_res = self.client.post("/api/auth/otp/verify/", {
            "email": self.email,
            "code": otp_code,
        })
        self.assertEqual(verify_res.status_code, status.HTTP_200_OK)
        self.assertEqual(verify_res.data["user"]["email"], self.email)
        self.assertIn("sessionid", self.client.cookies)
        self.assertTrue(self.client.cookies["sessionid"]["httponly"])

        # 3. Check /api/auth/me/
        me_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertTrue(me_res.data["authenticated"])
        self.assertEqual(me_res.data["user"]["email"], self.email)

        # 4. Patch profile
        patch_res = self.client.patch("/api/auth/me/", {
            "full_name": "Maya Gurung",
            "phone": "9841234567"
        })
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_res.data["user"]["full_name"], "Maya Gurung")
        self.assertEqual(patch_res.data["user"]["phone"], "9841234567")

        # 5. Logout
        logout_res = self.client.post("/api/auth/logout/")
        self.assertEqual(logout_res.status_code, status.HTTP_200_OK)

        # 6. Verify anonymous me
        me_after_res = self.client.get("/api/auth/me/")
        self.assertEqual(me_after_res.status_code, status.HTTP_200_OK)
        self.assertFalse(me_after_res.data["authenticated"])
        self.assertIsNone(me_after_res.data["user"])

    def test_five_wrong_attempts_locks_out_challenge(self):
        req_res = self.client.post("/api/auth/otp/request/", {"email": self.email})
        self.assertEqual(req_res.status_code, status.HTTP_200_OK)
        correct_code = req_res.data["dev_otp_hint"]

        # Send 5 wrong attempts
        for _ in range(5):
            res = self.client.post("/api/auth/otp/verify/", {
                "email": self.email,
                "code": "000000" if correct_code != "000000" else "111111",
            })
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                res.data["detail"],
                "That code didn't match or expired. Request a fresh 6-digit code."
            )

        # 6th attempt with CORRECT code must still fail due to lockout
        lockout_res = self.client.post("/api/auth/otp/verify/", {
            "email": self.email,
            "code": correct_code,
        })
        self.assertEqual(lockout_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            lockout_res.data["detail"],
            "That code didn't match or expired. Request a fresh 6-digit code."
        )

    def test_expired_challenge_rejected(self):
        req_res = self.client.post("/api/auth/otp/request/", {"email": self.email})
        correct_code = req_res.data["dev_otp_hint"]

        # Expire the challenge in DB
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
            "That code didn't match or expired. Request a fresh 6-digit code."
        )

    @override_settings(DEBUG=False)
    def test_dev_otp_hint_suppressed_in_production(self):
        res = self.client.post("/api/auth/otp/request/", {"email": "prashant@example.com"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotIn("dev_otp_hint", res.data)
        self.assertEqual(res.data["detail"], "6-digit code sent.")
        self.assertEqual(res.data["email"], "prashant@example.com")

    def test_csrf_token_endpoint(self):
        res = self.client.get("/api/auth/csrf/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("csrfToken", res.data)
        self.assertTrue(len(res.data["csrfToken"]) > 0)


class GoogleOAuthTests(APITestCase):
    def setUp(self):
        self.client_id = "test-google-client-id.apps.googleusercontent.com"

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

        # Check /api/auth/me/
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
    def setUp(self):
        self.shopper_x = User.objects.create_user("shopper.x@example.com")
        self.shopper_y = User.objects.create_user("shopper.y@example.com")

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

        # 1. Create first address (should auto-promote to default)
        res1 = self.client.post("/api/auth/addresses/", self.address_payload_1)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        addr1_id = res1.data["id"]
        self.assertTrue(res1.data["is_default"])

        # 2. Create second address with is_default=True
        res2 = self.client.post("/api/auth/addresses/", self.address_payload_2)
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        addr2_id = res2.data["id"]
        self.assertTrue(res2.data["is_default"])

        # 3. Check list: addr2 must be default, addr1 must NOT be default
        list_res = self.client.get("/api/auth/addresses/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        items = list_res.data
        self.assertEqual(len(items), 2)
        by_id = {item["id"]: item for item in items}
        self.assertTrue(by_id[addr2_id]["is_default"])
        self.assertFalse(by_id[addr1_id]["is_default"])

        # 4. Delete default addr2 -> addr1 must be promoted to default
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
        # Create address owned by Shopper Y
        self.client.force_login(self.shopper_y)
        res_y = self.client.post("/api/auth/addresses/", self.address_payload_1)
        y_addr_id = res_y.data["id"]

        # Now authenticate as Shopper X
        self.client.force_login(self.shopper_x)

        # GET Shopper Y's address -> 404
        get_res = self.client.get(f"/api/auth/addresses/{y_addr_id}/")
        self.assertEqual(get_res.status_code, status.HTTP_404_NOT_FOUND)

        # PATCH Shopper Y's address -> 404
        patch_res = self.client.patch(f"/api/auth/addresses/{y_addr_id}/", {"recipient_name": "Hacked Name"})
        self.assertEqual(patch_res.status_code, status.HTTP_404_NOT_FOUND)

        # DELETE Shopper Y's address -> 404
        del_res = self.client.delete(f"/api/auth/addresses/{y_addr_id}/")
        self.assertEqual(del_res.status_code, status.HTTP_404_NOT_FOUND)

        # Verify Shopper Y's address is untouched
        self.client.force_login(self.shopper_y)
        check_y = self.client.get(f"/api/auth/addresses/{y_addr_id}/")
        self.assertEqual(check_y.status_code, status.HTTP_200_OK)
        self.assertEqual(check_y.data["recipient_name"], "Prakash Adhikari")
