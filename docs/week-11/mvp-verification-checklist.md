# MVP Verification Checklist — ShopCraft

**Team:** Team 2 — ShopCraft (Multi-Tenant SaaS for Nepal's Craft Economy)  
**Week:** Week 11 — MVP Verification and Scope Freeze Gate  
**Date:** November 12, 2026 (Submitted for Wednesday, November 18, 2026 EOD KST Deadline)  
**Status:** **PASSED & FEATURE SCOPE FROZEN**  

Feature scope freezes at this gate for every team. If a promised core-path step is incomplete, finishing it is recovery work within the existing promise; it is not new scope.

Use the team's current [AI Use and Code Ownership Audit](../week-10/ai-use-and-code-ownership-audit.md) to find relevant areas, checks, and support paths. Keep area work shared; the steward can help with context, but another teammate should verify the result where practical.

---

## 1. MVP Proof

### What is the core MVP supposed to do?

> **ShopCraft** is a multi-tenant e-commerce platform engineered for Nepal's craft economy. A customer visits Store #1 (**BrewMellow**, artisanal coffee roaster) at `/s/brewmellow`, explores single-origin offerings, configures product options, and adds items to an isolated local cart drawer.  
> The customer proceeds to single-screen checkout, selects a localized Nepali delivery address (Provinces 1–7) with 10-digit mobile number validation, and completes payment via **Khalti Sandbox ePayment v2** (verified server-side via `epayment/lookup/` with `pidx`), OR selects an immediate offline **Cash on Delivery (COD)** fallback with zero external network lag.  
> An instantaneous visual invoice token is generated, and the order appears in the roaster's operations console (`/merchant/brewmellow/orders`), where the merchant updates status through a validated state machine (`PAID → PROCESSING → SHIPPED → DELIVERED`) backed by a 5-second undo toast action.  
> Finally, cross-tenant security is strictly enforced by **PostgreSQL Row-Level Security (RLS)**: a merchant from Store #2 (**Pahadi Honey**, `/s/pahadi-honey`) probing Store #1's orders or catalog is rejected with an immediate **HTTP 404 Not Found**.

### Transparent Boundaries — What the Core MVP Does NOT Claim
* **Sandbox Test Currency Only:** Khalti transactions run strictly in the official Khalti Sandbox (`9800000000` / OTP `987654`). **No real fiat currency is moved.**
* **Subscriptions Formally Cut (PR #45):** Shopper recurring subscriptions were removed in PR #45. All purchases operate strictly as direct one-time retail transactions.
* **No Third-Party Courier Fleet Dispatch:** Logistics tracking is managed internally through merchant dispatch status transitions rather than live third-party courier GPS APIs.
* **Local Health Probe Scope:** The `/api/health/` uptime probe is strictly a local development check of PostgreSQL connection pool latency; kept distinct from production Vercel frontend metrics.

---

## 2. Verification Checklist

| # | Check / Behavior | Expected Result (Written Prior to Test) | Actual Result (Observed at Runtime) | Direct Proof Link | Pass? |
|---|---|---|---|---|---|
| **1** | **Multi-Tenant Storefront Hydration** | Visiting `/s/brewmellow` and `/s/pahadi-honey` dynamically renders distinct store branding, logo, colors, and scoped catalog items. | Both stores render isolated branding and database-seeded items; non-existent slug `/s/unknown-store` returns HTTP 404. | [Live Store 1](https://team-2-capstone-design-one.vercel.app/s/brewmellow) · [Live Store 2](https://team-2-capstone-design-one.vercel.app/s/pahadi-honey) | **Yes** |
| **2** | **Cart Drawer Persistence** | Adding items recalculates price in integer paisa (`Rs.`) and persists across page reloads under store-isolated localStorage key (`store_cart_brewmellow`). | Cart persists across reloads; zero cross-tenant contamination between Store 1 and Store 2 carts. | [Surface Isolation Guard](../week-10/evidence/aanchal-storefront-a11y-handoff.md#repeatable-health-check-command) | **Yes** |
| **3** | **Single-Screen Checkout Form** | Renders localized Nepal 7 Provinces dropdown and requires a valid 10-digit Nepali mobile number (`98xxxxxxxx` or `97xxxxxxxx`). | All 7 provinces selectable; form prevents submission until all required fields and valid phone are provided. | [Commit `7a72592`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7a72592) | **Yes** |
| **4** | **Failure Path — Invalid Phone Rejection** | Submitting an invalid 8-digit phone (`98412345`) or unsupported prefix halts submission before POST and displays accessible red alert text. | Form submission is halted immediately; renders inline error *"Please enter a valid 10-digit Nepali mobile number starting with 98 or 97"*; submit button disabled (`cursor-not-allowed`). | [Aanchal Slice Note](../week-10/slices/slice-aanchal-mobile-checkout.md#3-how-did-we-check-it) | **Yes** |
| **5** | **Khalti Sandbox ePayment v2 Flow** | Initiating Khalti payment redirects to official test portal; authorizing with test mobile `9800000000` / OTP `987654` verifies via server `epayment/lookup/` and sets status `PAID`. | Server confirms `pidx` lookup; order transitions to `PAID` with token `ORD-2026-SC-001`; invoice rendered. Tested independently by non-author Kushan. | [Commit `1374b23`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) · [Kushan QA Note](../week-10/evidence/kushan-independent-qa-handoff.md#test-1-khalti-epayment-v2-sandbox-journey) | **Yes** |
| **6** | **Failure Path — Gateway Cancellation Recovery** | Shopper clicks "Cancel / Return to Merchant" on Khalti portal (`status=User%20canceled`). | Redirects back to `/s/brewmellow/checkout` with alert *"Payment was canceled. Your cart items have been saved"*; cart items, quantities, and addresses 100% intact. Zero orphaned `PAID` rows. | [Commit `89b1420`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/89b1420) · [Kushan QA Note](../week-10/evidence/kushan-independent-qa-handoff.md#test-2-gateway-cancellation-recovery) | **Yes** |
| **7** | **Cash on Delivery (COD) Fallback** | Selecting "Cash on Delivery" radio and submitting creates order instantly with status `CONFIRMED / COD_PENDING` with zero external HTTP calls. | Order created in 68ms with status `CONFIRMED`; inventory decremented; customer redirected to order invoice view. | [Kushan QA Note](../week-10/evidence/kushan-independent-qa-handoff.md#test-3-cash-on-delivery-cod-offline-fallback) | **Yes** |
| **8** | **Merchant Order Fulfillment Queue** | Merchant opens `/merchant/brewmellow/orders` and transitions order status (`PAID → PROCESSING → SHIPPED → DELIVERED`). | Order updates instantaneously; appends an immutable `OrderEvent` audit entry with timestamp and user email. | [Commit `5406c14`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5406c14) · [Rohit Handoff](../week-10/evidence/rohit-resilience-health-handoff.md#1-order-state-machine-slice) | **Yes** |
| **9** | **Merchant 5-Second Undo Toast Action** | Clicking status transition shows 5-second countdown toast allowing merchant to revert accidental status misclicks. | Clicking "Undo" within 5 seconds cleanly reverts order to previous state in database and UI. | [Commit `f54333c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c) | **Yes** |
| **10** | **Failure Path — Illegal Status Transition** | Attempting an illegal backward transition (e.g. `DELIVERED → PENDING` or `CANCELLED → PAID`) via API is rejected. | Backend returns `HTTP 400 Bad Request` with descriptive payload: *"Invalid state transition from DELIVERED to PENDING"*. Tested by non-author Aanchal. | [Rohit Slice Note](../week-10/slices/slice-rohit-order-statemachine.md#3-how-did-we-check-it) | **Yes** |
| **11** | **Local Backend Health Probe** | Curling `http://127.0.0.1:8000/api/health/` tests PostgreSQL engine connectivity and connection pool health. | Returns `HTTP 200 OK` with JSON `{ "status": "ok", "database": "connected", "latency_ms": 42 }`. Simulated DB drop returns HTTP 503. Strictly local development scope. | [Rohit Health Log](../week-10/evidence/rohit-resilience-health-handoff.md#health-probe-response) | **Yes** |
| **12** | **PostgreSQL RLS Tenant Isolation** | Store Owner B (`pahadi-honey`) attempting to query Store Owner A's (`brewmellow`) orders or catalog receives HTTP 404. | All 6 cross-tenant security test methods in `test_isolation.py` pass; database-level RLS blocks cross-tenant leakage. | [`test_isolation.py`](../../../backend/stores/tests/test_isolation.py) | **Yes** |
| **13** | **Backend Automated Test Suite** | Running `python manage.py test accounts catalog orders stores` verifies zero regressions across active apps. | **114 / 114 tests passed in 8.475s** with 0 failures and 0 errors (10 external live network tests skipped). | Verified via `manage.py test` | **Yes** |
| **14** | **Frontend Surface Isolation & TypeScript** | Running `npm run check:surfaces` and `npx tsc --noEmit` verifies strict token boundaries and zero compilation errors. | **`SURFACE_ISOLATION_OK`** confirmed (zero `--color-*` leaks in storefronts); `tsc --noEmit` passed with 0 errors. | Verified via `check-surfaces.mjs` | **Yes** |

---

## 3. Known Bugs and Risks

In accordance with course guidelines, **Work Priority (P0–P3)** is strictly separated from **Defect Severity**:

| Bug / Risk Description | Severity (Defect) | Work Priority (P-Level) & Evidence-Based Reason | Action & Mitigation Plan | Owner |
|---|---|---|---|---|
| **1. Khalti Sandbox Latency / Gateway Downtime** | Major (if portal unreachable) | **P1 (At Risk):** Financial payment completion is essential for demo. Mitigated by immediate Cash on Delivery (COD) fallback that requires zero external network calls. | Strict 8s server-side timeout (`requests.post()`), user-friendly error banners, and 1-click Cash on Delivery checkout fallback. | Aditya Kumar Gupta (`@notyouradhee`) |
| **2. Cold Starts on Neon Serverless PostgreSQL** | Minor (first query 400ms delay) | **P2 (Important):** First request after 5 minutes of inactivity experiences cold start. Does not break functionality. | Configured `CONN_MAX_AGE = 600` for connection pooling; added automated reconnection retry logic in `/api/health/`. | Rohit Chhantyal (`@Rohit-coder201`) |
| **3. Mobile Keyboard Obstructing Submit CTA** | Minor (ergonomic annoyance) | **P2 (Important):** Small screen viewports (360px) can obscure form buttons when mobile keyboard pops up. | Added sticky bottom action bar with `z-50` positioning and dynamic viewport bottom padding on mobile inputs (`pb-28`). | Aanchal Chand Thakuri (`@jaasly07`) |
| **4. Third-Party Live Courier GPS Tracking** | Out of Scope / Cut | **P3 (Defer / Cut):** Nepali couriers lack public developer sandboxes. Formally cut in Week 9 MVP Contract. | Managed through internal merchant fulfillment status transitions (`CONFIRMED → PROCESSING → SHIPPED → DELIVERED`). | Kushan Sunuwar (`@Kushan2191`) |

---

## 4. Feature-Freeze Decision

### Official Decision:
- [x] **The promised core path works reliably. Keep feature scope frozen and move to bounded QA, reliability, setup, or handoff work within the promise.**
- [ ] The promised core path is unstable or has untested required steps. Keep feature scope frozen and assign the smallest recovery step that makes the promise work.

### Scope Boundaries Confirmed Ahead of Sprint 3:
1. **Zero New Features:** No new modules, views, or endpoints will be created during Sprint 3 (Weeks 12–14).
2. **Subscriptions Formally Cut (PR #45):** Shopper recurring subscriptions and merchant subscription workspaces are permanently cut from the MVP scope.
3. **Focus for Sprint 3 (Weeks 12–14):**
   * **Week 12:** Full cross-platform non-author reproduction drill across different OS environments (Windows, macOS, Linux).
   * **Week 13:** WCAG 2.1 AA accessibility and mobile viewport stress testing (360px, 390px, 412px).
   * **Week 14:** Final handoff documentation, clean-install verification, and presentation slide deck draft.

---

## 5. Issues Updated

The following GitHub Issues reflect our current verified evidence and P-level work prioritization:

* **Issue #48:** Khalti Sandbox v2 Gateway & Signature Verification — **P1 (At Risk)** · [PASS — Verified in Commit `1374b23`]
* **Issue #49:** Gateway Cancellation Recovery & Clean-Clone Setup — **P2 (Important)** · [PASS — Verified in Commit `89b1420`]
* **Issue #50:** Mobile Checkout Ergonomics & 7 Provinces Validation — **P2 (Important)** · [PASS — Verified in Commit `7a72592`]
* **Issue #51:** Order State Machine & Local Uptime Probe — **P2 (Important)** · [PASS — Verified in Commit `5406c14`]
* **Issue #52:** PostgreSQL Row-Level Security Cross-Tenant Isolation — **P1 (At Risk)** · [PASS — Verified in Commit `cdb1c0e`]
* **Issue #53:** Shopper Recurring Subscriptions Lifecycle — **P3 (Defer / Cut)** · [RETIRED / CUT in PR #45]

---

## 6. Area and Handoff Check

* **Codebase Area Map Link:** [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map)
* **Codebase Areas & Stewards:**
  * **Area 1: Core Multi-Tenant Backend, RLS & Payments:** Aditya Kumar Gupta (`@notyouradhee`) · Backup: Rohit Chhantyal
  * **Area 2: QA, Non-Author Verification & Runbooks:** Kushan Sunuwar (`@Kushan2191`) · Backup: Aanchal Chand Thakuri
  * **Area 3: Storefront UI/UX, Mobile & Accessibility:** Aanchal Chand Thakuri (`@jaasly07`) · Backup: Kushan Sunuwar
  * **Area 4: DevOps, Backend Health & State Machine:** Rohit Chhantyal (`@Rohit-coder201`) · Backup: Aditya Kumar Gupta

### Cross-Area Non-Author Peer Check Record (Exceeds Criteria):
Each primary area was tested by a non-author teammate outside that stewardship area to confirm usability and failure recovery without author coaching:

1. **Kushan Sunuwar (Area 2 QA) verified Aditya's Payment Flow (Area 1):** Tested Khalti Sandbox ePayment v2 using official test credentials (`9800000000` / OTP `987654`) on live Vercel deployment without author intervention; verified server-side verification and invoice token generation (`PASS`). Verified that no real fiat currency moves.
2. **Rohit Chhantyal (Area 4 DevOps) verified Aanchal's Mobile Checkout Form (Area 3):** Tested form validation on a 360px Android viewport simulator; verified that submitting an invalid 8-digit mobile number (`98412345`) halts form submission before POST and displays accessible red warning text (`PASS`).
3. **Aanchal Chand Thakuri (Area 3 UI) verified Rohit's Order State Machine (Area 4):** Tested merchant order transitions on `/merchant/brewmellow/orders`; verified that an illegal transition (`DELIVERED → PENDING`) is rejected with `HTTP 400 Bad Request` and logged in audit history (`PASS`). Verified local health probe is strictly local development environment.
4. **Aditya Kumar Gupta (Area 1 Backend) verified Kushan's Clean-Clone Runbook (Area 2):** Followed Kushan's `README.md` setup instructions on a fresh machine; confirmed all 114 active tests passed without author intervention (`PASS`).
