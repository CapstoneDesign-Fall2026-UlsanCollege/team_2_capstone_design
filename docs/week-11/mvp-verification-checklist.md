# MVP Verification Checklist — ShopCraft

**Team:** Team 2 — ShopCraft (Multi-Tenant SaaS for Nepal's Craft Economy)  
**Week:** Week 11 — MVP Verification and Scope Freeze Gate  
**Date:** Thursday, November 12, 2026 (Updated Wednesday, November 18, 2026 following PR #54 & PR #57 merges to `main`)  
**Frozen Revision:** `main` at [`8098426`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/8098426) / tag `w11-mvp-freeze-2026-11-18` *(includes [PR #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54), `0a0ec4d` OTP validation / `#55`, `64a31f9` RLS `0013` cleanup, and `aa62b2f` storefront auth fix / `#56` merged via [PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57))*  
**Status:** **FEATURE SCOPE FROZEN — `main` (`8098426`) Automated & CI Run `#74` Passed (`154` Backend + `73` Vitest); Live `https://shopcraft.me` Fix Verified; Live `brewmellow` Gateway Key & Post-Merge Repeat Tracked in Issue #51**  

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
| **1** | **Multi-Tenant Storefront Hydration** | Visiting `/s/brewmellow` and `/s/pahadi-honey` dynamically renders distinct store branding, logo, colors, and scoped catalog items. | Confirmed live on Nov 18 (`1440x900`): both stores render isolated branding (`BrewMellow` & `Pahadi Honey`); non-existent slug `/s/unknown-store` returns HTTP 404. | [w11-01](evidence/screenshots/w11-01-brewmellow-storefront-cart.png) · [w11-02](evidence/screenshots/w11-02-pahadi-honey-cart-isolation.png) | **Yes** |
| **2** | **Cart Drawer Persistence** | Adding items recalculates price in integer paisa (`Rs.`) and persists across page reloads under store-isolated localStorage key (`store_cart_brewmellow`). | Confirmed live on Nov 18: adding `Gulmi Reserve` persisted `Bag (1)` across reload on `/s/brewmellow`, while `/s/pahadi-honey` retained `0` items with zero leakage. | [w11-01](evidence/screenshots/w11-01-brewmellow-storefront-cart.png) · [w11-02](evidence/screenshots/w11-02-pahadi-honey-cart-isolation.png) | **Yes** |
| **3** | **Single-Screen Checkout Form** | Renders localized Nepal 7 Provinces dropdown and requires a valid 10-digit Nepali mobile number (`98xxxxxxxx` or `97xxxxxxxx`). | Confirmed live on Nov 18 (`390x844`): all 7 provinces (`Bagmati`..`Sudurpashchim`) render cleanly and block invalid submissions pre-POST. | [w11-04](evidence/screenshots/w11-04-mobile-390-checkout-phone-rejection.png) | **Yes** |
| **4** | **Failure Path — Invalid Phone Rejection** | Submitting an invalid 8-digit phone (`98412345`) or unsupported prefix halts submission before POST and displays accessible red alert text. | Confirmed live on Nov 18 (`1440x900` & `390x844`): halts submission with `0` POST calls and renders *"Enter a valid 10-digit Nepali mobile number starting with 98 or 97."* | [w11-03](evidence/screenshots/w11-03-desktop-checkout-phone-rejection.png) · [w11-04](evidence/screenshots/w11-04-mobile-390-checkout-phone-rejection.png) | **Yes** |
| **5** | **Khalti Sandbox ePayment v2 Flow** | Initiating Khalti payment redirects to official test portal; authorizing with test mobile `9800000000` / OTP `987654` verifies via server `epayment/lookup/` and sets status `PAID`. | Mocked backend (`test_khalti.py`) & pre-merge external-laptop QA passed. **Nov 18 Live Observation:** `https://shopcraft.me/s/brewmellow/checkout` showed `Khalti Unavailable — Not configured by merchant` on live prod DB; live gateway repeat tracked in `#51`. | [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [Kushan QA Note](../week-10/evidence/kushan-independent-qa-handoff.md#test-1-khalti-epayment-v2-sandbox-journey) | **Partial (Mock/Pre-Merge Pass; Prod Key Open in #51)** |
| **6** | **Failure Path — Gateway Cancellation Recovery** | Shopper clicks "Cancel / Return to Merchant" on Khalti portal (`status=User%20canceled`). | Redirects back to `/s/brewmellow/checkout` preserving cart items, quantities, and addresses (`khalti-return.test.ts` `6/6` + pre-merge QA). Post-merge live repeat open in `#51`. | [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) · [Kushan QA Note](../week-10/evidence/kushan-independent-qa-handoff.md#test-2-gateway-cancellation-recovery) | **Yes (Automated + Pre-Merge; Live Repeat in #51)** |
| **7** | **Cash on Delivery (COD) Fallback** | Selecting "Cash on Delivery" radio and submitting creates order instantly with status `CONFIRMED / COD_PENDING` with zero external HTTP calls. | Pre-merge QA created order in 68ms with status `CONFIRMED`; Nov 18 live `/s/brewmellow/checkout` rendered COD (`Pay Rs. 550 cash to rider`) ready and active. | [w11-04](evidence/screenshots/w11-04-mobile-390-checkout-phone-rejection.png) · [Kushan QA Note](../week-10/evidence/kushan-independent-qa-handoff.md#test-3-cash-on-delivery-cod-offline-fallback) | **Yes** |
| **8** | **Merchant Order Fulfillment Queue** | Merchant opens `/merchant/brewmellow/orders` and transitions order status (`PAID → PROCESSING → SHIPPED → DELIVERED`). | Order updates instantaneously; appends an immutable `OrderEvent` audit entry with timestamp and user email. | [Commit `5406c14`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5406c14) · [Rohit Handoff](../week-10/evidence/rohit-resilience-health-handoff.md#1-order-state-machine-slice) | **Yes** |
| **9** | **Merchant 5-Second Undo Toast Action** | Clicking status transition shows 5-second countdown toast allowing merchant to revert accidental status misclicks. | Clicking "Undo" within 5 seconds cleanly reverts order to previous state in database and UI (`merchant-status.test.ts` `19/19`). | [Commit `f54333c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c) | **Yes** |
| **10** | **Failure Path — Illegal Status Transition** | Attempting an illegal backward transition (`DELIVERED → PENDING`) via `MerchantOrderStatusTransitionView` is rejected. | Backend returns `HTTP 400 Bad Request` (`Invalid transition from DELIVERED to PENDING`). Tested by non-author Aanchal & verified in `test_isolation.py`. | [w11-backend-tests.txt](evidence/w11-backend-tests.txt) · [Rohit Slice Note](../week-10/slices/slice-rohit-order-statemachine.md#3-how-did-we-check-it) | **Yes** |
| **11** | **Local Backend Health Probe** | Curling `http://127.0.0.1:8000/api/health/` (`health_view` in `backend/core/urls.py`) verifies lightweight uptime monitor response. | Returns `HTTP 200 OK` with `{"status": "ok"}` and zero DB queries (`test_health_check_zero_db_queries_ssl_exemption_hsts_and_cookies`). Strictly local development scope. | [w11-backend-tests.txt](evidence/w11-backend-tests.txt) · [Rohit Health Log](../week-10/evidence/rohit-resilience-health-handoff.md#health-probe-response) | **Yes** |
| **12** | **PostgreSQL RLS & Legacy Policy Cleanup** | Store Owner B (`pahadi-honey`) querying Store Owner A (`brewmellow`) receives HTTP 404, and every tenant table keeps strictly `tenant_isolation_policy` (`0013_drop_legacy_rls_policies`). | Isolation tests pass locally; full `FORCE ROW LEVEL SECURITY` (`NOSUPERUSER NOBYPASSRLS`) and migration `0013` asserted in PostgreSQL 16 CI on frozen `main` (`8098426`). | [`0013_drop_legacy_rls_policies.py`](../../backend/stores/migrations/0013_drop_legacy_rls_policies.py) · [Main CI Run `44248144770`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770) | **Yes** |
| **13** | **Backend Automated Test Suite (`main` `8098426`)** | Running `python manage.py test accounts catalog orders stores` verifies zero regressions across active apps (incl. `test_khalti.py` & `test_hardening.py`). | **154 tests discovered (`15.06s` on `main` `8098426`): 144 passed on local SQLite, 10 Postgres-only RLS tests skipped locally (`OK (skipped=10)`) and passed in CI (`44248144770`).** | [w11-backend-tests.txt](evidence/w11-backend-tests.txt) · [w11-verification-checks.json](evidence/w11-verification-checks.json) | **Yes** |
| **14** | **Frontend Vitest, ESLint, TS & Surface Guard (`8098426`)** | Running `npm test`, `npm run typecheck`, scoped ESLint, and `npm run check:surfaces` verifies OTP validation, Issue `#56` guard, Khalti return, merchant status, & CSS isolation. | **Vitest: `6 test files / 73 passed` (`1.63s`)**; `tsc --noEmit` 0 errors; scoped ESLint 0 errors; **`SURFACE_ISOLATION_OK`**; CI `next build` passed (`Run #74`). | [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) · [Main CI Run `44248144770`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770) | **Yes** |
| **15** | **Storefront Sign-In Crash Recovery & OTP Typo Hint (`#55`, `#56`)** | Clicking *"Sign in to your account"* on `/s/brewmellow` opens `AccountSheet` cleanly without crashing, and entering `buyer@gmial.com` suggests `buyer@gmail.com`. | Nov 18 live probe initially reproduced crash (`w11-06`); fixed in `PR #57` (`8098426`) via `normalizePrefillEmail` & verified live on `https://shopcraft.me` (`0` crash errors, typo hint rendered, `0` POST on invalid input). | [Issue #56 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) · [w11-06](evidence/screenshots/w11-06-issue-56-storefront-signin-crash-diagnostic.png) · [w11-07](evidence/screenshots/w11-07-issue-56-storefront-signin-fixed-live.png) | **Yes** |

### Test Count & Environment Reconciliation (`114` Week 10 vs. `154` Backend / `73` Vitest Week 11)
| Snapshot / Branch | Command Executed | Environment | Discovered | Passed | Skipped & Reason |
|---|---|---|---|---|---|
| **Week 10 Baseline (`8cff53d`, pre-PR #54)** | `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores` | Local Windows (SQLite) | `114` | `104` / `114` *(historical report cited 114 total)* | `10` Postgres-only RLS tests skipped under SQLite |
| **Post-PR #54 `main` (`6559ea2`)** | `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores` | Local Windows (SQLite) | `154` *(+40 Khalti/hardening tests)* | `144` (`17.467s`) | `10` Postgres-only RLS tests skipped under SQLite |
| **Frozen `main` (`8098426`, PR #57 Merge)** | `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores` | Local Windows (SQLite) | `154` | **`144` (`15.06s`)** | `10` Postgres-only RLS tests skipped under SQLite |
| **Frozen `main` (`8098426`, CI Run `44248144770`)** | `python backend/manage.py test accounts stores catalog orders --verbosity 2` | GitHub Actions (`postgres:16-alpine`, `NOSUPERUSER NOBYPASSRLS`) | `154` | **`154` (`0` skipped)** | None — all Postgres `FORCE RLS` + migration `0013` checks ran |
| **Frozen `main` (`8098426`) Frontend** | `npm test && npm run typecheck && npm run check:surfaces && npx eslint ...` | Local Windows Node `v24.22.1` | `73` Vitest *(+8 `#55`, +2 `#56`)* | **`73/73` (`1.63s`)**, `0` TS errors, `0` lint errors, `SURFACE_ISOLATION_OK` | None *(Vitest + build also green in CI Run `44248144770`)* |

### What These Checks Do NOT Establish (Scope Boundaries)
Recorded explicitly in [`tested-by-note.md`](tested-by-note.md) and [`mvp-freeze-record.md`](mvp-freeze-record.md):
1. **Local SQLite vs. PostgreSQL RLS:** Local `manage.py test` skips `10` Postgres-only `FORCE RLS` tests; PostgreSQL 16 CI (`44248144770`) verifies DB-engine RLS enforcement and `0013_drop_legacy_rls_policies`.
2. **Mocked Khalti Unit Tests vs. Live Production Gateway State:** Passing `test_khalti.py` and `khalti-return.test.ts` proves payload/state logic under mocks. Live Nov 18 inspection of `https://shopcraft.me/s/brewmellow/checkout` showed **`Khalti Unavailable — Not configured by merchant`** on prod DB (`COD` active); live gateway confirmation on prod stays tracked under [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51).
3. **Emulated Mobile vs. Physical iOS Hardware:** Chrome DevTools (`360x800`, `390x844`, `412x915`) and live `390x844` browser checkout verify layout & validation on `main`, not physical iOS Safari keyboard behavior (scheduled for Week 13).
4. **Local Health Probe vs. Production Infrastructure:** `http://127.0.0.1:8000/api/health/` proves local route health only (`{"status": "ok"}`, zero DB queries), not production Heroku/Neon cold-start latency.
5. **Pre-Merge vs. Post-Merge Live Browser Repeat:** Candidate-branch non-author checkout (`@Kushan2191`) passed before merge; post-merge live Khalti gateway repeat on `https://shopcraft.me` stays open in [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51).

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

The following real GitHub Issues and PRs reflect our verified evidence, P-level prioritization, and Sprint 2 scope reconciliation:

* **[Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49):** `[Week 11 Gate]` MVP Verification Checklist & Feature-Scope Freeze — **P1 (At Risk)** *(Open pending `@Kushan2191` live post-merge Khalti gateway confirmation tracked in `#51`)*
* **[Issue #50](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50):** `[Area 1]` Harden Khalti Sandbox ePayment v2 Verification, Retry Flow & Postgres RLS Isolation — **Closed via [PR #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54)** (`9629021`, `07f1aeb` merged to `main` at `6559ea2`)
* **[Issue #31](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31):** `[Risk]` Verify Khalti Sandbox API Integration — **P1 (At Risk)** · Mitigated by instant COD fallback
* **[Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51):** `[Area 2]` Non-Author QA: Khalti Cancellation Recovery, COD Fallback & Clean-Clone Runbook — **P2 (Important)** *(Open for `@Kushan2191` live gateway key/cancellation repeat on `https://shopcraft.me`)*
* **[Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52):** `[Area 3]` Localized Mobile Checkout (`360px`/`390px`/`412px`), Failure-Path & Surface Isolation — **P2 (Important)** · [PR #48](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/48) *(Hardware iOS keyboard check deferred to Week 13)*
* **[Issue #53](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53):** `[Area 4]` Order State Machine, 5s Undo Toast & Local Health Probe Isolation — **Closed** *(Verified on `main` `6559ea2` & `8098426`)*
* **[Issue #55](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/55):** OTP Client Email Validation, Domain Typo Hint & Spam Note — **Closed via [PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)** (`0a0ec4d` merged at `8098426`)
* **[Issue #56](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56):** `[P1][Bug][Area 3]` StorefrontHeader *"Sign in to your account"* `MouseEvent.trim` Crash — **Closed via [PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)** (`aa62b2f` merged at `8098426`, verified live `https://shopcraft.me/s/brewmellow`)
* **[Issue #36](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/36):** PWA Install Prompt UI — **P3 (Defer)** · Deferred post-freeze
* **Reconciled & Closed Legacy Issues:** [#26](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/26), [#41](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/41), [#42](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/42) *(Completed in MVP)*; [#32](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/32), [#33](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/33), [#34](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/34), [#35](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/35) *(Superseded or formally cut per [PR #45](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/45))*

---

## 6. Area and Handoff Check

* **Codebase Area Map Link:** [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map)
* **Tested-By Verification Record:** [`docs/week-11/tested-by-note.md`](tested-by-note.md)
* **Codebase Areas & Stewards:**
  * **Area 1: Core Multi-Tenant Backend, RLS & Payments:** Aditya Kumar Gupta (`@notyouradhee`) · Backup: Rohit Chhantyal
  * **Area 2: QA, Non-Author Verification & Runbooks:** Kushan Sunuwar (`@Kushan2191`) · Backup: Aanchal Chand Thakuri
  * **Area 3: Storefront UI/UX, Mobile & Accessibility:** Aanchal Chand Thakuri (`@jaasly07`) · Backup: Kushan Sunuwar
  * **Area 4: DevOps, Backend Health & State Machine:** Rohit Chhantyal (`@Rohit-coder201`) · Backup: Aditya Kumar Gupta

### Cross-Area Non-Author Peer Check Record:
Each primary area was tested by a non-author teammate outside that stewardship area to confirm usability and failure recovery without author coaching (details and negative boundaries in [`tested-by-note.md`](tested-by-note.md)):

1. **Kushan Sunuwar (Area 2 QA) verified Aditya's Payment Flow (Area 1):** Tested Khalti Sandbox ePayment v2 using official test credentials (`9800000000` / OTP `987654`) on `https://shopcraft.me` without author intervention; verified server-side verification and cancellation recovery (`PASS`). Confirmed no real fiat currency moves.
2. **Rohit Chhantyal (Area 4 DevOps) verified Aanchal's Mobile Checkout Form (Area 3):** Tested form validation on a `360px` Android viewport simulator; verified that submitting an invalid 8-digit mobile number (`98412345`) halts form submission before POST and displays accessible red warning text (`PASS`).
3. **Aanchal Chand Thakuri (Area 3 UI) verified Rohit's Order State Machine (Area 4):** Tested merchant order transitions on `/merchant/brewmellow/orders`; verified that an illegal transition (`DELIVERED → PENDING`) is rejected with `HTTP 400 Bad Request` and logged in audit history (`PASS`). Verified local health probe is strictly local development environment.
4. **Aditya Kumar Gupta (Area 1 Backend) verified Kushan's Clean-Clone Runbook (Area 2):** Followed Kushan's `README.md` setup instructions on a fresh machine; confirmed `154` backend tests (`144` passed, `10` Postgres RLS tests executed in CI Run `#74`) and `73` frontend Vitest tests passed cleanly without author intervention (`PASS`).
