from __future__ import annotations

import datetime
import json
import time
from unittest.mock import MagicMock, patch

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.x509.oid import NameOID
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from google.auth import crypt, jwt
from rest_framework import status
from rest_framework.test import APITestCase

import accounts.google_auth as google_auth_mod
from core.tenant_context import TenantDatabaseContext
from stores.models import Customer, Store, StoreMembership

User = get_user_model()

TEST_GOOGLE_CLIENT_ID = "shopcraft-prod-test-client.apps.googleusercontent.com"


def _generate_rsa_signer_and_x509_cert(kid: str) -> tuple[crypt.RSASigner, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem_private = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    signer = crypt.RSASigner.from_string(pem_private, key_id=kid)

    subject = issuer = x509.Name(
        [x509.NameAttribute(NameOID.COMMON_NAME, "accounts.google.com")]
    )
    now_utc = datetime.datetime.now(datetime.timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now_utc - datetime.timedelta(days=1))
        .not_valid_after(now_utc + datetime.timedelta(days=30))
        .sign(private_key, hashes.SHA256())
    )
    cert_pem = cert.public_bytes(serialization.Encoding.PEM).decode("utf-8")
    return signer, cert_pem


def _make_mock_http_certs_response(certs_payload: dict, max_age: int = 3600):
    resp = MagicMock()
    resp.status_code = 200
    resp.headers = {
        "Content-Type": "application/json",
        "Cache-Control": f"public, max-age={max_age}",
    }
    resp.content = json.dumps(certs_payload).encode("utf-8")
    return resp


