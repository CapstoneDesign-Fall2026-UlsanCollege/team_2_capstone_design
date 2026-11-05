from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from stores.models import StoreScopedManager


class Product(models.Model):
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="products"
    )
    slug = models.SlugField(max_length=80)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True, default="")
    image_url = models.URLField(blank=True, default="")
    attributes = models.JSONField(default=dict, blank=True)
    allow_one_time = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StoreScopedManager()

    class Meta:
        unique_together = [("store", "slug")]
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.name} ({self.store.slug})"


class Variant(models.Model):
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="variants"
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants"
    )
    sku = models.CharField(max_length=64)
    label = models.CharField(max_length=64)  # e.g. "150g", "250g", "1kg"
    weight_grams = models.PositiveIntegerField(null=True, blank=True)
    price_minor = models.PositiveIntegerField()  # Integer paisa (Rs. 1 = 100 paisa)
    allow_one_time = models.BooleanField(default=True)
    in_stock = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StoreScopedManager()

    class Meta:
        unique_together = [("store", "sku")]
        ordering = ["sort_order", "price_minor", "id"]

    def clean(self):
        if self.product_id and self.store_id and self.product.store_id != self.store_id:
            raise ValidationError("Variant store must match Product store.")

    def save(self, *args, **kwargs):
        if self.product_id and not self.store_id:
            self.store = self.product.store
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - {self.label} ({self.sku})"


class Discount(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ("PERCENTAGE", "Percentage"),
        ("FIXED_AMOUNT", "Fixed Amount (NPR)"),
    ]

    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="discounts",
    )
    code = models.CharField(max_length=32)
    description = models.CharField(max_length=160, blank=True, default="")
    discount_type = models.CharField(
        max_length=16,
        choices=DISCOUNT_TYPE_CHOICES,
        default="PERCENTAGE",
    )
    # For PERCENTAGE: 1..90 (integer %). For FIXED_AMOUNT: integer paisa (e.g. 15000 = Rs. 150).
    value = models.PositiveIntegerField()
    min_subtotal_minor = models.PositiveIntegerField(default=0)
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    used_count = models.PositiveIntegerField(default=0)
    starts_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StoreScopedManager()

    class Meta:
        unique_together = [("store", "code")]
        ordering = ["-created_at", "-id"]

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.strip().upper()
        super().save(*args, **kwargs)

    def check_eligibility(self, subtotal_minor: int) -> tuple[bool, str]:
        now = timezone.now()
        if not self.is_active:
            return False, "This promo code is no longer active."
        if self.starts_at and now < self.starts_at:
            return False, "This promo code is not yet active."
        if self.expires_at and now > self.expires_at:
            return False, "This promo code has expired."
        if self.max_uses is not None and self.used_count >= self.max_uses:
            return False, "This promo code has reached its redemption limit."
        if self.min_subtotal_minor and subtotal_minor < self.min_subtotal_minor:
            min_rs = round(self.min_subtotal_minor / 100)
            return False, f"Minimum order subtotal of Rs. {min_rs:,} required for {self.code}."
        return True, ""

    def compute_discount_minor(self, subtotal_minor: int) -> int:
        if subtotal_minor <= 0:
            return 0
        if self.discount_type == "PERCENTAGE":
            pct = min(90, max(1, int(self.value)))
            raw = round(subtotal_minor * (pct / 100))
            # Snap to nearest 100 paisa (Rs. 1 integer) to uphold integer NPR rule
            snapped = int(round(raw / 100.0) * 100)
            return min(subtotal_minor, max(0, snapped))
        return min(subtotal_minor, max(0, int(self.value)))

    def __str__(self):
        return f"{self.code} ({self.store.slug})"
