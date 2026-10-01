from django.db import models

class CoffeeOrigin(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()
    price_per_kg = models.DecimalField(max_digits=8, decimal_places=2)
    is_available = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class SubscriptionPlan(models.Model):
    PLAN_CHOICES = [
        ('PAYG', 'Pay-per-delivery'),
        ('3M', '3 Months (Discounted)'),
        ('6M', '6 Months (Discounted)'),
        ('12M', '12 Months (Discounted)'),
    ]
    
    name = models.CharField(max_length=4, choices=PLAN_CHOICES, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    
    def __str__(self):
        return self.get_name_display()
