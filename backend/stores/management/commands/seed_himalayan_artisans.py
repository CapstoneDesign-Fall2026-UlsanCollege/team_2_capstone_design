from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from catalog.models import Product, Variant
from orders.models import Order, OrderEvent, OrderItem
from stores.models import Customer, Store, StoreMembership

User = get_user_model()


class Command(BaseCommand):
    help = "Seed Store #2 Himalayan Artisans with organic teas, spices, and demo orders."

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
                    "story_headline": "Pure Botanicals & Single-Estate Mountain Teas",
                    "about_text": "Himalayan Artisans celebrates the rich botanicals and organic harvest of eastern Nepal. We partner with women's farming cooperatives in Ilam and Dhankuta to harvest hand-rolled black teas, wild chamomile blossoms, and high-altitude cardamom.\n\nEvery batch is packaged in biodegradable tin canisters right at the estate, ensuring peak freshness while supporting sustainable livelihoods in rural farming communities.",
                    "address": "Kanyam Tea Estate Road, Ilam & Jhamsikhel Studio, Lalitpur, Nepal",
                    "contact_email": "ananya.rai@himalayanartisans.com.np",
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
                    "in_stock": True,
                    "is_active": True,
                }
            )

            # 5. Customers & Sample Order
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

            # Seed a sample order
            order1, _ = Order.objects.update_or_create(
                store=store,
                order_number="#HA-2026-0001",
                defaults={
                    "customer": cust_prashant,
                    "order_type": "ONE_TIME",
                    "status": "PROCESSING",
                    "payment_method": "KHALTI",
                    "payment_status": "PAID",
                    "payment_ref": "sandbox_ha_seed_001",
                    "subtotal_minor": 95000,
                    "shipping_minor": 0,
                    "total_minor": 95000,
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
                    "variant_label_snapshot": "250g Tin",
                    "unit_price_minor": 95000,
                    "quantity": 1,
                    "line_total_minor": 95000,
                }
            )

        self.stdout.write(self.style.SUCCESS("Himalayan Artisans Store #2 seeded successfully."))
