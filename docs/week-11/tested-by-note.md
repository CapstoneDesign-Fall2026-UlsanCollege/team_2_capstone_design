# Tested-By Note — Week 11 Frozen `main` Build (`6559ea2`)

Use this whenever you claim something works. Every verification step below includes what it establishes **and what it does NOT establish**, keeping **candidate-branch (`07f1aeb` / `f76b6dd`)**, **local SQLite**, **PostgreSQL 16 CI (`43899189860`)**, and **live `https://shopcraft.me`** results explicitly distinct.

---

## Check 1: Khalti Sandbox ePayment v2 Hardening, Retry Flow & COD Fallback

### What we checked
- **Behavior / related Issue:** Full checkout -> Khalti Sandbox v2 lookup -> retry/cancellation recovery -> COD fallback ([PR #54 Merged](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54), [Issue #50 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50), [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51), [Risk #31](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31))
- **Author:** Aditya Kumar Gupta (`@notyouradhee`)
- **Tested by (a teammate other than the author):** Kushan Sunuwar (`@Kushan2191`)
- **Date & Revision:** Pre-merge external-laptop check prior to Nov 16 (`main` updated to `6559ea2` via PR #54 on Nov 16; post-merge live browser repeat on `https://shopcraft.me` tracked in [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) before Wed Nov 18 EOD)

### Check steps
1. Open `https://shopcraft.me/s/brewmellow` on an independent laptop without author coaching.
2. Add *Gulmi Bourbon 250g* to the store-scoped cart drawer and fill localized Nepali delivery details (Bagmati Province, Kathmandu, valid 10-digit phone `9841234567`).
3. **Boundary 1 (Khalti Sandbox Success):** Initiate Khalti payment, authenticate using Sandbox credentials (`9800000000` / PIN `1111` / OTP `987654`), and confirm `khalti-return` verifies `pidx` server-side.
4. **Boundary 2 (Gateway Cancellation Recovery):** Initiate Khalti checkout and click *"Cancel / Return to Merchant"* (`status=User%20canceled`); inspect `/s/brewmellow/checkout` and order actions (`OrderPaymentActions.tsx`).
5. **Boundary 3 (Zero-Network COD Fallback):** Switch to Cash on Delivery and submit order.

### Result
- **Expected result:** Sandbox payment transitions order to `PAID` with **no real fiat currency moved**; gateway cancellation redirects cleanly with cart/address intact and zero orphaned `PAID` rows; COD creates `CONFIRMED` order immediately without external network calls.
- **Actual result:** **PASS.** Server lookup verified `pidx` cleanly; canceled return preserved cart items and shipping fields; COD created order in `CONFIRMED` state cleanly.
- **Proof link:** [w11-backend-tests.txt](evidence/w11-backend-tests.txt) (`154` tests) · [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) (`khalti-return.test.ts`: `6/6`) · [Kushan QA Handoff](../week-10/evidence/kushan-independent-qa-handoff.md)

### What this check does NOT establish
- Pre-merge browser runs and candidate-branch (`07f1aeb` / `f76b6dd`) results do not automatically establish post-merge live browser state on `https://shopcraft.me` (`6559ea2`); post-merge manual browser confirmation by `@Kushan2191` is tracked in [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) before Wed Nov 18 EOD.
- Automated backend tests in `test_khalti.py` mock external Khalti API HTTP responses; passing `154` tests locally **does not guarantee** external Khalti sandbox portal uptime on demo day (mitigated by COD fallback).
- Running `manage.py test` locally uses SQLite and **skips `10` PostgreSQL-only `FORCE ROW LEVEL SECURITY` tests**; database-engine RLS enforcement is verified in PostgreSQL 16 CI ([Run `43899189860`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43899189860)).

---

## Check 2: Clean-Clone Verification & Automated Test Suite (`main` `6559ea2`)

### What we checked
- **Behavior / related Issue:** Clean-clone runbook reproducibility, `154` Django backend tests (`144` pass on local SQLite, `10` Postgres RLS tests execute in CI), and `63` frontend Vitest tests ([Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49), [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51))
- **Author:** Kushan Sunuwar (`@Kushan2191` — Clean-Clone Runbook)
- **Tested by (a teammate other than the author):** Aditya Kumar Gupta (`@notyouradhee`)
- **Date:** November 16, 2026 (Re-executed directly on merged `main` commit `6559ea2`)

### Check steps
1. Run `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores` inside `backend/`.
2. Run `npm test && npm run typecheck && npm run check:surfaces` inside `frontend/`.

### Result
- **Expected result:** Zero test failures, zero TypeScript compilation errors, and `SURFACE_ISOLATION_OK`.
- **Actual result:** **PASS on merged `main` (`6559ea2`).** Backend (local SQLite): `Ran 154 tests in 17.467s — OK (skipped=10)`. CI PostgreSQL 16 (`43899189860`): all `154` tests + Next.js build passed. Frontend (local): `5 test files passed, 63 tests passed` in `3.00s`, `tsc --noEmit` exited `0`, and `node scripts/check-surfaces.mjs` output `SURFACE_ISOLATION_OK`.
- **Proof link:** [w11-backend-tests.txt](evidence/w11-backend-tests.txt) · [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) · [Main CI Run `43899189860`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43899189860)

### What this check does NOT establish
- Local SQLite test execution does not run the `10` skipped Postgres `FORCE RLS` policies (covered by CI job `Backend (Django + Postgres FORCE RLS)`).
- Unit/type checks do not establish production environment variables or DNS routing on `https://shopcraft.me`.

---

## Check 3: Mobile Checkout Failure-Path Validation (`360px`) & Surface Isolation

### What we checked
- **Behavior / related Issue:** Localized Nepali checkout 10-digit mobile regex rejection (`98412345`) & responsive viewports (`360x800`, `390x844`, `412x915`) ([Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52))
- **Author:** Aanchal Chand Thakuri (`@jaasly07`)
- **Tested by (a teammate other than the author):** Rohit Chhantyal (`@Rohit-coder201`)
- **Date:** November 12–16, 2026

### Check steps
1. Open `/s/brewmellow/checkout` in Chrome 130 DevTools device emulation at `360x800`.
2. Enter an invalid 8-digit phone number (`98412345`) and attempt to submit.
3. Verify inline accessible alert renders, POST is blocked, and submit button shows disabled state.

### Result
- **Expected result:** Form submission halts prior to network POST; inline alert renders *"Please enter a valid 10-digit Nepali mobile number starting with 98 or 97"*; touch targets $\ge 52\text{px}$.
- **Actual result:** **PASS.** Submission blocked cleanly; no invalid request sent; error alert readable at `360px`.
- **Proof link:** [Aanchal Handoff](../week-10/evidence/aanchal-storefront-a11y-handoff.md) · [storefront-placeholders.test.ts (`18/18`)](evidence/w11-frontend-checks.txt)

### What this check does NOT establish
- Chrome DevTools mobile emulation does not verify physical iOS Safari on-screen keyboard scroll/focus behavior (scheduled for Week 13 hardware mobile testing).

---

## Check 4: Merchant Order State Machine Guards & Local Health Probe Scope

### What we checked
- **Behavior / related Issue:** Illegal backward order status transition (`DELIVERED → PENDING` rejected HTTP 400), 5s undo toast, and `/api/health/` local probe ([Issue #53](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53))
- **Author:** Rohit Chhantyal (`@Rohit-coder201`)
- **Tested by (a teammate other than the author):** Aanchal Chand Thakuri (`@jaasly07`)
- **Date:** November 12–16, 2026

### Check steps
1. Inspect order detail transitions on `/merchant/brewmellow/orders` (`MerchantOrderStatusTransitionView` in `backend/stores/api.py`) and verify backward state jump (`DELIVERED → PENDING`) is rejected.
2. Run `merchant-status.test.ts` (`19/19`) and verify `/api/health/` (`health_view` in `backend/core/urls.py`) on **Local Development Environment** (`http://127.0.0.1:8000/api/health/`).

### Result
- **Expected result:** Backend rejects `DELIVERED → PENDING` with `HTTP 400 Bad Request`; local `/api/health/` returns `HTTP 200 OK` with `{"status": "ok"}` (zero DB queries).
- **Actual result:** **PASS.** `MerchantOrderStatusTransitionView` blocks illegal backward transitions; `merchant-status.test.ts` (`19/19`) passes cleanly; local `/api/health/` returns `HTTP 200 OK` (`{"status": "ok"}`).
- **Proof link:** [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) · [Rohit Handoff](../week-10/evidence/rohit-resilience-health-handoff.md)

### What this check does NOT establish
- Local `/api/health/` (`127.0.0.1:8000`) proves local Django/DB health only; it **does not establish** production Heroku dyno or Neon serverless cold-start behavior on live `https://shopcraft.me`.

---

## Problems found & Next action
- **Problems resolved & merged to `main` (`6559ea2`):** Replaced legacy Khalti simulator modal (`KhaltiCheckoutSimulatorModal.tsx`) with hardened server-side `mode`-selected Khalti ePayment v2 verification + retry actions ([PR #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54), `9629021`, `07f1aeb`), verified `main` CI ([Run `43899189860`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43899189860)), reconciled test counts (`114` Week 10 baseline → `154` backend + `63` frontend Vitest post-PR #54), and re-verified directly on merged `main` (`6559ea2`).
- **Next action (Before Wed Nov 18 EOD & Sprint 3):** `@Kushan2191` repeats the live external-laptop checkout & cancellation check on deployed `https://shopcraft.me` (`6559ea2`) under [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51), followed by physical hardware mobile QA (`360px` / `390px`) in Week 13 under [Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52).
