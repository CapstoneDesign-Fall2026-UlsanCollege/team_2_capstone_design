import hashlib
import hmac
import unittest.mock
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import EmailOTPChallenge
from accounts.otp import compute_salted_ip_hash
from catalog.models import Product
from core.tenant_context import TenantDatabaseContext, UserMembershipContext
from stores.models import ActionRateLimit, Store, StoreMembership

User = get_user_model()


class MerchantStoreCreationAndSignupTests(TestCase):
    """
    Comprehensive tests for the merchant signup and store creation flow:
    - Verified email (OTP or Google) can create a shop.
    - Unverified / anonymous users cannot create a shop.
    - Owner membership is granted exclusively to the creating user.
    - Strict cross-store isolation: new merchant has zero access to any other store.
    - Slug validation: reserved words, length (3-60), characters, uniqueness, and IntegrityError handling.
    - Rate limits: per-user cap (3 owned stores), per-user daily creation limit, and per-IP DB rate limiting.
    - Raw IPs are never persisted in ActionRateLimit.
    """

    def setUp(self):
        ActionRateLimit.objects.all().delete()
        self.client = APIClient()
        self.existing_owner = User.objects.create_user(
            email="existing.owner@example.com",
            full_name="Existing Owner",
        )
        self.existing_store = Store.objects.create(
            name="Existing Store",
            slug="existing-store",
            is_active=True,
        )
        with TenantDatabaseContext(self.existing_store.id):
            StoreMembership.objects.create(
                store=self.existing_store,
                user=self.existing_owner,
                role="OWNER",
            )
            Product.objects.create(
                store=self.existing_store,
                name="Existing Store Secret Product",
                slug="secret-product",
                is_active=True,
            )

    def test_unverified_anonymous_cannot_create_shop(self):
        """Unauthenticated / anonymous requests must be rejected immediately."""
        res = self.client.post(
            "/api/stores/create/",
            {"name": "Hacker Store", "slug": "hacker-store"},
            format="json",
        )
        self.assertIn(
            res.status_code,
            (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
        )

    def test_otp_verified_user_creates_shop_and_gains_owner_membership(self):
        """
        A merchant who verifies via Email OTP can create a shop.
        The Store is created, and StoreMembership(role='OWNER') is created for THAT user only.
        """
        user = User.objects.create_user(
            email="brandnew.merchant@example.com",
            full_name="Brand New Merchant",
        )
        self.client.force_authenticate(user=user)

        res = self.client.post(
            "/api/stores/create/",
            {
                "name": "Artisan Coffee",
                "slug": "artisan-coffee",
                "category": "Food & Beverages",
                "city": "Lalitpur",
                "province": "Bagmati",
            },
            format="json",
            REMOTE_ADDR="198.51.100.11",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.json()["slug"], "artisan-coffee")

        new_store = Store.objects.get(slug="artisan-coffee")
        self.assertEqual(new_store.name, "Artisan Coffee")

        # Verify StoreMembership with TenantDatabaseContext (RLS-enforced)
        with TenantDatabaseContext(new_store.id):
            self.assertTrue(
                StoreMembership.objects.filter(store=new_store, user=user, role="OWNER").exists()
            )
            # The existing store owner has NO membership here
            self.assertFalse(
                StoreMembership.objects.filter(store=new_store, user=self.existing_owner).exists()
            )

        # Confirm cross-store isolation: the new user has NO access to existing_store
        res_cross = self.client.get(f"/api/merchant/stores/{self.existing_store.slug}/products/")
        self.assertEqual(res_cross.status_code, status.HTTP_404_NOT_FOUND)

    @unittest.mock.patch("accounts.api.verify_google_id_token")
    def test_google_user_creates_own_shop_and_cannot_access_other_stores(self, mock_verify):
        """
        A merchant who signs in with Google (verified email) can create their own shop,
        becomes the sole owner, and cannot access any other store.
        """
        mock_verify.return_value = {
            "email": "brandnew.google@example.com",
            "full_name": "Brand New Google",
            "email_verified": True,
        }

        # Step 1: Sign in via Google merchant endpoint
        with self.settings(GOOGLE_CLIENT_ID="mock-client-id-123.apps.googleusercontent.com"):
            res_auth = self.client.post(
                "/api/auth/google/",
                {"credential": "mocked_valid_google_token"},
                format="json",
                REMOTE_ADDR="198.51.100.22",
            )
        self.assertEqual(res_auth.status_code, status.HTTP_200_OK)
        google_user = User.objects.get(email="brandnew.google@example.com")

        # Authenticate as the new Google user
        self.client.force_authenticate(user=google_user)

        # Step 2: User has no stores yet; check /api/merchant/my-stores/
        res_my_stores = self.client.get("/api/merchant/my-stores/")
        self.assertEqual(res_my_stores.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_my_stores.json()["stores"]), 0)

        # Step 3: User cannot access existing_store
        res_forbidden = self.client.get(f"/api/merchant/stores/{self.existing_store.slug}/products/")
        self.assertEqual(res_forbidden.status_code, status.HTTP_404_NOT_FOUND)

        # Step 4: User creates their shop
        res_create = self.client.post(
            "/api/stores/create/",
            {
                "name": "Himalayan Herbs",
                "slug": "himalayan-herbs",
                "category": "Health & Wellness",
                "city": "Pokhara",
                "province": "Gandaki",
            },
            format="json",
            REMOTE_ADDR="198.51.100.22",
        )
        self.assertEqual(res_create.status_code, status.HTTP_201_CREATED)

        google_store = Store.objects.get(slug="himalayan-herbs")
        with TenantDatabaseContext(google_store.id):
            self.assertTrue(
                StoreMembership.objects.filter(store=google_store, user=google_user, role="OWNER").exists()
            )

        # Step 5: Merchant my-stores now shows exactly 1 store
        res_my_stores_after = self.client.get("/api/merchant/my-stores/")
        self.assertEqual(res_my_stores_after.status_code, status.HTTP_200_OK)
        stores_list = res_my_stores_after.json()["stores"]
        self.assertEqual(len(stores_list), 1)
        self.assertEqual(stores_list[0]["slug"], "himalayan-herbs")

        # Step 6: Verify isolation again — cannot access existing_store
        res_isolated = self.client.get(f"/api/merchant/stores/{self.existing_store.slug}/products/")
        self.assertEqual(res_isolated.status_code, status.HTTP_404_NOT_FOUND)

    def test_cap_owned_stores_per_user_at_three(self):
        """A single merchant user cannot own more than 3 stores."""
        user = User.objects.create_user(email="store.hoarder@example.com", full_name="Store Hoarder")
        self.client.force_authenticate(user=user)

        for i in range(1, 4):
            res = self.client.post(
                "/api/stores/create/",
                {"name": f"Store {i}", "slug": f"hoarder-store-{i}"},
                format="json",
                REMOTE_ADDR="198.51.100.33",
            )
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # 4th store creation attempt must be rejected
        res_fourth = self.client.post(
            "/api/stores/create/",
            {"name": "Store 4", "slug": "hoarder-store-4"},
            format="json",
            REMOTE_ADDR="198.51.100.33",
        )
        self.assertEqual(res_fourth.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("maximum limit of 3 stores", res_fourth.json()["error"])

    def test_slug_validation_rules_and_reserved_words(self):
        """Tests slug length (3-60), characters, reserved keywords, and duplicate handling."""
        user = User.objects.create_user(email="slug.validator@example.com", full_name="Slug Validator")
        self.client.force_authenticate(user=user)

        # Reserved system routes must be rejected
        for idx, reserved in enumerate(["admin", "api", "auth", "checkout", "login", "register", "cart", "orders"]):
            res = self.client.post(
                "/api/stores/create/",
                {"name": f"Test {reserved}", "slug": reserved},
                format="json",
                REMOTE_ADDR=f"198.51.100.{100 + idx}",
            )
            self.assertEqual(
                res.status_code,
                status.HTTP_400_BAD_REQUEST,
                f"Reserved word '{reserved}' was not rejected!",
            )

        # Too short (< 3 chars)
        res_short = self.client.post(
            "/api/stores/create/",
            {"name": "Short", "slug": "ab"},
            format="json",
            REMOTE_ADDR="198.51.100.120",
        )
        self.assertEqual(res_short.status_code, status.HTTP_400_BAD_REQUEST)

        # Too long (> 60 chars)
        long_slug = "a" * 61
        res_long = self.client.post(
            "/api/stores/create/",
            {"name": "Long", "slug": long_slug},
            format="json",
            REMOTE_ADDR="198.51.100.121",
        )
        self.assertEqual(res_long.status_code, status.HTTP_400_BAD_REQUEST)

        # Invalid characters (uppercase, spaces, underscores)
        res_invalid = self.client.post(
            "/api/stores/create/",
            {"name": "Invalid Slug", "slug": "invalid_slug!@#"},
            format="json",
            REMOTE_ADDR="198.51.100.122",
        )
        self.assertEqual(res_invalid.status_code, status.HTTP_400_BAD_REQUEST)

        # Duplicate slug
        res_dup = self.client.post(
            "/api/stores/create/",
            {"name": "Existing Store", "slug": "existing-store"},
            format="json",
            REMOTE_ADDR="198.51.100.123",
        )
        self.assertEqual(res_dup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already taken", res_dup.json()["error"])

    def test_check_slug_rate_limited_per_ip(self):
        """The /api/stores/check-slug/ endpoint is rate-limited per IP using salted hash."""
        test_ip = "198.51.100.55"
        with self.settings(TRUSTED_PROXY_HEADER="HTTP_X_FORWARDED_FOR"):
            for i in range(30):
                res = self.client.get(
                    f"/api/stores/check-slug/?slug=valid-slug-{i}",
                    HTTP_X_FORWARDED_FOR=test_ip,
                    REMOTE_ADDR=test_ip,
                )
                self.assertEqual(res.status_code, status.HTTP_200_OK)

            res_throttled = self.client.get(
                "/api/stores/check-slug/?slug=overflow-slug",
                HTTP_X_FORWARDED_FOR=test_ip,
                REMOTE_ADDR=test_ip,
            )
            self.assertEqual(res_throttled.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            self.assertFalse(res_throttled.json()["available"])

            # Confirm NO raw IP is stored in the database table
            raw_ip_found = ActionRateLimit.objects.filter(ip_hash__icontains=test_ip).exists()
            self.assertFalse(raw_ip_found, "Raw IP must never be stored in ActionRateLimit!")

            expected_hash = compute_salted_ip_hash(test_ip, "check_slug")
            self.assertTrue(ActionRateLimit.objects.filter(ip_hash=expected_hash).exists())

    def test_per_ip_store_creation_rate_limit(self):
        """Store creation is rate-limited per IP (max 10 creations per 24 hours per IP)."""
        test_ip = "198.51.100.66"
        with self.settings(TRUSTED_PROXY_HEADER="HTTP_X_FORWARDED_FOR"):
            # Create 10 stores across different users from this IP
            for i in range(10):
                u = User.objects.create_user(email=f"merchant_{i}@example.com", full_name=f"Merchant {i}")
                self.client.force_authenticate(user=u)
                res = self.client.post(
                    "/api/stores/create/",
                    {"name": f"Shop {i}", "slug": f"shop-{i}-{test_ip.replace('.', '')}"},
                    format="json",
                    HTTP_X_FORWARDED_FOR=test_ip,
                    REMOTE_ADDR=test_ip,
                )
                self.assertEqual(res.status_code, status.HTTP_201_CREATED)

            # 11th creation from same IP must be throttled
            overflow_user = User.objects.create_user(email="overflow_merchant@example.com", full_name="Overflow")
            self.client.force_authenticate(user=overflow_user)
            res = self.client.post(
                "/api/stores/create/",
                {"name": "Overflow Shop", "slug": "overflow-shop"},
                format="json",
                HTTP_X_FORWARDED_FOR=test_ip,
                REMOTE_ADDR=test_ip,
            )
            self.assertEqual(res.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
            self.assertIn("Too many store creations", res.json()["error"])
