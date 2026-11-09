# Weekly Report — Week 10: Code Ownership, Responsible AI Audit & Peer Verification

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — **ShopCraft** (Multi-Tenant E-Commerce Platform for Nepal's Craft Economy)  
**Week:** 10 (Sprint 2: MVP and Freeze)  
**Date:** Monday, November 9, 2026 (Submitted for Wednesday, November 11, 2026 EOD KST Deadline)  
**Status:** Completed & Cross-Verified  
**Live Deployed Application:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)  
**Repository:** [https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design)

---

## 1. This Week's Goal

The primary goal of Week 10 is executing the **Code Ownership and Responsible AI Audit**:
1. Map the codebase into four healthy, understandable areas matching our repository structure.
2. Assign each of the four students a primary stewardship area and a roadmap-aligned delivery slice based on current strengths.
3. Establish learning partners/backups for every area to ensure shared understanding and eliminate single-point-of-failure gatekeeping.
4. Transparently disclose permitted AI assistance (GitHub Copilot, Claude, ChatGPT), documenting human review, refactoring, and test evidence.
5. Perform independent non-author peer verification checks across area boundaries.
6. Prepare the team for the upcoming **Week 11 MVP Feature Freeze Gate** (November 12, 2026).

---

## 2. What We Committed to Do (Week 10 Checklist)

