from datetime import timedelta
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from catalog.models import Product, SellingPlan, Variant
from orders.models import Order, OrderItem
from stores.models import Customer, Store, StoreMembership
from subscriptions.models import Subscription

User = get_user_model()


class Command(BaseCommand):
    help = "Seed flagship Specialty Coffee & Tea tenant: Himalayan Coffee Roasters (himalayan-roasters)."

    def handle(self, *args, **options):
        self.stdout.write("Seeding Himalayan Coffee Roasters (himalayan-roasters)...")

        with transaction.atomic():
            # 1. Merchant Owner
            owner, _ = User.objects.get_or_create(
                email="roaster@himalayanroasters.com.np",
                defaults={
                    "full_name": "Tenzing Sherpa",
                    "phone": "9801987654",
                }
            )

            # 2. Store: Himalayan Coffee Roasters
            store, _ = Store.objects.update_or_create(
                slug="himalayan-roasters",
                defaults={
                    "name": "Himalayan Coffee Roasters",
                    "tagline": "Kathmandu's Specialty Roastery · Single-Origin Himalayan Arabica, Mountain Teas & Gear",
                    "theme_preset": "editorial-warm",
                    "currency": "NPR",
                    "contact_phone": "9801987654",
                    "inside_valley_shipping_minor": 10000,
                    "outside_valley_shipping_minor": 18000,
                    "free_shipping_threshold_minor": 150000,
                    "is_active": True,
                }
            )

            # 3. Store Membership
            StoreMembership.objects.update_or_create(
                store=store,
                user=owner,
                defaults={"role": "OWNER"}
            )

            # 4. Selling Plans (Shopify + Recharge model)
            plan_weekly, _ = SellingPlan.objects.update_or_create(
                store=store,
                code="hr-weekly",
                defaults={
                    "name": "Weekly Monday Roast (Save 10%)",
                    "interval_unit": "WEEK",
                    "interval_count": 1,
                    "commitment_cycles": 1,
                    "discount_pct": 10,
                    "is_prepaid": False,
                    "is_active": True,
                    "sort_order": 0,
                }
            )

            plan_biweekly, _ = SellingPlan.objects.update_or_create(
                store=store,
                code="hr-biweekly",
                defaults={
                    "name": "Bi-Weekly Fresh Roast (Save 10%)",
                    "interval_unit": "WEEK",
                    "interval_count": 2,
                    "commitment_cycles": 1,
                    "discount_pct": 10,
                    "is_prepaid": False,
                    "is_active": True,
                    "sort_order": 1,
                }
            )

            plan_3m_prepaid, _ = SellingPlan.objects.update_or_create(
                store=store,
                code="hr-prepaid-3m",
                defaults={
                    "name": "3-Month Roasters Club (6 Deliveries · Save 15%)",
                    "interval_unit": "WEEK",
                    "interval_count": 2,
                    "commitment_cycles": 6,
                    "discount_pct": 15,
                    "is_prepaid": True,
                    "is_active": True,
                    "sort_order": 2,
                }
            )

            # 5. Products & Variants

            # Product 1: Gulmi Reserve Bourbon Arabica
            p1, _ = Product.objects.update_or_create(
                store=store,
                slug="gulmi-reserve-bourbon",
                defaults={
                    "name": "Gulmi Reserve Bourbon Arabica",
                    "description": "High-altitude specialty micro-lot grown at 1,450m in Gulmi. Washed process with deep chocolate richness, vibrant mandarin citrus, and a silky brown sugar finish. Roasted fresh every Monday.",
                    "image_url": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80",
                    "attributes": {
                        "category": "Specialty Coffee",
                        "origin": "Gulmi, Western Nepal",
                        "elevation": "1,450m",
                        "roast_level": "Medium Roast",
                        "process": "Washed Process",
                        "tasting_notes": ["Dark Chocolate", "Mandarin Citrus", "Brown Sugar"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "is_active": True,
                    "sort_order": 1,
                }
            )
            v1_wb, _ = Variant.objects.update_or_create(
                store=store, product=p1, sku="HR-GULMI-250G-WB",
                defaults={"label": "250g · Whole Bean", "price_minor": 75000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 1}
            )
            Variant.objects.update_or_create(
                store=store, product=p1, sku="HR-GULMI-250G-PO",
                defaults={"label": "250g · Pour-Over Grind", "price_minor": 75000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 2}
            )
            Variant.objects.update_or_create(
                store=store, product=p1, sku="HR-GULMI-500G-WB",
                defaults={"label": "500g · Whole Bean", "price_minor": 140000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 3}
            )
            Variant.objects.update_or_create(
                store=store, product=p1, sku="HR-GULMI-1KG-WB",
                defaults={"label": "1kg · Roastery Bag", "price_minor": 260000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 4}
            )

            # Product 2: Nuwakot High-Altitude Typica
            p2, _ = Product.objects.update_or_create(
                store=store,
                slug="nuwakot-high-altitude-typica",
                defaults={
                    "name": "Nuwakot High-Altitude Typica",
                    "description": "Shade-grown under Himalayan silver firs at 1,600m in Nuwakot. Bright floral notes of jasmine blossom, stone fruit sweetness, and crisp Himalayan honey acidity.",
                    "image_url": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
                    "attributes": {
                        "category": "Specialty Coffee",
                        "origin": "Nuwakot, Langtang Foothills",
                        "elevation": "1,600m",
                        "roast_level": "Light-Medium Roast",
                        "process": "Honey Process",
                        "tasting_notes": ["Jasmine Blossom", "Apricot", "Mountain Honey"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "is_active": True,
                    "sort_order": 2,
                }
            )
            Variant.objects.update_or_create(
                store=store, product=p2, sku="HR-NUWAKOT-250G-WB",
                defaults={"label": "250g · Whole Bean", "price_minor": 82000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 1}
            )
            Variant.objects.update_or_create(
                store=store, product=p2, sku="HR-NUWAKOT-250G-ESP",
                defaults={"label": "250g · Espresso Grind", "price_minor": 82000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 2}
            )
            Variant.objects.update_or_create(
                store=store, product=p2, sku="HR-NUWAKOT-500G-WB",
                defaults={"label": "500g · Whole Bean", "price_minor": 155000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 3}
            )

            # Product 3: Ilam First-Flush Orthodox Black Tea
            p3, _ = Product.objects.update_or_create(
                store=store,
                slug="ilam-first-flush-orthodox",
                defaults={
                    "name": "Ilam First-Flush Orthodox Black Tea",
                    "description": "Prized spring harvest hand-plucked at 2,000m from historic tea gardens in Kanyam, Ilam. Exquisite golden tips offering muscatel grape brightness and amber sweetness.",
                    "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
                    "attributes": {
                        "category": "Himalayan Teas",
                        "origin": "Kanyam, Ilam",
                        "elevation": "2,000m",
                        "tasting_notes": ["Muscatel Grape", "Golden Tips", "Wildflower Honey"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "is_active": True,
                    "sort_order": 3,
                }
            )
            Variant.objects.update_or_create(
                store=store, product=p3, sku="HR-ILAM-100G",
                defaults={"label": "100g · Foil Pouch", "price_minor": 48000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 1}
            )
            Variant.objects.update_or_create(
                store=store, product=p3, sku="HR-ILAM-250G",
                defaults={"label": "250g · Airtight Tin", "price_minor": 98000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 2}
            )

            # Product 4: Organic Solukhumbu Chamomile & Lemongrass
            p4, _ = Product.objects.update_or_create(
                store=store,
                slug="organic-solukhumbu-chamomile",
                defaults={
                    "name": "Organic Solukhumbu Chamomile & Lemongrass",
                    "description": "Sun-dried whole chamomile blossoms blended with highland lemongrass cultivated by mountain cooperatives near Lukla. 100% caffeine-free soothing evening tisane.",
                    "image_url": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=800&q=80",
                    "attributes": {
                        "category": "Tisanes & Herbs",
                        "origin": "Solukhumbu, Everest Region",
                        "tasting_notes": ["Crisp Apple", "Lemongrass", "Wild Chamomile"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "is_active": True,
                    "sort_order": 4,
                }
            )
            Variant.objects.update_or_create(
                store=store, product=p4, sku="HR-CHAM-50G",
                defaults={"label": "50g · Glass Jar", "price_minor": 38000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 1}
            )
            Variant.objects.update_or_create(
                store=store, product=p4, sku="HR-CHAM-120G",
                defaults={"label": "120g · Eco-Refill", "price_minor": 72000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 2}
            )

            # Product 5: Raw Himalayan Cliff Honey (Rukum Valley)
            p5, _ = Product.objects.update_or_create(
                store=store,
                slug="raw-himalayan-cliff-honey",
                defaults={
                    "name": "Raw Mountain Cliff Honey (Rukum Valley)",
                    "description": "Unpasteurized, coarse-filtered cliff honey harvested from wild Apis laboriosa colonies in the high gorges of Rukum. Rich in propolis, enzymes, and medicinal floral nectar.",
                    "image_url": "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
                    "attributes": {
                        "category": "Pantry & Pairings",
                        "origin": "Rukum, Western Himalayas",
                        "elevation": "2,200m",
                        "tasting_notes": ["Wild Rhododendron", "Medicinal Propolis", "Amber Caramel"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": True,
                    "is_active": True,
                    "sort_order": 5,
                }
            )
            Variant.objects.update_or_create(
                store=store, product=p5, sku="HR-HONEY-350G",
                defaults={"label": "350g · Hexagonal Jar", "price_minor": 95000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 1}
            )
            Variant.objects.update_or_create(
                store=store, product=p5, sku="HR-HONEY-750G",
                defaults={"label": "750g · Stoneware Jar", "price_minor": 185000, "allow_one_time": True, "allow_subscription": True, "in_stock": True, "sort_order": 2}
            )

            # Product 6: Matte Black Pour-Over Dripper
            p6, _ = Product.objects.update_or_create(
                store=store,
                slug="stainless-pour-over-dripper",
                defaults={
                    "name": "Matte Black Stainless Steel Pour-Over Dripper",
                    "description": "Precision dual-layer micro-mesh cone dripper engineered for clean, full-bodied extraction without disposable paper filters. Food-grade 304 stainless steel with heat-resistant silicone base.",
                    "image_url": "https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=800&q=80",
                    "attributes": {
                        "category": "Brewing Gear",
                        "origin": "Professional Barista Tooling",
                        "tasting_notes": ["Paperless Extraction", "Full Body", "Eco-Friendly"],
                    },
                    "allow_one_time": True,
                    "allow_subscription": False,
                    "is_active": True,
                    "sort_order": 6,
                }
            )
            Variant.objects.update_or_create(
                store=store, product=p6, sku="HR-GEAR-DRIPPER-02",
                defaults={"label": "Size 02 (1-4 Cups)", "price_minor": 165000, "allow_one_time": True, "allow_subscription": False, "in_stock": True, "sort_order": 1}
            )

            # 6. Sample Demo Orders & Subscriptions for Himalayan Roasters
            customer_aarav, _ = User.objects.get_or_create(
                email="aarav.shrestha@example.com",
                defaults={"full_name": "Aarav Shrestha", "phone": "9841234567"}
            )
            cust_aarav, _ = Customer.objects.get_or_create(
                store=store,
                email=customer_aarav.email,
                defaults={"user": customer_aarav, "full_name": "Aarav Shrestha", "phone": "9841234567"}
            )

            addr = {
                "recipient_name": "Aarav Shrestha",
                "phone": "9841234567",
                "province": "Bagmati",
                "district": "Kathmandu",
                "municipality": "Kathmandu Metropolitan City",
                "ward": "3",
                "street_address": "Near Lazimpat Embassy area",
            }
            now = timezone.now().date()

            order1, _ = Order.objects.update_or_create(
                store=store,
                order_number="#HR-2026-0001",
                defaults={
                    "customer": cust_aarav,
                    "order_type": "SUBSCRIPTION_FIRST",
                    "status": "PROCESSING",
                    "payment_method": "KHALTI",
                    "payment_status": "PAID",
                    "payment_ref": "sandbox_hr_seed_001",
                    "subtotal_minor": 135000,
                    "shipping_minor": 10000,
                    "total_minor": 145000,
                    "currency": "NPR",
                    "shipping_address_snapshot": addr,
                    "is_test": True,
                }
            )

            OrderItem.objects.update_or_create(
                store=store,
                order=order1,
                variant=v1_wb,
                defaults={
                    "product_name_snapshot": p1.name,
                    "variant_label_snapshot": "250g · Whole Bean (Bi-Weekly)",
                    "unit_price_minor": 67500,
                    "quantity": 2,
                    "line_total_minor": 135000,
                }
            )

            Subscription.objects.update_or_create(
                store=store,
                customer=cust_aarav,
                variant=v1_wb,
                defaults={
                    "selling_plan": plan_biweekly,
                    "order": order1,
                    "status": "ACTIVE",
                    "unit_price_minor": 67500,
                    "next_delivery_date": now + timedelta(days=14),
                    "cycles_total": 6,
                    "cycles_remaining": 5,
                    "shipping_address_snapshot": addr,
                }
            )

        self.stdout.write(self.style.SUCCESS("Successfully seeded Himalayan Coffee Roasters (himalayan-roasters)!"))
