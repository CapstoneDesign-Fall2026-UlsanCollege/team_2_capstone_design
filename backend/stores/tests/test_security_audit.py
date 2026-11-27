import re
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from core.tenant_context import TenantDatabaseContext
from stores.models import Store, StoreMembership

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
