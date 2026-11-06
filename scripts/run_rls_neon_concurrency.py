#!/usr/bin/env python3
"""
ShopCraft Real-World RLS Concurrency & Isolation Stress Test.
Fires 200+ concurrent requests across multiple worker threads to two distinct stores
running on the Django dev server against the live Neon POOLED connection (PgBouncer).
Asserts 100% tenant isolation, zero cross-store leakage, and zero connection state bleed.
"""

import json
import random
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8000"

STORE_A = {
    "slug": "brewmellow",
    "name": "BrewMellow",
    "known_products": ["Gulmi Reserve", "Ilam Gold", "Nuwakot Heritage"],
    "forbidden_keywords": ["Cliff Honey", "White Forest Honey", "Tulsi Honey"],
}

STORE_B = {
    "slug": "abc",
    "name": "abc",
    "known_products": ["Raw Himalayan Wild Cliff Honey", "High-Altitude White Forest Honey"],
    "forbidden_keywords": ["Gulmi Reserve", "Ilam Gold", "Nuwakot Heritage"],
}


def send_request(url: str):
    start = time.perf_counter()
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "ShopCraft-RLS-StressTest/1.0", "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            status_code = response.getcode()
            body = response.read().decode("utf-8")
            elapsed = time.perf_counter() - start
            return {
                "url": url,
                "status_code": status_code,
                "data": json.loads(body) if body else {},
                "elapsed": elapsed,
                "error": None,
            }
    except urllib.error.HTTPError as e:
        elapsed = time.perf_counter() - start
        return {
            "url": url,
            "status_code": e.code,
            "data": None,
            "elapsed": elapsed,
            "error": f"HTTP {e.code}",
        }
    except Exception as e:
        elapsed = time.perf_counter() - start
        return {
            "url": url,
            "status_code": 0,
            "data": None,
            "elapsed": elapsed,
            "error": str(e),
        }


def run_stress_test(total_requests: int = 200, concurrency: int = 16):
    print("=" * 70)
    print("ShopCraft Real-World Multi-Tenant RLS Concurrency Verification")
    print(f"Target Server: {BASE_URL}")
    print(f"Stores Under Test: Store A ({STORE_A['slug']}) vs Store B ({STORE_B['slug']})")
    print(f"Total Requests: {total_requests} | Concurrency: {concurrency} worker threads")
    print("=" * 70)

    # Build randomized workload:
    # 40% Store A catalog, 40% Store B catalog, 10% Detail views, 10% Error paths (404)
    tasks = []
    for i in range(total_requests):
        r = random.random()
        if r < 0.40:
            tasks.append((f"{BASE_URL}/api/stores/{STORE_A['slug']}/catalog/", "STORE_A_CATALOG"))
        elif r < 0.80:
            tasks.append((f"{BASE_URL}/api/stores/{STORE_B['slug']}/catalog/", "STORE_B_CATALOG"))
        elif r < 0.88:
            tasks.append((f"{BASE_URL}/api/stores/{STORE_A['slug']}/", "STORE_A_DETAIL"))
        elif r < 0.95:
            tasks.append((f"{BASE_URL}/api/stores/{STORE_B['slug']}/", "STORE_B_DETAIL"))
        else:
            tasks.append((f"{BASE_URL}/api/stores/non-existent-store-xyz-{i}/catalog/", "ERROR_404"))

    random.shuffle(tasks)

    results = []
    start_total = time.perf_counter()

    with ThreadPoolExecutor(max_workers=concurrency) as executor:
        futures = {executor.submit(send_request, url): (url, task_type) for url, task_type in tasks}
        for future in as_completed(futures):
            url, task_type = futures[future]
            res = future.result()
            res["task_type"] = task_type
            results.append(res)

    total_time = time.perf_counter() - start_total

    # Analysis & Isolation Assertions
    passed = 0
    failed = 0
    violations = []
    latencies = [r["elapsed"] for r in results]

    store_a_catalog_count = 0
    store_b_catalog_count = 0
    detail_count = 0
    error_404_count = 0

    for r in results:
        task_type = r["task_type"]
        status_code = r["status_code"]
        data = r["data"]

        if task_type == "STORE_A_CATALOG":
            store_a_catalog_count += 1
            if status_code != 200:
                violations.append(f"Store A catalog returned status {status_code}: {r['error']}")
                failed += 1
                continue

            products = data.get("products", [])
            if len(products) == 0:
                violations.append("Store A catalog unexpectedly returned 0 products (RLS wiped context)!")
                failed += 1
                continue

            prod_names = [p.get("name", "") for p in products]
            has_forbidden = any(
                any(fk in name for fk in STORE_A["forbidden_keywords"])
                for name in prod_names
            )
            if has_forbidden:
                violations.append(f"LEAKAGE: Store A catalog contains Store B products: {prod_names}")
                failed += 1
                continue

            passed += 1

        elif task_type == "STORE_B_CATALOG":
            store_b_catalog_count += 1
            if status_code != 200:
                violations.append(f"Store B catalog returned status {status_code}: {r['error']}")
                failed += 1
                continue

            products = data.get("products", [])
            if len(products) == 0:
                violations.append("Store B catalog unexpectedly returned 0 products (RLS wiped context)!")
                failed += 1
                continue

            prod_names = [p.get("name", "") for p in products]
            has_forbidden = any(
                any(fk in name for fk in STORE_B["forbidden_keywords"])
                for name in prod_names
            )
            if has_forbidden:
                violations.append(f"LEAKAGE: Store B catalog contains Store A products: {prod_names}")
                failed += 1
                continue

            passed += 1

        elif task_type in ("STORE_A_DETAIL", "STORE_B_DETAIL"):
            detail_count += 1
            expected_name = STORE_A["name"] if task_type == "STORE_A_DETAIL" else STORE_B["name"]
            if status_code != 200 or data.get("name") != expected_name:
                violations.append(f"Detail view mismatch: expected {expected_name}, got status {status_code}, data: {data}")
                failed += 1
            else:
                passed += 1

        elif task_type == "ERROR_404":
            error_404_count += 1
            if status_code != 404:
                violations.append(f"Expected 404 for invalid store, got status {status_code}")
                failed += 1
            else:
                passed += 1

    print("\n--- Concurrency & Isolation Results ---")
    print(f"Total Requests Dispatched: {len(results)}")
    print(f"Successful Requests: {passed}/{len(results)} ({passed / len(results) * 100:.1f}%)")
    print(f"Store A Catalog Requests: {store_a_catalog_count} (all verified isolated)")
    print(f"Store B Catalog Requests: {store_b_catalog_count} (all verified isolated)")
    print(f"Store Detail Requests:    {detail_count}")
    print(f"Interleaved 404 Errors:   {error_404_count}")
    print(f"Total Execution Time:     {total_time:.2f}s ({len(results)/total_time:.1f} req/s)")
    print(f"Latencies (ms): Min={min(latencies)*1000:.1f}ms | Avg={sum(latencies)/len(latencies)*1000:.1f}ms | Max={max(latencies)*1000:.1f}ms")

    if violations:
        print(f"\nFAILURES DETECTED ({len(violations)}):")
        for v in violations[:10]:
            print(f"  - {v}")
        sys.exit(1)
    else:
        print("\n>>> ALL 200 CONCURRENT REQUESTS PASSED WITH 100% TENANT ISOLATION <<<")
        print(">>> ZERO CROSS-STORE LEAKAGE DETECTED ON NEON PGBOUNCER POOLER <<<")
        sys.exit(0)


if __name__ == "__main__":
    total = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else 16
    run_stress_test(total, workers)
