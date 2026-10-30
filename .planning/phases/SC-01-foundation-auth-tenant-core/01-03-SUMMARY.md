# Phase 1 Plan 03: Multi-Tenant Catalog, Orders & Store Isolation Summary

**Execution Date:** 2026-10-30  
**Phase:** `SC-01-foundation-auth-tenant-core`  
**Plan:** `01-03-PLAN.md` (Wave 3)  
**Status:** Complete (All acceptance criteria verified green)  

---

## 1. Objectives & Outcomes

Plan `01-03` completed the multi-tenant core domain schema, flagship BrewMellow Store #1 seed data, and cross-tenant isolation enforcement:

1. **Shared-Schema Multi-Tenant Domain Models (`FOUND-03`, `D-03`, `D-04`):**
   - `catalog.Product`, `catalog.Variant`, `catalog.SellingPlan`
   - `orders.Order`, `orders.OrderItem`, `orders.OrderEvent`
   - `subscriptions.Subscription`
   - Every model binds a mandatory `store` Foreign Key, carries `StoreScopedManager` (`objects.for_store(store)`), and enforces integer paisa money units (`price_minor`, `subtotal_minor`, `total_minor`).
2. **Tenant & Merchant API Mixins (`AUTH-03`, `D-03`, `D-08`):**
   - `StorePublicMixin`: Resolves active store from URL slug or returns HTTP 404.
   - `StoreMerchantMixin`: Checks `StoreMembership.objects.for_store(store).filter(user=request.user).exists()` and raises HTTP 404 (strictly 404, never 403 or 200) on unauthorized merchant probes.
   - `StoreScopedSerializerMixin`: Strips incoming `store` or `store_id` payloads, preventing tenant reassignments.
   - Public endpoints: `/api/stores/<slug>/`, `/api/stores/<slug>/catalog/`, `/api/stores/<slug>/customer/bootstrap/`, `/api/stores/<slug>/orders/`.
   - Merchant endpoints: `/api/merchant/stores/<slug>/overview/`, `/api/merchant/stores/<slug>/products/`, `/api/merchant/stores/<slug>/orders/`, `/api/merchant/stores/<slug>/customers/`, `/api/merchant/stores/<slug>/subscriptions/`.
3. **Idempotent Flagship Seed (`seed_brewmellow`, `FOUND-04`, `D-04`, `D-05`):**
   - `manage.py seed_brewmellow`:
     - Merchant owner `aarav.shrestha@brewmellow.com.np`.
     - Store #1 `brewmellow` (preset `editorial-warm`).
     - 3 Himalayan origins (`gulmi-reserve`, `ilam-gold`, `nuwakot-heritage`).
     - 12 variants with exact paisa prices (`40000..260000` paisa). All 150g variants set `allow_subscription=False` (Trial Pack rule); 250g, 500g, 1kg allow subscriptions.
     - 4 selling plans (`bm-payg`, `bm-3m`, `bm-6m`, `bm-12m`).
     - 3 realistic Nepali shoppers and orders (`BM-2026-0001`, `0002`, `0003`) with item snapshots and status events.
     - 2 active subscriptions.
4. **Automated Cross-Tenant & Cross-Shopper Isolation Suite (`AUTH-03`, `FOUND-05`):**
   - `backend/stores/tests/test_isolation.py` proves HTTP 404 on all competitor merchant endpoints, payload injection immunity, per-store customer isolation, and cross-shopper 404 isolation.

---

## 2. Tasks Executed

| Task | Title | Commit | Status |
|------|-------|--------|--------|
| Task 1 | End-to-end Multi-Tenant Schema & Isolation Mixins Tracer (Catalog, Orders, Mixins & StoreScoped Endpoints) | `44f93cb` | Done |
| Task 2 | Subscription Domain Model & Idempotent `seed_brewmellow` Flagship Tenant #1 Command | `44f93cb` | Done |
| Task 3 | Automated Cross-Tenant & Cross-Shopper HTTP 404 Isolation Suite | `44f93cb` | Done |

---

## 3. Verification Evidence

1. **Automated Test Suite:**
   - Command: `backend/venv/Scripts/python.exe backend/manage.py test accounts stores.tests.test_isolation --verbosity 2`
   - Ran 18 tests in 6.01s: **OK**.
     - `TenantIsolationTests`:
       - `test_merchant_cross_store_endpoints_return_404`: PASS
       - `test_store_field_never_writable_from_payload`: PASS
       - `test_global_user_provisions_isolated_per_store_customers`: PASS
       - `test_shopper_cross_user_order_and_address_return_404`: PASS
       - `test_seed_brewmellow_double_run_idempotency_and_paisa_matrix`: PASS
     - `accounts` tests (13 tests): ALL PASS
2. **Double Seed Idempotency:**
   - Ran `manage.py seed_brewmellow` twice:
     - 3 Products, 12 Variants (3 one-time only at 150g, 9 subscription-enabled), 4 Selling Plans, 3 Orders, 2 Subscriptions. Zero duplicate rows generated.

---

## 4. Key Decisions & Discoveries

- **`get_or_create` on filtered querysets:** In `provision_store_customer`, passing `store=store, email=email` explicitly avoids `IntegrityError` when `get_or_create` triggers `create()`.
- **404 over 403 for Tenant Probes:** Following ASVS V4.1 and D-03, unauthorized merchant requests return HTTP 404 to avoid leaking competitor existence or metadata.

---

## 5. Next Steps

Proceed directly to **Wave 3: Plan `01-04-PLAN.md`** (Three-Surface CSS Tokens, Storefront & Merchant Shells, and UI Utilities):
- Configure `frontend/src/app/globals.css` with exact `DESIGN.md` §2 tokens (`--sc-*`, `.console`, `[data-store-theme]`).
- Build font loading and surface isolation layouts (`(platform)`, `merchant/[storeSlug]`, `s/[storeSlug]`).
- Create leaf pages for `/s/[storeSlug]/page.tsx` and `/merchant/[storeSlug]/page.tsx`.
- Create `frontend/src/lib/utils.ts` and verify with `check-surfaces.mjs`.
