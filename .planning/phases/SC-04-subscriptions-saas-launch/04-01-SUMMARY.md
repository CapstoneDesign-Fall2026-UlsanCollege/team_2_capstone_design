# SC-04 Wave 1 Summary: Subscription Checkout & Idempotent Recurring Cycle Runner (Plan 04-01)

**Executed:** 2026-10-31  
**Phase:** SC-04 Subscriptions, SaaS Landing & Production Launch  
**Plan:** 01 of 4  
**Status:** Complete (100%)  
**Commit:** `saas/main`

---

## 1. Executive Summary

Plan 04-01 delivers the core subscription checkout lifecycle and idempotent recurring billing engine. Shoppers purchasing prepaid commitment variants (3, 6, 12 months) or pay-per-delivery plans have active `Subscription` records provisioned upon checkout and verified via Khalti payment callbacks. Initial orders fulfill Cycle 1, and subsequent recurring cycles are processed via `manage.py run_subscription_cycles` (or merchant console "Run Cycle Now" API).

Fulfillment orders for prepaid commitments are generated as $0 orders (`subtotal_minor = 0`, `total_minor = 0`, `status = "CONFIRMED"`, `payment_status = "PAID"`), decrementing `cycles_remaining` until commitment completion (`status = "COMPLETED"`). The runner enforces strict date-based idempotency keys (`SUB-CYCLE-{sub_id}-{date}`), completely preventing duplicate order creation or accidental re-billing.

---

## 2. Key Accomplishments

### A. Subscription Domain Service (`backend/subscriptions/services.py`)
- `create_subscription_for_item`: Provisions subscription from checkout orders, snapshots delivery address, calculates commitment cycles (`cycles_total`, `cycles_remaining = cycles_total - 1`), unit prices, and intervals.
- `activate_order_subscriptions`: Atomically transitions subscriptions from `PENDING_PAYMENT` to `ACTIVE` upon payment verification.
- `execute_due_subscription_cycles`:
  - Scans active subscriptions where `next_delivery_date <= target_date`.
  - Idempotency guard: Skips if `Order(payment_ref=SUB-CYCLE-{sub.id}-{target_date})` exists.
  - Prepaid plans: Generates $0 fulfillment order, decrements `cycles_remaining`, advances `next_delivery_date`, marks `COMPLETED` when remaining hits 0.
  - Pay-per-delivery plans: Generates renewal order (`PENDING_PAYMENT`, `UNPAID`) and advances delivery date.
  - Logs `OrderEvent` audit timeline entries.

### B. Checkout & Verification Integration (`backend/stores/api.py`)
- `StoreCheckoutPlaceView`: Preserves selling plan metadata and provisions subscription records in atomic transaction.
- `StoreKhaltiVerifyView`: Activates pending subscriptions upon Khalti sandbox verification.
- `MerchantRunSubscriptionCyclesView` (`POST /api/merchant/stores/<storeSlug>/subscriptions/run-cycles/`): Allows store owner to trigger cycles from merchant console.
- `SubscriptionSerializer`: Enriched with `plan_code`, `is_prepaid`, `customer_email`, `customer_name`, and `customer_phone`.

### C. CLI Management Command (`backend/subscriptions/management/commands/run_subscription_cycles.py`)
- `manage.py run_subscription_cycles [--store <slug>] [--date <YYYY-MM-DD>]` for cron / background workers.

### D. Automated Tests (`backend/stores/tests/test_isolation.py`)
- Added `test_prepaid_subscription_checkout_and_idempotent_cycles`:
  - Places 3M prepaid order, verifies initial `Subscription` in `PENDING_PAYMENT`.
  - Simulates Khalti verification, verifies transition to `ACTIVE`.
  - Executes Cycle 2: Generates $0 fulfillment order, decrements remaining cycles to 1.
  - Re-executes on same date: Confirms 0 orders generated (idempotency verified).
  - Executes Cycle 3: Decrements remaining cycles to 0, transitions status to `COMPLETED`.
- Added `test_merchant_run_subscription_cycles_isolation`:
  - Verifies merchant can trigger cycles and cross-tenant access returns HTTP 404.
- All 25 Django tests pass in 10.1s.

---

## 3. Verification & Compliance Evidence

| Check | Tool / Command | Result |
| :--- | :--- | :--- |
| **Surface Isolation** | `node scripts/check-surfaces.mjs` | `SURFACE_ISOLATION_OK` |
| **TypeScript Compilation** | `npm run typecheck` | Passed (0 errors) |
| **Django Test Suite** | `python manage.py test accounts stores.tests.test_isolation` | 25/25 tests passed (OK) |
| **Idempotent Billing** | `test_prepaid_subscription_checkout_and_idempotent_cycles` | Verified 0 duplicate orders |
| **Cross-Tenant Security** | `test_merchant_run_subscription_cycles_isolation` | 404 on unauthorized stores |
