# MVP Scope Freeze and Candidate Record — November 18, 2026

**Team:** Team 2 — ShopCraft (Multi-Tenant SaaS Platform for Nepal's Craft Economy)  
**Coordinator / Release Steward:** `@notyouradhee` (Aditya Kumar Gupta)  
**Freeze Gate Issue:** [`Issue #49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)  
**Date Locked:** Wednesday, November 18, 2026 (Ahead of Week 11 EOD KST Gate)

---

## 1. Freeze Decision & Fixed Scope

Feature scope is **frozen**. Ahead of Sprint 3 (Weeks 12–14), zero new product features, integrations, or optional modules will be introduced. Only bounded defect recovery within the existing promised core path, reliability checks, accessibility verification, and handoff documentation enter post-freeze work.

### Promised Core Demo Path
1. **Multi-Tenant Storefront Discovery & Cart Persistence:** `/s/brewmellow` and `/s/pahadi-honey` render store-scoped branding and isolated cart drawers (`localStorage` scoped by store slug).
2. **Localized Single-Screen Checkout:** Nepal 7 Provinces (`Bagmati` through `Sudurpashchim`), municipality/ward fields, and pre-POST 10-digit Nepali phone validation (`98xxxxxxxx` / `97xxxxxxxx`).
3. **Payment & Fallback Resilience:**
   - **Khalti Sandbox ePayment v2** (`epayment/initiate/` -> `epayment/lookup/` server verification; cancellation `status=User%20canceled` restores cart/shipping fields cleanly).
   - **Cash on Delivery (COD) Fallback** with zero external gateway dependency.
4. **Invoice & Merchant Fulfillment State Machine:** `/merchant/brewmellow/orders` enforces `PAID / CONFIRMED -> PROCESSING -> SHIPPED -> DELIVERED`, rejects illegal backward transitions (`HTTP 400`), and supports 5-second undo toast reversal.
5. **PostgreSQL Row-Level Security (RLS):** Non-superuser `FORCE ROW LEVEL SECURITY` (`tenant_isolation_policy`) enforces single-policy isolation across tenant tables and blocks cross-tenant access (`HTTP 404`).

### Explicitly Frozen / Cut Boundaries
- **Shopper Recurring Subscriptions:** Permanently cut from MVP per [`PR #45`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/45) and [`mvp-contract.md`](../week-09/mvp-contract.md) (legacy Issues `#33` and `#34` closed).
- **Third-Party Live Courier GPS Tracking:** Deferred / cut; fulfillment is managed via internal merchant status transitions (`#32` closed).
- **Khalti Currency Boundary:** Strictly official Khalti Sandbox test credentials (`9800000000` / OTP `987654`); **no real fiat money moves**.

---

## 2. Exact Frozen Candidate & Deployment Binding

| Field | Recorded Value |
|---|---|
| **Frozen Code Candidate Commit** | [`80984261d9ab698a27e8c8affa34766083af1ec0`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/80984261d9ab698a27e8c8affa34766083af1ec0) (`Merge pull request #57` incorporating `#54`, `0a0ec4d` / `#55`, `64a31f9` RLS migration `0013`, and `aa62b2f` / `#56`) |
| **Candidate Release Tag** | `w11-mvp-freeze-2026-11-18` (annotated tag referencing verified Week 11 documentation & freeze SHA) |
| **GitHub Actions CI Run (`main`)** | [CI Run #74 (`44248144770`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770) — **Success** (`Backend (Django + Postgres FORCE RLS)` + `Frontend (Next.js)` incl. Vitest) |
| **GitHub Actions CI Run (PR #57)** | [CI Run #73 (`44247935450`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44247935450) — **Success** on head commit `aa62b2f` |
| **Production Frontend URL** | [https://shopcraft.me](https://shopcraft.me) (Vercel Deployment [`GXNf69Qaf8UUrkdyi3KcRqoQKFR4`](https://vercel.com/notyouradhee/team-2-capstone-design/GXNf69Qaf8UUrkdyi3KcRqoQKFR4) tied to `8098426`) |
| **Machine-Readable Local Receipt** | [`evidence/w11-verification-checks.json`](evidence/w11-verification-checks.json) (`154` backend tests discovered / `144` passed SQLite + `10` skipped SQLite & run in CI #74; `73/73` Vitest; `tsc --noEmit` 0 errors; `SURFACE_ISOLATION_OK`; ESLint 0 errors) |

*(Note: Subsequent documentation commits updating markdown reports/receipts on `main` after `8098426` do not modify application runtime code under `backend/` or `frontend/`.)*

---

## 3. Transparent Release Boundaries & Remaining Open Items

1. **Live Production `brewmellow` Khalti Configuration (`Nov 18` Observation):**
   - During live browser inspection of `https://shopcraft.me/s/brewmellow/checkout` on November 18, 2026, `Cash on Delivery` (`Pay Rs. 550 cash to rider`) rendered active while **Khalti displayed `"Unavailable — Not configured by merchant"`** on that store's live database record.
   - Server-side Khalti verification and cancellation recovery are verified in automated `test_khalti.py` / `khalti-return.test.ts` and prior candidate QA (`76172af`).
   - **Open Action ([Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51)):** Assigned to `@Kushan2191` to confirm merchant sandbox gateway activation on live `brewmellow` and post his live browser cancellation/COD repeat result before closing `#51` and `#49`.
2. **Storefront Sign-In Crash Discovery & Verification ([Issue #56](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) — Closed by [PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)):**
   - Live browser QA on November 18 discovered `StorefrontHeader` `"Sign in to your account"` forwarding a synthetic click `MouseEvent` into `AccountContext.openAccount`, throwing `TypeError: I.trim is not a function` ([diagnostic screenshot](evidence/screenshots/w11-06-issue-56-storefront-signin-crash-diagnostic.png)).
   - Fixed via `normalizePrefillEmail` guard and caller wrappers in [`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57), verified live post-deploy on `https://shopcraft.me/s/brewmellow` (`0` app crash errors, [verified screenshot](evidence/screenshots/w11-07-issue-56-storefront-signin-fixed-live.png)).
3. **Physical iOS Hardware Boundary:**
   - Emulated viewports (`360x800`, `390x844`, `412x915`) and live `390x844` browser checkout verified layout and pre-POST phone rejection (`w11-04-mobile-390-checkout-phone-rejection.png`); physical iOS Safari virtual keyboard ergonomics remain scheduled for Week 13 under [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52).
4. **Local Health Probe vs Production Infra:**
   - `/api/health/` proves local backend JSON response (`{"status": "ok"}`, zero DB queries) cleanly distinct from production Render/Neon cold-start measurements.

---

## 4. Reproduce the Frozen Automated Suite

From a clean checkout of [`80984261d9ab698a27e8c8affa34766083af1ec0`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/80984261d9ab698a27e8c8affa34766083af1ec0) or tag `w11-mvp-freeze-2026-11-18`:

```powershell
# Backend (154 discovered: 144 pass on local SQLite, 10 Postgres-only RLS checks skipped locally & executed in CI)
cd backend
.\venv\Scripts\python.exe manage.py test accounts catalog orders stores --verbosity 2

# Frontend (6 Vitest files / 73 tests + tsc + surface guard + scoped lint)
cd ..\frontend
npm test
npm run typecheck
npm run check:surfaces
npx eslint "src/app/(platform)" "src/app/merchant" "src/app/s" "src/components/account" "src/components/auth" "src/components/storefront" "src/lib"
```

---

## 5. Change Control After Freeze

1. Any defect discovered during Sprint 3 QA must first be logged as a tracked GitHub Issue with **Severity**, **Priority (`P0`–`P3`)**, **Expected vs. Actual result**, and **Owner**.
2. Only `P0`/`P1` defects breaking the frozen core demo path enter `main` via a reviewed PR referencing the issue and passing **CI (`Backend (Django + Postgres FORCE RLS)` + `Frontend (Next.js)`)**.
3. If runtime code changes, cut a replacement annotated tag (`w11-mvp-freeze-YYYY-MM-DD-r2`) rather than mutating prior evidence SHA references.
