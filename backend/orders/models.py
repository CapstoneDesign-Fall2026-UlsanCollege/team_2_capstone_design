from django.db import models

class Order(models.Model):
    origin_id = models.IntegerField()
    origin_name = models.CharField(max_length=255)
    weight_kg = models.FloatField()
    plan_id = models.CharField(max_length=50)
    plan_name = models.CharField(max_length=255)
    total_price_npr = models.IntegerField()
    is_fake_payment = models.BooleanField(default=False)
    status = models.CharField(max_length=50, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Order {self.id} - {self.origin_name} ({self.plan_name})"
