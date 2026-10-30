# SC-04 Wave 2 Summary: Merchant Subscriptions Workspace & Shopper Lifecycle Controls (Plan 04-02)

**Executed:** 2026-10-31  
**Phase:** SC-04 Subscriptions, SaaS Landing & Production Launch  
**Plan:** 02 of 4  
**Status:** Complete (100%)  
**Commit:** `saas/main`

---

## 1. Executive Summary

Plan 04-02 delivers a complete, real-time subscription management console at `/merchant/[storeSlug]/subscriptions` along with self-serve lifecycle APIs (`pause`, `resume`, `skip_cycle`, `cancel`). Merchants gain instant operational visibility into recurring subscriber counts, gross Monthly Recurring Value (MRR in NPR), and paused retention queues.

Store owners can trigger immediate subscription cycle processing directly from the console header ("Run Cycle Now") with non-blocking feedback, search and filter subscriptions across status tabs (`All`, `Active`, `Paused`, `Fulfilled`, `Cancelled`), and execute lifecycle state mutations that update delivery schedules without data leakage across tenants.

---

## 2. Key Accomplishments

### A. Merchant & Shopper Subscription Management APIs (`backend/stores/api.py`)
- **Aggregated Listing (`MerchantSubscriptionListView`):**
  - Scoped strictly to the store.
  - Automatically computes live summary metrics: `active_count`, `paused_count`, `completed_count`, `cancelled_count`, and `mrr_minor`.
  - Supports query search (`q`) across subscriber name, email, phone, and product title, plus status tab filtering.
- **Lifecycle Action Controller (`MerchantSubscriptionActionView` & `ShopperSubscriptionActionView`):**
  - `pause`: Transitions status from `ACTIVE` to `PAUSED`.
  - `resume`: Transitions status from `PAUSED` to `ACTIVE`.
  - `skip_cycle`: Advances `next_delivery_date` by the selling plan's interval (e.g. 30 days) without consuming commitment cycles or charging.
  - `cancel`: Terminates subscription (`CANCELLED`).
  - Guards against invalid transitions (e.g. cannot resume terminated plans).

### B. Typed Client Integration (`frontend/src/lib/api.ts`)
- Added `SubscriptionItem`, `SubscriptionMetrics`, and `MerchantSubscriptionsResponse` interfaces.
- Added API methods:
  - `fetchMerchantSubscriptions(storeSlug, params)`
  - `performMerchantSubscriptionAction(storeSlug, subId, action)`
  - `runMerchantSubscriptionCycles(storeSlug, targetDate)`
  - `fetchShopperSubscriptions(storeSlug)`
  - `performShopperSubscriptionAction(storeSlug, subId, action)`

### C. Merchant Console UI
- **Linear Subscription Table (`frontend/src/components/merchant/SubscriptionTable.tsx`):**
  - Columns: Subscriber contact, Plan badge, Product & Variant, Unit Rate (integer NPR), Next Cycle Date, Cycles Progress (`X of Y remaining` or `Ongoing`), Status badge, and Quick row actions (`Pause`, `Resume`, `Skip`, `Cancel`).
  - Empty state with merchant growth callouts.
- **Subscriptions Workspace (`frontend/src/app/merchant/[storeSlug]/subscriptions/page.tsx`):**
  - Header with primary action: "Run Cycle Now".
  - Metric cards: Active Subscribers, Monthly Recurring Value (Rs.), and Paused Subscriptions.
  - Segmented status tabs with live badge counters.
  - Debounced search input.
  - Non-blocking feedback banners.
- **Navigation Integration:**
  - Added "Subscriptions" (`↻`) link to `MerchantSidebar.tsx` and `MerchantBottomNav.tsx`.

### D. Automated Test Suite (`backend/stores/tests/test_isolation.py`)
- Added `test_merchant_subscription_actions_and_isolation`:
  - Verifies merchant can pause, resume, and skip cycle dates.
  - Asserts cross-tenant action attempts return HTTP 404.
- All 26 tests across `accounts` and `stores.tests.test_isolation` pass in 8.3s.

---

## 3. Verification & Compliance Evidence

| Check | Tool / Command | Result |
| :--- | :--- | :--- |
| **Surface Isolation** | `node scripts/check-surfaces.mjs` | `SURFACE_ISOLATION_OK` |
| **TypeScript Compilation** | `npm run typecheck` | Passed (0 errors) |
| **Production Build** | `npm run build` | Passed (`ƒ /merchant/[storeSlug]/subscriptions` generated) |
| **Django Test Suite** | `python manage.py test accounts stores.tests.test_isolation` | 26/26 tests passed (OK) |
| **Cross-Tenant Security** | `test_isolation.py` | Verified HTTP 404 on cross-store actions |
