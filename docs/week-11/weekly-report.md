# Weekly Report — Week 11 (MVP Verification and Freeze Gate)

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — **ShopCraft** (Multi-Tenant SaaS Platform for Nepal's Craft Economy)  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Submitted for Wednesday, November 18, 2026 EOD KST Deadline)  
**Status:** **PASSED & FEATURE SCOPE FROZEN**  
**Live Production URL:** [https://shopcraft.me](https://shopcraft.me)  

---

## 1. This Week's Goal

Lock and freeze feature scope for the final demonstration, verify the complete promised core path (`Storefront Discovery -> Localized Single-Screen Checkout -> Khalti Sandbox v2 / COD -> Merchant Order Fulfillment -> PostgreSQL RLS Cross-Tenant Isolation`), maintain zero regressions across 114 automated backend tests and frontend surface isolation guards, and establish cross-area non-author verification across all 4 codebase stewards.

No new stretch features will be introduced for Sprint 3 (Weeks 12–14). The project shifts 100% into bounded QA, cross-platform reproducibility, accessibility testing, and handoff documentation.

---

## 2. What We Committed to Do

- [x] **Verify the Core Demo Journey:** Test the end-to-end flow from `/s/brewmellow` to Khalti Sandbox authorization, COD fallback, merchant order management, and PostgreSQL RLS tenant isolation.
- [x] **Complete the MVP Verification Checklist:** Author [`mvp-verification-checklist.md`](mvp-verification-checklist.md) recording expected results *before* execution and actual runtime results for 14 distinct system checks.
- [x] **Enforce Feature Scope Freeze:** Lock repository feature branches; formally confirm that cut features (such as shopper recurring subscriptions removed in PR #45) remain strictly out of scope.
- [x] **Classify Active Issues by Priority & Severity:** Author [`issue-priority-guide.md`](issue-priority-guide.md) separating defect severity from P0–P3 work priorities.
- [x] **Execute Cross-Area Non-Author Peer Checks:** Have each student verify a component outside their primary stewardship area without author coaching to satisfy Exceeds criteria.
- [x] **Maintain Test Suite & Surface Health:** Run automated test suites: 114/114 passing backend tests (`python manage.py test accounts catalog orders stores`) and zero TypeScript/CSS token leaks (`SURFACE_ISOLATION_OK`).
- [x] **Complete Sprint 2 Quality Quick Checks:** Audit and complete [`sprint-quality-quick-checks.md`](sprint-quality-quick-checks.md).
- [x] **Publish Individual Contribution Receipts:** Provide dedicated receipts in [`receipts/`](receipts/) for all 4 enrolled students.

---

## 3. Evidence Links

| Evidence Category | Description | Direct Evidence Link |
|---|---|---|
| **MVP Verification Checklist** | Official Week 11 Gate deliverable with 14 verified observable checks | [mvp-verification-checklist.md](mvp-verification-checklist.md) |
| **Feature Freeze Decision** | Formal decision freezing feature scope ahead of Sprint 3 | [Freeze Decision](mvp-verification-checklist.md#4-feature-freeze-decision) |
| **Issue Priority Guide** | P0–P3 prioritization framework separating work priority from bug severity | [issue-priority-guide.md](issue-priority-guide.md) |
| **Sprint Quality Quick Checks** | Completed Sprint 0, 1, and 2 quality audit | [sprint-quality-quick-checks.md](sprint-quality-quick-checks.md) |
| **Backend Test Suite** | 114/114 Passing Django Automated Tests (Ran in 8.475s, 0 failures, 0 errors) | Verified via `python manage.py test accounts catalog orders stores` |
| **Frontend Surface Isolation** | Zero CSS token leaks and 0 TypeScript compilation errors | Verified via `check-surfaces.mjs` and `tsc --noEmit` |
| **Codebase Area Map** | 4-Area Architecture Map with Stewards, Backups, and Health Checks | [Codebase Area Map](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) |
| **Individual Receipts** | 4 Course-Compliant Individual Evidence Receipts | [`receipts/`](receipts/) |
| **Aditya Handoff & Slice** | Core Multi-Tenant Backend, RLS Policies & Khalti Sandbox Gateway | [Aditya Handoff](../week-10/evidence/aditya-backend-rls-handoff.md) · [Slice](../week-10/slices/slice-aditya-khalti-backend.md) · [Receipt](receipts/receipt-aditya.md) |
| **Kushan Handoff & Slice** | QA Lead, Non-Author Testing, Clean Clone Runbook & Payment Edge Cases | [Kushan Handoff](../week-10/evidence/kushan-independent-qa-handoff.md) · [Slice](../week-10/slices/slice-kushan-checkout-cancellation.md) · [Receipt](receipts/receipt-kushan.md) |
| **Aanchal Handoff & Slice** | Storefront UI/UX, Mobile Viewport Ergonomics (360px/390px) & WCAG AA | [Aanchal Handoff](../week-10/evidence/aanchal-storefront-a11y-handoff.md) · [Slice](../week-10/slices/slice-aanchal-mobile-checkout.md) · [Receipt](receipts/receipt-aanchal.md) |
| **Rohit Handoff & Slice** | DevOps, Backend Health Probe (`/api/health/`), Order Lifecycle State Machine | [Rohit Handoff](../week-10/evidence/rohit-resilience-health-handoff.md) · [Slice](../week-10/slices/slice-rohit-order-statemachine.md) · [Receipt](receipts/receipt-rohit.md) |
| **Live Deployed App** | Live Production Deployment on Vercel over HTTPS | [https://shopcraft.me](https://shopcraft.me) |
| **MVP Contract** | Official Scope Cut Contract & Week 11 Freeze Gates | [mvp-contract.md](../week-09/mvp-contract.md) |
| **Final Demo Roadmap** | Complete Roadmap & Verification Boundaries | [final-demo-roadmap.md](../week-09/final-demo-roadmap.md) |

---

## 4. Individual Contribution Entries — One Row Per Enrolled Student

| Student | What They Did in Week 11 | Primary Stewardship Area & Backup | Direct Evidence Link |
|---|---|---|---|
| **Aditya Kumar Gupta**<br>([`@notyouradhee`](https://github.com/notyouradhee)) | **Backend, RLS & Feature Freeze Leadership:** Managed Week 11 MVP verification and feature freeze gates; reconciled Phase 4 scope cut in `.planning/ROADMAP.md` ensuring subscriptions are retired per PR #45; verified all 114 automated backend tests across active apps (`accounts catalog orders stores`); verified server-side Khalti Sandbox ePayment v2 lookup verification (`epayment/lookup/` with `pidx`) with explicit sandbox credentials (`9800000000` / OTP `987654`) confirming no real money moves; independently verified Kushan's clean-clone setup runbook on a separate machine. | **Area 1: Core Multi-Tenant Backend, RLS & Payments**<br>*Backup:* Rohit Chhantyal | [Receipt](receipts/receipt-aditya.md)<br>[MVP Checklist](mvp-verification-checklist.md)<br>[Commit `776c34e`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/776c34e)<br>[Commit `cdb1c0e`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/cdb1c0e) |
| **Kushan Sunuwar**<br>([`@Kushan2191`](https://github.com/Kushan2191)) | **QA Lead, Non-Author Testing & Recovery:** Executed independent non-author testing of the Khalti Sandbox flow and Cash on Delivery fallback on an external laptop without author coaching; recorded compact Expected and Actual notes for gateway cancellation recovery (`status=User%20canceled` preserves cart items and address fields in session storage) and COD fallback (68ms confirmation with zero external HTTP calls); maintained active test runner health across 114 tests. | **Area 2: QA, Non-Author Verification & Runbooks**<br>*Backup:* Aanchal Chand Thakuri | [Receipt](receipts/receipt-kushan.md)<br>[Commit `76172af`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/76172af)<br>[Commit `89b1420`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/89b1420)<br>[QA Note](../week-10/evidence/kushan-independent-qa-handoff.md#test-2-gateway-cancellation-recovery) |
| **Aanchal Chand Thakuri**<br>([`@jaasly07`](https://github.com/jaasly07)) | **Storefront UI/UX, Mobile & Accessibility:** Audited responsive single-screen checkout with localized Nepal 7 Provinces dropdown and 10-digit mobile number regex validation; verified exact mobile test environments using Chrome 130 DevTools across 360x800, 390x844, and 412x915; documented failure-path result where submitting an invalid 8-digit phone (`98412345`) halts form submission before POST and renders accessible red error text; independently verified Rohit's order state machine on merchant dashboard. | **Area 3: Storefront UI/UX, Mobile & Accessibility**<br>*Backup:* Kushan Sunuwar | [Receipt](receipts/receipt-aanchal.md)<br>[Commit `8835f43`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/8835f43)<br>[Commit `7a72592`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7a72592)<br>[A11y Handoff](../week-10/evidence/aanchal-storefront-a11y-handoff.md) |
| **Rohit Chhantyal**<br>([`@Rohit-coder201`](https://github.com/Rohit-coder201)) | **DevOps, Backend Health & State Machine:** Maintained `/api/health/` uptime probe testing PostgreSQL engine connectivity and connection pooling in local development environment (strictly distinct from deployed Vercel frontend); audited order lifecycle state machine transitions (`PAID → PROCESSING → SHIPPED → DELIVERED`) and 5-second undo toast recovery; standardized canonical name spelling as **Rohit Chhantyal** (`@Rohit-coder201`) across documentation; independently tested Aanchal's mobile checkout validation on 360px Android viewport simulator. | **Area 4: DevOps, Backend Health & State Machine**<br>*Backup:* Aditya Kumar Gupta | [Receipt](receipts/receipt-rohit.md)<br>[Commit `b53f520`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b53f520)<br>[Commit `5406c14`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5406c14)<br>[Health Log](../week-10/evidence/rohit-resilience-health-handoff.md#health-probe-response) |

---

## 5. Cross-Area Independent Peer Checks (Exceeds Criteria)

Each student's stewardship area was independently tested and verified by a teammate outside that area to confirm usability, error resilience, and unassisted reproducibility:

1. **Kushan Sunuwar (Area 2 QA) verified Aditya's Payment Flow (Area 1):** Tested Khalti Sandbox ePayment v2 using official test credentials (`9800000000` / OTP `987654`) on live Vercel deployment; verified server-side verification and invoice token generation (`PASS`). Verified that no real fiat currency moves.
2. **Rohit Chhantyal (Area 4 DevOps) verified Aanchal's Mobile Checkout Form (Area 3):** Tested form validation on a 360px Android viewport simulator; verified that submitting an invalid 8-digit mobile number (`98412345`) halts form submission before POST and displays accessible red warning text (`PASS`).
3. **Aanchal Chand Thakuri (Area 3 UI) verified Rohit's Order State Machine (Area 4):** Tested merchant order transitions on `/merchant/brewmellow/orders`; verified that an illegal transition (`DELIVERED → PENDING`) is rejected with `HTTP 400 Bad Request` and logged in audit history (`PASS`). Verified local health probe is strictly local development environment.
4. **Aditya Kumar Gupta (Area 1 Backend) verified Kushan's Clean-Clone Runbook (Area 2):** Followed Kushan's `README.md` setup instructions on a fresh machine; confirmed all 114 active tests passed without author intervention (`PASS`).

---

## 6. Blockers & Risks Register

| Blocker / Risk | Defect Severity | Work Priority | Owner | Mitigation Plan |
|---|---|---|---|---|
| **1. Khalti Sandbox Latency / Downtime** | Major (if portal unreachable) | **P1 (At Risk)** | Aditya Kumar Gupta (`@notyouradhee`) | Strict 8s server-side timeout (`requests.post()`), user-friendly error notifications, and immediate **Cash on Delivery (COD)** checkout fallback that requires zero external network calls. |
| **2. Cold Starts on Neon Serverless DB** | Minor (first query 400ms delay) | **P2 (Important)** | Rohit Chhantyal (`@Rohit-coder201`) | Configured `CONN_MAX_AGE = 600` for connection pooling; added automated reconnect retry logic in `/api/health/`. |
| **3. Mobile Keyboard Obscuring Submit CTA** | Minor (ergonomic annoyance) | **P2 (Important)** | Aanchal Chand Thakuri (`@jaasly07`) | Added sticky bottom action bar with `z-50` positioning and dynamic viewport bottom padding on mobile inputs (`pb-28`). |
| **4. Third-Party Live Courier GPS Tracking** | Out of Scope / Cut | **P3 (Defer / Cut)** | Kushan Sunuwar (`@Kushan2191`) | Domestic couriers in Nepal lack public developer sandboxes. Formally cut in Week 9 MVP Contract; managed via internal merchant fulfillment status transitions. |
