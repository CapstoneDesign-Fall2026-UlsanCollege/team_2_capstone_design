# Tested-By Note — Week 11 MVP Freeze Candidate

Use this whenever you claim something works. Every verification step below includes what it establishes **and what it does NOT establish**, per the Week 11 MVP Verification Guide.

---

## Check 1: Khalti Sandbox ePayment v2 Hardening, Retry Flow & COD Fallback

### What we checked
- **Behavior / related Issue:** Full checkout -> Khalti Sandbox v2 lookup -> retry/cancellation recovery -> COD fallback ([Issue #50](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50), [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51), [Risk #31](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31))
- **Author:** Aditya Kumar Gupta (`@notyouradhee`)
- **Tested by (a teammate other than the author):** Kushan Sunuwar (`@Kushan2191`)
- **Date:** November 16, 2026 (Freeze Candidate Commit `07f1aeb` / `shopcraft.me`)

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
- Automated backend tests in `test_khalti.py` mock external Khalti API HTTP responses; passing `154` tests locally **does not guarantee** external Khalti sandbox portal uptime on demo day (mitigated by COD fallback).
- Running `manage.py test` locally uses SQLite and **skips `10` PostgreSQL-only `FORCE ROW LEVEL SECURITY` tests**; database-engine RLS enforcement is verified in PostgreSQL 16 CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

---

## Check 2: Clean-Clone Verification & Automated Test Suite (`07f1aeb`)

### What we checked
- **Behavior / related Issue:** Clean-clone runbook reproducibility, 154 Django backend tests, and 63 frontend Vitest tests ([Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49), [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51))
- **Author:** Kushan Sunuwar (`@Kushan2191` — Clean-Clone Runbook)
- **Tested by (a teammate other than the author):** Aditya Kumar Gupta (`@notyouradhee`)
- **Date:** November 16, 2026

### Check steps
1. Run `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores` inside `backend/`.
2. Run `npm test && npm run typecheck && npm run check:surfaces` inside `frontend/`.

### Result
- **Expected result:** Zero test failures, zero TypeScript compilation errors, and `SURFACE_ISOLATION_OK`.
- **Actual result:** **PASS.** Backend: `Ran 154 tests in 47.296s — OK (skipped=10)`. Frontend: `5 test files passed, 63 tests passed`, `tsc --noEmit` exited `0`, and `node scripts/check-surfaces.mjs` output `SURFACE_ISOLATION_OK`.
- **Proof link:** [w11-backend-tests.txt](evidence/w11-backend-tests.txt) · [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) · [Latest CI Run on `main` (`43732989361`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43732989361)

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
- **Problems resolved before freeze:** Replaced legacy Khalti simulator modal (`KhaltiCheckoutSimulatorModal.tsx`) with hardened server-side `mode`-selected Khalti ePayment v2 verification + retry actions (`9629021`, `07f1aeb`), reconciling stale test counts (`114` → `154` backend + `63` frontend Vitest) and creating real GitHub Issues `#49`–`#53`.
- **Next action (Sprint 3, Week 12):** Complete physical hardware mobile QA (`360px` / `390px`), confirm green GitHub Actions CI run on the merged `fix/khalti-real-sandbox` PR, and conduct outside-author setup rehearsal.
