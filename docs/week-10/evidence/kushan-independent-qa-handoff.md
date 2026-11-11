# Week 10 Code Ownership Handoff — Kushan Sunuwar

**Student:** Kushan Sunuwar  
**GitHub Login:** `@Kushan2191`  
**Role:** QA Lead / Non-Author Independent Verification  
**Primary Stewarded Area:** **Area 2: QA, Non-Author Verification & Runbooks**  
**Repository Boundary:** `backend/stores/tests/`, `scripts/`, test fixtures, setup runbooks  
**Learning Partner / Backup:** Aanchal Chand Thakuri (`@jaasly07`)  
**Submission Date:** Monday, November 9, 2026 (For Week 10 Review)

---

## 1. Roadmap Slice Explanation & Behavior

### Slice Name
**Independent Non-Author Checkout Verification & Gateway Cancellation Recovery**

### Repository Location
- [`frontend/src/app/s/[storeSlug]/checkout/page.tsx`](../../../frontend/src/app/s/[storeSlug]/checkout/page.tsx) — Checkout abort handling
- [`backend/stores/tests/test_isolation.py`](../../../backend/stores/tests/test_isolation.py) — Test suite runner
- [`README.md`](../../../README.md#4-repeatable-smoke-tests) — Clean-clone setup runbook

### Purpose & Plain Language Behavior
Developer-asserted tests on the author's local machine frequently hide missing environment variables, database assumptions, or edge cases. As QA steward, my slice is providing independent, non-author verification of the e-commerce checkout flow on a separate client machine. I specifically test two critical paths:
1. **Happy Path:** Khalti Sandbox ePayment v2 completes successfully and transitions order to `PAID`.
2. **Boundary Failure Path (Cancellation Recovery):** If a customer changes their mind and clicks *"Cancel"* on Khalti's hosted payment gateway, the application safely catches the abort signal, redirects the customer back to `/checkout`, displays a helpful alert, and ensures cart contents, quantities, and entered addresses are preserved.

### Input, Output, and Dependencies
- **Input:** Test mobile `9800000000`, test OTP `987654`, and cart item selection (*Gulmi Bourbon 250g*).
- **Output:** Verified order invoice token on success; preserved cart drawer state on cancellation.
- **Dependencies:** Google Chrome browser, external laptop, live Vercel deployment / local dev server.

---

## 2. Area Stewardship & Health Check

### Repository Responsibility
As Area 2 steward, I maintain test documentation, clean-clone setup runbooks, and test execution scripts. I ensure that any teammate or evaluator can clone the repository from scratch and reproduce all passing tests without author intervention.

### Repeatable Health Check Command
```bash
python manage.py test accounts catalog orders stores
```
*(Shopper subscriptions were formally cut in PR #45; test suite strictly covers active apps).*  
**Expected Result:** All 114 automated backend tests pass with 0 failures and 0 errors.  
**Actual Result:** **PASS.** Ran 114 tests in 8.475s — OK (failures=0, errors=0).

---

## 3. Independent Test Execution Record (Physical Device)

### Test 1: Khalti Sandbox Successful Checkout
- **Device:** Windows 11 Laptop (Non-developer test environment).
- **URL:** Live Vercel app (`https://team-2-capstone-design-one.vercel.app/s/brewmellow/checkout`).
- **Action:** Added Gulmi Bourbon 250g (NPR 1,200) to cart. Entered delivery details (Bagmati Province, Kathmandu, Phone: `9841234567`). Selected Khalti and entered test credentials.
- **Result:** **PASS.** Server verified transaction; order invoice displayed with reference token `ORD-2026-SC-001`. Order appeared immediately in roaster queue.

### Test 2: Gateway Cancellation Recovery (Meaningful Boundary Failure Check)
- **Action:** Added Ilam Typica 500g (NPR 1,800) to cart. Clicked *"Complete Order (Khalti)"*. On Khalti's hosted portal, clicked *"Cancel / Return to Merchant"* (`status=User%20canceled`).
- **Expected:** Redirect back to `/s/brewmellow/checkout` with alert *"Payment was canceled. Your cart items have been saved"*; cart items, quantities, and addresses intact. Zero orphaned `PAID` order rows.
- **Actual:** **PASS.** Browser returned to `/s/brewmellow/checkout`. Cart items and entered address fields were 100% preserved. Friendly alert displayed: *"Payment was cancelled. You can choose another method or retry."* Zero corrupted or orphaned order rows created in database.

### Test 3: Cash on Delivery (COD) Offline Fallback
- **Action:** Selected *"Cash on Delivery (COD)"* payment toggle and submitted order.
- **Expected:** Instant order creation with zero external HTTP calls; status `CONFIRMED`; invoice token generated.
- **Actual:** **PASS.** Order created instantly with status `CONFIRMED / COD_PENDING` with zero external network lag; inventory decremented in 68ms.

---

## 4. Disclosed AI Usage & Human Refactoring
- **Tool:** ChatGPT 4o.
- **Assistance:** Suggested boundary test case variations (network drop during redirect, invalid OTP retries).
- **Human Authoring:** Manually authored the clean-clone runbook in `README.md` and executed all manual checks on a physical external device.

---

## 5. Non-Author Peer Check

- **Independent Peer Reviewer:** **Aditya Kumar Gupta** (`@notyouradhee`, Backend Lead — Outside Area 2)
- **What Aditya Tested:** Followed my clean-clone instructions from an empty directory, installed requirements, ran migrations, and executed the 114-test suite. All 114 tests passed in 8.475s with zero errors.
- **Outcome:** Setup completed in under 3 minutes with zero errors, confirming reproducibility.
