from django.core.exceptions import ValidationError
from django.db import models
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
    allow_subscription = models.BooleanField(default=False)
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
    allow_subscription = models.BooleanField(default=False)
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


class SellingPlan(models.Model):
    INTERVAL_CHOICES = [
        ("WEEK", "Week"),
        ("MONTH", "Month"),
    ]

    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="selling_plans"
    )
    code = models.SlugField(max_length=32)
    name = models.CharField(max_length=100)
    interval_unit = models.CharField(max_length=16, choices=INTERVAL_CHOICES, default="MONTH")
    interval_count = models.PositiveSmallIntegerField(default=1)
    commitment_cycles = models.PositiveSmallIntegerField(default=1)  # 1, 3, 6, 12
    discount_pct = models.PositiveSmallIntegerField(default=0)
    is_prepaid = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StoreScopedManager()

    class Meta:
        unique_together = [("store", "code")]
        ordering = ["sort_order", "id"]

    def __str__(self):
        return f"{self.name} ({self.store.slug})"
