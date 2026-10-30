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
    help = "Seed BrewMellow Store #1 with Himalayan micro-lots, selling plans, and demo orders."

    def handle(self, *args, **options):
        self.stdout.write("Seeding BrewMellow Store #1...")

        with transaction.atomic():
            # 1. Merchant Owner
            owner, _ = User.objects.get_or_create(
                email="aarav.shrestha@brewmellow.com.np",
                defaults={
                    "full_name": "Aarav Shrestha",
                    "phone": "9841223344",
                }
            )

            # 2. Store #1
            store, _ = Store.objects.update_or_create(
                slug="brewmellow",
                defaults={
                    "name": "BrewMellow",
                    "tagline": "Direct-trade Himalayan specialty micro-lots roasted to order in Lalitpur.",
                    "theme_preset": "editorial-warm",
                    "currency": "NPR",
                    "contact_phone": "9841223344",
                    "inside_valley_shipping_minor": 10000,
                    "outside_valley_shipping_minor": 20000,
                    "free_shipping_threshold_minor": 250000,
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
            products_data = [
                {
                    "slug": "gulmi-reserve",
                    "name": "Gulmi Reserve",
                    "description": "Shade-grown Bourbon and Typica cultivated at 1,550m in Aapchaur, Gulmi. Crisp Himalayan acidity with notes of wild honey, green apple, and roasted walnut.",
                    "image_url": "https://images.unsplash.com/photo-1559525839-b184a4d698c7",
                    "attributes": {
                        "altitude_masl": 1550,
                        "process": "Washed",
                        "roast_level": "Medium-Light",
                        "tasting_notes": ["Wild Honey", "Green Apple", "Roasted Walnut"],
                        "district": "Gulmi",
                    },
                    "variants": [
                        {"sku": "bm-gul-150g", "label": "150g", "weight": 150, "price": 45000, "sub": False},
                        {"sku": "bm-gul-250g", "label": "250g", "weight": 250, "price": 65000, "sub": True},
                        {"sku": "bm-gul-500g", "label": "500g", "weight": 500, "price": 120000, "sub": True},
                        {"sku": "bm-gul-1kg", "label": "1kg", "weight": 1000, "price": 220000, "sub": True},
                    ]
                },
                {
                    "slug": "ilam-gold",
                    "name": "Ilam Gold",
                    "description": "High-altitude Typica harvested at 1,750m in the misty hills of Sandakphu, Ilam. Silky body with fragrant notes of jasmine tea, bergamot, and sweet stone fruit.",
                    "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd",
                    "attributes": {
                        "altitude_masl": 1750,
                        "process": "Natural",
                        "roast_level": "Light",
                        "tasting_notes": ["Jasmine Tea", "Bergamot", "Stone Fruit"],
                        "district": "Ilam",
                    },
                    "variants": [
                        {"sku": "bm-ilm-150g", "label": "150g", "weight": 150, "price": 50000, "sub": False},
                        {"sku": "bm-ilm-250g", "label": "250g", "weight": 250, "price": 75000, "sub": True},
                        {"sku": "bm-ilm-500g", "label": "500g", "weight": 500, "price": 140000, "sub": True},
                        {"sku": "bm-ilm-1kg", "label": "1kg", "weight": 1000, "price": 260000, "sub": True},
                    ]
                },
                {
                    "slug": "nuwakot-heritage",
                    "name": "Nuwakot Heritage",
                    "description": "Heritage Red Catuai micro-lot from Kakani, Nuwakot at 1,400m. Velvety mouthfeel with deep dark chocolate, toasted cardamom, and jaggery undertones.",
                    "image_url": "https://images.unsplash.com/photo-1611854779393-1b2da9d400fe",
                    "attributes": {
                        "altitude_masl": 1400,
                        "process": "Honey",
                        "roast_level": "Medium-Dark",
                        "tasting_notes": ["Dark Chocolate", "Toasted Cardamom", "Jaggery"],
                        "district": "Nuwakot",
                    },
                    "variants": [
                        {"sku": "bm-nuw-150g", "label": "150g", "weight": 150, "price": 40000, "sub": False},
                        {"sku": "bm-nuw-250g", "label": "250g", "weight": 250, "price": 60000, "sub": True},
                        {"sku": "bm-nuw-500g", "label": "500g", "weight": 500, "price": 110000, "sub": True},
                        {"sku": "bm-nuw-1kg", "label": "1kg", "weight": 1000, "price": 200000, "sub": True},
                    ]
                },
            ]

            variants_by_sku = {}
            for p_idx, p_data in enumerate(products_data):
                product, _ = Product.objects.update_or_create(
                    store=store,
                    slug=p_data["slug"],
                    defaults={
                        "name": p_data["name"],
                        "description": p_data["description"],
                        "image_url": p_data["image_url"],
                        "attributes": p_data["attributes"],
                        "allow_one_time": True,
                        "allow_subscription": True,
                        "is_active": True,
                        "sort_order": p_idx,
                    }
                )
                for v_idx, v_data in enumerate(p_data["variants"]):
                    variant, _ = Variant.objects.update_or_create(
                        store=store,
                        sku=v_data["sku"],
                        defaults={
                            "product": product,
                            "label": v_data["label"],
                            "weight_grams": v_data["weight"],
                            "price_minor": v_data["price"],
                            "allow_one_time": True,
                            "allow_subscription": v_data["sub"],
                            "in_stock": True,
                            "is_active": True,
                            "sort_order": v_idx,
                        }
                    )
                    variants_by_sku[v_data["sku"]] = variant

            # 5. Selling Plans
            plans_data = [
                {"code": "bm-payg", "name": "Pay-per-delivery", "cycles": 1, "discount": 0, "prepaid": False, "order": 0},
                {"code": "bm-3m", "name": "3 Months Prepaid", "cycles": 3, "discount": 5, "prepaid": True, "order": 1},
                {"code": "bm-6m", "name": "6 Months Prepaid", "cycles": 6, "discount": 10, "prepaid": True, "order": 2},
                {"code": "bm-12m", "name": "12 Months Prepaid", "cycles": 12, "discount": 15, "prepaid": True, "order": 3},
            ]
            plans_by_code = {}
            for pl in plans_data:
                plan, _ = SellingPlan.objects.update_or_create(
                    store=store,
                    code=pl["code"],
                    defaults={
                        "name": pl["name"],
                        "interval_unit": "MONTH",
                        "interval_count": 1,
                        "commitment_cycles": pl["cycles"],
                        "discount_pct": pl["discount"],
                        "is_prepaid": pl["prepaid"],
                        "is_active": True,
                        "sort_order": pl["order"],
                    }
                )
                plans_by_code[pl["code"]] = plan

            # 6. Customers
            customers_seed = [
                ("sita.maharjan@example.com.np", "Sita Maharjan", "9851123456", {
                    "recipient_name": "Sita Maharjan",
                    "phone": "9851123456",
                    "province": "Bagmati",
                    "district": "Lalitpur",
                    "municipality": "Lalitpur Metropolitan City",
                    "ward": 3,
                    "street_landmark": "Jhamsikhel, near British School",
                }),
                ("bikash.gurung@example.com.np", "Bikash Gurung", "9846012345", {
                    "recipient_name": "Bikash Gurung",
                    "phone": "9846012345",
                    "province": "Gandaki",
                    "district": "Kaski",
                    "municipality": "Pokhara Metropolitan City",
                    "ward": 6,
                    "street_landmark": "Lakeside Hallan Chowk",
                }),
                ("nisha.tamang@example.com.np", "Nisha Tamang", "9818987654", {
                    "recipient_name": "Nisha Tamang",
                    "phone": "9818987654",
                    "province": "Bagmati",
                    "district": "Kathmandu",
                    "municipality": "Kirtipur Municipality",
                    "ward": 5,
                    "street_landmark": "Naya Bazaar Chowk",
                }),
            ]
            customers_by_email = {}
            for email, name, phone, addr in customers_seed:
                shopper_user, _ = User.objects.get_or_create(
                    email=email,
                    defaults={"full_name": name, "phone": phone}
                )
                cust, _ = Customer.objects.update_or_create(
                    store=store,
                    email=email,
                    defaults={"user": shopper_user, "full_name": name, "phone": phone}
                )
                customers_by_email[email] = (cust, addr)

            # 7. Demo Orders
            # Order 1: Sita, One-time COD
            sita_cust, sita_addr = customers_by_email["sita.maharjan@example.com.np"]
            order1, _ = Order.objects.update_or_create(
                store=store,
                order_number="BM-2026-0001",
                defaults={
                    "customer": sita_cust,
                    "order_type": "ONE_TIME",
                    "status": "DELIVERED",
                    "payment_method": "COD",
                    "payment_status": "PAID",
                    "subtotal_minor": 65000,
                    "shipping_minor": 10000,
                    "discount_minor": 0,
                    "total_minor": 75000,
                    "currency": "NPR",
                    "shipping_address_snapshot": sita_addr,
                    "is_test": True,
                }
            )
            OrderItem.objects.update_or_create(
                store=store,
                order=order1,
                variant=variants_by_sku["bm-gul-250g"],
                defaults={
                    "product_name_snapshot": "Gulmi Reserve",
                    "variant_label_snapshot": "250g",
                    "unit_price_minor": 65000,
                    "quantity": 1,
                    "line_total_minor": 65000,
                }
            )
            OrderEvent.objects.get_or_create(
                store=store,
                order=order1,
                to_status="DELIVERED",
                defaults={"from_status": "SHIPPED", "note": "Delivered · Collected Rs. 750 cash"}
            )

            # Order 2: Bikash, Subscription Cycle Khalti
            bikash_cust, bikash_addr = customers_by_email["bikash.gurung@example.com.np"]
            order2, _ = Order.objects.update_or_create(
                store=store,
                order_number="BM-2026-0002",
                defaults={
                    "customer": bikash_cust,
                    "order_type": "SUBSCRIPTION_CYCLE",
                    "status": "SHIPPED",
                    "payment_method": "KHALTI",
                    "payment_status": "PAID",
                    "payment_ref": "KHL_DEMO_REF_002",
                    "subtotal_minor": 140000,
                    "shipping_minor": 20000,
                    "discount_minor": 14000,
                    "total_minor": 146000,
                    "currency": "NPR",
                    "shipping_address_snapshot": bikash_addr,
                    "is_test": True,
                }
            )
            OrderItem.objects.update_or_create(
                store=store,
                order=order2,
                variant=variants_by_sku["bm-ilm-500g"],
                defaults={
                    "product_name_snapshot": "Ilam Gold",
                    "variant_label_snapshot": "500g",
                    "unit_price_minor": 140000,
                    "quantity": 1,
                    "line_total_minor": 126000,
                }
            )
            OrderEvent.objects.get_or_create(
                store=store,
                order=order2,
                to_status="SHIPPED",
                defaults={"from_status": "PROCESSING", "note": "Dispatched via Sundarban Courier Pokhara"}
            )

            # Order 3: Nisha, One-time Khalti
            nisha_cust, nisha_addr = customers_by_email["nisha.tamang@example.com.np"]
            order3, _ = Order.objects.update_or_create(
                store=store,
                order_number="BM-2026-0003",
                defaults={
                    "customer": nisha_cust,
                    "order_type": "ONE_TIME",
                    "status": "PROCESSING",
                    "payment_method": "KHALTI",
                    "payment_status": "PAID",
                    "payment_ref": "KHL_DEMO_REF_003",
                    "subtotal_minor": 105000,
                    "shipping_minor": 10000,
                    "discount_minor": 0,
                    "total_minor": 115000,
                    "currency": "NPR",
                    "shipping_address_snapshot": nisha_addr,
                    "is_test": True,
                }
            )
            OrderItem.objects.update_or_create(
                store=store,
                order=order3,
                variant=variants_by_sku["bm-nuw-250g"],
                defaults={
                    "product_name_snapshot": "Nuwakot Heritage",
                    "variant_label_snapshot": "250g",
                    "unit_price_minor": 60000,
                    "quantity": 1,
                    "line_total_minor": 60000,
                }
            )
            OrderItem.objects.update_or_create(
                store=store,
                order=order3,
                variant=variants_by_sku["bm-gul-150g"],
                defaults={
                    "product_name_snapshot": "Gulmi Reserve",
                    "variant_label_snapshot": "150g",
                    "unit_price_minor": 45000,
                    "quantity": 1,
                    "line_total_minor": 45000,
                }
            )
            OrderEvent.objects.get_or_create(
                store=store,
                order=order3,
                to_status="PROCESSING",
                defaults={"from_status": "PAID", "note": "Roasting batch scheduled"}
            )

            # 8. Subscriptions
            now = timezone.now().date()
            Subscription.objects.update_or_create(
                store=store,
                customer=sita_cust,
                variant=variants_by_sku["bm-gul-250g"],
                defaults={
                    "selling_plan": plans_by_code["bm-3m"],
                    "order": order1,
                    "status": "ACTIVE",
                    "unit_price_minor": 61750,
                    "next_delivery_date": now + timedelta(days=14),
                    "cycles_total": 3,
                    "cycles_remaining": 2,
                    "shipping_address_snapshot": sita_addr,
                }
            )
            Subscription.objects.update_or_create(
                store=store,
                customer=bikash_cust,
                variant=variants_by_sku["bm-ilm-500g"],
                defaults={
                    "selling_plan": plans_by_code["bm-6m"],
                    "order": order2,
                    "status": "ACTIVE",
                    "unit_price_minor": 126000,
                    "next_delivery_date": now + timedelta(days=21),
                    "cycles_total": 6,
                    "cycles_remaining": 5,
                    "shipping_address_snapshot": bikash_addr,
                }
            )

        self.stdout.write(self.style.SUCCESS("BrewMellow Store #1 seeded successfully."))
