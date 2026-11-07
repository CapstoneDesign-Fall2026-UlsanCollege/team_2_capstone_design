from datetime import timedelta
from email.utils import formataddr
import json
import re
from unittest import mock

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core import mail
from django.db import transaction
from django.test import Client, TestCase, override_settings
from django.utils import timezone

from accounts.models import EmailOTPChallenge
from accounts.otp import check_otp_hash, compute_otp_hash
from core.email_transport import RESEND_API_URL, schedule_otp_email
from core.tenant_context import TenantDatabaseContext
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class StorefrontOTPHMacAndRateLimitTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user(email="owner@testbrand.np", full_name="Brand Owner")
        cls.store = Store.objects.create(
            name="Himalayan Artisans",
            slug="himalayan-artisans",
            is_active=True,
            support_email="help@himalayanartisans.com",
            contact_email="help@himalayanartisans.com",
        )
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")

        cls.store_b = Store.objects.create(
            name="Pokhara Gear",
            slug="pokhara-gear",
            is_active=True,
            support_email="",
            contact_email="",
        )

    def setUp(self):
        self.client = Client()
        mail.outbox.clear()

    def test_hmac_hashing_and_legacy_fallback(self):
        """Tests domain-separated HMAC-SHA256 digest and backward-compatible legacy hash fallback."""
        email = "shopper@nepal.np"
        code = "123456"

        digest = compute_otp_hash(email, code)
        self.assertTrue(digest.startswith("hmac-sha256$"))

        self.assertTrue(check_otp_hash(email, code, digest))
        self.assertFalse(check_otp_hash(email, "654321", digest))
        self.assertTrue(check_otp_hash("SHOPPER@nepal.np", code, digest))

        legacy_hash = make_password(code)
        self.assertTrue(check_otp_hash(email, code, legacy_hash))
        self.assertFalse(check_otp_hash(email, "999999", legacy_hash))

    @override_settings(DEFAULT_FROM_EMAIL="auth@send.shopcraft.np")
    def test_otp_request_store_branded_email_and_optional_reply_to(self):
        """OTP email must use formataddr((store.name, DEFAULT_FROM_EMAIL)) and conditional reply_to."""
        mail.outbox.clear()
        email = "shopper.one@nepal.np"

        with self.captureOnCommitCallbacks(execute=True):
            resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["ok"])
        self.assertEqual(resp.json()["resend_in_seconds"], 60)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.subject, f"Your {self.store.name} sign-in code")
        self.assertEqual(sent.from_email, formataddr((self.store.name, "auth@send.shopcraft.np")))
        self.assertIn(self.store.name, sent.body)
        self.assertIn("expires in 10 minutes", sent.body)
        self.assertEqual(sent.reply_to, [self.store.support_email])
        self.assertNotIn("BrewMellow", sent.body)
        self.assertNotIn("ShopCraft", sent.body)

        # Store without support_email omits reply_to completely
        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            resp_b = self.client.post(
                f"/api/stores/{self.store_b.slug}/account/otp/request/",
                data=json.dumps({"email": "shopper.two@nepal.np"}),
                content_type="application/json",
            )
        self.assertEqual(resp_b.status_code, 200)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].reply_to, [])

    @override_settings(
        DEBUG=False,
        EMAIL_TRANSPORT="resend_api",
        RESEND_API_KEY="re_live_mock_token",
        DEFAULT_FROM_EMAIL="auth@send.shopcraft.np",
        EMAIL_SEND_ASYNC=False,
    )
    def test_resend_api_payload_headers_timeout_and_zero_otp_leak(self):
        """Verifies Resend API POST format, <=5s timeout, no OTP in response/logs when DEBUG=False."""
        email = "resend.buyer@nepal.np"
        with mock.patch("core.email_transport.get_shared_http_session") as mock_session_fn:
            mock_session_fn.return_value.post.return_value = mock.MagicMock(status_code=200)
            with self.captureOnCommitCallbacks(execute=True):
                resp = self.client.post(
                    f"/api/stores/{self.store.slug}/account/otp/request/",
                    data=json.dumps({"email": email}),
                    content_type="application/json",
                )

            self.assertEqual(resp.status_code, 200)
            resp_data = resp.json()
            self.assertNotIn("dev_otp_hint", resp_data)
            self.assertIsNone(re.search(r"\b\d{6}\b", json.dumps(resp_data)))

            mock_session_fn.return_value.post.assert_called_once()
            args, kwargs = mock_session_fn.return_value.post.call_args
            self.assertEqual(args[0], RESEND_API_URL)
            self.assertLessEqual(kwargs["timeout"], 5.0)
            self.assertEqual(kwargs["headers"]["Authorization"], "Bearer re_live_mock_token")
            payload = kwargs["json"]
            self.assertEqual(payload["from"], formataddr((self.store.name, "auth@send.shopcraft.np")))
            self.assertEqual(payload["to"], [email])
            self.assertEqual(payload["reply_to"], [self.store.support_email])
            self.assertIn("expires in 10 minutes", payload["text"])
            self.assertIn("expires in 10 minutes", payload["html"])

    @override_settings(DEBUG=False, EMAIL_SEND_ASYNC=True)
    def test_async_on_commit_commits_otp_before_executor_submit_and_skips_on_rollback(self):
        """Verifies async path registers via transaction.on_commit -> ThreadPoolExecutor only after commit."""
        email = "async.commit@nepal.np"
        with mock.patch("core.email_transport.get_email_executor") as mock_exec_fn:
            # 1. Before commit: executor must NOT be called inside uncommitted block
            with self.captureOnCommitCallbacks(execute=False) as callbacks:
                resp = self.client.post(
                    f"/api/stores/{self.store.slug}/account/otp/request/",
                    data=json.dumps({"email": email}),
                    content_type="application/json",
                )
                self.assertEqual(resp.status_code, 200)
                self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 1)
                mock_exec_fn.return_value.submit.assert_not_called()

            self.assertEqual(len(callbacks), 1)
            callbacks[0]()
            mock_exec_fn.return_value.submit.assert_called_once()

            # 2. Rolled-back transaction must NEVER submit an email send
            mock_exec_fn.return_value.submit.reset_mock()
            with self.captureOnCommitCallbacks(execute=True):
                try:
                    with transaction.atomic():
                        EmailOTPChallenge.issue_for_email("rollback@nepal.np")
                        schedule_otp_email(
                            to_email="rollback@nepal.np",
                            raw_code="999999",
                            brand_name=self.store.name,
                            store_id=self.store.id,
                        )
                        raise RuntimeError("Simulated DB failure")
                except RuntimeError:
                    pass
            mock_exec_fn.return_value.submit.assert_not_called()

    @override_settings(DEBUG=False)
    @mock.patch("django.core.mail.EmailMultiAlternatives.send")
    def test_otp_request_email_send_failure_returns_generic_response_and_masks_logs(self, mock_send):
        """When mail backend raises an error, response remains generic 200 and logs mask email/code."""
        target_email = "fail.mail@nepal.np"
        mock_send.side_effect = TimeoutError(f"SMTP timed out delivering to {target_email}")
        with self.assertLogs("core.email_transport", level="ERROR") as captured:
            with self.captureOnCommitCallbacks(execute=True):
                resp = self.client.post(
                    f"/api/stores/{self.store.slug}/account/otp/request/",
                    data=json.dumps({"email": target_email}),
                    content_type="application/json",
                )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["detail"], "If this email is valid, a verification code has been sent.")
        self.assertEqual(data["resend_in_seconds"], 60)
        self.assertNotIn("SMTP", json.dumps(data))
        self.assertNotIn("dev_otp_hint", data)

        log_text = "\n".join(captured.output)
        self.assertIn("TimeoutError", log_text)
        self.assertIn(f"store_id={self.store.id}", log_text)
        self.assertNotIn(target_email, log_text)
        self.assertIsNone(re.search(r"\b\d{6}\b", log_text))

    def test_otp_rate_limiting_cooldown_and_email_limit(self):
        """Enforces 60s cooldown on immediate resend and max 3 requests per email per 15 minutes."""
        email = "fast.clicker@nepal.np"

        r1 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r1.status_code, 200)

        r2 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r2.status_code, 429)
        self.assertIn("resend_in_seconds", r2.json())

        EmailOTPChallenge.objects.filter(email=email).update(
            created_at=timezone.now() - timedelta(seconds=65)
        )

        r3 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r3.status_code, 200)

        latest = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        EmailOTPChallenge.objects.filter(id=latest.id).update(
            created_at=timezone.now() - timedelta(seconds=65)
        )

        r4 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r4.status_code, 200)

        latest = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        EmailOTPChallenge.objects.filter(id=latest.id).update(
            created_at=timezone.now() - timedelta(seconds=65)
        )

        r5 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r5.status_code, 429)
        self.assertIn("Too many sign-in attempts", r5.json()["error"])

    def test_otp_rate_limiting_ip_limit(self):
        """Max 10 requests per IP per hour (honoring rightmost X-Forwarded-For on Heroku)."""
        ip = "198.51.100.88"
        now = timezone.now()

        for i in range(10):
            EmailOTPChallenge.objects.create(
                email=f"dummy_{i}@nepal.np",
                code_hash="dummy",
                ip_address=ip,
                expires_at=now + timedelta(minutes=10),
                created_at=now - timedelta(minutes=5),
            )

        with override_settings(TRUSTED_PROXY_HEADER="HTTP_X_FORWARDED_FOR"):
            resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": "another.user@nepal.np"}),
                content_type="application/json",
                HTTP_X_FORWARDED_FOR=f"1.2.3.4, {ip}",
            )
        self.assertEqual(resp.status_code, 429)
        self.assertIn("Too many sign-in attempts from this network", resp.json()["error"])

    def test_otp_verification_success_links_customer_and_logs_in(self):
        """Valid OTP creates User, logs in session, and links Customer for this store only."""
        email = "shopper.login@nepal.np"

        with self.captureOnCommitCallbacks(execute=True):
            req_resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
        self.assertEqual(req_resp.status_code, 200)
        match = re.search(r"\b(\d{6})\b", mail.outbox[-1].body)
        self.assertIsNotNone(match)
        code = match.group(1)

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

        me_resp = self.client.get("/api/auth/me/")
        self.assertEqual(me_resp.status_code, 200)
        self.assertTrue(me_resp.json()["authenticated"])
        self.assertEqual(me_resp.json()["user"]["email"], email)

        with TenantDatabaseContext(self.store.id):
            customer_a = Customer.objects.filter(store=self.store, email=email).first()
            self.assertIsNotNone(customer_a)
            self.assertEqual(customer_a.user.email, email)

        with TenantDatabaseContext(self.store_b.id):
            customer_b = Customer.objects.filter(store=self.store_b, email=email).first()
            self.assertIsNone(customer_b)

        merchant_resp = self.client.get(f"/api/merchant/stores/{self.store.slug}/overview/")
        self.assertIn(merchant_resp.status_code, [403, 404])

    def test_otp_replay_expired_and_max_attempts(self):
        """OTP cannot be replayed, used after expiry, or used after 5 wrong attempts."""
        email = "retry.user@nepal.np"

        challenge, raw_code = EmailOTPChallenge.issue_for_email(email)

        for _ in range(5):
            self.assertFalse(EmailOTPChallenge.verify_code(email, "000000"))

        challenge.refresh_from_db()
        self.assertEqual(challenge.attempt_count, 5)
        self.assertFalse(EmailOTPChallenge.verify_code(email, raw_code))

        challenge2, raw_code2 = EmailOTPChallenge.issue_for_email("expired@nepal.np")
        challenge2.expires_at = timezone.now() - timedelta(seconds=1)
        challenge2.save(update_fields=["expires_at"])
        self.assertFalse(EmailOTPChallenge.verify_code("expired@nepal.np", raw_code2))

        _, raw_code3 = EmailOTPChallenge.issue_for_email("replay@nepal.np")
        self.assertTrue(EmailOTPChallenge.verify_code("replay@nepal.np", raw_code3))
        self.assertFalse(EmailOTPChallenge.verify_code("replay@nepal.np", raw_code3))

    def test_cleanup_deletes_only_rows_older_than_24h(self):
        """Opportunistic cleanup deletes rows older than 24 hours while keeping rate limit history."""
        now = timezone.now()

        old_ch = EmailOTPChallenge.objects.create(
            email="cleanup.test@nepal.np",
            code_hash="old",
            expires_at=now - timedelta(hours=25),
        )
        EmailOTPChallenge.objects.filter(id=old_ch.id).update(created_at=now - timedelta(hours=25))

        recent_ch = EmailOTPChallenge.objects.create(
            email="cleanup.test@nepal.np",
            code_hash="recent",
            expires_at=now - timedelta(hours=2),
        )
        EmailOTPChallenge.objects.filter(id=recent_ch.id).update(created_at=now - timedelta(hours=2))

        EmailOTPChallenge.issue_for_email("new.issue@nepal.np")

        self.assertFalse(EmailOTPChallenge.objects.filter(id=old_ch.id).exists())
        self.assertTrue(EmailOTPChallenge.objects.filter(id=recent_ch.id).exists())

    def test_storefront_otp_verify_six_attempts_persist_and_lockout(self):
        """Failed OTP verify attempts persist attempt_count and lock out on the 6th attempt."""
        email = "lockout.test@nepal.np"

        mail.outbox.clear()
        with self.captureOnCommitCallbacks(execute=True):
            req_resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/request/",
                data=json.dumps({"email": email}),
                content_type="application/json",
            )
        self.assertEqual(req_resp.status_code, 200)

        match = re.search(r"\b(\d{6})\b", mail.outbox[-1].body)
        self.assertIsNotNone(match)
        valid_code = match.group(1)

        challenge = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        self.assertIsNotNone(challenge)
        self.assertEqual(challenge.attempt_count, 0)

        for attempt_num in range(1, 6):
            wrong_code = f"{attempt_num:06d}"
            if wrong_code == valid_code:
                wrong_code = "999998"
            verify_resp = self.client.post(
                f"/api/stores/{self.store.slug}/account/otp/verify/",
                data=json.dumps({"email": email, "code": wrong_code}),
                content_type="application/json",
            )
            self.assertEqual(verify_resp.status_code, 400)
            self.assertIn("error", verify_resp.json())

            challenge.refresh_from_db()
            self.assertEqual(challenge.attempt_count, attempt_num)

        lockout_resp = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/verify/",
            data=json.dumps({"email": email, "code": valid_code}),
            content_type="application/json",
        )
        self.assertEqual(lockout_resp.status_code, 400)

        me_resp = self.client.get("/api/auth/me/")
        self.assertFalse(me_resp.json()["authenticated"])

    def test_storefront_otp_request_rate_limit_counters_persist(self):
        """OTP request rate-limit counters persist across failed and rate-limited requests."""
        email = "rate.persist@nepal.np"

        r1 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r1.status_code, 200)
        self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 1)

        r2 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r2.status_code, 429)
        self.assertIn("Please wait", r2.json()["error"])

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

        ch2 = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        EmailOTPChallenge.objects.filter(id=ch2.id).update(created_at=now - timedelta(seconds=70))

        r4 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r4.status_code, 200)
        self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 3)

        ch3 = EmailOTPChallenge.objects.filter(email=email).order_by("-created_at").first()
        EmailOTPChallenge.objects.filter(id=ch3.id).update(created_at=now - timedelta(seconds=70))

        r5 = self.client.post(
            f"/api/stores/{self.store.slug}/account/otp/request/",
            data=json.dumps({"email": email}),
            content_type="application/json",
        )
        self.assertEqual(r5.status_code, 429)
        self.assertIn("Too many sign-in attempts for this email", r5.json()["error"])
        self.assertEqual(EmailOTPChallenge.objects.filter(email=email).count(), 3)
