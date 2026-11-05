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
    help = "Seed Store #3 KTM Streetwear with apparel, graphic tees, hoodies, and demo orders."

    def handle(self, *args, **options):
        self.stdout.write("Seeding KTM Streetwear Store #3...")

        with transaction.atomic():
            # 1. Merchant Owner
            owner, _ = User.objects.get_or_create(
                email="rohit.tamang@ktmstreetwear.com.np",
                defaults={
                    "full_name": "Rohit Tamang",
                    "phone": "9812345678",
                }
            )

            # 2. Store #3
            store, _ = Store.objects.update_or_create(
                slug="ktm-streetwear",
                defaults={
                    "name": "KTM Streetwear & Apparel",
                    "tagline": "Contemporary Himalayan streetwear, heavy-cotton drop-shoulder tees & outerwear.",
                    "theme_preset": "ktm-bold",
                    "currency": "NPR",
                    "contact_phone": "9812345678",
                    "inside_valley_shipping_minor": 10000,
                    "outside_valley_shipping_minor": 20000,
                    "free_shipping_threshold_minor": 250000,
                    "is_active": True,
                    "story_headline": "Contemporary Urban Streetwear Made in Kathmandu",
                    "about_text": "Born out of Kathmandu's thriving youth subculture, KTM Streetwear crafts heavyweight combed-cotton tees, oversized hoodies, and technical cargo essentials.\n\nAll garments are cut and sewn in our Baluwatar workshop using locally sourced fabrics and durable water-based screenprints designed to withstand everyday wear.",
                    "address": "Baluwatar Chowk, Kathmandu, Nepal",
                    "contact_email": "drops@ktmstreetwear.com",
                }
            )

            # 3. Store Membership
            StoreMembership.objects.update_or_create(
                store=store,
                user=owner,
                defaults={"role": "OWNER"}
            )

            # 4. Products & Variants
            # Product 1: KTM Heavyweight Boxy Tee
            p1, _ = Product.objects.update_or_create(
                store=store,
                slug="ktm-heavyweight-boxy-tee",
                defaults={
                    "name": "KTM Heavyweight Boxy Tee (280 GSM)",
                    "description": "Constructed from 100% Nepali combed cotton. Custom relaxed drop-shoulder cut with reinforced ribbing and high-density screenprinted Kathmandu typography.",
                    "attributes": {
                        "fabric": "100% Combed Heavy Cotton (280 GSM)",
                        "fit": "Boxy Oversized Drop Shoulder",
                        "color": "Washed Charcoal",
                        "origin": "Manufactured in Lalitpur, Nepal",
                    },
                    "allow_one_time": True,
                    "is_active": True,
                }
            )

            v1_l, _ = Variant.objects.update_or_create(
                store=store,
                product=p1,
                sku="KTM-TEE-L",
                defaults={
                    "label": "Size L (Oversized)",
                    "price_minor": 185000,
                    "allow_one_time": True,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            for size, price in [("M", 185000), ("XL", 195000)]:
                Variant.objects.update_or_create(
                    store=store,
                    product=p1,
                    sku=f"KTM-TEE-{size}",
                    defaults={
                        "label": f"Size {size}",
                        "price_minor": price,
                        "allow_one_time": True,
                        "in_stock": True,
                        "is_active": True,
                    }
                )

            # Product 2: Thamel Cyberpunk Graphic Hoodie
            p2, _ = Product.objects.update_or_create(
                store=store,
                slug="thamel-cyberpunk-graphic-hoodie",
                defaults={
                    "name": "Thamel Cyberpunk Graphic Hoodie (420 GSM)",
                    "description": "Heavyweight loopback French terry fleece hoodie featuring neo-Kathmandu street art graphics. Deep double-layered hood with silver eyelets and custom kangaroo pouch.",
                    "attributes": {
                        "fabric": "French Terry Loopback Cotton (420 GSM)",
                        "fit": "Oversized Streetwear Silhouette",
                        "color": "Nightfall Black",
                    },
                    "allow_one_time": True,
                    "is_active": True,
                }
            )

            for size, price in [("M", 345000), ("L", 345000), ("XL", 365000)]:
                Variant.objects.update_or_create(
                    store=store,
                    product=p2,
                    sku=f"KTM-HDY-{size}",
                    defaults={
                        "label": f"Size {size}",
                        "price_minor": price,
                        "allow_one_time": True,
                        "in_stock": True,
                        "is_active": True,
                    }
                )

            # Product 3: Nepal Heritage Corduroy Cap
            p3, _ = Product.objects.update_or_create(
                store=store,
                slug="nepal-heritage-corduroy-cap",
                defaults={
                    "name": "Nepal Heritage 6-Panel Corduroy Cap",
                    "description": "Premium 8-wale corduroy dad hat with embroidered Nepali Dhaka crest. Antique brass buckle closure and curved brim.",
                    "attributes": {
                        "fabric": "100% Cotton 8-Wale Corduroy",
                        "color": "Forest / Mustard",
                    },
                    "allow_one_time": True,
                    "is_active": True,
                }
            )

            Variant.objects.update_or_create(
                store=store,
                product=p3,
                sku="KTM-CAP-OS",
                defaults={
                    "label": "One Size (Adjustable)",
                    "price_minor": 95000,
                    "allow_one_time": True,
                    "in_stock": True,
                    "is_active": True,
                }
            )

            # 5. Demo Orders
            c1, _ = Customer.objects.get_or_create(
                store=store,
                email="siddharth@example.com",
                defaults={
                    "full_name": "Siddharth Shrestha",
                    "phone": "9841890123",
                }
            )

            s_addr = {
                "recipient_name": "Siddharth Shrestha",
                "phone": "9841890123",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metro",
                "ward": "3",
                "street_address": "Lazimpat, Near Radisson Hotel",
            }

            order1, _ = Order.objects.update_or_create(
                store=store,
                order_number="#KTM-2026-0001",
                defaults={
                    "customer": c1,
                    "order_type": "ONE_TIME",
                    "status": "PROCESSING",
                    "payment_method": "KHALTI",
                    "payment_status": "PAID",
                    "payment_ref": "sandbox_ktm_seed_001",
                    "subtotal_minor": 185000,
                    "shipping_minor": 10000,
                    "total_minor": 195000,
                    "currency": "NPR",
                    "shipping_address_snapshot": s_addr,
                    "is_test": True,
                }
            )

            OrderItem.objects.update_or_create(
                store=store,
                order=order1,
                variant=v1_l,
                defaults={
                    "product_name_snapshot": p1.name,
                    "variant_label_snapshot": v1_l.label,
                    "unit_price_minor": 185000,
                    "quantity": 1,
                    "line_total_minor": 185000,
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded KTM Streetwear Store #3!"))
