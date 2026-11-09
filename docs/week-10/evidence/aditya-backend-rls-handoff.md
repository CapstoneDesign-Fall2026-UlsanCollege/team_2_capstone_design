# Week 10 Code Ownership Handoff — Aditya Kumar Gupta

**Student:** Aditya Kumar Gupta  
**GitHub Login:** `@notyouradhee`  
**Role:** Project Lead / Full-Stack & Payment Gateway Integration  
**Primary Stewarded Area:** **Area 1: Core Multi-Tenant Backend, RLS & Payments**  
**Repository Boundary:** `backend/core/`, `backend/stores/`, `backend/orders/`, `backend/catalog/`  
**Learning Partner / Backup:** Rohit Chhantyal (`@Rohit-coder201`)  
**Submission Date:** Monday, November 9, 2026 (For Week 10 Review)

---

## 1. Roadmap Slice Explanation & Behavior

### Slice Name
**Khalti Sandbox ePayment v2 Initiation & Verification with PostgreSQL Row-Level Security (RLS)**

### Repository Location
- [`backend/orders/api.py`](../../../backend/orders/api.py) — `initiate_khalti_payment()` and `verify_khalti_payment()`
- [`backend/core/tenant_context.py`](../../../backend/core/tenant_context.py) — `TenantDatabaseContext` & `apply_postgres_rls_policies()`
- [`backend/stores/tests/test_isolation.py`](../../../backend/stores/tests/test_isolation.py) — Multi-tenant isolation test suite

### Purpose & Plain Language Behavior
When a customer clicks *"Pay with Khalti"* on a ShopCraft storefront (e.g., `/s/brewmellow/checkout`), the backend validates the cart items, recalculates the server-authoritative subtotal in paisa (NPR minor units), and calls Khalti's official ePayment v2 sandbox API (`POST https://a.khalti.com/api/v2/epayment/initiate/`). Khalti returns a payment URL and unique `pidx`. When the customer completes payment, Khalti redirects back to our callback endpoint with the `pidx`. Our backend calls Khalti's `epayment/lookup/` with our server secret key to verify the payment status independently. If verified, the order status transitions to `PAID`. If the gateway is unavailable or offline, the customer can instantly select **Cash on Delivery (COD)**, which creates a `CONFIRMED / COD_PENDING` order immediately with zero third-party network dependency.

### Input, Output, and Dependencies
- **Input:** Store slug, cart items array (product ID, variant SKU, quantity), Nepali shipping address (Province, City, Street, 10-digit Phone), and payment rail choice (`KHALTI` or `COD`).
- **Output:** JSON containing `{ "payment_url": "https://test-pay.khalti.com/...", "pidx": "...", "order_id": 123 }`.
- **Dependencies:** `requests` library, `django.db.transaction`, `core.tenant_context`, Khalti Sandbox API credentials (`KHALTI_SECRET_KEY`).

---

## 2. Area Stewardship & Health Check

### Repository Responsibility
As Area 1 steward, I ensure that all backend models, API views, and database migrations respect multi-tenant boundaries. Every tenant-owned model inherits from `StoreScopedModel` or uses `StoreScopedManager`, ensuring that queries automatically filter by `store_id`.

### Repeatable Health Check Command
```bash
python manage.py test stores.tests.test_isolation
```
**Expected Result:** 33/33 isolation tests pass; confirms Store Owner A probing Store B endpoints receives `HTTP 404 NOT FOUND`.  
**Actual Result:** **PASS.** Ran 33 tests in 4.690s (0 failures, 0 errors).

---

## 3. Disclosed AI Usage & Human Refactoring
- **Tool:** GitHub Copilot & Claude 3.7.
- **Assistance:** Suggested boilerplate payload structure for Khalti v2 API and PostgreSQL RLS policy syntax.
- **Human Refactoring:** Replaced client-provided transaction status with strict server-side verification using `epayment/lookup/`; added atomic transactions (`transaction.atomic()`) around order creation to prevent duplicate orders during network retries.

---

## 4. Non-Author Peer Check

- **Independent Peer Reviewer:** **Kushan Sunuwar** (`@Kushan2191`, QA Lead — Outside Area 1)
- **What Kushan Tested:** Executed a live checkout flow on `/s/brewmellow/checkout` using Khalti Sandbox test credentials (`9800000000` / OTP `987654`).
- **Outcome:** Verified that the order transitioned to `PAID` and generated an immutable order invoice token without author assistance. (Documented in Kushan's handoff).
