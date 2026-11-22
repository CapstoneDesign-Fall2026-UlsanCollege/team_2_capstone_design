# QA Checklist — Week 12 (Carry a QA Finding to a Verified Action)

**Team:** Team 2 — ShopCraft (Multi-Tenant SaaS Platform for Nepal's Craft Economy)  
**Week:** 12 (Sprint 3: QA and Handoff · Class Thu Nov 19, 2026 · Homework Due Wed Nov 25, 2026 EOD)  
**Baseline Carried Forward:** [`docs/week-11/mvp-freeze-record.md`](../week-11/mvp-freeze-record.md) (`w11-mvp-freeze-2026-11-18` / [`Issue #49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49) / [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51))  
**Week 12 Target Commit & Deployment:** [`fbc79ab`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab) · Live [`https://shopcraft.me`](https://shopcraft.me) · Tracker [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67)

This week follows through on Week 11's open live production observation rather than re-running the full MVP gate from scratch, while verifying that bounded bug fixes (`#60`–`#65`) and storefront template changes (`PR #66`) protect the frozen demo path.

---

## 1. Inherited Question & Basic Checks

**Exact Uncertainty to Settle in Week 12:**
1. *Primary Carried Target ([`#51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) / [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67)):* Week 11's Nov 18 live browser check found `https://shopcraft.me/s/brewmellow/checkout` displaying `Khalti Unavailable — Not configured by merchant`. Does live `brewmellow` now expose Khalti Sandbox checkout and clean cancellation/promo-count recovery (`PR #64`), or does the production store still lack merchant Khalti credentials?
2. *Bounded QA Fixes (`PR #60`–`#65`) & Template Regression (`PR #66`):* Do bounded fixes for out-of-stock/archived checkout rejection (`#60`), archive timer (`#61`), cache invalidation (`#62`), `PRODUCT_CREATE` logging (`#63`), promo reuse (`#64`), unpaid Khalti vs COD labeling (`#65`), and the active storefront template system (`#66`) preserve the frozen core path without introducing crashes?

- [x] **Project opens or runs:** Local Django backend, Next.js frontend, and production `https://shopcraft.me` (`HTTP 200`, `0` console/page errors) all run cleanly.
- [x] **Main demo path can be completed (with COD active; Khalti prod key flagged):** `/s/brewmellow` -> cart persistence -> single-screen checkout -> Cash on Delivery (`Pay Rs. 550 cash to rider`) is operational; live Khalti option requires merchant key provisioning in prod DB ([`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67)).
- [x] **Important buttons/links/screens work:** `Bag (1)` drawer add/reload, `"Sign in to your account"` typo hint (`AccountSheet`), `/s/pahadi-honey` isolated bag (`0` items), `"Have a promo code?"` toggle, and `Place Order` pre-POST validation all work live.
- [x] **Errors are recorded as Issues:** Re-confirmed live Khalti key absence tracked in [`#51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) and consolidated under [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67).
- [x] **Each bug Issue has a P0–P3 work priority and a separate severity label:** Severity (`Major`) and Work Priority (`P1 — At Risk` for live Khalti key availability) recorded separately in [`bug-report.md`](bug-report.md) and [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67).
- [x] **Setup/view instructions are understandable:** Reproduced clean local suite run from [`README.md`](../../README.md) (`165` backend tests discovered, `102` Vitest tests).
- [x] **Known problems are listed:** Production `brewmellow` missing Khalti sandbox config, physical iOS hardware keyboard testing (`#52`), and pending human non-author repeats are explicitly documented.
- [x] **Bug Issues identify affected codebase area & link area map:** Mapped to Area 1 (`backend/stores/`, `backend/orders/`), Area 2 (`QA / Runbooks`), and Area 3 (`frontend/src/components/storefront/`) via [`Codebase Area Map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map).
- [ ] **A teammate outside the area reproduces a key bug or regression check:** Pending uncoached human confirmation from `@Kushan2191` (`#51` / `#67`) and `@jaasly07` / `@Rohit-coder201` on `fbc79ab` (see [`peer-test-notes.md`](peer-test-notes.md)).

---

## 2. Targeted Demo Path Retest (`https://shopcraft.me` on `fbc79ab` — Nov 22, 2026)

*(Pre-written expected results checked via automated headless Chromium verification, zero order POSTs sent, zero secrets/PII stored.)*

| Step | Starting State & Action | Expected Result | Actual Result | Pass? |
|---|---|---|---|---|
| **1** | Open `https://shopcraft.me/s/brewmellow` (`1440x900`), add `Gulmi Reserve (150g)`, reload | HTTP 200, template renders cleanly, `Bag (1)` (`Rs. 450`) persists across reload | HTTP 200, `0` console/page errors, `Bag (1)` persisted cleanly ([w12-01](evidence/screenshots/w12-01-brewmellow-template-cart-persistence.png)) | **Yes** |
| **2** | Click *"Sign in to your account"* on `/s/brewmellow`, type `buyer@gmial.com`, close | Account drawer opens without Issue `#56` crash and displays `"Did you mean buyer@gmail.com?"` | Drawer opened with `0` errors; rendered `"Did you mean buyer@gmail.com?"` ([w12-02](evidence/screenshots/w12-02-storefront-signin-typo-hint.png)) | **Yes** |
| **3** | Open `https://shopcraft.me/s/pahadi-honey` (`1440x900`) | Distinct Store #2 branding renders; header bag shows `0` items (no leakage) | HTTP 200, distinct Pahadi Honey storefront, `0`-item bag confirmed ([w12-03](evidence/screenshots/w12-03-pahadi-honey-template-bag-isolation.png)) | **Yes** |
| **4** | Open `/s/brewmellow/checkout` (`390x844` mobile), inspect Payment Choice & promo input (`#51` / `#64`) | Khalti Sandbox & COD status clearly displayed; `"Have a promo code?"` expands promo field | **`COD` active (`Pay Rs. 550 cash to rider`); `ENTER PROMO CODE` expands cleanly; `Khalti` STILL shows `Unavailable — Not configured by merchant` in prod DB** ([w12-05](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png)) | **No (Khalti Config Gap Reproduced)** |
| **5** | On `/s/brewmellow/checkout` (`390x844`), submit invalid phone `98412345` | Client validation halts submission before `POST`; renders accessible inline error | Halted pre-POST (`0` submit network requests); displayed `"Enter a valid 10-digit Nepali mobile number starting with 98 or 97."` ([w12-04](evidence/screenshots/w12-04-mobile-390-checkout-validation.png)) | **Yes** |

---

## 3. Automated Checks Run on `fbc79ab` (Nov 22, 2026)

| Check or Test Run | How It Was Run | Expected Result | Actual Result | Evidence Link |
|---|---|---|---|---|
| **Django Backend Suite (`165` tests)** | `cd backend && .\venv\Scripts\python.exe manage.py test accounts catalog orders stores --verbosity 2` | Zero failures (`+11` tests added in `test_bugfixes.py` for `#60`, `#63`, `#64`) | **`Ran 165 tests in 12.16s — OK (skipped=10)`** (`155` passed on local SQLite; `10` Postgres `FORCE RLS` checks skipped locally) | [`w12-backend-tests.txt`](evidence/w12-backend-tests.txt) · [`w12-verification-checks.json`](evidence/w12-verification-checks.json) |
| **PostgreSQL 16 CI (`FORCE RLS` + Suite)** | GitHub Actions [Run #82](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) (`postgres:16-alpine`, `NOSUPERUSER NOBYPASSRLS`) | All `165` backend tests pass with `0` skipped + Next.js build + Vitest | **Success** — both `Backend (Django + Postgres FORCE RLS)` and `Frontend (Next.js)` passed on `fbc79ab` | [CI Run #82 (`44989840995`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) |
| **Frontend Vitest Unit Suite (`102` tests)** | `cd frontend && npm test` | Zero failures across `10` test files (`+29` new specs incl. `#61`, `#62`, `#65`, theme tests) | **`Test Files 10 passed (10) · Tests 102 passed (102)` in `3.95s` wall (`1.68s` runner)** | [`w12-frontend-checks.txt`](evidence/w12-frontend-checks.txt) · [`w12-verification-checks.json`](evidence/w12-verification-checks.json) |
| **TypeScript, ESLint & Surface Guard** | `npm run typecheck && npm run check:surfaces && npx eslint ...` | `0` TS errors, `SURFACE_ISOLATION_OK`, `0` ESLint errors | **`tsc` exit `0`, `SURFACE_ISOLATION_OK`, scoped ESLint `0 errors` (`22` warnings)** | [`w12-frontend-checks.txt`](evidence/w12-frontend-checks.txt) |

---

## 4. Bug & Disposition Summary

| Bug / Check Item | Work Priority (`P0–P3`) | Severity | Affected Area | Issue / PR Link | Owner / Support | Disposition / Proof |
|---|---|---|---|---|---|---|
| **Live `brewmellow` Khalti Sandbox Key Unconfigured on Prod DB** | **P1 (At Risk)** *(elevated from Week 11 `P2` review after Nov 22 repro)* | **Major** | Area 1 & Area 2 | [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) | `@notyouradhee` (config) & `@Kushan2191` (non-author live retest) | **Reproduced Open Blocker (Mitigated by active COD)** · [`w12-05`](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png) |
| **Reject Out-of-Stock Variants & Archived Products at Checkout** | **P1** *(resolved)* | **Major** | Area 1 & Area 3 | [`PR #60`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b03f7ca) · [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) | `@notyouradhee` (`@Kushan2191` backup) | **Fixed & Automated Pass** (`CheckoutAvailabilityBug60Tests`, 4 tests) |
| **Release Promo `used_count` on Khalti Failure / Cancel** | **P1** *(resolved in code)* | **Major** | Area 1 (`orders` / `stores`) | [`PR #64`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/11baf28) · [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) | `@notyouradhee` (`@Kushan2191` peer retest pending live key) | **Fixed & Automated Pass** (`PromoDiscountKhaltiReleaseBug64Tests`, 4 tests; live E2E pending `#51` key) |
| **Distinguish Unpaid Khalti Orders vs COD on Packing Slip & Sheet** | **P2** | **Minor** | Area 4 (`merchant` UI) | [`PR #65`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/d68d5b9) | `@Rohit-coder201` & `@notyouradhee` | **Fixed & Automated Pass** (`merchant-status.test.ts`, `25` tests) |
| **Archive Timer Self-Cancel (`#61`), Cache Invalidation (`#62`), Audit Log (`#63`)** | **P2** | **Minor** | Area 1 & Area 4 | [`#61`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/326df97) · [`#62`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/e2141e6) · [`#63`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1fbe59b) | `@notyouradhee` & `@Rohit-coder201` | **Fixed & Automated Pass** (`product-archive` 4, `api.test` 5, `ProductCreateAuditLog` 3) |
| **Mobile `390x844` Checkout & Storefront Template Regression (`#52` / `PR #66`)** | **P2** | N/A | Area 3 | [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) | `@jaasly07` (`@Kushan2191` backup) | **Scoped All-Clear (Live Desktop/390px)** · Physical iOS keyboard check stays Week 13 |
