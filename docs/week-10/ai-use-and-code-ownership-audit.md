# AI Use and Code Ownership Audit — Team 2: ShopCraft

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — **ShopCraft** (Multi-Tenant E-Commerce Platform for Nepal's Craft Economy)  
**Sprint:** Sprint 2 — MVP and Freeze (Weeks 9–11)  
**Date:** Monday, November 9, 2026 (Submitted for Wednesday, November 11, 2026 EOD KST Deadline)  
**Status:** Completed & Independently Verified across all 4 Codebase Areas  
**Repository:** [https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design)  
**Live Deployed Application:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)

> *“AI can help, but your team owns the code you submit. Each student contributes a roadmap slice and helps steward a codebase area.”*

---

## 1. Responsible AI Use Notes

In accordance with course academic honesty guidelines, our team discloses all permitted AI-assisted tools utilized during Sprint 2. Every AI-assisted suggestion underwent manual code review, refactoring, and automated testing before inclusion in the codebase.

| PR / Commit / File | AI Tool Used? | What AI Helped With | What the Team Reviewed or Changed | Test / Review Evidence |
|---|---|---|---|---|
| **Commit `1374b23`**<br>[`backend/orders/api.py`](../../backend/orders/api.py) | **Yes** (GitHub Copilot) | Suggested boilerplate structure for Khalti Sandbox v2 `epayment/initiate/` payload formatting and JSON parsing. | **Human Refactoring:** Replaced client-trusted status with server-authoritative `epayment/lookup/` signature verification using secret environment variables; added instant Cash on Delivery (COD) fallback rail. | **Verified:** 114 backend tests pass; live sandbox payment verified with test mobile `9800000000` / OTP `987654`. |
| **Commit `cdb1c0e`**<br>[`backend/core/tenant_context.py`](../../backend/core/tenant_context.py) | **Yes** (Claude 3.7) | Suggested SQL template for PostgreSQL Row-Level Security (RLS) policies on tenant-owned tables. | **Human Refactoring:** Removed unsafe bypass methods; bound tenant context to Django thread-locals with automatic `request_finished` cleanup signal; created `setup_postgres_rls` command. | **Verified:** 6 cross-tenant isolation tests in [`test_isolation.py`](../../backend/stores/tests/test_isolation.py); Store Owner A probing Store B receives HTTP 404. |
| **Commit `7abc09c` & `b8d5a64`**<br>[`backend/stores/api.py`](../../backend/stores/api.py) & `frontend/` | **No** (Human Authored) | N/A — Authored directly by Aditya Kumar Gupta. | Enforced HTTP 401/403 for unauthorized merchant store access; added merchant authorization matrix test; hardened Next.js merchant guard against non-existent stores and open redirect targets. | **Verified:** 114 backend tests pass (including new authorization matrix tests); unauthorized requests blocked. |
| **Commit `f54333c`**<br>[`frontend/src/components/merchant/OrderDetailSheet.tsx`](../../frontend/src/components/merchant/OrderDetailSheet.tsx) | **Yes** (GitHub Copilot) | Generated Tailwind UI layout skeleton for order status badges and action buttons. | **Human Refactoring:** Integrated 5-second undo toast state machine (`PAID → PROCESSING → SHIPPED → DELIVERED`); added keyboard focus management and ARIA labels. | **Verified:** Tested status updates in browser; verified illegal state transitions return HTTP 400. |
| **Commit `a3e62f7`**<br>[`backend/stores/models.py`](../../backend/stores/models.py) | **Yes** (ChatGPT 4o) | Suggested composite database indexes for `(store_id, slug)` and `(store_id, created_at)`. | **Human Refactoring:** Audited Django migration dependency graph; ensured unique constraints are scoped per tenant rather than global. | **Verified:** Database migration `0003` applied cleanly; zero N+1 queries on merchant overview. |
| **Commit `7a72592`**<br>[`frontend/src/components/storefront/CheckoutForm.tsx`](../../frontend/src/components/storefront/CheckoutForm.tsx) | **No** (Human Authored) | N/A — Authored directly by Aanchal Chand Thakuri. | Implemented Nepal's 7 Provinces dropdown, 10-digit mobile number regex validation, and responsive mobile layout. | **Verified:** Tested on 360px (Android) and 390px (iOS) viewports; 100% WCAG AA contrast. |
| **Commit `00ff1b2`**<br>[`README.md`](../../README.md) | **No** (Human Authored) | N/A — Authored directly by Rohit Chhantyal and Aditya Gupta. | Documented clean development setup, multi-tenant smoke test scripts, and `/api/health/` uptime probe instructions. | **Verified:** Kushan Sunuwar reproduced entire installation on a clean laptop without author help. |

