# Core Demo Evidence Matrix — Team 2: ShopCraft

**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Evidence Review Date:** 2026/11/04 (Asia/Kathmandu)  
**Evaluator Reference:** Capstone Design Fall 2026 Week 9 Deliverable

---

## 1. Core Demonstration Journey

$$\text{Storefront } (/s/\text{brewmellow}) \longrightarrow \text{Product Selection} \longrightarrow \text{Single-Screen Checkout} \longrightarrow \text{Khalti Sandbox / COD} \longrightarrow \text{Confirmation} \longrightarrow \text{Merchant Console} \longrightarrow \text{Tenant Isolation 404 Guard}$$

---

## 2. Granular Evidence Matrix

Every row states the exact tested condition, environment, observable result, and explicit engineering boundaries.

| User Journey Step / Component | Status | Actual Verifiable Evidence | Limitations & Boundaries | Assigned Owner & Verifier |
|---|---|---|---|---|
| **1. Multi-Tenant Database Isolation (RLS)** | **PASS** | 114/114 Django tests pass in 8.475s (`python manage.py test accounts catalog orders stores`). Store Owner A querying Store B's endpoints returns HTTP 404 (`test_isolation.py`). | Tested against PostgreSQL RLS scripts and SQLite test runner. | `notyouradhee` (Aditya) & `Rohit-coder201` (Rohit) |
| **2. Storefront Discovery (`/s/brewmellow`)** | **PASS** | Live deployment on Vercel over HTTPS. Renders BrewMellow's single-origin coffees (Gulmi, Ilam, Nuwakot) with price, roast profile, and terroir elevation. | Tested on Chrome desktop and mobile viewports. | `jaasly07` (Aanchal) & `notyouradhee` (Aditya) |
| **3. Cart Drawer State & Storage** | **PASS** | Adding items recalculates subtotal and preserves quantities across tab reload using store-scoped localStorage key (`store_cart_brewmellow`). | Verified via `check-surfaces.mjs`; zero cross-tenant contamination. | `jaasly07` (Aanchal) |
| **4. Single-Screen Checkout Form** | **PASS** | Address inputs (Province 1–7, City, Street, 10-digit Phone) enforce regex validation; invalid phone numbers block progression. | Localized to Nepal; does not support international postal codes. | `notyouradhee` (Aditya) |
| **5. Khalti Sandbox Payment Flow** | **PASS** | Clicking 'Pay with Khalti' calls backend `epayment/initiate/`, redirects to Khalti test gateway, enters test phone `9800000000` / OTP `987654`, and verifies via `epayment/lookup/` with `pidx`. | **Sandbox Test Credits Only.** No real money is transferred. | `Kushan2191` (Kushan — Non-author test) |
| **6. Khalti Payment Cancellation Edge Case** | **PASS** | User cancels payment on Khalti gateway; redirected back to checkout with cart items intact and notification displayed. | Verified independently by Kushan Sunuwar on separate device. | `Kushan2191` (Kushan) |
| **7. Cash on Delivery (COD) Fallback** | **PASS** | Offline payment method selected; order creates immediately with status `CONFIRMED / COD_PENDING` without external gateway calls. | Zero third-party network dependency; ensures demo resilience. | `notyouradhee` (Aditya) & `Kushan2191` (Kushan) |
| **8. Customer Order Invoice & Confirmation** | **PASS** | Instant confirmation page renders order ID, delivery address, items, and Khalti transaction reference token. | Printable receipt view supported via browser print styling. | `jaasly07` (Aanchal) |
| **9. Merchant Fulfillment Console (`/merchant/brewmellow/orders`)** | **PASS** | Merchant views pending orders, clicks status transition (`PAID → PROCESSING → SHIPPED → DELIVERED`), and verifies audit event log. | Backed by 5-second undo toast action in Commit `f54333c`. | `Rohit-coder201` (Rohit) |
| **10. Backend Health Probe (`/api/health/`)** | **PASS** | Returns HTTP 200 with `{ "status": "ok", "database": "connected" }`. | Confirmed via local curl and automated test assertions. | `Rohit-coder201` (Rohit) |
| **11. Shopper Recurring Subscriptions & Auto-Debit** | **CUT (PR #45)** | Formally removed from MVP in PR #45 and [`mvp-contract.md`](mvp-contract.md). All purchases operate strictly as direct one-time retail checkout with Khalti Sandbox v2 and Cash on Delivery fallback. | Nepali payment gateway sandboxes require explicit OTP per transaction and do not support recurring auto-debit tokens. | Team Consensus |
| **12. Third-Party Courier Live GPS Tracking** | **NOT TESTED / CUT** | Officially cut in [`mvp-contract.md`](mvp-contract.md). Replaced by merchant manual dispatch status updates. | Live courier APIs (Pathao/NepalPost) require commercial merchant agreements. | Team Consensus |

---

## 3. Verification Artifacts & Test Logs

- **Multi-Tenant Security Test:** 6 isolation test methods verified in [`backend/stores/tests/test_isolation.py`](../../backend/stores/tests/test_isolation.py).
- **Backend Automated Test Log:** 114/114 tests passed in 8.475 seconds (`python manage.py test accounts catalog orders stores`).
- **Frontend TypeScript Audit:** 0 errors across entire Next.js codebase (`npx tsc --noEmit`).
- **Surface Isolation Guard:** Passed with zero leak violations (`node scripts/check-surfaces.mjs`).
- **Independent Test Note:** Documented in [`receipts/receipt-kushan.md`](receipts/receipt-kushan.md).
- **Mobile Viewport Audit:** Documented in [`receipts/receipt-aanchal.md`](receipts/receipt-aanchal.md).
- **Backend Resilience Audit:** Documented in [`receipts/receipt-rohit.md`](receipts/receipt-rohit.md).
