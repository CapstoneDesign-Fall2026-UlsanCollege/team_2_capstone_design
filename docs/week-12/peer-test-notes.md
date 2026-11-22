# Peer Test Notes and Boundary Verification — Week 12

**Prepared / Run By:** Agent-assisted verification coordinated by Aditya Kumar Gupta (`@notyouradhee`) on Nov 22, 2026 (`fbc79ab`)  
**Project Tested:** ShopCraft ([`https://shopcraft.me`](https://shopcraft.me))  
**Carried Target:** [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52)

> *Transparency Rule:* Automated local runs and Playwright browser checks recorded below are strictly distinguished from uncoached **human non-author peer checks**. Pending teammate repeats are left explicitly **Open / Pending** until posted by the named non-author teammate.

---

## 1. What We Tried (Nov 22, 2026 on `fbc79ab`)

1. **Automated Suite & CI Parity Verification (`fbc79ab`):**
   - Executed `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores --verbosity 2` (`165` discovered: `155` pass in `12.16s` on local Windows SQLite, `10` Postgres-only checks skipped locally and verified passing under `postgres:16-alpine` `NOSUPERUSER NOBYPASSRLS` in GitHub Actions [Run #82](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995)).
   - Executed `npm test` (`10` Vitest files / `102` tests passing in `3.95s`), `npm run typecheck` (`0` errors), `npm run check:surfaces` (`SURFACE_ISOLATION_OK`), and scoped ESLint (`0` errors).
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
- **Automated Regression Suite Expansion — PASS:** `165` backend tests (`+11` in `test_bugfixes.py` for `#60`, `#63`, `#64`) and `102/102` frontend Vitest specs (`+29` across `#61`, `#62`, `#65`, themes) pass cleanly locally and in PostgreSQL 16 CI [Run #82](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995).

---

## 4. What Confused Us / Problems Found

| Problem | Severity | Status | Suggested Issue / Tracker |
|---|---|---|---|
| **Live `brewmellow` Khalti card still shows `Unavailable — Not configured by merchant`** | **Major** (`P1` work priority) | **Reproduced** on Nov 18 & Nov 22 (`w12-05`) | Tracked in [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) & [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) |
| **Checkout quote initial request aborted cleanly alongside 200 retry** | Polish | Benign prefetch/superseded quote during fast client mount | Observed 1 cancelled initial `quote/` alongside `200 OK`; UI unaffected |

---

## 5. Pending Non-Author Human Repeats & Explicit Negative Boundaries

1. **Pending Uncoached Non-Author Live Gateway Check ([`#51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) / [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67)):**
   - *Next Owner:* `@notyouradhee` provisions Khalti Sandbox key for live `brewmellow`; **`@Kushan2191`** (Area 2 — outside Area 1) then executes an uncoached checkout using Khalti Sandbox (`9800000000` / OTP `987654`), tests `User canceled` cart/promo retention (`PR #64`), and posts screenshot proof directly on Issue `#51` / `#67` before Wed Nov 25 EOD.
2. **Pending Cross-OS Clean-Clone & Console Peer Spot-Check:**
   - While clean local tests passed on Windows SQLite + Ubuntu PostgreSQL 16 CI (`Run #82`), an uncoached teammate run on a second OS/clean worktree plus visual verification of `OrderDetailSheet`/`PackingSlipModal` unpaid Khalti vs COD (`PR #65` by `@jaasly07` or `@Kushan2191`) remains scheduled for Week 12–13 handoff prep.
3. **Physical Mobile Hardware Boundary ([`#52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52)):**
   - Browser `390x844` viewport emulation does **not** establish physical iOS Safari virtual-keyboard scroll/focus behavior (kept scheduled for Week 13).
4. **Handoff Trial Status *(Required in Week 13)*:** Setup path follows [`README.md`](../../README.md) and [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map); formal Week 13 external handoff trial scheduled next week.
