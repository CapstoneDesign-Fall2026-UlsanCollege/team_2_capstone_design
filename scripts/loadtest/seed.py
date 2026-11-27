"""
Seed a local SQLite database with a large synthetic store for load testing.

Usage (from repo root, with the backend venv):
  set LOADTEST_DB=<path>.sqlite3
  set PYTHONPATH=backend;scripts\\loadtest
  set DJANGO_SETTINGS_MODULE=loadtest_settings
  backend\\venv\\Scripts\\python.exe scripts\\loadtest\\seed.py --customers 100000 --orders 50000 --products 2000
"""
import argparse
import json
import os
import random
import time
import uuid

import django

django.setup()

from django.core.management import call_command  # noqa: E402
from django.db import connection  # noqa: E402
from django.test import Client  # noqa: E402

from accounts.models import User  # noqa: E402
from catalog.models import Product, Variant  # noqa: E402
from orders.models import Order, OrderItem  # noqa: E402
from stores.models import Customer, Store, StoreMembership  # noqa: E402

BATCH = 5000
STATUSES = ["CONFIRMED", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "DELIVERED", "DELIVERED", "CANCELLED"]
FIRST = ["Aarav", "Sita", "Ram", "Gita", "Bikash", "Anita", "Sujan", "Maya", "Prakash", "Nisha", "Kiran", "Sunita"]
LAST = ["Shrestha", "Gurung", "Rai", "Tamang", "Thapa", "Sharma", "Karki", "Magar", "Adhikari", "Basnet"]


def chunks(items, size):
    for i in range(0, len(items), size):
        yield items[i:i + size]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--customers", type=int, default=100_000)
    parser.add_argument("--orders", type=int, default=50_000)
    parser.add_argument("--products", type=int, default=2_000)
    parser.add_argument("--slug", default="loadtest-store")
    parser.add_argument("--out", default=os.path.join(os.path.dirname(os.environ["LOADTEST_DB"]), "session.json"))
    args = parser.parse_args()

    random.seed(42)
    started = time.time()
    print("Migrating local SQLite ...", flush=True)
    call_command("migrate", interactive=False, verbosity=0)

    owner, _ = User.objects.get_or_create(email="owner@loadtest.local", defaults={"is_active": True, "full_name": "Load Owner"})
    store, _ = Store.objects.get_or_create(slug=args.slug, defaults={"name": "Load Test Store", "shipping_configured": True})
    StoreMembership.all_objects.get_or_create(store=store, user=owner, defaults={"role": "OWNER"})

    if Customer.all_objects.filter(store=store).exists():
        raise SystemExit("Store already seeded; delete the SQLite file to reseed.")

    print(f"Creating {args.products} products ...", flush=True)
    products = [
        Product(store=store, slug=f"prod-{i}", name=f"Product {i}", description="Synthetic product", sort_order=i % 30000)
        for i in range(args.products)
    ]
    for batch in chunks(products, BATCH):
        Product._base_manager.bulk_create(batch)
    product_ids = list(Product._base_manager.filter(store=store).values_list("id", "name"))

    variants = []
    for pid, _name in product_ids:
        for label, price in (("Small", 50000), ("Large", 90000)):
            variants.append(Variant(
                store=store, product_id=pid, sku=f"SKU-{pid}-{label[0]}", label=label,
                price_minor=price, in_stock=True, track_inventory=(pid % 4 == 0),
                stock_quantity=random.randint(0, 50), low_stock_threshold=5,
            ))
    for batch in chunks(variants, BATCH):
        Variant._base_manager.bulk_create(batch)
    variant_rows = list(Variant._base_manager.filter(store=store).values_list("id", "product_id", "label", "price_minor"))
    product_names = dict(product_ids)

    print(f"Creating {args.customers} customers ...", flush=True)
    customers = [
        Customer(
            store=store,
            email=f"customer{i}@example.com",
            full_name=f"{random.choice(FIRST)} {random.choice(LAST)} {i}",
            phone=f"98{random.randint(10000000, 99999999)}",
        )
        for i in range(args.customers)
    ]
    for batch in chunks(customers, BATCH):
        Customer.all_objects.bulk_create(batch)
    customer_ids = list(Customer.all_objects.filter(store=store).values_list("id", flat=True))

    print(f"Creating {args.orders} orders ...", flush=True)
    order_rows = []
    for i in range(args.orders):
        total = random.choice([50000, 90000, 140000, 180000])
        order_rows.append(Order(
            store=store,
            customer_id=random.choice(customer_ids),
            order_number=f"LT-{i:07d}",
            token=uuid.uuid4(),
            status=random.choice(STATUSES),
            payment_method=random.choice(["COD", "KHALTI"]),
            payment_status="PAID",
            subtotal_minor=total,
            total_minor=total + 10000,
            shipping_minor=10000,
            shipping_address_snapshot={"recipient_name": "Load Buyer", "district": "Kathmandu"},
        ))
    for batch in chunks(order_rows, BATCH):
        Order._base_manager.bulk_create(batch)

    order_ids = list(Order._base_manager.filter(store=store).order_by("id").values_list("id", flat=True))
    items = []
    for oid in order_ids:
        for _ in range(random.randint(1, 3)):
            vid, pid, label, price = random.choice(variant_rows)
            qty = random.randint(1, 3)
            items.append(OrderItem(
                store=store, order_id=oid, variant_id=vid,
                product_name_snapshot=product_names[pid], variant_label_snapshot=label,
                unit_price_minor=price, quantity=qty, line_total_minor=price * qty,
            ))
    for batch in chunks(items, BATCH):
        OrderItem._base_manager.bulk_create(batch)

    with connection.cursor() as cur:  # spread timestamps so newest-first ordering is realistic
        cur.execute("UPDATE orders_order SET created_at = datetime('now', '-' || (id * 90) || ' seconds')")
        cur.execute("UPDATE stores_customer SET created_at = datetime('now', '-' || (id * 40) || ' seconds')")

    client = Client()
    client.force_login(owner)
    session_id = client.cookies["sessionid"].value
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump({"slug": store.slug, "sessionid": session_id, "product_ids": [p for p, _ in product_ids[:200]]}, fh)

    print(
        f"Seeded in {time.time() - started:.0f}s: {len(customer_ids)} customers, {len(order_ids)} orders, "
        f"{len(items)} order items, {len(product_ids)} products, {len(variant_rows)} variants. Session -> {args.out}",
        flush=True,
    )


if __name__ == "__main__":
    main()
