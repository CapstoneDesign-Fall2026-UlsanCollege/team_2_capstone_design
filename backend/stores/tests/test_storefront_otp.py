import json
from datetime import timedelta
from unittest import mock
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core import mail
from django.test import Client, TestCase
from django.utils import timezone

from accounts.models import EmailOTPChallenge
from accounts.otp import check_otp_hash, compute_otp_hash
from core.tenant_context import TenantDatabaseContext
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class StorefrontOTPHMacAndRateLimitTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(email="owner@testbrand.np", full_name="Brand Owner")
        self.store = Store.objects.create(
            name="Himalayan Artisans",
            slug="himalayan-artisans",
            is_active=True,
            contact_email="help@himalayanartisans.com",
        )
        StoreMembership.objects.create(store=self.store, user=self.owner, role="OWNER")

        # Second distinct store for multi-tenant isolation testing
        self.store_b = Store.objects.create(
            name="Pokhara Gear",
            slug="pokhara-gear",
            is_active=True,
            contact_email="support@pokharagear.np",
        )

        self.client = Client()

    def test_hmac_hashing_and_legacy_fallback(self):
        """Tests domain-separated HMAC-SHA256 digest and backward-compatible legacy hash fallback."""
        email = "shopper@nepal.np"
        code = "123456"

        # 1. Compute HMAC hash
        digest = compute_otp_hash(email, code)
        self.assertTrue(digest.startswith("hmac-sha256$"))

        # Verify correct match
        self.assertTrue(check_otp_hash(email, code, digest))
        # Wrong code
        self.assertFalse(check_otp_hash(email, "654321", digest))
        # Case insensitivity of email in HMAC
        self.assertTrue(check_otp_hash("SHOPPER@nepal.np", code, digest))

        # 2. Legacy fallback (e.g. PBKDF2 from make_password)
        legacy_hash = make_password(code)
        self.assertTrue(check_otp_hash(email, code, legacy_hash))
        self.assertFalse(check_otp_hash(email, "999999", legacy_hash))

    def test_otp_request_store_branded_email(self):
        """OTP email must use Store.name dynamically and set reply-to without hardcoding brands."""
        mail.outbox.clear()
        email = "shopper.one@nepal.np"

        with TenantDatabaseContext(self.store.id):
            resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
            self.assertEqual(resp.status_code, 200)
            self.assertTrue(resp.json()["ok"])
            self.assertEqual(resp.json()["resend_in_seconds"], 60)

        # Check outbox
        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.subject, f"Your {self.store.name} sign-in code")
        self.assertIn(self.store.name, sent.body)
        self.assertIn(self.store.name, sent.from_email)
        self.assertEqual(sent.reply_to, [self.store.contact_email])
        self.assertNotIn("BrewMellow", sent.body)
        self.assertNotIn("ShopCraft", sent.body)

    @mock.patch("django.core.mail.EmailMessage.send")
    def test_otp_request_email_send_failure_returns_generic_response(self, mock_send):
        """When SMTP/mail backend raises an error, response must remain generic 200 without exposing error or code."""
        mock_send.side_effect = Exception("SMTP connection timed out")
        with TenantDatabaseContext(self.store.id):
            resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": "fail.mail@nepal.np"}),
                content_type="application/json",
            )
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertTrue(data["ok"])
            self.assertEqual(data["detail"], "If this email is valid, a verification code has been sent.")
            self.assertEqual(data["resend_in_seconds"], 60)
            self.assertNotIn("SMTP", json.dumps(data))

    def test_otp_rate_limiting_cooldown_and_email_limit(self):
        """
        Enforces:
        - 60s cooldown on immediate resend
        - Max 3 requests per email per 15 minutes
        """
        email = "fast.clicker@nepal.np"

        with TenantDatabaseContext(self.store.id):
            # First request -> OK
            r1 = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
            self.assertEqual(r1.status_code, 200)

            # Immediate second request -> 429 Cooldown
            r2 = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
            self.assertEqual(r2.status_code, 429)
            self.assertIn("resend_in_seconds", r2.json())

            # Simulate passing 65 seconds
            EmailOTPChallenge.objects.filter(email=email).update(
                created_at=timezone.now() - timedelta(seconds=65)
            )

            # Second send (outside 60s cooldown) -> OK (2nd send in 15min)
            r3 = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
            self.assertEqual(r3.status_code, 200)

            # Advance 65 seconds again
            latest = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
            EmailOTPChallenge.objects.filter(id=latest.id).update(
                created_at=timezone.now() - timedelta(seconds=65)
            )

            # Third send -> OK (3rd send in 15min)
            r4 = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
            self.assertEqual(r4.status_code, 200)

            # Advance 65 seconds again
            latest = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
            EmailOTPChallenge.objects.filter(id=latest.id).update(
                created_at=timezone.now() - timedelta(seconds=65)
            )

            # Fourth send in 15 minutes -> 429 Too Many Requests (Email Limit reached!)
            r5 = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
            self.assertEqual(r5.status_code, 429)
            self.assertIn("Too many sign-in attempts", r5.json()["error"])

    def test_otp_rate_limiting_ip_limit(self):
        """Max 10 requests per IP per hour."""
        ip = "192.168.1.100"
        now = timezone.now()

        # Seed 10 challenges from this IP within the last hour
        for i in range(10):
            EmailOTPChallenge.objects.create(
                email=f"dummy_{i}@nepal.np",
                code_hash="dummy",
                ip_address=ip,
                expires_at=now + timedelta(minutes=10),
                created_at=now - timedelta(minutes=5),
            )

        with TenantDatabaseContext(self.store.id):
            resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": "another.user@nepal.np"}),
                content_type="application/json",
                REMOTE_ADDR=ip,
            )
            self.assertEqual(resp.status_code, 429)
            self.assertIn("Too many sign-in attempts from this network", resp.json()["error"])

    def test_otp_verification_success_links_customer_and_logs_in(self):
        """Valid OTP creates User, logs in session, and links Customer for this store only."""
        email = "shopper.login@nepal.np"

        with TenantDatabaseContext(self.store.id):
            # 1. Request code
            req_resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
            self.assertEqual(req_resp.status_code, 200)
            import re
            match = re.search(r"\b(\d{6})\b", mail.outbox[-1].body)
            self.assertIsNotNone(match)
            code = match.group(1)

            # 2. Verify code
            verify_resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/verify/",
                data=json.dumps({"email": email, "code": code}),
                content_type="application/json",
            )
            self.assertEqual(verify_resp.status_code, 200)
            data = verify_resp.json()
            self.assertTrue(data["ok"])
            self.assertEqual(data["user"]["email"], email)
            self.assertEqual(data["customer"]["email"], email)

            # Verify session is logged in
            me_resp = self.client.get("/api/auth/me/")
            self.assertEqual(me_resp.status_code, 200)
            self.assertTrue(me_resp.json()["authenticated"])
            self.assertEqual(me_resp.json()["user"]["email"], email)

            # Verify Customer is created and linked for Store A
            customer_a = Customer.objects.filter(store=self.store, email=email).first()
            self.assertIsNotNone(customer_a)
            self.assertEqual(customer_a.user.email, email)

            # 3. MULTI-TENANT ISOLATION CHECK:
            # Customer must NOT exist in Store B!
            customer_b = Customer.objects.filter(store=self.store_b, email=email).first()
            self.assertIsNone(customer_b)

            # 4. STOREFRONT CUSTOMER MUST NOT HAVE MERCHANT ACCESS:
            merchant_resp = self.client.get(f"/api/merchant/stores/{self.store.slug}/overview/")
            self.assertIn(merchant_resp.status_code, [403, 404])

    def test_otp_replay_expired_and_max_attempts(self):
        """OTP cannot be replayed, used after expiry, or used after 5 wrong attempts."""
        email = "retry.user@nepal.np"

        # 1. Issue code
        challenge, raw_code = EmailOTPChallenge.issue_for_email(email)

        # 2. 5 wrong attempts
        for _ in range(5):
            self.assertFalse(EmailOTPChallenge.verify_code(email, "000000"))

        # Challenge now locked out
        challenge.refresh_from_db()
        self.assertEqual(challenge.attempt_count, 5)

        # Even with correct code, must fail
        self.assertFalse(EmailOTPChallenge.verify_code(email, raw_code))

        # 3. Expired code test
        challenge2, raw_code2 = EmailOTPChallenge.issue_for_email("expired@nepal.np")
        challenge2.expires_at = timezone.now() - timedelta(seconds=1)
        challenge2.save(update_fields=["expires_at"])
        self.assertFalse(EmailOTPChallenge.verify_code("expired@nepal.np", raw_code2))

        # 4. Replay test
        challenge3, raw_code3 = EmailOTPChallenge.issue_for_email("replay@nepal.np")
        self.assertTrue(EmailOTPChallenge.verify_code("replay@nepal.np", raw_code3))
        # Immediate second verification attempt must fail (single-use)
        self.assertFalse(EmailOTPChallenge.verify_code("replay@nepal.np", raw_code3))

    def test_cleanup_deletes_only_rows_older_than_24h(self):
        """Opportunistic cleanup deletes rows older than 24 hours while keeping rate limit history."""
        now = timezone.now()

        # Old challenge from 25 hours ago
        old_ch = EmailOTPChallenge.objects.create(
            email="cleanup.test@nepal.np",
            code_hash="old",
            expires_at=now - timedelta(hours=25),
        )
        EmailOTPChallenge.objects.filter(id=old_ch.id).update(created_at=now - timedelta(hours=25))

        # Recent challenge from 2 hours ago (within 24h)
        recent_ch = EmailOTPChallenge.objects.create(
            email="cleanup.test@nepal.np",
            code_hash="recent",
            expires_at=now - timedelta(hours=2),
        )
        EmailOTPChallenge.objects.filter(id=recent_ch.id).update(created_at=now - timedelta(hours=2))

        # Issuing new challenge triggers cleanup
        EmailOTPChallenge.issue_for_email("new.issue@nepal.np")

        # Assert old challenge was deleted
        self.assertFalse(EmailOTPChallenge.objects.filter(id=old_ch.id).exists())
        # Assert recent challenge was kept
        self.assertTrue(EmailOTPChallenge.objects.filter(id=recent_ch.id).exists())

    def test_storefront_otp_verify_six_attempts_persist_and_lockout(self):
        """
        Verifies that failed OTP verify attempts (HTTP 400 responses) persist their attempt_count
        in the database across requests without being rolled back by StoreTenantMixin,
        and the 6th attempt is strictly locked out even when providing the correct code.
        """
        email = "lockout.test@nepal.np"

        # 1. Request OTP code
        mail.outbox.clear()
        req_resp = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(req_resp.status_code, 200)

        import re
        match = re.search(r"\b(\d{6})\b", mail.outbox[-1].body)
        self.assertIsNotNone(match)
        valid_code = match.group(1)

        challenge = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge.attempt_count, 0)

        # 2. Send 5 sequential wrong codes to the storefront OTP verify endpoint
        for attempt_num in range(1, 6):
            wrong_code = f"{attempt_num:06d}"
            verify_resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/verify/",
                data=json.dumps({"email": email, "code": wrong_code}),
                content_type="application/json",
            )
            self.assertEqual(verify_resp.status_code, 400)
            self.assertIn("error", verify_resp.json())

            # Verify that StoreTenantMixin did NOT roll back the attempt_count increment
            challenge.refresh_from_db()
            self.assertEqual(challenge.attempt_count, attempt_num)

        # 3. 6th attempt: send the REAL valid code.
        # Because attempt_count is 5 (>= 5), challenge is locked out and must be rejected!
        lockout_resp = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/verify/",
            data=json.dumps({"email": email, "code": valid_code}),
            content_type="application/json",
        )
        self.assertEqual(lockout_resp.status_code, 400)

        # Confirm user is NOT authenticated
        me_resp = self.client.get("/api/auth/me/")
        self.assertFalse(me_resp.json()["authenticated"])

    def test_storefront_otp_request_rate_limit_counters_persist(self):
        """
        Verifies that OTP request rate-limit counters persist across failed and rate-limited
        requests under StoreTenantMixin without rollback.
        """
        email = "rate.persist@nepal.np"

        # 1. First request succeeds
        r1 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 1)

        # 2. Immediate second request triggers 60s cooldown (429)
        r2 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r2.status_code, 429)
        self.assertIn("Please wait", r2.json()["error"])

        # 3. Age challenge 1 past 60s cooldown and issue second challenge
        now = timezone.now()
        ch1 = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        EmailOTPChallenge.objects.filter(id=ch1.id).update(created_at=now - timedelta(seconds=70))

        r3 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r3.status_code, 200)
        self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 2)

        # 4. Age challenge 2 past 60s cooldown and issue third challenge
        ch2 = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        EmailOTPChallenge.objects.filter(id=ch2.id).update(created_at=now - timedelta(seconds=70))

        r4 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r4.status_code, 200)
        self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 3)

        # 5. Age challenge 3 past 60s cooldown, but 4th request must hit 15-minute EMAIL_LIMIT (3 max)
        ch3 = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        EmailOTPChallenge.objects.filter(id=ch3.id).update(created_at=now - timedelta(seconds=70))

        r5 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r5.status_code, 429)
        self.assertIn("Too many sign-in attempts for this email", r5.json()["error"])

        # Confirm all 3 challenges persisted in DB (rate limit was not rolled back)
        self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 3)
