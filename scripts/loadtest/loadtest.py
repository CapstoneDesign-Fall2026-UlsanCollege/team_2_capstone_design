"""
Minimal concurrent HTTP load driver (no extra dependencies beyond `requests`).

  python loadtest.py --session <session.json> --concurrency 32 --duration 30 --label baseline --out result.json
"""
import argparse
import json
import random
import statistics
import threading
import time
from concurrent.futures import ThreadPoolExecutor

import requests

parser = argparse.ArgumentParser()
parser.add_argument("--base", default="http://127.0.0.1:8765")
parser.add_argument("--session", required=True)
parser.add_argument("--concurrency", type=int, default=32)
parser.add_argument("--duration", type=int, default=30)
parser.add_argument("--label", default="run")
parser.add_argument("--out", default="")
args = parser.parse_args()

with open(args.session, encoding="utf-8") as fh:
    cfg = json.load(fh)
SLUG = cfg["slug"]
PRODUCT_IDS = cfg["product_ids"]
COOKIES = {"sessionid": cfg["sessionid"]}

# (name, weight, auth, path-factory)
ENDPOINTS = [
    ("public_catalog", 30, False, lambda: f"/api/stores/{SLUG}/catalog/"),
    ("public_product", 15, False, lambda: f"/api/stores/{SLUG}/products/{random.choice(PRODUCT_IDS)}/"),
    ("merchant_overview", 10, True, lambda: f"/api/merchant/stores/{SLUG}/overview/"),
    ("merchant_orders", 10, True, lambda: f"/api/merchant/stores/{SLUG}/orders/"),
    ("merchant_orders_search", 5, True, lambda: f"/api/merchant/stores/{SLUG}/orders/?search=LT-00{random.randint(10, 99)}"),
    ("merchant_customers", 10, True, lambda: f"/api/merchant/stores/{SLUG}/customers/"),
    ("merchant_customers_search", 5, True, lambda: f"/api/merchant/stores/{SLUG}/customers/?search=customer{random.randint(100, 9999)}"),
    ("merchant_products", 10, True, lambda: f"/api/merchant/stores/{SLUG}/products/"),
    ("merchant_inventory", 5, True, lambda: f"/api/merchant/stores/{SLUG}/inventory/"),
]
WEIGHTS = [e[1] for e in ENDPOINTS]

lock = threading.Lock()
stats = {e[0]: {"lat": [], "err": 0, "bytes": 0} for e in ENDPOINTS}
deadline = 0.0


def worker(_):
    session = requests.Session()
    while time.time() < deadline:
        name, _w, auth, make_path = random.choices(ENDPOINTS, weights=WEIGHTS)[0]
        t0 = time.perf_counter()
        try:
            resp = session.get(args.base + make_path(), cookies=COOKIES if auth else None, timeout=60)
            ok = resp.status_code == 200
            size = len(resp.content)
        except requests.RequestException:
            ok, size = False, 0
        dt = (time.perf_counter() - t0) * 1000
        with lock:
            s = stats[name]
            s["lat"].append(dt)
            s["bytes"] += size
            if not ok:
                s["err"] += 1


def pct(values, p):
    if not values:
        return 0.0
    values = sorted(values)
    return values[min(len(values) - 1, int(len(values) * p))]


start = time.time()
deadline = start + args.duration
with ThreadPoolExecutor(max_workers=args.concurrency) as pool:
    list(pool.map(worker, range(args.concurrency)))
elapsed = time.time() - start

rows, total, errors, all_lat = [], 0, 0, []
for name, s in stats.items():
    n = len(s["lat"])
    total += n
    errors += s["err"]
    all_lat += s["lat"]
    rows.append({
        "endpoint": name, "requests": n, "errors": s["err"],
        "p50_ms": round(pct(s["lat"], 0.50), 1), "p95_ms": round(pct(s["lat"], 0.95), 1),
        "p99_ms": round(pct(s["lat"], 0.99), 1),
        "avg_kb": round(s["bytes"] / max(n, 1) / 1024, 1),
    })
summary = {
    "label": args.label, "concurrency": args.concurrency, "duration_s": round(elapsed, 1),
    "total_requests": total, "rps": round(total / elapsed, 1), "errors": errors,
    "error_pct": round(100 * errors / max(total, 1), 2),
    "overall_p50_ms": round(pct(all_lat, 0.50), 1), "overall_p95_ms": round(pct(all_lat, 0.95), 1),
    "overall_mean_ms": round(statistics.fmean(all_lat), 1) if all_lat else 0,
    "endpoints": rows,
}
print(json.dumps(summary, indent=2))
if args.out:
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(summary, fh, indent=2)