---

## 2. Codebase Area Map

Our codebase is organized into four distinct areas. Each area is stewarded by a team member based on their strengths, supported by a designated backup partner, and protected by repeatable automated health checks. Area stewardship is linked from the [Team Working Agreement](../week-01/team-working-agreement.md#codebase-area-stewardship-map-week-10-update) and the shared Weekly Report.

*(Note on Scope Boundary: Following PR #45, recurring shopper subscriptions were formally removed from the MVP. All purchases on ShopCraft storefronts are direct one-time retail purchases).*

| Area in ShopCraft | Repository Boundary & Responsibility | Primary Steward | Backup / Learning Partner | Repeatable Health or Review Check | Existing Evidence & Boundaries |
|---|---|---|---|---|---|
| **Area 1: Core Multi-Tenant Backend, RLS & Payments** | `backend/core/`<br>`backend/stores/`<br>`backend/orders/`<br>`backend/catalog/` | **Aditya Kumar Gupta** (`@notyouradhee`) | Rohit Chhantyal (`@Rohit-coder201`) | `python manage.py test stores.tests.test_isolation`<br>Verifies that cross-tenant queries return HTTP 404 and RLS prevents data leaks. | **PASS.** 33 isolation tests pass in 4.7s. *Boundary: Sandbox test credits only; no real fiat currency moves.* |
| **Area 2: QA, Non-Author Verification & Runbooks** | `backend/stores/tests/`<br>`scripts/`<br>Root test runners & documentation | **Kushan Sunuwar** (`@Kushan2191`) | Aanchal Chand Thakuri (`@jaasly07`) | `python manage.py test accounts catalog orders stores`<br>Runs full test suite across active apps. | **PASS.** 114 tests pass in 8.5s. Independent clean-clone reproduction documented in receipt. |
| **Area 3: Storefront UI/UX, Mobile & Accessibility** | `frontend/src/app/s/[storeSlug]/`<br>`frontend/src/components/storefront/`<br>`frontend/src/components/ui/` | **Aanchal Chand Thakuri** (`@jaasly07`) | Kushan Sunuwar (`@Kushan2191`) | `npx tsc --noEmit && node scripts/check-surfaces.mjs`<br>Verifies 0 TypeScript errors and zero cross-surface state leakage. | **PASS.** 0 type errors; `SURFACE_ISOLATION_OK`. Audited at 360px and 390px mobile viewports. |
| **Area 4: DevOps, Backend Health & State Machine** | `backend/orders/models.py`<br>`backend/core/views.py` (`/api/health/`)<br>`frontend/src/components/merchant/` | **Rohit Chhantyal** (`@Rohit-coder201`) | Aditya Kumar Gupta (`@notyouradhee`) | `curl http://localhost:8000/api/health/`<br>Verifies backend uptime and PostgreSQL connection pooling (HTTP 200). | **PASS.** Uptime probe returns status OK; order lifecycle rejects illegal state transitions with HTTP 400. |

---

## 3. Individual Slice and Stewardship Check

Each student owns one specific, roadmap-aligned vertical slice that they can locate, explain, and defend, while stewarding their primary codebase area.

| Student | Roadmap Slice: File/Function + Behavior | Primary Area Stewarded | Explain Status | How Slice was Checked & by Whom (Non-Author Peer Check) | Evidence Link |
|---|---|---|---|---|---|
| **Aditya Kumar Gupta**<br>(`@notyouradhee`) | **Khalti Sandbox v2 & Server Verification:**<br>[`backend/orders/api.py`](../../backend/orders/api.py): `initiate_khalti_payment()` & `verify_khalti_payment()`.<br>*Behavior:* Initiates payment signature with Khalti API, verifies callback token `pidx` server-side, updates order to `PAID`, with COD fallback. | Area 1: Core Multi-Tenant Backend, RLS & Payments | **Can Explain** | **Checked by Kushan Sunuwar (`@Kushan2191`):** Executed checkout on live Vercel deployment; verified payment redirect, OTP submission, and server verification without author help. | [Aditya Slice](slices/slice-aditya-khalti-backend.md)<br>[Aditya Handoff](evidence/aditya-backend-rls-handoff.md) |
| **Kushan Sunuwar**<br>(`@Kushan2191`) | **Gateway Cancellation Recovery & QA Runbook:**<br>[`frontend/src/app/s/[storeSlug]/checkout/page.tsx`](../../frontend/src/app/s/[storeSlug]/checkout/page.tsx): Gateway abort handling.<br>*Behavior:* When a customer cancels payment on Khalti's hosted portal, user is redirected back to checkout with cart items, quantities, and addresses intact. | Area 2: QA, Non-Author Verification & Runbooks | **Can Explain** | **Checked by Aditya Kumar Gupta (`@notyouradhee`):** Cloned repo on a clean laptop, ran setup commands from Kushan's runbook, and verified zero-dependency reproduction. | [Kushan Slice](slices/slice-kushan-checkout-cancellation.md)<br>[Kushan Handoff](evidence/kushan-independent-qa-handoff.md) |
| **Aanchal Chand Thakuri**<br>(`@jaasly07`) | **Localized Nepali Mobile Checkout & A11y:**<br>[`frontend/src/components/storefront/CheckoutForm.tsx`](../../frontend/src/components/storefront/CheckoutForm.tsx): Form inputs & touch targets.<br>*Behavior:* Enforces Nepal 7 Provinces dropdown, 10-digit phone regex, 52px touch-friendly buttons (`py-3 px-6`), and WCAG AA contrast ($>4.5:1$). | Area 3: Storefront UI/UX, Mobile & Accessibility | **Can Explain** | **Checked by Rohit Chhantyal (`@Rohit-coder201`):** Tested on simulated 360px Android and 390px iPhone viewports; verified mobile keyboards do not obscure checkout CTAs. | [Aanchal Slice](slices/slice-aanchal-mobile-checkout.md)<br>[Aanchal Handoff](evidence/aanchal-storefront-a11y-handoff.md) |
| **Rohit Chhantyal**<br>(`@Rohit-coder201`) | **Order State Machine & Uptime Health Probe:**<br>[`backend/orders/models.py`](../../backend/orders/models.py): `Order.transition_status()` & `/api/health/`.<br>*Behavior:* Validates legal order transitions (`PAID → PROCESSING → SHIPPED → DELIVERED`), logs `OrderEvent`, and exposes database readiness probe. | Area 4: DevOps, Backend Health & State Machine | **Can Explain** | **Checked by Aanchal Chand Thakuri (`@jaasly07`):** Tested status transitions on merchant console; verified illegal transition (`DELIVERED → PENDING`) returns HTTP 400. | [Rohit Slice](slices/slice-rohit-order-statemachine.md)<br>[Rohit Handoff](evidence/rohit-resilience-health-handoff.md) |

---

## 4. Code We Need to Rewrite, Understand Better, or Freeze

Ahead of the **Week 11 MVP Feature Freeze Gate (November 12, 2026)**, the team audited all remaining code gaps:

| Location / Behavior | Current Status / Gap | Assigned Owner | Next Step & Check | Due Point |
|---|---|---|---|---|
| **Cloudinary Media Uploads**<br>`backend/stores/api.py` | Store banner and product image uploads depend on Cloudinary cloud credentials; offline local dev uses local media storage fallback. | Aditya Kumar Gupta (`@notyouradhee`) | Add explicit unit test asserting graceful fallback to placeholder image when Cloudinary credentials are empty. | Week 11 Freeze (Nov 12) |
| **Khalti Timeout Handling**<br>`frontend/src/app/s/[storeSlug]/checkout/khalti-return/` | If Khalti's server-side verification lookup takes $>8$ seconds due to gateway network congestion, UI shows generic error. | Kushan Sunuwar (`@Kushan2191`) | Implement friendly retry button with instant option to switch to Cash on Delivery (COD). | Week 11 Freeze (Nov 12) |
| **Merchant Mobile Table View**<br>`frontend/src/app/merchant/[storeSlug]/orders/` | Orders table on merchant console requires horizontal scrolling on screens $<380\text{px}$. | Aanchal Chand Thakuri (`@jaasly07`) | Add responsive card-list view for mobile viewports below 400px. | Week 11 Freeze (Nov 12) |
| **Database Connection Pooling**<br>`backend/core/settings.py` | Neon serverless PostgreSQL connections can cold-start if idle for $>5$ minutes. | Rohit Chhantyal (`@Rohit-coder201`) | Verify connection max age (`CONN_MAX_AGE = 600`) and test automatic reconnect resilience. | Week 11 Freeze (Nov 12) |

---

## 5. Non-Author Peer Verification & Boundary Checks

Every area was independently reviewed and verified by a peer outside the area to test real boundaries and failure handling:

### Peer Check 1: Kushan Sunuwar independently tests Aditya's Backend Payment Flow
- **Tester:** Kushan Sunuwar (QA Lead — Outside Area 1)
- **Slice Traced:** `initiate_khalti_payment` & `verify_khalti_payment` in `backend/orders/api.py`.
- **Expected Result:** Valid test credentials create an order with status `PAID`. Gateway cancellation aborts cleanly and restores cart.
- **Actual Result:** **PASS.** Entered test mobile `9800000000` / OTP `987654`; order verified via Khalti lookup and returned invoice token `ORD-2026-BM-001`. On cancel, cart preserved items with zero corruption.
- **Evidence:** Documented in [`evidence/kushan-independent-qa-handoff.md`](evidence/kushan-independent-qa-handoff.md).

### Peer Check 2: Rohit Chhantyal independently tests Aanchal's Mobile Storefront Form
- **Tester:** Rohit Chhantyal (DevOps Lead — Outside Area 3)
- **Slice Traced:** `CheckoutForm.tsx` validation logic in `frontend/src/components/storefront/`.
- **Expected Result:** Submitting an invalid 9-digit mobile number (`984123456`) triggers inline error message and blocks API call.
- **Actual Result:** **PASS.** Form validation halted submission with red alert *"Please enter a valid 10-digit Nepali mobile number"*; submit button disabled until valid 10-digit number entered.
- **Evidence:** Documented in [`evidence/aanchal-storefront-a11y-handoff.md`](evidence/aanchal-storefront-a11y-handoff.md).

### Peer Check 3: Aanchal Chand Thakuri independently tests Rohit's Order State Machine
- **Tester:** Aanchal Chand Thakuri (UI Lead — Outside Area 4)
- **Slice Traced:** `Order.transition_status()` in `backend/orders/models.py`.
- **Expected Result:** Transitioning from `DELIVERED` back to `PENDING` is rejected by state machine.
- **Actual Result:** **PASS.** Backend returned `HTTP 400 Bad Request` with message *"Invalid state transition from DELIVERED to PENDING"*; 5-second undo toast correctly reversed valid intermediate transitions.
- **Evidence:** Documented in [`evidence/rohit-resilience-health-handoff.md`](evidence/rohit-resilience-health-handoff.md).

### Peer Check 4: Aditya Kumar Gupta independently tests Kushan's Clean-Clone Setup
- **Tester:** Aditya Kumar Gupta (Project Lead — Outside Area 2)
- **Slice Traced:** Clean clone setup runbook in `README.md`.
- **Expected Result:** Fresh clone in empty directory installs dependencies, runs migrations, seeds Store #1, and passes tests without author assistance.
- **Actual Result:** **PASS.** Executed `python manage.py test accounts catalog orders stores`; 114/114 tests passed in 8.475s with 0 failures (including new merchant authorization matrix tests).
- **Evidence:** Documented in [`evidence/aditya-backend-rls-handoff.md`](evidence/aditya-backend-rls-handoff.md).

---

## 6. Review Notes & Handoff Summary

- **Summary of Current State:** The team maintains verifiable code ownership, clear area stewardship, transparent AI disclosures, and non-author peer verification across all 4 areas.
- **Cross-Area Dependencies:** 
  - Storefront UI (Aanchal) $\rightarrow$ Backend Checkout API (Aditya) $\rightarrow$ Order State Machine (Rohit) $\rightarrow$ Test Suite Runner (Kushan).
- **Demo Boundaries:** Khalti Sandbox only; no real money moves. Shopper recurring subscriptions, live third-party courier dispatch APIs, and AI recommender questionnaires are formally cut per [`mvp-contract.md`](../week-09/mvp-contract.md) and PR #45.
- **Next Action:** Lock all feature commits ahead of the **Week 11 MVP Freeze Gate** (Thursday, November 12, 2026).