- [x] Author the comprehensive [AI Use and Code Ownership Audit](ai-use-and-code-ownership-audit.md).
- [x] Map the codebase into 4 real repository areas with designated stewards, backups, and repeatable health checks.
- [x] Document individual roadmap slices, explain-back statuses, inputs, outputs, and dependencies for all 4 students in [`slices/`](slices/).
- [x] Record transparent AI-use notes for all AI-assisted commits with human refactoring details.
- [x] Execute and document 4 non-author cross-area peer verification checks with expected vs actual results.
- [x] Pass all **113/113 automated backend tests** in 13.2s (`python manage.py test accounts catalog orders stores` — shopper subscriptions cleanly excluded per PR #45 scope rules).
- [x] Verify **0 TypeScript compilation errors** (`npx tsc --noEmit`) and **Surface Isolation** (`node scripts/check-surfaces.mjs`).
- [x] Author individual handoff and evidence files in [`evidence/`](evidence/) and official receipts in [`receipts/`](receipts/) for all 4 students.
- [x] Complete the official [Week 10 Work Checklist](work-checklist.md).
- [x] Maintain one shared Weekly Report with attributed contribution rows for every enrolled student.

---

## 3. Evidence Links

| Evidence Category | Description | Direct Evidence Link |
|---|---|---|
| **Code Ownership Audit** | Official Week 10 Code Ownership & Responsible AI Audit | [ai-use-and-code-ownership-audit.md](ai-use-and-code-ownership-audit.md) |
| **Work Checklist** | Official Course Week 10 Checklist (Sections 1–5 completed) | [work-checklist.md](work-checklist.md) |
| **Codebase Area Map** | 4-Area Architecture Map with Stewards, Backups, and Health Checks | [Area Map](ai-use-and-code-ownership-audit.md#2-codebase-area-map) |
| **Backend Test Suite** | 113/113 Passing Django Automated Tests (Ran in 13.236s) | Verified via `python manage.py test accounts catalog orders stores` |
| **Frontend Verification** | Zero Type Errors & Surface Isolation OK | Verified via `tsc --noEmit` and `check-surfaces.mjs` |
| **Individual Slices** | 4 Dedicated Roadmap Slice Notes (PR with AI Use format) | [`slices/`](slices/) |
| **Individual Receipts** | 4 Course-Compliant Individual Evidence Receipts | [`receipts/`](receipts/) |
| **Aditya Handoff & Slice** | Core Multi-Tenant Backend, RLS Policies & Khalti Sandbox Gateway | [Aditya Handoff](evidence/aditya-backend-rls-handoff.md) · [Slice](slices/slice-aditya-khalti-backend.md) · [Receipt](receipts/receipt-aditya.md) |
| **Kushan Handoff & Slice** | QA Lead, Non-Author Testing, Clean Clone Runbook & Payment Edge Cases | [Kushan Handoff](evidence/kushan-independent-qa-handoff.md) · [Slice](slices/slice-kushan-checkout-cancellation.md) · [Receipt](receipts/receipt-kushan.md) |
| **Aanchal Handoff & Slice** | Storefront UI/UX, Mobile Viewport Ergonomics (360px/390px) & WCAG AA | [Aanchal Handoff](evidence/aanchal-storefront-a11y-handoff.md) · [Slice](slices/slice-aanchal-mobile-checkout.md) · [Receipt](receipts/receipt-aanchal.md) |
| **Rohit Handoff & Slice** | DevOps, Backend Health Probe (`/api/health/`), Order Lifecycle State Machine | [Rohit Handoff](evidence/rohit-resilience-health-handoff.md) · [Slice](slices/slice-rohit-order-statemachine.md) · [Receipt](receipts/receipt-rohit.md) |
| **Live Deployed App** | Live Production Deployment on Vercel over HTTPS | [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app) |
| **MVP Contract** | Official Scope Cut Contract & Week 11 Freeze Gates | [mvp-contract.md](../week-09/mvp-contract.md) |
| **Final Demo Roadmap** | Complete Roadmap & Verification Boundaries | [final-demo-roadmap.md](../week-09/final-demo-roadmap.md) |

---

## 4. Individual Contribution Entries — One Row Per Enrolled Student

| Student | What They Did in Week 10 | Primary Stewardship Area & Backup | Direct Evidence Link |
|---|---|---|---|
| **Aditya Kumar Gupta**<br>([`@notyouradhee`](https://github.com/notyouradhee)) | Implemented server-side Khalti Sandbox ePayment v2 initiation and signature verification (`epayment/lookup/` with `pidx`), Cash on Delivery (COD) fallback, and PostgreSQL Row-Level Security (RLS) policies on 11 tables; authored Week 10 audit scaffolding; verified 113/113 backend tests across active apps. | **Area 1: Core Multi-Tenant Backend, RLS & Payments**<br>*Backup:* Rohit Chhantyal | [Aditya Evidence](evidence/aditya-backend-rls-handoff.md)<br>[Commit 1374b23](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23)<br>[Commit cdb1c0e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/cdb1c0e) |
| **Kushan Sunuwar**<br>([`@Kushan2191`](https://github.com/Kushan2191)) | Executed independent non-author testing of the Khalti Sandbox flow and Cash on Delivery fallback on an external laptop; verified payment cancellation edge case (cart state and entered addresses preserved upon gateway abort); authored QA clean-clone reproducibility runbook. | **Area 2: QA, Non-Author Verification & Runbooks**<br>*Backup:* Aanchal Chand Thakuri | [Kushan Evidence](evidence/kushan-independent-qa-handoff.md)<br>[QA Test Note](evidence/kushan-independent-qa-handoff.md#test-2-gateway-cancellation-recovery) |
| **Aanchal Chand Thakuri**<br>([`@jaasly07`](https://github.com/jaasly07)) | Designed and refactored the responsive single-screen checkout with localized Nepal 7 Provinces dropdown and 10-digit mobile number validation; audited mobile ergonomics across 360px (Android) and 390px (iOS) viewports enforcing 52px touch targets (`py-3 px-6`) and WCAG 2.1 AA color contrast ($>4.5:1$). | **Area 3: Storefront UI/UX, Mobile & Accessibility**<br>*Backup:* Kushan Sunuwar | [Aanchal Evidence](evidence/aanchal-storefront-a11y-handoff.md)<br>[Commit 7a72592](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7a72592) |
| **Rohit Chhantyal**<br>([`@Rohit-coder201`](https://github.com/Rohit-coder201)) | Tested backend system resilience and `/api/health/` uptime probe with PostgreSQL connection pooling; audited order lifecycle state machine transitions (`PAID → PROCESSING → SHIPPED → DELIVERED`) with 5-second undo toast actions; verified graceful JSON error degradation (`HTTP 503`) during simulated database drops. | **Area 4: DevOps, Backend Health & State Machine**<br>*Backup:* Aditya Kumar Gupta | [Rohit Evidence](evidence/rohit-resilience-health-handoff.md)<br>[Health Check Log](evidence/rohit-resilience-health-handoff.md#health-probe-response) |

---

## 5. Cross-Area Independent Peer Checks

Each student's slice was independently traced and verified by a teammate outside their stewardship area to verify cross-area usability and failure recovery:

1. **Kushan Sunuwar verified Aditya's Payment Flow:** Tested Khalti Sandbox ePayment v2 using official test credentials (`9800000000` / OTP `987654`) on live Vercel deployment; verified server-side verification and invoice token generation (`PASS`).
2. **Rohit Chhantyal verified Aanchal's Mobile Checkout Form:** Tested form validation on a 360px Android viewport; verified that submitting an invalid 9-digit mobile number blocks checkout and displays accessible red warning text (`PASS`).
3. **Aanchal Chand Thakuri verified Rohit's Order State Machine:** Tested merchant order transitions on `/merchant/craftnepal/orders`; verified that an illegal transition (`DELIVERED → PENDING`) is rejected with `HTTP 400 Bad Request` and logged in audit history (`PASS`).
4. **Aditya Kumar Gupta verified Kushan's Clean-Clone Runbook:** Followed Kushan's `README.md` setup instructions on a fresh machine; confirmed all 113 active tests passed without author intervention (`PASS`).

---

## 6. Blockers & Risks Register

| Blocker / Risk | Severity | Owner | Mitigation Plan |
|---|---|---|---|
| **1. Khalti Sandbox Latency / Downtime** | High | Aditya Kumar Gupta (`@notyouradhee`) | Strict 8s API timeouts, client-side notifications, and instant **Cash on Delivery (COD)** checkout fallback that requires zero external network calls. |
| **2. Cold Starts on Neon Serverless DB** | Medium | Rohit Chhantyal (`@Rohit-coder201`) | Configured `CONN_MAX_AGE = 600` for connection pooling; added automated reconnect retry logic in `/api/health/`. |
| **3. Mobile Keyboard Obscuring Submit CTA** | Low | Aanchal Chand Thakuri (`@jaasly07`) | Added sticky bottom action bar with `z-50` positioning and dynamic viewport bottom padding on mobile inputs. |
| **4. Teammate Authorship Attribution** | Medium | All Members | Each member maintains dedicated handoff files in `evidence/` with matching git author commits in the repository. |

---

## 7. Decision Record

| Decision | Why We Chose It | Owner | Evidence Link |
|---|---|---|---|
| **Adopt 4-Area Codebase Stewardship Model** | Ensures every team member has a clear, defensible ownership area and learning partner, eliminating single-author bottlenecks. | All Members | [Area Map](ai-use-and-code-ownership-audit.md#2-codebase-area-map) |
| **Formalize Disclosed AI Usage with Human Code Review** | Complies with academic honesty policy; transparently documents where Copilot/Claude assisted and how the human team refactored the code. | All Members | [AI Notes](ai-use-and-code-ownership-audit.md#1-responsible-ai-use-notes) |
| **Enforce Cross-Area Peer Reviews** | Validates that code can be understood, traced, and tested by teammates outside the author's area, ensuring peer reproducibility. | All Members | [Peer Checks](ai-use-and-code-ownership-audit.md#5-non-author-peer-verification--boundary-checks) |
| **Freeze Scope Ahead of Week 11 Gate** | Protects project stability; no new feature branches permitted prior to the MVP Feature Freeze Gate on Nov 12. | All Members | [MVP Contract](../week-09/mvp-contract.md) |

---

## 8. Next Week's Bridge Task (Week 11: MVP Feature Freeze Gate)

- **Date:** Thursday, November 12, 2026.
- **Milestone:** **Sprint 2 MVP Feature Freeze Gate**.
- **Actions:**
  1. Lock `main` branch against new feature additions; focus exclusively on bug fixes, performance, and demo rehearsal.
  2. Perform full end-to-end regression testing of the frozen core journey:
     $$\text{Storefront } (/s/\text{craftnepal}) \longrightarrow \text{Product Selection} \longrightarrow \text{Single-Screen Checkout} \longrightarrow \text{Khalti Sandbox (or COD)} \longrightarrow \text{Confirmation} \longrightarrow \text{Merchant Console} \longrightarrow \text{Tenant Isolation 404 Guard}$$
  3. Verify that all 113 automated backend tests and TypeScript checks remain 100% green.
