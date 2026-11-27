import re
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from core.tenant_context import TenantDatabaseContext
from stores.api import _resolve_safe_khalti_return_url
from stores.models import Store, StoreMembership
from rest_framework.test import APIRequestFactory

User = get_user_model()


class CorsCsrfOriginAuditTests(SimpleTestCase):
    """Issue #69: never trust arbitrary *.vercel.app origins for credentialed CORS/CSRF."""

    def test_wildcard_vercel_origins_are_not_trusted(self):
        evil_origin = "https://attacker-phishing.vercel.app"
        self.assertNotIn("https://*.vercel.app", settings.CSRF_TRUSTED_ORIGINS)
        self.assertFalse(
            any(re.match(pattern, evil_origin) for pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES),
            "Arbitrary *.vercel.app origins must not match CORS_ALLOWED_ORIGIN_REGEXES",
        )
        self.assertTrue(
            any(re.match(pattern, "https://shop.shopcraft.me") for pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES),
        )


class SocialUrlAndStoreCreateValidationTests(APITestCase):
    """Issue #70: block stored javascript: URLs and validate StoreCreateView banner/theme inputs."""

    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_user("audit70-owner@example.com", full_name="Owner 70")
        cls.store = Store.objects.create(slug="audit70-shop", name="Audit 70 Shop", is_active=True)
        with TenantDatabaseContext(cls.store.id):
            StoreMembership.objects.create(store=cls.store, user=cls.owner, role="OWNER")

    def setUp(self):
        self.client.force_authenticate(user=self.owner)

    def test_settings_rejects_javascript_social_urls_and_accepts_https(self):
        bad_ig = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/settings/",
            {"instagram_url": "javascript:alert(document.cookie)"},
            format="json",
        )
        self.assertEqual(bad_ig.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("instagram_url", bad_ig.json())

        bad_fb = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/settings/",
            {"facebook_url": "data:text/html,<script>alert(1)</script>"},
            format="json",
        )
        self.assertEqual(bad_fb.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("facebook_url", bad_fb.json())

        ok = self.client.patch(
            f"/api/merchant/stores/{self.store.slug}/settings/",
            {
                "instagram_url": "https://instagram.com/himalayan.roast",
                "facebook_url": "https://facebook.com/himalayan.roast",
            },
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK)
        self.assertEqual(ok.json()["instagram_url"], "https://instagram.com/himalayan.roast")

    def test_store_create_rejects_invalid_theme_and_unsafe_banner_url(self):
        bad_theme = self.client.post(
            "/api/stores/create/",
            {"name": "Theme Check", "slug": "theme-check-70", "theme_preset": "evil-preset"},
            format="json",
        )
        self.assertEqual(bad_theme.status_code, status.HTTP_400_BAD_REQUEST)

        for bad_banner in ("javascript:alert(1)", "https://evil.com/phish.jpg", "/images/../secret.jpg"):
            res = self.client.post(
                "/api/stores/create/",
                {
                    "name": "Banner Check",
                    "slug": "banner-check-70",
                    "theme_preset": "editorial-warm",
                    "banner_url": bad_banner,
                },
                format="json",
            )
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, bad_banner)

        ok_res = self.client.post(
            "/api/stores/create/",
            {
                "name": "Valid Shop 70",
                "slug": "valid-shop-70",
                "theme_preset": "pahadi-sage",
                "banner_url": "/images/themes/sage-hero.jpg",
            },
            format="json",
        )
        self.assertEqual(ok_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ok_res.json()["banner_url"], "/images/themes/sage-hero.jpg")


class KhaltiReturnUrlAuditTests(APITestCase):
    """Issue #72: only allow allowlisted origins and exact return path in Khalti return_url."""

    @classmethod
    def setUpTestData(cls):
        cls.store = Store.objects.create(slug="khalti-url-72", name="Khalti Shop 72", is_active=True)

    def _req(self, return_url):
        req = APIRequestFactory().post("/checkout/place/", {"return_url": return_url}, format="json")
        req.data = {"return_url": return_url}
        return req

    def test_untrusted_origin_or_wrong_path_falls_back_to_canonical(self):
        canonical_suffix = f"/s/{self.store.slug}/checkout/khalti-return/"
        for evil in (
            "https://attacker.com/s/khalti-url-72/checkout/khalti-return/",
            "https://evil.vercel.app/s/khalti-url-72/checkout/khalti-return/",
            "https://shop.shopcraft.me/steal-token",
            "https://shop.shopcraft.me/s/khalti-url-72/checkout/khalti-return/?evil=1",
            "javascript:alert(1)",
        ):
            resolved = _resolve_safe_khalti_return_url(self._req(evil), self.store)
            self.assertTrue(resolved.endswith(canonical_suffix), evil)
            self.assertNotIn("attacker.com", resolved)
            self.assertNotIn("evil.vercel.app", resolved)
            self.assertNotIn("evil=1", resolved)

    def test_allowlisted_frontend_origin_with_exact_path_is_preserved(self):
        good = "https://shop.shopcraft.me/s/khalti-url-72/checkout/khalti-return/"
        self.assertEqual(_resolve_safe_khalti_return_url(self._req(good), self.store), good)
