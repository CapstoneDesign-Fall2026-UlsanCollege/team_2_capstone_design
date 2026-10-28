# Weekly Report — Week 8: Midterm Gate, Feedback Review & MVP Scope Reset

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — BrewMellow  
**Week:** 8 (Midterm Gate Checkpoint)  
**Date:** Wednesday, October 28, 2026 (Submitted for Wed 2026-10-28 EOD Deadline)  
**Status:** Completed  
**Live Deployed Application:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)  
**Midterm Presentation Deck:** [`docs/week-07/BrewMellow_Midterm_Presentation.pptx`](../week-07/BrewMellow_Midterm_Presentation.pptx)  
**Repository:** [https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design)

---

## 1. This Week's Goal

The goal for Week 8 is executing the **Midterm Gate Reset**: capturing and digesting instructor and peer feedback from our Week 8 Midterm Presentation, codifying foundational lessons learned from both the course and our engineering implementation, honestly assessing our MVP completion status, and establishing a single, bounded focus milestone for Sprint 2 (Week 9–11).

Rather than expanding feature scope into secondary wishlists, our team is using Week 8 to convert presentation boundaries—specifically our simulated payment flag (`is_fake_payment=True`)—into concrete, testable engineering tasks.

---

## 2. Post-Midterm Lessons Learned (Course & Project)

Following the course guidance pattern: *“We believed X; the evidence changed our view to Y; therefore our Week 9 decision is Z”*, Team 2 records the following core reflections:

### Lesson 1: Course Lesson (Engineering Honesty vs. Feature Breadth)
- **Statement:**  
  *We believed* that presenting an expansive feature set (multi-tier subscriptions, brew ratio calculators, roastery queue management, and simulated payment modals) would demonstrate stronger progress to reviewers; *the evidence* (course rubric Criterion 2 and formative feedback across Weeks 6–8) proved that reviewers value an honest, verifiable, and bounded vertical slice far more than wide-but-shallow mockups; *therefore our Week 9 decision is* to strictly freeze feature expansion and focus 100% of our Sprint 2 capacity on closing the single remaining happy-path gap: converting our simulated payment boundary into a verified Khalti sandbox transaction flow.
