# Week 11 Evidence Index — ShopCraft

**Team:** Team 2 — ShopCraft  
**Week:** 11 — MVP Verification & Scope Freeze Gate  
**Frozen Candidate SHA:** [`80984261d9ab698a27e8c8affa34766083af1ec0`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/80984261d9ab698a27e8c8affa34766083af1ec0)  
**Period:** November 12–18, 2026

---

## 1. Core Week 11 Deliverables

| Deliverable | Purpose | Link |
|---|---|---|
| **Shared Weekly Report** | Team goals, commitments, all 4 student rows, peer checks, and risk register | [`weekly-report.md`](weekly-report.md) |
| **MVP Verification Checklist** | 15+ observable checks with pre-written expected vs actual results and `114`/`154`/`73` reconciliation | [`mvp-verification-checklist.md`](mvp-verification-checklist.md) |
| **MVP Scope Freeze Record** | Candidate SHA `8098426`, tag `w11-mvp-freeze-2026-11-18`, change control, and transparent release boundaries | [`mvp-freeze-record.md`](mvp-freeze-record.md) |
| **Tested-By Note** | Non-author peer verification records + explicit "What these checks do NOT establish" | [`tested-by-note.md`](tested-by-note.md) |
| **CI Validation Report** | GitHub Actions Run `#74` (`44248144770`), Postgres `FORCE RLS` + migration `0013`, & Vitest CI integration | [`ci-validation.md`](ci-validation.md) |
| **Architecture & Hardening Notes** | Source-linked technical notes for human walkthroughs across Areas 1–4 | [`architecture-and-hardening-notes.md`](architecture-and-hardening-notes.md) |
| **Issue Priority Guide** | P0–P3 work priority framework separated from defect severity | [`issue-priority-guide.md`](issue-priority-guide.md) |
| **Sprint Quality Quick Checks** | Sprint 0, Sprint 1, and Sprint 2 completion audit | [`sprint-quality-quick-checks.md`](sprint-quality-quick-checks.md) |

---

## 2. Automated Verification Logs & Machine-Readable Receipt (`8098426`)

| Artifact | Summary | Link |
|---|---|---|
| **Machine-Readable Receipt (`.json`)** | SHA-256 digests, ISO UTC timestamps, durations, Python `3.13.1` / Node `v24.22.1`, `154` backend (`144` SQLite / `10` Postgres CI) + `73/73` Vitest | [`evidence/w11-verification-checks.json`](evidence/w11-verification-checks.json) |
| **Backend Verbose Test Log** | `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores --verbosity 2` (`154` discovered, `144` passed in `15.06s`, `10` Postgres RLS skipped locally & passed in CI Run `#74`) | [`evidence/w11-backend-tests.txt`](evidence/w11-backend-tests.txt) |
| **Frontend Checks Log** | `npm test` (`6 files / 73 passed` in `1.63s`), `tsc --noEmit` (`0` errors), `SURFACE_ISOLATION_OK`, scoped ESLint (`0` errors) | [`evidence/w11-frontend-checks.txt`](evidence/w11-frontend-checks.txt) |

---

## 3. Live Deployment Browser Verification Screenshots (`https://shopcraft.me`)

Captured via isolated browser sessions against production `https://shopcraft.me` (zero order POSTs submitted, zero private credentials or PII exposed):

