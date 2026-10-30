from django.db import models
from stores.models import StoreScopedManager


class Subscription(models.Model):
    STATUS_CHOICES = [
        ("ACTIVE", "Active"),
        ("PAUSED", "Paused"),
        ("CANCELLED", "Cancelled"),
        ("COMPLETED", "Completed"),
    ]

    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="subscriptions"
    )
    customer = models.ForeignKey(
        "stores.Customer",
        on_delete=models.PROTECT,
        related_name="subscriptions"
    )
    variant = models.ForeignKey(
        "catalog.Variant",
        on_delete=models.PROTECT,
        related_name="subscriptions"
    )
    selling_plan = models.ForeignKey(
        "catalog.SellingPlan",
        on_delete=models.PROTECT,
        related_name="subscriptions"
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="originating_subscriptions"
    )
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="ACTIVE")
    unit_price_minor = models.PositiveIntegerField()
    next_delivery_date = models.DateField()
    cycles_total = models.PositiveSmallIntegerField(null=True, blank=True)
    cycles_remaining = models.PositiveSmallIntegerField(null=True, blank=True)
    shipping_address_snapshot = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StoreScopedManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Subscription #{self.id} - {self.customer.email} ({self.status})"
