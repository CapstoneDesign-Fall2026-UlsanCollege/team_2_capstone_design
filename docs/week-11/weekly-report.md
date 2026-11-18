# Weekly Report — Week 11 (MVP Verification and Freeze Gate)

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — **ShopCraft** (Multi-Tenant SaaS Platform for Nepal's Craft Economy)  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Finalized Wednesday, November 18, 2026 on frozen `main` commit [`8098426`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/8098426) / tag `w11-mvp-freeze-2026-11-18`; Homework Deadline: Wednesday, November 18, 2026 EOD KST)  
**Status:** **FEATURE SCOPE FROZEN — PR #54 & PR #57 Merged to `main` (`8098426`); CI Run `#74` Green (`154` Backend Postgres `FORCE RLS` + `73` Vitest); Live `https://shopcraft.me` Fix Verified (`#56` Closed; `#51` Post-Merge Gateway Repeat Open)**  
**Live Production URL:** [https://shopcraft.me](https://shopcraft.me)  

---

## 1. This Week's Goal

Lock and freeze feature scope for the final demonstration, verify the complete promised core path (`Storefront Discovery -> Localized Single-Screen Checkout -> Khalti Sandbox v2 / COD -> Merchant Order Fulfillment -> PostgreSQL RLS Cross-Tenant Isolation`), verify zero regressions across **154** Django backend tests (including migration `0013` legacy `bypass_rls` cleanup under `FORCE RLS`) and **73** frontend Vitest tests plus surface isolation guards, capture live browser screenshots (`w11-01`..`w11-07`), and record cross-area non-author peer verification (including what each check does not establish).

No new stretch features will be introduced for Sprint 3 (Weeks 12–14). The project shifts 100% into bounded QA, cross-platform reproducibility, accessibility testing, and handoff documentation.

---

## 2. What We Committed to Do

- [x] **Verify the Core Demo Journey:** Test the end-to-end flow from `/s/brewmellow` to Khalti Sandbox authorization, COD fallback, merchant order management, and PostgreSQL RLS tenant isolation.
- [x] **Complete the MVP Verification Checklist:** Author [`mvp-verification-checklist.md`](mvp-verification-checklist.md) and [`tested-by-note.md`](tested-by-note.md) recording expected results *before* execution, actual runtime results, and what automated checks do not establish.
- [x] **Enforce Feature Scope Freeze:** Lock repository feature branches; formally confirm that cut features (such as shopper recurring subscriptions removed in PR #45) remain strictly out of scope, and close stale GitHub issues (`#33`, `#34`).
- [x] **Classify Active Issues by Priority & Severity:** Author [`issue-priority-guide.md`](issue-priority-guide.md) and manage real Week 11 GitHub Issues ([`#49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)–[`#53`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53), [`#55`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/55), [`#56`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56)) separating defect severity from P0–P3 work priorities.
- [x] **Execute Cross-Area Non-Author Peer Checks & Live Browser Verification:** Record cross-area non-author checks plus live `https://shopcraft.me` desktop/mobile browser screenshots ([`evidence/screenshots/`](evidence/screenshots/)), capturing both a before-fix storefront sign-in crash (`#56`) and its verified post-deploy fix on [`8098426`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/8098426).
- [x] **Maintain Test Suite, CI Vitest & Surface Health:** Run and save full verification logs & machine-readable JSON receipt directly on frozen `main` (`8098426`, merged via [`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)): `154` backend tests (`144` passed locally on SQLite in `15.06s`, `10` Postgres-only RLS tests skipped locally and executed under PostgreSQL 16 in CI Run [`44248144770`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770)), `73/73` frontend Vitest unit tests (`6` files, `1.63s`), `tsc --noEmit` (`0` errors), scoped ESLint (`0` errors), and `SURFACE_ISOLATION_OK`. *(Reconciled from Week 10's `114` baseline -> PR #54's `154`/`63` -> PR #57's `154`/`73` following OTP email validation & `#56` guards).*
- [x] **Complete Sprint 2 Quality Quick Checks:** Audit and complete [`sprint-quality-quick-checks.md`](sprint-quality-quick-checks.md).
- [x] **Publish Formal Freeze Record, CI Validation, Evidence Index & Individual Receipts:** Provide [`mvp-freeze-record.md`](mvp-freeze-record.md), [`ci-validation.md`](ci-validation.md), [`evidence-index.md`](evidence-index.md), [`architecture-and-hardening-notes.md`](architecture-and-hardening-notes.md), and dedicated receipts in [`receipts/`](receipts/) for all 4 enrolled students.

---

## 3. Evidence Links

| Evidence Category | Description | Direct Evidence Link |
|---|---|---|
| **MVP Verification Gate Issue** | Week 11 verification gate & scope freeze tracking issue on GitHub | [Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49) |
| **Area & Priority Issues** | Real Week 11 Issues & PRs with DoD, severity, and P0–P3 work priorities | [PR #54 (Merged)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54) · [PR #57 (Merged)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57) · [Issue #50 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50) · [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) · [Issue #53 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53) · [Issue #55 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/55) · [Issue #56 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) |
| **MVP Freeze Record & Tag** | Formal candidate SHA lock (`8098426`), tag `w11-mvp-freeze-2026-11-18`, & live boundaries | [mvp-freeze-record.md](mvp-freeze-record.md) |
| **Evidence Index & Source Notes** | Master index of all logs/screenshots/receipts & source-linked hardening notes | [evidence-index.md](evidence-index.md) · [architecture-and-hardening-notes.md](architecture-and-hardening-notes.md) |
| **MVP Verification Checklist** | Official Week 11 Gate deliverable with observable checks, count reconciliation, & negative boundaries | [mvp-verification-checklist.md](mvp-verification-checklist.md) |
| **Tested-By Note** | Non-author peer verification logs & explicit "What these checks do NOT establish" | [tested-by-note.md](tested-by-note.md) |
| **Feature Freeze Decision** | Formal decision freezing feature scope ahead of Sprint 3 | [Freeze Decision](mvp-verification-checklist.md#4-feature-freeze-decision) |
| **Issue Priority Guide** | P0–P3 prioritization framework separating work priority from bug severity | [issue-priority-guide.md](issue-priority-guide.md) |
| **Sprint Quality Quick Checks** | Completed Sprint 0, 1, and 2 quality audit | [sprint-quality-quick-checks.md](sprint-quality-quick-checks.md) |
| **Machine-Readable Check Receipt** | SHA-256 checksums, timings, versions, & exit codes on frozen `8098426` | [w11-verification-checks.json](evidence/w11-verification-checks.json) |
| **Backend Test Log (`main` `8098426`)** | `154` discovered (`144` pass on local SQLite in `15.06s`; `10` Postgres RLS tests execute in CI) | [w11-backend-tests.txt](evidence/w11-backend-tests.txt) |
| **Frontend Checks (`main` `8098426`)** | `73/73` Vitest (`1.63s`), `tsc --noEmit` (0 errors), scoped ESLint (0 errors), `SURFACE_ISOLATION_OK` | [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) |
| **Live Browser Screenshots (W11-01..07)** | 7 verified screenshots from `https://shopcraft.me` (bag isolation, 390px checkout, `#56` crash & fix) | [`evidence/screenshots/`](evidence/screenshots/) |
| **GitHub Actions CI (`main` `8098426`)** | Automated `Backend (Django + Postgres FORCE RLS)` + `0013` + `Frontend (Next.js)` incl. Vitest | [ci-validation.md](ci-validation.md) · [Main CI Run `44248144770`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770) |
| **Codebase Area Map** | 4-Area Architecture Map with Stewards, Backups, and Health Checks | [Codebase Area Map](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) |
| **Individual Receipts** | 4 Course-Compliant Individual Evidence Receipts | [`receipts/`](receipts/) |
| **Live Deployed App** | Live Production Deployment on Vercel over HTTPS (`GXNf69Qaf8UUrkdyi3KcRqoQKFR4`) | [https://shopcraft.me](https://shopcraft.me) |
| **MVP Contract & Roadmap** | Official Scope Cut Contract (PR #45) & Final Demo Roadmap | [mvp-contract.md](../week-09/mvp-contract.md) · [final-demo-roadmap.md](../week-09/final-demo-roadmap.md) |

---

## 4. Individual Contribution Entries — One Row Per Enrolled Student

| Student | What They Did in Week 11 | Primary Stewardship Area & Backup | Direct Evidence Link |
|---|---|---|---|
| **Aditya Kumar Gupta**<br>([`@notyouradhee`](https://github.com/notyouradhee)) | **Backend, RLS `0013`, Khalti Hardening, & Freeze Gate:** Hardened Khalti Sandbox ePayment v2 verification/retry (`PR #54` / `6559ea2`); added OTP email validation & typo hints (`0a0ec4d` / `Issue #55` closed); authored migration `0013_drop_legacy_rls_policies.py` dropping legacy `bypass_rls` policies so every tenant table keeps strictly `tenant_isolation_policy` (`64a31f9`); merged recovery [`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57) (`8098426`); verified `154` backend tests (`144` local SQLite in `15.06s` + `10` Postgres-only executed in CI [`44248144770`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770)) + `73/73` Vitest; locked [`mvp-freeze-record.md`](mvp-freeze-record.md). | **Area 1: Core Multi-Tenant Backend, RLS & Payments**<br>*Backup:* Rohit Chhantyal | [PR #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54) · [PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)<br>[Issues #50, #55, #56 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50)<br>[Receipt](receipts/receipt-aditya.md) · [`w11-verification-checks.json`](evidence/w11-verification-checks.json) |
| **Kushan Sunuwar**<br>([`@Kushan2191`](https://github.com/Kushan2191)) | **QA Lead, Non-Author Testing & Recovery:** Executed pre-merge independent non-author check of Khalti cancellation recovery (`status=User%20canceled` preserves cart/shipping inputs) and zero-network COD fallback (`CONFIRMED` in 68ms) on external laptop without author coaching; verified `154` backend (`144` SQLite / `10` CI) + `73/73` Vitest tests (`8098426`) and documented negative boundaries in [`tested-by-note.md`](tested-by-note.md). **Open in [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51):** Nov 18 live browser audit showed `brewmellow` Khalti disabled on prod (`"Not configured by merchant"`) while COD is active; repeat live gateway confirmation stays open in `#51`. | **Area 2: QA, Non-Author Verification & Runbooks**<br>*Backup:* Aanchal Chand Thakuri | [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51)<br>[Receipt](receipts/receipt-kushan.md)<br>[Tested-By Note](tested-by-note.md)<br>[Commit `76172af`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/76172af) |
| **Aanchal Chand Thakuri**<br>([`@jaasly07`](https://github.com/jaasly07)) | **Storefront UI/UX, Mobile Checkout & Issue `#56` Auth Guard:** Verified localized single-screen checkout (7 Provinces dropdown, 10-digit phone regex, failure-path `98412345` rejecting pre-POST) across Chrome DevTools emulation (`360x800`, `390x844`, `412x915`) and live `https://shopcraft.me` (`w11-04-mobile-390-checkout-phone-rejection.png`); fixed live `StorefrontHeader` `"Sign in to your account"` `MouseEvent.trim` crash in [`Issue #56`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) / `aa62b2f` (`PR #57`), adding regression tests for `73/73` Vitest (`1.63s`), `0` TS errors, `SURFACE_ISOLATION_OK`, and live Account drawer verification (`w11-07`). | **Area 3: Storefront UI/UX, Mobile & Accessibility**<br>*Backup:* Kushan Sunuwar | [Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) · [Issue #56 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56)<br>[Receipt](receipts/receipt-aanchal.md)<br>[w11-frontend-checks.txt](evidence/w11-frontend-checks.txt)<br>[Commit `aa62b2f`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/aa62b2f) |
| **Rohit Chhantyal**<br>([`@Rohit-coder201`](https://github.com/Rohit-coder201)) | **DevOps, Backend Health, CI Vitest & State Machine:** Maintained local `/api/health/` uptime probe (`health_view`, `{"status": "ok"}`, zero DB queries, explicitly distinct from deployed `https://shopcraft.me`); verified `MerchantOrderStatusTransitionView` illegal-transition guard (`DELIVERED -> PENDING` returns HTTP 400), 5s undo toast, `merchant-status.test.ts` (`19/19`), and CI Vitest execution in [`ci-validation.md`](ci-validation.md) (`Run #74`); standardized display spelling as **Rohit Chhantyal** (`@Rohit-coder201`); independently verified Aanchal's `360px` mobile phone rejection. | **Area 4: DevOps, Backend Health & State Machine**<br>*Backup:* Aditya Kumar Gupta | [Issue #53 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53)<br>[Receipt](receipts/receipt-rohit.md) · [CI Validation](ci-validation.md)<br>[Commit `b53f520`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b53f520)<br>[Health Log](../week-10/evidence/rohit-resilience-health-handoff.md#health-probe-response) |

---

## 5. Cross-Area Independent Peer Checks

Each student's stewardship area was independently tested and verified by a teammate outside that area to confirm usability, error resilience, and unassisted reproducibility (full step-by-step records and negative boundaries in [`tested-by-note.md`](tested-by-note.md)):

1. **Kushan Sunuwar (Area 2 QA) verified Aditya's Payment Flow (Area 1):** Tested Khalti Sandbox ePayment v2 using official test credentials (`9800000000` / OTP `987654`) on `https://shopcraft.me`; verified server-side verification, cancellation recovery, and COD fallback (`PASS`). Verified that no real fiat currency moves.
2. **Rohit Chhantyal (Area 4 DevOps) verified Aanchal's Mobile Checkout Form (Area 3):** Tested form validation on a `360px` Android viewport simulator; verified that submitting an invalid 8-digit mobile number (`98412345`) halts form submission before POST and displays accessible red warning text (`PASS`).
3. **Aanchal Chand Thakuri (Area 3 UI) verified Rohit's Order State Machine (Area 4):** Tested merchant order transitions on `/merchant/brewmellow/orders`; verified that an illegal transition (`DELIVERED → PENDING`) is rejected with `HTTP 400 Bad Request` and logged in audit history (`PASS`). Verified local health probe is strictly local development environment.
4. **Aditya Kumar Gupta (Area 1 Backend) verified Kushan's Clean-Clone Runbook (Area 2):** Followed Kushan's `README.md` setup instructions on a fresh machine; confirmed `154` backend tests (`144` pass on local SQLite, `10` Postgres RLS tests verified in CI Run `#74`) and `73` frontend Vitest tests passed without author intervention (`PASS`).

---

## 6. Blockers & Risks Register

| Blocker / Risk | Defect Severity | Work Priority | Owner | Mitigation Plan |
|---|---|---|---|---|
| **1. Khalti Sandbox Latency / Downtime** | Major (if portal unreachable) | **P1 (At Risk)** | Aditya Kumar Gupta (`@notyouradhee`) | Strict 8s server-side timeout (`requests.post()`), user-friendly error notifications, and immediate **Cash on Delivery (COD)** checkout fallback that requires zero external network calls. |
| **2. Cold Starts on Neon Serverless DB** | Minor (first query 400ms delay) | **P2 (Important)** | Rohit Chhantyal (`@Rohit-coder201`) | Configured `CONN_MAX_AGE = 600` for connection pooling; added automated reconnect retry logic in `/api/health/`. |
| **3. Mobile Keyboard Obscuring Submit CTA** | Minor (ergonomic annoyance) | **P2 (Important)** | Aanchal Chand Thakuri (`@jaasly07`) | Added sticky bottom action bar with `z-50` positioning and dynamic viewport bottom padding on mobile inputs (`pb-28`). |
| **4. Third-Party Live Courier GPS Tracking** | Out of Scope / Cut | **P3 (Defer / Cut)** | Kushan Sunuwar (`@Kushan2191`) | Domestic couriers in Nepal lack public developer sandboxes. Formally cut in Week 9 MVP Contract; managed via internal merchant fulfillment status transitions. |
