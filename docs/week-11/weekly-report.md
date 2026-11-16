# Weekly Report — Week 11 (MVP Verification and Freeze Gate)

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — **ShopCraft** (Multi-Tenant SaaS Platform for Nepal's Craft Economy)  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Updated Monday, November 16, 2026 on merged `main` commit [`6559ea2`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/6559ea2); Homework Deadline: Wednesday, November 18, 2026 EOD KST)  
**Status:** **FEATURE SCOPE FROZEN — PR #54 Merged to `main` (`6559ea2`); CI & Automated Suites Verified (`154` Backend + `63` Vitest); Post-Merge Live Repeat Open in Issue #51**  
**Live Production URL:** [https://shopcraft.me](https://shopcraft.me)  

---

## 1. This Week's Goal

Lock and freeze feature scope for the final demonstration, verify the complete promised core path (`Storefront Discovery -> Localized Single-Screen Checkout -> Khalti Sandbox v2 / COD -> Merchant Order Fulfillment -> PostgreSQL RLS Cross-Tenant Isolation`), verify zero regressions across **154** Django backend tests and **63** frontend Vitest tests plus surface isolation guards, and record cross-area non-author peer verification (including what each check does not establish).

No new stretch features will be introduced for Sprint 3 (Weeks 12–14). The project shifts 100% into bounded QA, cross-platform reproducibility, accessibility testing, and handoff documentation.

---

## 2. What We Committed to Do

- [x] **Verify the Core Demo Journey:** Test the end-to-end flow from `/s/brewmellow` to Khalti Sandbox authorization, COD fallback, merchant order management, and PostgreSQL RLS tenant isolation.
- [x] **Complete the MVP Verification Checklist:** Author [`mvp-verification-checklist.md`](mvp-verification-checklist.md) and [`tested-by-note.md`](tested-by-note.md) recording expected results *before* execution, actual runtime results, and what automated checks do not establish.
- [x] **Enforce Feature Scope Freeze:** Lock repository feature branches; formally confirm that cut features (such as shopper recurring subscriptions removed in PR #45) remain strictly out of scope, and close stale GitHub issues (`#33`, `#34`).
- [x] **Classify Active Issues by Priority & Severity:** Author [`issue-priority-guide.md`](issue-priority-guide.md) and open real Week 11 GitHub Issues ([`#49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)–[`#53`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53)) separating defect severity from P0–P3 work priorities.
- [x] **Execute Cross-Area Non-Author Peer Checks:** Have each student verify a component outside their primary stewardship area without author coaching.
- [x] **Maintain Test Suite & Surface Health:** Run and save full verification logs directly on merged `main` (`6559ea2`, merged via PR #54): `154` backend tests (`144` passed locally on SQLite in `17.467s`, `10` Postgres-only RLS tests skipped locally and executed under PostgreSQL 16 in CI Run `43899189860`), `63/63` frontend Vitest unit tests (`3.00s`), `tsc --noEmit` (`0` errors), and `SURFACE_ISOLATION_OK`. *(Reconciled from Week 10's `114`-test baseline following PR #54's +40 tests in `test_khalti.py` & hardening suites).*
- [x] **Complete Sprint 2 Quality Quick Checks:** Audit and complete [`sprint-quality-quick-checks.md`](sprint-quality-quick-checks.md).
- [x] **Publish Individual Contribution Receipts:** Provide dedicated receipts in [`receipts/`](receipts/) for all 4 enrolled students.

---

## 3. Evidence Links

| Evidence Category | Description | Direct Evidence Link |
|---|---|---|
| **MVP Verification Gate Issue** | Week 11 verification gate & scope freeze tracking issue on GitHub | [Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49) |
| **Area & Priority Issues** | Real Week 11 Issues with DoD, severity, and P0–P3 work priorities | [PR #54 (Merged)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54) · [Issue #50 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50) · [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) · [Issue #53](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53) · [Risk #31](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31) · [Defer #36](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/36) |
| **MVP Verification Checklist** | Official Week 11 Gate deliverable with 14 checks, `114` vs. `154` reconciliation, & negative boundaries | [mvp-verification-checklist.md](mvp-verification-checklist.md) |
| **Tested-By Note** | Non-author peer verification logs & explicit "What these checks do NOT establish" | [tested-by-note.md](tested-by-note.md) |
| **Feature Freeze Decision** | Formal decision freezing feature scope ahead of Sprint 3 | [Freeze Decision](mvp-verification-checklist.md#4-feature-freeze-decision) |
| **Issue Priority Guide** | P0–P3 prioritization framework separating work priority from bug severity | [issue-priority-guide.md](issue-priority-guide.md) |
| **Sprint Quality Quick Checks** | Completed Sprint 0, 1, and 2 quality audit | [sprint-quality-quick-checks.md](sprint-quality-quick-checks.md) |
| **Backend Test Log (`main` `6559ea2`)** | `154` discovered (`144` pass on local SQLite in `17.467s`; `10` Postgres RLS tests execute in CI) | [w11-backend-tests.txt](evidence/w11-backend-tests.txt) |
| **Frontend Checks (`main` `6559ea2`)** | `63/63` Vitest unit tests (`3.00s`), `tsc --noEmit` (0 errors), and `SURFACE_ISOLATION_OK` | [w11-frontend-checks.txt](evidence/w11-frontend-checks.txt) |
| **GitHub Actions CI (`main` `6559ea2`)** | Automated `Backend (Django + Postgres FORCE RLS)` (all `154` tests) + `Frontend` green run | [Main CI Run `43899189860`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43899189860) |
| **Codebase Area Map** | 4-Area Architecture Map with Stewards, Backups, and Health Checks | [Codebase Area Map](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) |
| **Individual Receipts** | 4 Course-Compliant Individual Evidence Receipts | [`receipts/`](receipts/) |
| **Live Deployed App** | Live Production Deployment on Vercel over HTTPS | [https://shopcraft.me](https://shopcraft.me) |
| **MVP Contract & Roadmap** | Official Scope Cut Contract (PR #45) & Final Demo Roadmap | [mvp-contract.md](../week-09/mvp-contract.md) · [final-demo-roadmap.md](../week-09/final-demo-roadmap.md) |

---

## 4. Individual Contribution Entries — One Row Per Enrolled Student

| Student | What They Did in Week 11 | Primary Stewardship Area & Backup | Direct Evidence Link |
|---|---|---|---|
| **Aditya Kumar Gupta**<br>([`@notyouradhee`](https://github.com/notyouradhee)) | **Backend, RLS, Khalti Hardening & `main` Reconciliation:** Hardened Khalti Sandbox ePayment v2 verification and retry actions (`fix/khalti-real-sandbox` candidate commits `9629021`, `07f1aeb`, merged into `main` at [`6559ea2`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/6559ea2) via [PR #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54)); reconciled `114` (Week 10) vs. `154` (Week 11 post-PR #54: `144` local SQLite in `17.467s` + `10` Postgres-only RLS executed in CI [`43899189860`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/43899189860)) + `63/63` Vitest; kept explicit **no real money moves** Sandbox boundary; reproduced clean-clone test runner on `6559ea2`. | **Area 1: Core Multi-Tenant Backend, RLS & Payments**<br>*Backup:* Rohit Chhantyal | [PR #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54)<br>[Issue #50 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50)<br>[Receipt](receipts/receipt-aditya.md)<br>[w11-backend-tests.txt](evidence/w11-backend-tests.txt) |
| **Kushan Sunuwar**<br>([`@Kushan2191`](https://github.com/Kushan2191)) | **QA Lead, Non-Author Testing & Recovery:** Executed pre-merge independent non-author check of Khalti cancellation recovery (`status=User%20canceled` preserves cart/shipping inputs) and zero-network COD fallback (`CONFIRMED` in 68ms) on external laptop without author coaching; verified `154` backend (`144` SQLite / `10` CI) + `63/63` Vitest tests and documented negative boundaries in [`tested-by-note.md`](tested-by-note.md). **Open before Wed Nov 18 EOD:** repeat live browser check on merged `main` (`6559ea2` / `https://shopcraft.me`) under [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51). | **Area 2: QA, Non-Author Verification & Runbooks**<br>*Backup:* Aanchal Chand Thakuri | [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51)<br>[Receipt](receipts/receipt-kushan.md)<br>[Tested-By Note](tested-by-note.md)<br>[Commit `76172af`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/76172af) |
| **Aanchal Chand Thakuri**<br>([`@jaasly07`](https://github.com/jaasly07)) | **Storefront UI/UX, Mobile & Accessibility:** Verified localized single-screen checkout (7 Provinces dropdown, 10-digit phone regex, municipality/ward validation from PR #48) on frozen `main` (`6559ea2`) via Chrome 130 DevTools mobile emulation (`360x800`, `390x844`, `412x915`); verified failure-path (`98412345` halts POST with inline red alert) and noted emulation does not establish physical iOS Safari keyboard behavior; confirmed `63/63` Vitest (`3.00s`), `0` TS errors, `SURFACE_ISOLATION_OK`, and Rohit's illegal state-transition guard. | **Area 3: Storefront UI/UX, Mobile & Accessibility**<br>*Backup:* Kushan Sunuwar | [Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52)<br>[Receipt](receipts/receipt-aanchal.md)<br>[w11-frontend-checks.txt](evidence/w11-frontend-checks.txt)<br>[Commit `8835f43`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/8835f43) |
| **Rohit Chhantyal**<br>([`@Rohit-coder201`](https://github.com/Rohit-coder201)) | **DevOps, Backend Health & State Machine:** Maintained local `/api/health/` uptime probe (`health_view`, `{"status": "ok"}`, zero DB queries, explicitly distinct from deployed `https://shopcraft.me`); verified `MerchantOrderStatusTransitionView` illegal-transition guard (`DELIVERED → PENDING` returns HTTP 400), 5s undo toast, and `merchant-status.test.ts` (`19/19`) on `main` (`6559ea2`); standardized display spelling as **Rohit Chhantyal** (`@Rohit-coder201`); independently verified Aanchal's `360px` mobile phone rejection. | **Area 4: DevOps, Backend Health & State Machine**<br>*Backup:* Aditya Kumar Gupta | [Issue #53](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53)<br>[Receipt](receipts/receipt-rohit.md)<br>[Commit `b53f520`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b53f520)<br>[Health Log](../week-10/evidence/rohit-resilience-health-handoff.md#health-probe-response) |

---

## 5. Cross-Area Independent Peer Checks

Each student's stewardship area was independently tested and verified by a teammate outside that area to confirm usability, error resilience, and unassisted reproducibility (full step-by-step records and negative boundaries in [`tested-by-note.md`](tested-by-note.md)):

1. **Kushan Sunuwar (Area 2 QA) verified Aditya's Payment Flow (Area 1):** Tested Khalti Sandbox ePayment v2 using official test credentials (`9800000000` / OTP `987654`) on `https://shopcraft.me`; verified server-side verification, cancellation recovery, and COD fallback (`PASS`). Verified that no real fiat currency moves.
2. **Rohit Chhantyal (Area 4 DevOps) verified Aanchal's Mobile Checkout Form (Area 3):** Tested form validation on a `360px` Android viewport simulator; verified that submitting an invalid 8-digit mobile number (`98412345`) halts form submission before POST and displays accessible red warning text (`PASS`).
3. **Aanchal Chand Thakuri (Area 3 UI) verified Rohit's Order State Machine (Area 4):** Tested merchant order transitions on `/merchant/brewmellow/orders`; verified that an illegal transition (`DELIVERED → PENDING`) is rejected with `HTTP 400 Bad Request` and logged in audit history (`PASS`). Verified local health probe is strictly local development environment.
4. **Aditya Kumar Gupta (Area 1 Backend) verified Kushan's Clean-Clone Runbook (Area 2):** Followed Kushan's `README.md` setup instructions on a fresh machine; confirmed `154` backend tests (`144` pass on local SQLite, `10` Postgres RLS tests verified in CI) and `63` frontend Vitest tests passed without author intervention (`PASS`).

---

## 6. Blockers & Risks Register

| Blocker / Risk | Defect Severity | Work Priority | Owner | Mitigation Plan |
|---|---|---|---|---|
| **1. Khalti Sandbox Latency / Downtime** | Major (if portal unreachable) | **P1 (At Risk)** | Aditya Kumar Gupta (`@notyouradhee`) | Strict 8s server-side timeout (`requests.post()`), user-friendly error notifications, and immediate **Cash on Delivery (COD)** checkout fallback that requires zero external network calls. |
| **2. Cold Starts on Neon Serverless DB** | Minor (first query 400ms delay) | **P2 (Important)** | Rohit Chhantyal (`@Rohit-coder201`) | Configured `CONN_MAX_AGE = 600` for connection pooling; added automated reconnect retry logic in `/api/health/`. |
| **3. Mobile Keyboard Obscuring Submit CTA** | Minor (ergonomic annoyance) | **P2 (Important)** | Aanchal Chand Thakuri (`@jaasly07`) | Added sticky bottom action bar with `z-50` positioning and dynamic viewport bottom padding on mobile inputs (`pb-28`). |
| **4. Third-Party Live Courier GPS Tracking** | Out of Scope / Cut | **P3 (Defer / Cut)** | Kushan Sunuwar (`@Kushan2191`) | Domestic couriers in Nepal lack public developer sandboxes. Formally cut in Week 9 MVP Contract; managed via internal merchant fulfillment status transitions. |
