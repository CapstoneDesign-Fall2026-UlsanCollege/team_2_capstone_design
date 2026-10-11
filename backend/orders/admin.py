from django.contrib import admin
from .models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'origin_name', 'plan_name', 'total_price_npr', 'status', 'created_at')
    list_filter = ('status', 'origin_name', 'plan_name')
    search_fields = ('customer_name', 'customer_email', 'delivery_address')
