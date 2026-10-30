from django.conf import settings
from django.db import models
from stores.models import StoreScopedManager


class Order(models.Model):
    ORDER_TYPE_CHOICES = [
        ("ONE_TIME", "One-time"),
        ("SUBSCRIPTION_CYCLE", "Subscription cycle"),
    ]

    STATUS_CHOICES = [
        ("PENDING_PAYMENT", "Pending payment"),
        ("CONFIRMED", "Confirmed"),
        ("PAID", "Paid"),
        ("PROCESSING", "Processing"),
        ("SHIPPED", "Shipped"),
        ("DELIVERED", "Delivered"),
        ("CANCELLED", "Cancelled"),
        ("PAYMENT_FAILED", "Payment failed"),
    ]

    PAYMENT_METHOD_CHOICES = [
        ("KHALTI", "Khalti"),
        ("COD", "Cash on Delivery"),
    ]

    PAYMENT_STATUS_CHOICES = [
        ("UNPAID", "Unpaid"),
        ("COD_PENDING", "COD Pending"),
        ("PAID", "Paid"),
        ("FAILED", "Failed"),
    ]

    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="orders"
    )
    customer = models.ForeignKey(
        "stores.Customer",
        on_delete=models.PROTECT,
        related_name="orders"
    )
    order_number = models.CharField(max_length=32)
    order_type = models.CharField(max_length=24, choices=ORDER_TYPE_CHOICES, default="ONE_TIME")
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default="PENDING_PAYMENT")
    payment_method = models.CharField(max_length=16, choices=PAYMENT_METHOD_CHOICES, default="COD")
    payment_status = models.CharField(max_length=24, choices=PAYMENT_STATUS_CHOICES, default="UNPAID")
    payment_ref = models.CharField(max_length=120, blank=True, default="")
    subtotal_minor = models.PositiveIntegerField()
    shipping_minor = models.PositiveIntegerField(default=0)
    discount_minor = models.PositiveIntegerField(default=0)
    total_minor = models.PositiveIntegerField()
    currency = models.CharField(max_length=3, default="NPR")
    shipping_address_snapshot = models.JSONField(default=dict)
    is_test = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = StoreScopedManager()

    class Meta:
        unique_together = [("store", "order_number")]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.order_number} ({self.store.slug})"


class OrderItem(models.Model):
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="order_items"
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items"
    )
    variant = models.ForeignKey(
        "catalog.Variant",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    product_name_snapshot = models.CharField(max_length=160)
    variant_label_snapshot = models.CharField(max_length=64)
    unit_price_minor = models.PositiveIntegerField()
    quantity = models.PositiveSmallIntegerField(default=1)
    line_total_minor = models.PositiveIntegerField()

    objects = StoreScopedManager()

    def save(self, *args, **kwargs):
        if self.order_id and not self.store_id:
            self.store = self.order.store
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product_name_snapshot} ({self.order.order_number})"


class OrderEvent(models.Model):
    store = models.ForeignKey(
        "stores.Store",
        on_delete=models.CASCADE,
        related_name="order_events"
    )
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="events"
    )
    from_status = models.CharField(max_length=24, blank=True, default="")
    to_status = models.CharField(max_length=24)
    note = models.CharField(max_length=255, blank=True, default="")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    objects = StoreScopedManager()

    class Meta:
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.order_id and not self.store_id:
            self.store = self.order.store
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order.order_number}: {self.from_status}->{self.to_status}"