- **Source / Class Evidence Link:** [Midterm Presentation Rubric (Criterion 2: Demonstration and Honest Boundaries)](../../course-materials/student-starter-kit/docs/midterm-presentation-rubric.md), [Week 7 Feedback (Lines 76–83)](../../scratch/grades-and-feedback/Week%207/feedback.md#team-2).

### Lesson 2: Project Lesson (Simulated Payment Boundary & State Synchronization)
- **Statement:**  
  *We believed* that carrying origin selections into `/checkout` via URL parameters and recording an order row in PostgreSQL was sufficient proof of a complete e-commerce subscription slice; *the evidence* from our own demo rehearsal and instructor review showed that because payments remain simulated (`is_fake_payment=True`), no real funds move, webhook callbacks are unverified, and orders cannot be automatically dispatched to real couriers; *therefore our Week 9 decision is* to formally define our MVP status as **“Still Has a Gap”** and build a dedicated Khalti Sandbox SDK integration with server-side signature validation before touching any optional bells and whistles.
- **Project Evidence Link:** [Checkout State Sync Commit `30081cc`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/30081cc), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Simulated Payment Scope Boundary in Midterm Script](../week-07/midterm-demo-script.md#slide-3-28-scope-of-this-demo--full-stack-architecture-040--110).

---

## 3. Current Project Proof (Openable by Reviewers)

Any course reviewer or teammate can independently inspect our current verified vertical slice:
1. **Production Deployment (Live on Vercel over HTTPS):**  
   [https://team-2-capstone-design-one.vercel.app/origins](https://team-2-capstone-design-one.vercel.app/origins)
2. **End-to-End User Path:**  
   Home $\rightarrow$ Browse 3 Nepali micro-lots (`Gulmi Reserve`, `Ilam Gold`, `Nuwakot Heritage`) $\rightarrow$ Click *"Shop Gulmi Reserve"* $\rightarrow$ Transition to `/checkout?origin=1&name=Gulmi+Reserve...` with zero state loss on reload $\rightarrow$ Submit customer details $\rightarrow$ Order row written to PostgreSQL on Neon $\rightarrow$ Order tracker visible on `/dashboard`.
3. **Defensive Edge Case Fallback:**  
   Navigating directly to [`https://team-2-capstone-design-one.vercel.app/checkout`](https://team-2-capstone-design-one.vercel.app/checkout) without parameters cleanly displays a *"Your Cart is Empty"* card with a direct *"Build Your Plan"* CTA (Commit `f69700e`).
4. **Backend Resilience & Outage Recovery:**  
   Frontend intercepts backend API downtime and displays a descriptive connection alert banner rather than crashing (Commit `5d61dd6`, README repeatable smoke commands).

---

## 4. MVP Status Assessment: **Still Has a Gap**

In strict accordance with engineering honesty and Week 8 formative feedback, Team 2 formally assesses its MVP status as **STILL HAS A GAP**.

| What Is Verified & Proven | What Remains Incomplete (The Gap) |
|---|---|
| ✅ Next.js 16 + Tailwind CSS live on Vercel over HTTPS | ❌ Real mobile wallet payment deduction (NPR) |
| ✅ URL query parameter state synchronization without reload loss | ❌ Server-to-server Khalti payment verification API |
| ✅ Django 5.1 REST Framework API backed by Neon PostgreSQL | ❌ Automated transactional order dispatch email via SMTP |
| ✅ Customer delivery dashboard & roastery backoffice status tracker | ❌ Production webhook retry/timeout handling |
| ✅ Clean empty-cart fallback and backend connection failure recovery | ❌ End-to-end sandbox payment regression test suite |

---

## 5. Single Focus Milestone for Sprint 2 (Week 9–11)

To prevent scope creep and ensure our team delivers an airtight, testable MVP by the Week 11 MVP Freeze Gate, we commit to **ONE** primary milestone:

### **Milestone 1: Khalti Sandbox Payment Integration & Order State Machine**
- **Objective:** Replace internal simulated payment modal (`is_fake_payment=True`) with official Khalti Sandbox SDK (E-Payment API v2), validating live test wallet transactions in NPR and transitioning order state from `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `ROASTING` $\rightarrow$ `DISPATCHED`.
- **Primary Technical Owners:** `notyouradhee` (Backend API & Khalti Webhook Verification) & `Rohit-coder201` (Payment Error Handling & SMTP Dispatch).
- **Secondary QA & UX Owners:** `Kushan2191` (Independent Sandbox Test Script) & `jaasly07` (Mobile Payment Sheet & Touch UX).
- **Testable Success Signal:** A non-author teammate can initiate checkout on Vercel, pay using standard Khalti sandbox test credentials (`9800000000`, PIN `1111`), observe a successful callback redirect, and verify an updated `PAID` record in Neon PostgreSQL with a valid Khalti `transaction_id`.

---

## 6. What We Committed to Do (Week 8 Deliverables)

- [x] Review Week 7 Grades & Formative Feedback and Week 8 Instructor Notes ([`grades-and-feedback/`](../../scratch/grades-and-feedback/)).
- [x] Author shared Week 8 Weekly Report with lessons learned, MVP status, and single focus milestone ([`weekly-report.md`](weekly-report.md)).
- [x] Ensure Rohit's canonical name (`Rohit Chhantyal`) and login (`Rohit-coder201`) are unambiguously mapped across all project documentation.
- [x] Author individual evidence receipts for all 4 enrolled students in [`receipts/`](receipts/).
- [x] Formulate post-midterm scope cuts and risk mitigation strategy in [`post-midterm-reset-and-mvp-gap-analysis.md`](post-midterm-reset-and-mvp-gap-analysis.md).
- [x] Maintain zero hardcoded credentials and safe synthetic test data across all commits.

---

## 7. Evidence Links & Document Matrix

| Category | Document / Asset | Description & Direct Link |
|---|---|---|
| **Weekly Report** | Week 8 Shared Team Report | [weekly-report.md](weekly-report.md) |
| **Post-Midterm Reset** | In-depth Gap Analysis & Scope Cut Plan | [post-midterm-reset-and-mvp-gap-analysis.md](post-midterm-reset-and-mvp-gap-analysis.md) |
| **Midterm Slide Deck** | Official 9-Slide Presentation Deck | [BrewMellow_Midterm_Presentation.pptx](../week-07/BrewMellow_Midterm_Presentation.pptx) |
| **Interactive Deck** | Zero-Dependency Web Slides | [slides.html](../week-07/slides.html) |
| **Live Production** | Deployed Next.js App on Vercel | [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app) |
| **Primary Code PR** | Origin Selection & Checkout Integration | [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44) / [Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95) |
| **State Sync Commit** | Checkout Query Parameter Binding | [Commit 30081cc](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/30081cc) |
| **Edge Case Commit** | Defensive Empty Cart Fallback | [Commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e) |
| **Mobile & A11y Audit**| WCAG 2.1 AA Mobile Test Record | [accessibility-and-mobile-check.md](../week-06/accessibility-and-mobile-check.md) |
| **Outage Smoke Test** | API Outage & Recovery Record | [api-smoke-test-record.md](../week-06/api-smoke-test-record.md) |

---

## 8. Individual Contribution Entries — One Row Per Enrolled Student

| Student Login | Canonical Name | Week 8 Contribution & Reflection | Evidence Link |
|---|---|---|---|
| **`jaasly07`** | Aanchal Chand Thakuri | **Course Lesson:** Designing for accessibility is not cosmetic; thumb reachability and WCAG AA contrast make or break mobile conversions.<br>**Project Lesson:** The 390px mobile viewport audit caught critical bottom tab collisions (`pb-28` fix).<br>**MVP Status & Next Action:** MVP has a gap; will design mobile Khalti payment sheet and receipt screens. | [Receipt](receipts/receipt-aanchal.md)<br>[Commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72)<br>[Slide 5](../week-07/presentation-slides.md#slide-5-48-individual-contribution-aanchal-chand-thakuri-jaasly07) |
| **`notyouradhee`** | Aditya Kumar Gupta | **Course Lesson:** Engineering honesty regarding boundaries builds greater trust than presenting simulated flows as live systems.<br>**Project Lesson:** URL parameter synchronization gives resilience, but real financial transactions require signed server-side verification.<br>**MVP Status & Next Action:** MVP has a gap; will scaffold Khalti Sandbox API integration and webhook verification in Django. | [Receipt](receipts/receipt-aditya.md)<br>[Commit 30081cc](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/30081cc)<br>[PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44) |
| **`Kushan2191`** | Kushan Sunuwar | **Course Lesson:** Testing must be conducted by non-authors on independent hardware without author coaching to expose hidden caching.<br>**Project Lesson:** Defensive routing prevents white-screen crashes when users bookmark incomplete URLs (empty cart fallback).<br>**MVP Status & Next Action:** MVP has a gap; will author an independent test script for Khalti sandbox success and cancellation flows. | [Receipt](receipts/receipt-kushan.md)<br>[Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95)<br>[Commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e) |
| **`Rohit-coder201`** | Rohit Chhantiyal | **Identity Confirmation:** Confirmed exact canonical mapping: `Rohit Chhantyal` $\leftrightarrow$ `@Rohit-coder201`.<br>**Course Lesson:** Failure modes must be designed upfront; systems must degrade gracefully with explicit alerts.<br>**Project Lesson:** Repeatable curl smoke commands give fast verification before demos.<br>**MVP Status & Next Action:** MVP has a gap; will configure SMTP transactional email dispatcher for confirmed orders. | [Receipt](receipts/receipt-rohit.md)<br>[api-smoke-test-record.md](../week-06/api-smoke-test-record.md)<br>[Slide 8](../week-07/presentation-slides.md#slide-8-78-individual-contribution-rohit-chhantyal-rohit-coder201) |

---

## 9. Blockers, Risks & Mitigation Strategy

| Blocker / Risk | Severity | Owner | Mitigation Plan |
|---|---|---|---|
| **Khalti Sandbox API Latency / Downtime** | High | `notyouradhee` | Implement client-side timeout handling (5.0s) and fallback error alerts; preserve order state in sessionStorage so user data is never lost. |
| **SMTP Delivery Flakiness** | Medium | `Rohit-coder201` | Decouple order confirmation from email dispatch using background Celery/asynchronous tasks; orders succeed even if email delivery is delayed. |
| **Mobile Webview Payment Redirects** | Medium | `jaasly07` | Test Khalti popup and redirect modes on 390px iOS and Android Chrome viewports to ensure seamless return to `/dashboard`. |

---

## 10. Decision Record

| Decision | Why We Chose It | Owner | Evidence / Link |
|---|---|---|---|
| **Freeze Feature Scope for Sprint 2** | Adding secondary features (loyalty points, multi-address books) threatens MVP delivery; closing the payment gap is our sole priority. | All Teammates | [post-midterm-reset-and-mvp-gap-analysis.md](post-midterm-reset-and-mvp-gap-analysis.md) |
| **Adopt Khalti E-Payment v2 API** | Standardized REST API for NPR transactions with signed payment verification tokens and sandbox test credentials. | `notyouradhee` | [Issue #56](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) |
| **Explicit Scope Cut on Live Courier APIs** | Third-party courier tracking APIs in Nepal (e.g., Himalayan Express) lack sandbox endpoints; we will maintain automated internal status stages. | `Rohit-coder201` | Section 4 of this report |

---

## 11. Next Week's Bridge Task (Week 9 MVP Contract)

- Author the official **One-Page MVP Contract** defining the definitive in-scope finish list and explicit cut/postpone list for Week 11 MVP Freeze.
- Scaffold Django endpoints: `POST /api/payments/khalti/initiate/` and `POST /api/payments/khalti/verify/`.
- Conduct independent teammate verification of the sandbox checkout flow.
