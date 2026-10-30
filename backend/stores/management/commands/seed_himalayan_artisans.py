from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from catalog.models import Product, SellingPlan, Variant
from orders.models import Order, OrderEvent, OrderItem
from stores.models import Customer, Store, StoreMembership
from subscriptions.models import Subscription

User = get_user_model()


class Command(BaseCommand):
    help = "Seed Store #2 Himalayan Artisans with organic teas, spices, selling plans, and demo orders."

    def handle(self, *args, **options):
        self.stdout.write("Seeding Himalayan Artisans Store #2...")

        with transaction.atomic():
            # 1. Merchant Owner
            owner, _ = User.objects.get_or_create(
                email="ananya.rai@himalayanartisans.com.np",
                defaults={
                    "full_name": "Ananya Rai",
                    "phone": "9801234567",
                }
            )

            # 2. Store #2
            store, _ = Store.objects.update_or_create(
                slug="himalayan-artisans",
                defaults={
                    "name": "Himalayan Artisans",
                    "tagline": "Handcrafted single-estate teas, wild chamomile, and high-altitude spices from eastern Nepal.",
                    "theme_preset": "pahadi-sage",
                    "currency": "NPR",
                    "contact_phone": "9801234567",
                    "inside_valley_shipping_minor": 10000,
                    "outside_valley_shipping_minor": 18000,
                    "free_shipping_threshold_minor": 200000,
                    "is_active": True,
                }
            )

            # 3. Store Membership
            StoreMembership.objects.update_or_create(
                store=store,
                user=owner,
                defaults={"role": "OWNER"}
            )

            # 4. Products & Variants
            # Product 1: Ilam Single-Estate Black Tea
            p1, _ = Product.objects.update_or_create(
                store=store,
                slug="ilam-single-estate-black-tea",
                defaults={
                    "name": "Ilam Single-Estate Black Tea",
                    "description": "First-flush artisanal orthodox black tea hand-picked at 2,000m elevation in Kanyam, Ilam. Golden tips with notes of muscatel, wildflower honey, and roasted malt.",
                    "attributes": {
                        "elevation": "2,000m",
                        "origin": "Kanyam, Ilam",
                        "tasting_notes": ["Muscatel", "Wild Honey", "Roasted Malt"],
                        "process": "Hand-rolled orthodox orthodox",
                    },
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "is_active": True,
                }
            )

            v1_100g, _ = Variant.objects.update_or_create(
                store=store,
                product=p1,
                sku="HA-TEA-100G",
                defaults={
                    "label": "100g Pouch",
                    "price_minor": 45000,
                    "allow_one_time": True,
                    "allow_subscription": False,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            v1_250g, _ = Variant.objects.update_or_create(
                store=store,
                product=p1,
                sku="HA-TEA-250G",
                defaults={
                    "label": "250g Tin",
                    "price_minor": 95000,
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            v1_500g, _ = Variant.objects.update_or_create(
                store=store,
                product=p1,
                sku="HA-TEA-500G",
                defaults={
                    "label": "500g Bag",
                    "price_minor": 175000,
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            # Product 2: Organic Himalayan Chamomile
            p2, _ = Product.objects.update_or_create(
                store=store,
                slug="organic-himalayan-chamomile",
                defaults={
                    "name": "Organic Himalayan Chamomile",
                    "description": "Sun-dried whole chamomile flowers grown sustainably along the terrace slopes of Solukhumbu. Naturally caffeine-free with calming floral and apple aromas.",
                    "attributes": {
                        "origin": "Solukhumbu",
                        "caffeine": "Zero (Herbal Tisane)",
                        "tasting_notes": ["Sweet Apple", "Floral", "Honeyed Crisp"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "is_active": True,
                }
            )

            v2_50g, _ = Variant.objects.update_or_create(
                store=store,
                product=p2,
                sku="HA-CHAM-50G",
                defaults={
                    "label": "50g Jar",
                    "price_minor": 35000,
                    "allow_one_time": True,
                    "allow_subscription": False,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            v2_100g, _ = Variant.objects.update_or_create(
                store=store,
                product=p2,
                sku="HA-CHAM-100G",
                defaults={
                    "label": "100g Eco-Pouch",
                    "price_minor": 65000,
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            # Product 3: High-Altitude Turmeric & Ginger
            p3, _ = Product.objects.update_or_create(
                store=store,
                slug="wild-turmeric-ginger",
                defaults={
                    "name": "Wild Turmeric & Mountain Ginger",
                    "description": "Stone-ground heirloom turmeric root blended with spicy mountain ginger from Sindhupalchok. Exceptionally high curcumin content (6.2%).",
                    "attributes": {
                        "origin": "Sindhupalchok",
                        "curcumin": "6.2%",
                        "tasting_notes": ["Earthy", "Spicy Warmth", "Bright Citrus"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": False,
                    "is_active": True,
                }
            )

            v3_100g, _ = Variant.objects.update_or_create(
                store=store,
                product=p3,
                sku="HA-TURM-100G",
                defaults={
                    "label": "100g Glass Jar",
                    "price_minor": 30000,
                    "allow_one_time": True,
                    "allow_subscription": False,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            # 5. Selling Plans
            plan_payg, _ = SellingPlan.objects.update_or_create(
                store=store,
                code="ha-payg",
                defaults={
                    "name": "Monthly Delivery (Pay-per-delivery)",
                    "interval_unit": "MONTH",
                    "interval_count": 1,
                    "commitment_cycles": 1,
                    "discount_pct": 0,
                    "is_prepaid": False,
                    "is_active": True,
                    "sort_order": 0,
                }
            )

            plan_3m, _ = SellingPlan.objects.update_or_create(
                store=store,
                code="ha-3m",
                defaults={
                    "name": "3 Months Artisan Season (10% off)",
                    "interval_unit": "MONTH",
                    "interval_count": 1,
                    "commitment_cycles": 3,
                    "discount_pct": 10,
                    "is_prepaid": True,
                    "is_active": True,
                    "sort_order": 1,
                }
            )

            plan_6m, _ = SellingPlan.objects.update_or_create(
                store=store,
                code="ha-6m",
                defaults={
                    "name": "6 Months Mountain Harvest (15% off)",
                    "interval_unit": "MONTH",
                    "interval_count": 1,
                    "commitment_cycles": 6,
                    "discount_pct": 15,
                    "is_prepaid": True,
                    "is_active": True,
                    "sort_order": 2,
                }
            )

            # 6. Customers & Sample Subscriptions
            user_prashant, _ = User.objects.get_or_create(
                email="prashant.gurung@example.com.np",
                defaults={"full_name": "Prashant Gurung", "phone": "9860112233"}
            )
            cust_prashant, _ = Customer.objects.get_or_create(
                store=store,
                email=user_prashant.email,
                defaults={"user": user_prashant, "full_name": "Prashant Gurung", "phone": "9860112233"}
            )

            now = timezone.now().date()
            p_addr = {
                "recipient_name": "Prashant Gurung",
                "phone": "9860112233",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metro",
                "ward": "4",
                "street_address": "Baluwatar",
            }

            # Seed a sample order & subscription
            order1, _ = Order.objects.update_or_create(
                store=store,
                order_number="#HA-2026-0001",
                defaults={
                    "customer": cust_prashant,
                    "order_type": "SUBSCRIPTION_CYCLE",
                    "status": "PROCESSING",
                    "payment_method": "KHALTI",
                    "payment_status": "PAID",
                    "payment_ref": "sandbox_ha_seed_001",
                    "subtotal_minor": 256500,  # 3 cycles of 250g tea at 10% discount
                    "shipping_minor": 0,
                    "total_minor": 256500,
                    "currency": "NPR",
                    "shipping_address_snapshot": p_addr,
                    "is_test": True,
                }
            )

            OrderItem.objects.update_or_create(
                store=store,
                order=order1,
                variant=v1_250g,
                defaults={
                    "product_name_snapshot": p1.name,
                    "variant_label_snapshot": "250g Tin (3 cycles prepaid)",
                    "unit_price_minor": 85500,
                    "quantity": 1,
                    "line_total_minor": 256500,
                }
            )

            Subscription.objects.update_or_create(
                store=store,
                customer=cust_prashant,
                variant=v1_250g,
                defaults={
                    "selling_plan": plan_3m,
                    "order": order1,
                    "status": "ACTIVE",
                    "unit_price_minor": 85500,
                    "next_delivery_date": now + timedelta(days=18),
                    "cycles_total": 3,
                    "cycles_remaining": 2,
                    "shipping_address_snapshot": p_addr,
                }
            )

        self.stdout.write(self.style.SUCCESS("Himalayan Artisans Store #2 seeded successfully."))
