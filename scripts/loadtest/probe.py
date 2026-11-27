"""Time each endpoint once (sequential, no concurrency) and print status, latency, payload size."""
import json
import sys
import time

import requests

cfg = json.load(open(sys.argv[1], encoding="utf-8"))
base = "http://127.0.0.1:8765"
slug = cfg["slug"]
cookies = {"sessionid": cfg["sessionid"]}
paths = [
    ("public_catalog", f"/api/stores/{slug}/catalog/", False),
    ("public_product", f"/api/stores/{slug}/products/{cfg['product_ids'][0]}/", False),
    ("merchant_overview", f"/api/merchant/stores/{slug}/overview/", True),
    ("merchant_orders", f"/api/merchant/stores/{slug}/orders/", True),
    ("merchant_orders_search", f"/api/merchant/stores/{slug}/orders/?search=LT-0042", True),
    ("merchant_customers", f"/api/merchant/stores/{slug}/customers/", True),
    ("merchant_customers_search", f"/api/merchant/stores/{slug}/customers/?search=customer4242", True),
    ("merchant_products", f"/api/merchant/stores/{slug}/products/", True),
    ("merchant_inventory", f"/api/merchant/stores/{slug}/inventory/", True),
]
for name, path, auth in paths:
    t0 = time.perf_counter()
    try:
        r = requests.get(base + path, cookies=cookies if auth else None, timeout=180)
        print(f"{name:28s} {r.status_code}  {(time.perf_counter()-t0)*1000:9.0f} ms  {len(r.content)/1024:9.1f} KB", flush=True)
    except Exception as exc:  # noqa: BLE001
        print(f"{name:28s} ERROR {type(exc).__name__}", flush=True)
