# Peer Test Notes and Boundary Verification — Week 12

**Prepared / Run By:** Agent-assisted verification coordinated by Aditya Kumar Gupta (`@notyouradhee`) — Live prod checks on `fbc79ab` (Nov 22) & `4464ed7` (Nov 23); automated suite & RBAC verification on [`067a478`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/067a478) (Nov 25, 2026)  
**Project Tested:** ShopCraft ([`https://shopcraft.me`](https://shopcraft.me))  
**Carried Target:** [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) · [`evidence-index.md`](evidence-index.md)

> *Transparency Rule:* Automated local runs and Playwright browser checks recorded below are strictly distinguished from uncoached **human non-author peer checks**. Pending teammate repeats are left explicitly **Open / Pending** until posted by the named non-author teammate.

---

## 1. What We Tried (Nov 22–25, 2026 · `fbc79ab` -> `067a478`)

1. **Automated Suite & CI Parity Verification (`067a478`):**
   - Executed `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores --verbosity 2` (`199` discovered incl. `test_edge_cases.py` and `test_rbac.py`: `189` pass in `21.17s` on local Windows SQLite, `10` Postgres-only checks skipped locally and verified passing under `postgres:16-alpine` `NOSUPERUSER NOBYPASSRLS` in GitHub Actions [Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139)).
   - Executed `npm test` on Windows Node `v24.22.1` (`12` Vitest files / `130` tests passing; `src/lib/theme-contrast.test.ts` failed locally importing `../../scripts/check-surfaces.mjs` shebang on Windows Node v24 while passing on Ubuntu Node 22 in CI [Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139)), plus `npm run typecheck` (`0` errors, `3.28s`), `npm run check:surfaces` (`SURFACE_ISOLATION_OK`, `0.69s`), and scoped ESLint (`0` errors, `17.12s`).
2. **Non-Destructive Live Production Regression (`https://shopcraft.me`):**
   - Tested `/s/brewmellow` storefront template rendering & cart persistence across page reload (`1440x900`).
   - Tested *"Sign in to your account"* `AccountSheet` modal + domain typo suggestion (`buyer@gmial.com` -> `"Did you mean buyer@gmail.com?"`).
   - Tested cross-tenant store isolation on `/s/pahadi-honey` (`Bag` shows `0` items).
   - Tested `/s/brewmellow/checkout` at mobile viewport `390x844`: inspected **4. Payment Choice**, opened `"Have a promo code?"` input (`#64` UI integration), and submitted invalid 8-digit mobile `98412345`.

---

## 2. Area Map & Support Path

- **Areas Touched:** Area 1 (`backend/stores/`, `backend/orders/`), Area 2 (`QA & Runbooks`), Area 3 (`frontend/src/components/storefront/`), and Area 4 (`frontend/src/components/merchant/`).
- **Current Area Map Link:** [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) *(stewardship boundaries unchanged; `PR #66` storefront theme system falls under Area 3 UI / Area 4 Console).*
- **Cross-Area Dependency Observed:** Enabling promo discount recovery (`PR #64` in Area 1) and verifying checkout gateway cancellation recovery (Area 2 [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51)) both depend on Store #1 (`brewmellow`) having live Khalti Sandbox merchant credentials stored in the production database.

---

## 3. What Worked (Scoped All-Clear & Reproduction Findings)

- **Storefront Template Regression (`PR #66`) — PASS:** Both `BrewMellow` (`w12-01`) and `Pahadi Honey` (`w12-03`) loaded HTTP `200` with `0` console/page errors and zero cross-tenant bag leakage (`Bag (1)` vs `0` items).
- **Issue `#56` Auth Sheet Fix Remains Solid — PASS:** Clicking *"Sign in to your account"* opened `AccountSheet` cleanly without error and displayed `"Did you mean buyer@gmail.com?"` (`w12-02`).
- **Mobile `390x844` Checkout Validation & COD — PASS:** Submitting `98412345` halted client-side before any `POST` request with inline red alert (`w12-04`); `Cash on Delivery` (`Pay Rs. 550 cash to rider`) and `"Have a promo code?"` (`ENTER PROMO CODE`) rendered cleanly (`w12-05`).
- **Khalti Sandbox Live End-to-End Resolution & `User canceled` Lookup Fix (`Nov 23` `4464ed7` -> `Nov 25` `f2b4096`) — PASS (Agent-Assisted `@notyouradhee` Verification):**
  - *Nov 23 (`4464ed7`):* Real Email OTP -> saved custom Khalti `TEST (Sandbox)` key ([`w12-06`](evidence/screenshots/w12-06-brewmellow-khalti-sandbox-connected.png)) -> active Khalti checkout ([`w12-07`](evidence/screenshots/w12-07-brewmellow-checkout-khalti-active.png)) -> Order `#BR-2026-0005` **`Khalti Verified` (`PAID`, zero real money)** ([`w12-08`](evidence/screenshots/w12-08-khalti-sandbox-order-br-2026-0005-paid.png)) & `/merchant/brewmellow/orders` ([`w12-09`](evidence/screenshots/w12-09-merchant-orders-queue-khalti-verified.png)).
  - *Nov 25 (`#BR-2026-0007` Live Cancel Repro -> Fix `f2b4096`):* Live guest checkout canceled on `test-pay.khalti.com` initially returned **HTTP `503`** because Khalti v2 `/epayment/lookup/` returns **HTTP `400`** with `{"status": "User canceled"}` ([`w12-10`](evidence/screenshots/w12-10-live-khalti-cancel-503-bug.png)). Fixed `backend/stores/khalti.py` + `test_khalti.py` (`f2b4096`, CI [Run #89](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45557766494)) and retested `#BR-2026-0007` live: `/checkout/khalti-verify/` returned **HTTP `400` (`PAYMENT_FAILED` / `reason="canceled"`)** and rendered **`Payment Failed` (`Payment was canceled on Khalti.` + `Retry Payment` + `Return to Store`)** ([`w12-11`](evidence/screenshots/w12-11-live-khalti-cancel-recovered.png)). *(Note: still distinct from an uncoached human non-author teammate run by `@Kushan2191`.)*
- **Automated Regression Suite Expansion — PASS:** Expanded from `165` (`fbc79ab`, CI `#82`) -> `170` (`4464ed7`, CI `#84`) -> `199` (`067a478`, CI `#86`) -> **`200` backend tests** (`f2b4096`, CI [Run #89](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45557766494)) + **`12` Vitest files (`130` tests) locally & full CI Vitest pass**. Note: `theme-contrast.test.ts` local Windows Node v24 diagnostic failure is preserved openly in [`w12-verification-checks.json`](evidence/w12-verification-checks.json).

---

## 4. What Confused Us / Problems Found

| Problem | Severity | Status | Suggested Issue / Tracker |
|---|---|---|---|
| **Pre-fix live `brewmellow` Khalti card showed `Unavailable — Not configured by merchant`** | **Major** (`P1` work priority) | **Reproduced** Nov 18 & Nov 22 (`w12-05`) -> **Fixed on live prod Nov 23** (`4464ed7`, `#BR-2026-0005` `PAID`, `w12-06`..`w12-09`); awaiting `@Kushan2191` non-author cancel repeat | Tracked in [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) & [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) |
| **Checkout quote initial request aborted cleanly alongside 200 retry** | Polish | Benign prefetch/superseded quote during fast client mount | Observed 1 cancelled initial `quote/` alongside `200 OK`; UI unaffected |

---

## 5. Pending Non-Author Human Repeats & Explicit Negative Boundaries

1. **Pending Uncoached Non-Author Live Gateway Repeat ([`#51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) / [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67)):**
   - *Next Owner:* Live `brewmellow` Khalti Sandbox key is now provisioned and confirmed active (`w12-06`..`w12-09`). **`@Kushan2191`** (Area 2 — outside Area 1) can now execute an uncoached checkout using Khalti Sandbox (`9800000000` / OTP `987654`), verify `User canceled` cart/promo retention (`PR #64`), and post screenshot proof directly on Issue `#51` / `#67` before Wed Nov 25 EOD.
2. **Pending Uncoached Non-Area-4 Merchant-Console Confirmation (`PR #65` & `067a478`) + Cross-OS Clean Clone:**
   - While automated suites passed on Windows SQLite + Ubuntu PostgreSQL 16 CI (`Run #86`) and `#BR-2026-0005` (`w12-09`) was observed by `@notyouradhee`, an **uncoached teammate outside Area 4** (`@Kushan2191` or `@jaasly07`) must still independently verify `/merchant/brewmellow/orders` (`OrderDetailSheet` / `PackingSlipModal` unpaid Khalti `Verifying payment` vs `Cash on Delivery` distinction on `067a478` / `https://shopcraft.me`) plus second-OS clean setup and add their own result in `#67`.
3. **Physical Mobile Hardware Boundary ([`#52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52)):**
   - Browser `390x844` viewport emulation does **not** establish physical iOS Safari virtual-keyboard scroll/focus behavior (kept scheduled for Week 13).
4. **Handoff Trial Status *(Required in Week 13)*:** Setup path follows [`README.md`](../../README.md) and [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map); formal Week 13 external handoff trial scheduled next week.