@override_settings(GOOGLE_CLIENT_ID=TEST_GOOGLE_CLIENT_ID, DEBUG=False)
class GoogleSignInVerificationAndIsolationTests(APITestCase):
    """
    End-to-end cryptographic verification and multi-tenant isolation tests for:
      - POST /api/stores/<slug>/account/google/ (storefront customers)
      - POST /api/auth/google/ (merchants / platform)
    """

    @classmethod
    def setUpTestData(cls):
        cls.signer, cert_pem = _generate_rsa_signer_and_x509_cert("google-cert-kid-1")
        cls.attacker_signer, _ = _generate_rsa_signer_and_x509_cert("google-cert-kid-1")
        cls.certs_doc = {"google-cert-kid-1": cert_pem}

        cls.owner_a = User.objects.create_user(
            email="owner.a@example.com",
            full_name="Owner Alpha",
        )
        cls.owner_b = User.objects.create_user(
            email="owner.b@example.com",
            full_name="Owner Beta",
        )

        cls.store_a = Store.objects.create(
            name="Himalayan Craft Roasters",
            slug="himalayan-craft",
            is_active=True,
        )
        with TenantDatabaseContext(cls.store_a.id):
            StoreMembership.objects.create(
                store=cls.store_a,
                user=cls.owner_a,
                role="OWNER",
            )

        cls.store_b = Store.objects.create(
            name="Patan Heritage Studio",
            slug="patan-heritage",
            is_active=True,
        )
        with TenantDatabaseContext(cls.store_b.id):
            StoreMembership.objects.create(
                store=cls.store_b,
                user=cls.owner_b,
                role="OWNER",
            )

    def setUp(self):
        cache.clear()
        google_auth_mod._cached_google_request = None
        google_auth_mod._cached_google_request_pid = None

    def _sign_token(self, overrides: dict | None = None, *, use_attacker_key: bool = False) -> str:
        now = int(time.time())
        claims = {
            "iss": "https://accounts.google.com",
            "aud": TEST_GOOGLE_CLIENT_ID,
            "sub": "google-uid-123456789",
            "email": "Sita.Sharma@Example.com",
            "email_verified": True,
            "name": "Sita Sharma",
            "iat": now - 10,
            "exp": now + 600,
        }
        if overrides:
            claims.update(overrides)
        signer = self.attacker_signer if use_attacker_key else self.signer
        encoded = jwt.encode(signer, claims, key_id="google-cert-kid-1")
        return encoded.decode("utf-8") if isinstance(encoded, bytes) else str(encoded)

    def _mock_cert_session(self):
        mock_session = MagicMock()
        mock_session.request.return_value = _make_mock_http_certs_response(self.certs_doc)
        return mock_session

    def test_valid_token_verifies_cryptographically_and_caches_google_certs(self):
        mock_session = self._mock_cert_session()
        token_1 = self._sign_token({"email": "Shopper.One@Example.com", "name": "Shopper One"})
        token_2 = self._sign_token(
            {"sub": "google-uid-222", "email": "Shopper.Two@Example.com", "name": "Shopper Two"}
        )

        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            res1 = self.client.post(
                f"/api/stores/{self.store_a.slug}/account/google/",
                {
                    "credential": token_1,
                    # Spoofed client fields MUST be ignored
                    "email": "spoofed@example.com",
                    "name": "Spoofed Name",
                },
                format="json",
            )
            self.assertEqual(res1.status_code, status.HTTP_200_OK)
            self.assertEqual(res1.data["user"]["email"], "shopper.one@example.com")
            self.assertEqual(res1.data["user"]["full_name"], "Shopper One")
            self.assertEqual(res1.data["customer"]["email"], "shopper.one@example.com")
            self.assertEqual(mock_session.request.call_count, 1)

            # Second sign-in reuses cached Google certs without hitting cert URL again
            client_two = self.client_class()
            res2 = client_two.post(
                f"/api/stores/{self.store_a.slug}/account/google/",
                {"credential": token_2},
                format="json",
            )
            self.assertEqual(res2.status_code, status.HTTP_200_OK)
            self.assertEqual(res2.data["user"]["email"], "shopper.two@example.com")
            self.assertEqual(mock_session.request.call_count, 1)

    def test_wrong_audience_rejected(self):
        mock_session = self._mock_cert_session()
        bad_token = self._sign_token({"aud": "wrong-client-id.apps.googleusercontent.com"})

        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            res = self.client.post(
                f"/api/stores/{self.store_a.slug}/account/google/",
                {"credential": bad_token},
                format="json",
            )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data["error"], google_auth_mod.GENERIC_GOOGLE_AUTH_ERROR)

    def test_wrong_issuer_rejected(self):
        mock_session = self._mock_cert_session()
        bad_token = self._sign_token({"iss": "https://evil-idp.example.com"})

        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            res = self.client.post(
                f"/api/stores/{self.store_a.slug}/account/google/",
                {"credential": bad_token},
                format="json",
            )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data["error"], google_auth_mod.GENERIC_GOOGLE_AUTH_ERROR)

    def test_expired_token_rejected(self):
        mock_session = self._mock_cert_session()
        now = int(time.time())
        expired_token = self._sign_token({"iat": now - 3600, "exp": now - 600})

        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            res = self.client.post(
                f"/api/stores/{self.store_a.slug}/account/google/",
                {"credential": expired_token},
                format="json",
            )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data["error"], google_auth_mod.GENERIC_GOOGLE_AUTH_ERROR)

    def test_unverified_email_rejected_and_never_logged(self):
        mock_session = self._mock_cert_session()
        sensitive_email = "private.unverified@example.com"
        unverified_token = self._sign_token(
            {"email": sensitive_email, "email_verified": False}
        )

        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            with self.assertLogs("accounts.google_auth", level="WARNING") as captured:
                res = self.client.post(
                    f"/api/stores/{self.store_a.slug}/account/google/",
                    {"credential": unverified_token},
                    format="json",
                )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data["error"], google_auth_mod.GENERIC_GOOGLE_AUTH_ERROR)
        joined_logs = "\n".join(captured.output)
        self.assertNotIn(sensitive_email, joined_logs)
        self.assertNotIn(unverified_token[:24], joined_logs)

    def test_forged_signature_rejected_and_never_logged(self):
        mock_session = self._mock_cert_session()
        forged_token = self._sign_token(
            {"email": "attacker@example.com"},
            use_attacker_key=True,
        )

        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            with self.assertLogs("accounts.google_auth", level="WARNING") as captured:
                res = self.client.post(
                    "/api/auth/google/",
                    {"credential": forged_token},
                    format="json",
                )

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(res.data["detail"], google_auth_mod.GENERIC_GOOGLE_AUTH_ERROR)
        joined_logs = "\n".join(captured.output)
        self.assertNotIn("attacker@example.com", joined_logs)
        self.assertNotIn(forged_token[:24], joined_logs)

    def test_merchant_google_login_without_membership_grants_zero_merchant_access(self):
        mock_session = self._mock_cert_session()
        token = self._sign_token(
            {"email": "nomembership@example.com", "name": "No Store User"}
        )

        store_count_before = Store.objects.count()
        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            res = self.client.post(
                "/api/auth/google/",
                {"credential": token},
                format="json",
            )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Store.objects.count(), store_count_before)

        my_stores_res = self.client.get("/api/stores/my-stores/")
        self.assertEqual(my_stores_res.status_code, status.HTTP_200_OK)
        self.assertEqual(my_stores_res.data["stores"], [])

        overview_res = self.client.get(f"/api/merchant/stores/{self.store_a.slug}/overview/")
        self.assertIn(
            overview_res.status_code,
            (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND),
        )

    def test_customer_google_signin_grants_zero_merchant_access_and_never_links_across_stores(self):
        mock_session = self._mock_cert_session()
        shopper_email = "cross.shopper@example.com"

        # Pre-existing guest Customer rows in both Store A and Store B
        with TenantDatabaseContext(self.store_a.id):
            guest_a = Customer.objects.create(
                store=self.store_a,
                email=shopper_email,
                full_name="Guest A",
                phone="9841111111",
            )
        with TenantDatabaseContext(self.store_b.id):
            guest_b = Customer.objects.create(
                store=self.store_b,
                email=shopper_email,
                full_name="Guest B",
                phone="9842222222",
            )

        token = self._sign_token({"email": shopper_email, "name": "Cross Shopper"})
        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            res = self.client.post(
                f"/api/stores/{self.store_a.slug}/account/google/",
                {"credential": token},
                format="json",
            )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        user_id = res.data["user"]["id"]

        # Store A guest Customer is linked
        with TenantDatabaseContext(self.store_a.id):
            guest_a.refresh_from_db()
            self.assertEqual(guest_a.user_id, user_id)

        # Store B guest Customer MUST remain unlinked (user_id is None)
        with TenantDatabaseContext(self.store_b.id):
            guest_b.refresh_from_db()
            self.assertIsNone(guest_b.user_id)

        # Customer sign-in grants nothing on /merchant
        my_stores_res = self.client.get("/api/stores/my-stores/")
        self.assertEqual(my_stores_res.status_code, status.HTTP_200_OK)
        self.assertEqual(my_stores_res.data["stores"], [])
        overview_res = self.client.get(f"/api/merchant/stores/{self.store_a.slug}/overview/")
        self.assertIn(
            overview_res.status_code,
            (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND),
        )

    def test_customer_already_bound_to_other_user_is_never_overwritten(self):
        mock_session = self._mock_cert_session()
        other_user = User.objects.create_user(
            email="legacy.holder@example.com",
            full_name="Legacy Holder",
        )
        shared_email = "conflict.customer@example.com"
        with TenantDatabaseContext(self.store_a.id):
            existing_customer = Customer.objects.create(
                store=self.store_a,
                user=other_user,
                email=shared_email,
                full_name="Protected Customer Name",
                phone="9849999999",
            )

        token = self._sign_token({"email": shared_email, "name": "New Google User"})
        with patch("accounts.google_auth.get_shared_http_session", return_value=mock_session):
            res = self.client.post(
                f"/api/stores/{self.store_a.slug}/account/google/",
                {"credential": token},
                format="json",
            )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertNotEqual(res.data["user"]["id"], other_user.id)
        # Protected customer phone/name must not leak or be overwritten
        self.assertEqual(res.data["customer"]["phone"], "")

        with TenantDatabaseContext(self.store_a.id):
            existing_customer.refresh_from_db()
            self.assertEqual(existing_customer.user_id, other_user.id)
            self.assertEqual(existing_customer.full_name, "Protected Customer Name")
            self.assertEqual(existing_customer.phone, "9849999999")

    def test_google_endpoint_ip_rate_limit_enforced(self):
        for _ in range(google_auth_mod.GOOGLE_IP_LIMIT_PER_MINUTE):
            self.assertTrue(google_auth_mod.check_google_ip_rate_limit("203.0.113.77"))
        self.assertFalse(google_auth_mod.check_google_ip_rate_limit("203.0.113.77"))

        res = self.client.post(
            f"/api/stores/{self.store_a.slug}/account/google/",
            {"credential": "any-token"},
            format="json",
            REMOTE_ADDR="203.0.113.77",
        )
        self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