| Screenshot | Check & State Captured | Status at Capture | File |
|---|---|---|---|
| **W11-01** | Store #1 (`/s/brewmellow`) desktop (`1440x900`) catalog & persisted `Bag (1)` after reload | **PASS** | [`w11-01-brewmellow-storefront-cart.png`](evidence/screenshots/w11-01-brewmellow-storefront-cart.png) |
| **W11-02** | Store #2 (`/s/pahadi-honey`) desktop (`1440x900`) distinct store header & `0`-item bag (zero cross-tenant cart leak) | **PASS** | [`w11-02-pahadi-honey-cart-isolation.png`](evidence/screenshots/w11-02-pahadi-honey-cart-isolation.png) |
| **W11-03** | Desktop checkout (`/s/brewmellow/checkout`) invalid phone (`98412345`) rejected pre-POST | **PASS** | [`w11-03-desktop-checkout-phone-rejection.png`](evidence/screenshots/w11-03-desktop-checkout-phone-rejection.png) |
| **W11-04** | Mobile (`390x844`) checkout invalid phone (`98412345`) rejected pre-POST + sticky footer CTA (`Place Order · Rs. 550`) | **PASS** | [`w11-04-mobile-390-checkout-phone-rejection.png`](evidence/screenshots/w11-04-mobile-390-checkout-phone-rejection.png) |
| **W11-05** | Pre-deploy `/login` (`buyer@gmial.com`) showing baseline prior to `PR #57` bundle rollout | **Diagnostic Baseline** | [`w11-05-login-pre-typo-hint-live.png`](evidence/screenshots/w11-05-login-pre-typo-hint-live.png) |
| **W11-06** | Issue `#56` before-fix crash reproduction (`Connection Error / Unable to Load Store` from `MouseEvent.trim`) | **Recorded Failure (Fixed in PR #57)** | [`w11-06-issue-56-storefront-signin-crash-diagnostic.png`](evidence/screenshots/w11-06-issue-56-storefront-signin-crash-diagnostic.png) |
| **W11-07** | Issue `#56` after-fix post-`PR #57` deployment on `https://shopcraft.me/s/brewmellow` (`Sign In / Passwordless sign-in` sheet opens cleanly with `0` crash errors) | **PASS (Verified Live Post-Deploy)** | [`w11-07-issue-56-storefront-signin-fixed-live.png`](evidence/screenshots/w11-07-issue-56-storefront-signin-fixed-live.png) |

---

## 4. Individual Student Contribution Receipts

| Student | GitHub Handle | Primary Area | Receipt |
|---|---|---|---|
| **Aditya Kumar Gupta** | [`@notyouradhee`](https://github.com/notyouradhee) | Area 1 — Core Backend, RLS & Payments | [`receipts/receipt-aditya.md`](receipts/receipt-aditya.md) |
| **Kushan Sunuwar** | [`@Kushan2191`](https://github.com/Kushan2191) | Area 2 — QA, Non-Author Checks & Runbooks | [`receipts/receipt-kushan.md`](receipts/receipt-kushan.md) |
| **Aanchal Chand Thakuri** | [`@jaasly07`](https://github.com/jaasly07) | Area 3 — Storefront UI/UX, Mobile & A11y | [`receipts/receipt-aanchal.md`](receipts/receipt-aanchal.md) |
| **Rohit Chhantyal** | [`@Rohit-coder201`](https://github.com/Rohit-coder201) | Area 4 — DevOps, Health & State Machine | [`receipts/receipt-rohit.md`](receipts/receipt-rohit.md) |

---

## 5. GitHub Issues & Pull Requests Ledger

| Item | State | Priority / Area | Scope |
|---|---|---|---|
| [`#49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49) | **Open** | `P1` / Gate | Week 11 MVP Verification Gate (tracks `@Kushan2191` post-merge live confirmation in `#51`) |
| [`#50`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50) / [`PR #54`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54) | **Closed / Merged** | `P1` / Area 1 | Khalti Sandbox ePayment v2 verification, cancellation recovery & hardening suite (`6559ea2`) |
| [`#51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) | **Open** | `P2` / Area 2 | Non-author QA live repeat on `https://shopcraft.me` (notes live `brewmellow` Khalti unconfigured status) |
| [`#52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) | **Open** | `P2` / Area 3 | Localized mobile checkout emulation verified; physical iOS hardware keyboard deferred to Week 13 |
| [`#53`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53) | **Closed** | `P2` / Area 4 | Order state machine (`DELIVERED -> PENDING` HTTP 400), 5s undo toast & local `/api/health/` probe |
| [`#55`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/55) / [`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57) | **Closed / Merged** | `P2` / Area 3 | OTP client email validation, domain typo hint (`gmial.com`, etc.), `"Wrong email? Change it"`, spam note (`0a0ec4d`) |
| [`#56`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) / [`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57) | **Closed / Merged** | `P1` / Area 3 | Storefront header `"Sign in to your account"` `MouseEvent.trim` crash guard (`aa62b2f`, fixed at `8098426`) |
