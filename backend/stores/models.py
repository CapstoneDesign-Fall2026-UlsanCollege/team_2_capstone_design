import re
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models, transaction

RESERVED_STORE_SLUGS = frozenset({
    "admin", "api", "merchant", "s", "login", "signup", "account",
    "static", "media", "health", "new", "settings", "checkout"
})

SLUG_REGEX = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


def validate_store_slug(value: str):
    slug = value.lower().strip()
    if slug in RESERVED_STORE_SLUGS:
        raise ValidationError(f"'{slug}' is a reserved system route.")
    if not SLUG_REGEX.match(slug):
        raise ValidationError("Store slug must use lowercase letters, numbers, and single hyphens.")


class StoreScopedQuerySet(models.QuerySet):
    def for_store(self, store):
        if store is None:
            raise ValueError("store parameter is required for StoreScopedQuerySet.for_store")
        return self.filter(store=store)


StoreScopedManager = models.Manager.from_queryset(StoreScopedQuerySet)


class Store(models.Model):
    THEME_PRESET_CHOICES = [
        ("editorial-warm", "Editorial Warm"),
        ("pahadi-sage", "Pahadi Sage"),
        ("ktm-bold", "KTM Bold"),
    ]
    KHALTI_MODE_CHOICES = [
        ("TEST", "Test"),
        ("LIVE", "Live"),
    ]

    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=64, unique=True, validators=[validate_store_slug])
    tagline = models.CharField(max_length=200, blank=True, default="")
    currency = models.CharField(max_length=3, default="NPR")
    theme_preset = models.CharField(max_length=32, choices=THEME_PRESET_CHOICES, default="editorial-warm")
    logo_url = models.URLField(blank=True, default="")
    accent_color = models.CharField(max_length=7, blank=True, default="")
    contact_phone = models.CharField(max_length=16, blank=True, default="")
    inside_valley_shipping_minor = models.PositiveIntegerField(default=10000)
    outside_valley_shipping_minor = models.PositiveIntegerField(default=20000)
    free_shipping_threshold_minor = models.PositiveIntegerField(null=True, blank=True)
    khalti_mode = models.CharField(max_length=8, choices=KHALTI_MODE_CHOICES, default="TEST")
    khalti_secret_key_encrypted = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def set_khalti_secret_key(self, raw_key: str):
        if not raw_key:
            self.khalti_secret_key_encrypted = ""
            return
        from cryptography.fernet import Fernet
        f = Fernet(settings.FIELD_ENCRYPTION_KEY)
        self.khalti_secret_key_encrypted = f.encrypt(raw_key.encode("utf-8")).decode("utf-8")

    def get_khalti_secret_key(self) -> str:
        if not self.khalti_secret_key_encrypted:
            return ""
        from cryptography.fernet import Fernet
        f = Fernet(settings.FIELD_ENCRYPTION_KEY)
        return f.decrypt(self.khalti_secret_key_encrypted.encode("utf-8")).decode("utf-8")

    def __str__(self):
        return f"{self.name} ({self.slug})"


class StoreMembership(models.Model):
    ROLE_CHOICES = [
        ("OWNER", "Owner"),
        ("STAFF", "Staff"),
    ]

    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="store_memberships")
    role = models.CharField(max_length=16, choices=ROLE_CHOICES, default="OWNER")
    created_at = models.DateTimeField(auto_now_add=True)

    objects = StoreScopedManager()

    class Meta:
        unique_together = [("store", "user")]

    def __str__(self):
        return f"{self.user} in {self.store.slug} ({self.role})"


class Customer(models.Model):
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name="customers")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="store_customer_profiles"
    )
    email = models.EmailField()
    full_name = models.CharField(max_length=150, blank=True, default="")
    phone = models.CharField(max_length=16, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StoreScopedManager()

    class Meta:
        unique_together = [("store", "email")]

    def __str__(self):
        return f"{self.email} ({self.store.slug})"


def provision_store_customer(store: Store, user) -> Customer:
    email = user.email.strip().lower()
    with transaction.atomic():
        customer, created = Customer.objects.for_store(store).get_or_create(
            store=store,
            email=email,
            defaults={
                "user": user,
                "full_name": getattr(user, "full_name", ""),
                "phone": getattr(user, "phone", ""),
            }
        )
        if not created and customer.user is None:
            customer.user = user
            customer.save(update_fields=["user"])
        return customer
