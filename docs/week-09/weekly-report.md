# Weekly Report — Week 9: ShopCraft Pivot, MVP Contract & Khalti Sandbox Delivery

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Week:** 9 (Sprint 2: MVP Contract & SaaS Pivot Formalization)  
**Date:** Wednesday, November 4, 2026 (Submitted for Wed 2026-11-04 EOD Deadline)  
**Status:** Completed  
**Live Deployed Application:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)  
**Repository:** [https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design)

---

## 1. Project Pivot Rationale & Architectural Reconciliation

### The Pivot: From "BrewMellow" (Single Store) to "ShopCraft" (Multi-Tenant Platform)
Following our Midterm evaluation (where Team 2 was rated **Exceeds** in `Week 8/grades.md`), classroom discussion and feedback challenged us:
> *“A single bespoke coffee shop website limits engineering depth and real-world scalability. Independent craft producers across Nepal (coffee roasters, honey harvesters, artisanal weavers) desperately need a localized, multi-tenant e-commerce engine with native Khalti payments, Nepali address handling (Provinces 1–7), and strict merchant isolation.”*

In response, our team made a deliberate, post-midterm architectural pivot:
1. **Project Name Changed to ShopCraft:** ShopCraft is a multi-tenant e-commerce SaaS platform built for Nepali craft merchants.
2. **BrewMellow Retained as Flagship Tenant #1:** Rather than discarding our domain research, BrewMellow (`/s/brewmellow`) became our primary pilot store selling single-origin coffees from Gulmi, Ilam, and Nuwakot.
3. **Pahadi Honey Added as Tenant #2:** To test and verify multi-tenant isolation, we seeded a second store (`/s/pahadi-honey`) selling wild cliff honey.
4. **Khalti Milestone Kept & Delivered:** We did NOT replace Khalti. We implemented server-side **Khalti Sandbox ePayment v2** integration (`epayment/lookup/` with `pidx` verification) and Cash on Delivery (COD) fallback across all ShopCraft storefronts.
5. **Chronology Correction:** We audited `.planning/ROADMAP.md` and `.planning/STATE.md`, removing all future-dated completion checkboxes and synchronizing phases with the official course calendar.

---

## 2. End-to-End Tenant Isolation Check (Closing the Reviewer's Prompt)

In the Week 9 formative feedback, the instructor noted:
> *“If you choose the SaaS pivot, record the scope decision and one end-to-end tenant-isolation check before expanding the feature list.”*

### Verifiable Multi-Tenant Isolation Test
We implemented and verified comprehensive multi-tenant isolation in [`backend/stores/tests/test_isolation.py`](../../backend/stores/tests/test_isolation.py).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          SHOPCRAFT MULTI-TENANT ISOLATION MODEL                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Store A: BrewMellow (Owner: aarav.shrestha@brewmellow.com.np)                          │
│ Store B: Pahadi Honey (Owner: roshani.gurung@pahadihoney.com.np)                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Cross-Tenant Attack Test:                                                              │
│ • Owner A authenticates and probes Store B endpoints:                                  │
│   GET  /api/merchant/stores/pahadi-honey/overview/       ──> HTTP 404 NOT FOUND        │
│   GET  /api/merchant/stores/pahadi-honey/products/       ──> HTTP 404 NOT FOUND        │
│   POST /api/merchant/stores/pahadi-honey/products/       ──> HTTP 404 NOT FOUND        │
│   GET  /api/merchant/stores/pahadi-honey/orders/         ──> HTTP 404 NOT FOUND        │
│   GET  /api/merchant/stores/pahadi-honey/customers/      ──> HTTP 404 NOT FOUND        │
│   GET  /api/merchant/stores/pahadi-honey/subscriptions/  ──> HTTP 404 NOT FOUND        │
│ • Payload Tampering Test:                                                              │
│   Owner A submits product creation payload containing "store": store_b.id              │
│   Result: Store field is immutable; product created strictly in Store A.               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Test Execution Result:**  
All **51 tests** (including 6 isolation test methods) passed in 12.52s via `python manage.py test`. The platform enforces strict boundary security through PostgreSQL Row-Level Security (RLS) policies and Django's `TenantDatabaseContext`.

---

## 3. Week 09 / Look Back: Course & Project Lessons (Slide Framework)

Per the classroom slide (*"Bring one course lesson and one project lesson. Work individually first, then share the notes with your team"*):

```
┌───────────────────────────────────────────────────┬───────────────────────────────────────────────────┐
│              COURSE / PROCESS LESSON              │                  PRODUCT LESSON                   │
├───────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 01 • LESSON: What did we learn?                   │ 03 • ROUTE: What might we change?                 │
│ Verifiable reality over speculative features.     │ Post-midterm pivot to ShopCraft SaaS engine;      │
│ Bounded slices with automated test evidence        │ deliver Khalti Sandbox ePayment v2 + COD fallback │
│ consistently outperform untested roadmaps.        │ backed by verified tenant isolation.              │
├───────────────────────────────────────────────────┼───────────────────────────────────────────────────┤
│ 02 • SOURCE: What event or proof supports it?     │ 04 • QUESTION: What do we need to decide?         │
│ Week 8 'Exceeds' rating + Week 9 Formative        │ How to prove SaaS tenant isolation is airtight     │
│ Feedback citing future-dated roadmap checkmarks   │ without runaway scope expansion?                  │
│ and requiring non-author payment test receipts.   │ (Decision: Verify cross-store 404 RLS tests first)│
└───────────────────────────────────────────────────┴───────────────────────────────────────────────────┘
```

### Course / Process Lesson
- **01 • LESSON (What did we learn?):**  
  *We believed* that presenting an expansive catalog of speculative features (multi-tier automated recurring bank billing, international currency converters, and AI recommendation quizzes) would make our project stand out;  
  *the evidence* demonstrated that course staff consistently rewards bounded, working vertical slices backed by independent non-author test notes and transparent limitations;  
  *therefore our Week 9 decision is* to formally execute a strict scope cut (documented in [`mvp-contract.md`](mvp-contract.md)), dropping all third-party courier APIs, recurring bank rebilling, and recommendation questionnaires to focus 100% on payment integrity, multi-tenant isolation, and clean-clone verification.
- **02 • SOURCE (What event or proof supports it?):**  
  - Week 8 Grades: Team 2 awarded **Exceeds** based on working demo proof and bounded code.
  - Week 9 Formative Feedback: Instructor flagged future-dated checkmarks in `.planning/ROADMAP.md` and required explicit reconciliation of the SaaS pivot with an end-to-end tenant isolation test.

### Product Lesson
- **03 • ROUTE (What might we change?):**  
  *We believed* that saving order rows to PostgreSQL via an internal simulated payment modal (`is_fake_payment=True`) was acceptable for demonstrating e-commerce workflows;  
  *the evidence* revealed that mock modals do not test real-world gateway redirection, network timeouts, payment cancellation, or multi-tenant boundary security;  
  *therefore our Week 9 decision is* to pivot to **ShopCraft**, integrate official Khalti Sandbox ePayment v2 with server-side lookup verification, provide an offline Cash on Delivery (COD) fallback, seed two isolated stores (BrewMellow and Pahadi Honey), and strictly distinguish sandbox test credits from real currency.
- **04 • QUESTION (What do we need to decide?):**  
  *Key Decision Question:* How do we protect our final demonstration against third-party sandbox gateway downtime or network flakiness while keeping payment verification real?  
  *Team Consensus:* Dual-rail checkout—Khalti Sandbox ePayment v2 (tested with official phone `9800000000` / OTP `987654`) as primary rail, and Cash on Delivery (COD) as instant zero-network fallback.

---

### Individual Member Reflections ("Work Individually First")

#### 1. Aditya Kumar Gupta (`@notyouradhee`) — Full-Stack & Payment Lead
- **01 • LESSON:** Roadmap dates must reflect tested runtime reality; future-dating completion checkmarks confuses evaluators and undermines grading credibility.
- **02 • SOURCE:** Instructor's Week 9 feedback noting future dates (Nov 19 & Nov 26) on checked items in `.planning/ROADMAP.md`.
- **03 • ROUTE:** Audited `.planning/ROADMAP.md` and `.planning/STATE.md` to remove all future-dated checkboxes; implemented the real server-side Khalti Sandbox ePayment v2 lookup flow in Commit `1374b23` and merchant fulfillment queues in Commit `f54333c`.
- **04 • QUESTION:** How do we guarantee customer order data is never exposed across merchants while allowing shared payment verification?  
  *Decision:* PostgreSQL Row-Level Security (RLS) and `StoreScopedAPIViewMixin` guarantee multi-tenant data isolation; verified by 51 automated tests.

#### 2. Kushan Sunuwar (`@Kushan2191`) — QA & Independent Tester
- **01 • LESSON:** Developer tests on the author's local machine hide environment coupling and assumptions. Only non-author testing on a separate machine uncovers real checkout flaws.
- **02 • SOURCE:** Midterm feedback noting that independent non-author test evidence is required to validate payment integrity.
- **03 • ROUTE:** Established a clean-clone test environment; executed independent verification of the Khalti Sandbox flow, payment cancellation modal recovery, and COD fallback without author assistance.
- **04 • QUESTION:** What happens if the customer aborts payment on Khalti's hosted page?  
  *Decision:* Verified that aborting redirects back to cart with items and quantities fully intact; no phantom orders are created.

#### 3. Aanchal Chand Thakuri (`@jaasly07`) — UI/UX & Accessibility Lead
- **01 • LESSON:** Responsive design cannot be evaluated solely on desktop devtools. Real mobile ergonomics (thumb reach, viewport keyboards, and touch target sizes) dictate checkout completion rates.
- **02 • SOURCE:** Usability inspection showing that crowded 360px mobile viewports caused sticky checkout buttons to overlap address form fields.
- **03 • ROUTE:** Redesigned single-screen checkout and product sheets with minimum 52px touch targets (`py-3 px-6`), responsive bottom sheet navigation, and explicit keyboard dismiss padding.
- **04 • QUESTION:** Does our checkout form pass WCAG 2.1 AA accessibility standards for color contrast and screen readers?  
  *Decision:* Tested contrast ratios ($>4.5:1$) for all text and form labels; added explicit `aria-label` and `htmlFor` attributes to every checkout input.

#### 4. Rohit Chhantyal (`@Rohit-coder201`) — DevOps & Resilience Lead
- **01 • LESSON:** Consistency in team identity and operational hygiene is foundational to engineering rigor. Unclear naming and absent health probes degrade grading confidence.
- **02 • SOURCE:** Week 9 feedback noting inconsistency in surname spelling ("Chhantiyal" vs "Chhantyal") and the requirement for demonstrable system resilience.
- **03 • ROUTE:** Confirmed canonical name as **Rohit Chhantyal** (`@Rohit-coder201`); implemented and verified `/api/health/` uptime probe and verified order status state machine transitions (`PAID → PROCESSING → SHIPPED → DELIVERED`).
- **04 • QUESTION:** How do we verify that backend failure modes return structured JSON rather than unhandled 500 error pages?  
  *Decision:* Audited Django exception handlers to ensure database connection dropouts return graceful `503 Service Unavailable` with actionable error codes.

---

## 4. What We Committed to Do (Week 9 Deliverables)

- [x] Author official one-page [MVP Contract](mvp-contract.md) with definitive finish and cut lists.
- [x] Document the post-midterm pivot to ShopCraft and record the end-to-end tenant isolation test.
- [x] Correct the chronology and future-dated phase marks in [`.planning/ROADMAP.md`](../../.planning/ROADMAP.md) and [`.planning/STATE.md`](../../.planning/STATE.md).
- [x] Implement and verify server-side Khalti Sandbox ePayment v2 integration and Cash on Delivery fallback.
- [x] Run and pass the 51-test Django automated test suite including tenant isolation guards (`manage.py test`).
- [x] Run and pass frontend TypeScript typechecks (`tsc --noEmit`) and surface isolation checks (`check-surfaces.mjs`).
- [x] Document the single shared Week 9 Weekly Report with individual contribution rows for all 4 students.
- [x] Author individual evidence receipts in [`receipts/`](receipts/) for all 4 enrolled students.
- [x] Author the [Final Demo Roadmap](final-demo-roadmap.md) and [Core Demo Evidence Matrix](core-demo-evidence-matrix.md).
- [x] Author the [Sprint Quality Quick Checks](sprint-quality-quick-checks.md).

---

## 5. Evidence Links & Document Matrix

| Category | Document / Asset | Description & Direct Link |
|---|---|---|
| **MVP Contract** | Official Week 9 Scope Cut Contract | [mvp-contract.md](mvp-contract.md) |
| **Weekly Report** | Shared Team Report (Week 9) | [weekly-report.md](weekly-report.md) |
| **Final Demo Roadmap** | Complete Route to Final Demo | [final-demo-roadmap.md](final-demo-roadmap.md) |
| **Core Evidence Matrix** | PASS / FAIL / NOT TESTED Status Table | [core-demo-evidence-matrix.md](core-demo-evidence-matrix.md) |
| **Sprint Quality Checks** | 51 Passing Tests & Surface Verification | [sprint-quality-quick-checks.md](sprint-quality-quick-checks.md) |
| **Tenant Isolation Test** | 6 Cross-Tenant Security Isolation Tests | [`backend/stores/tests/test_isolation.py`](../../backend/stores/tests/test_isolation.py) |
| **Corrected Roadmap** | Updated GSD Milestone Architecture | [.planning/ROADMAP.md](../../.planning/ROADMAP.md) |
| **Backend Test Suite** | 51 Passing Django Tests (0 Failures) | Verified via `python manage.py test` (Ran in 12.52s) |
| **Frontend Verification** | Zero Type Errors & Surface Guard Pass | Verified via `tsc --noEmit` and `check-surfaces.mjs` |
| **Khalti Checkout Commit** | Single-Screen Checkout & Khalti Sandbox | [Commit 1374b23](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) |
| **Fulfillment Commit** | Merchant Queue & Order Status Transitions | [Commit f54333c](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c) |

---

## 6. Core Demonstration Journey & Evidence Matrix

**Target Demonstration Path:**  
**ShopCraft Platform Overview $\rightarrow$ Storefront (`/s/brewmellow`) $\rightarrow$ Product Variant Selection $\rightarrow$ Single-Screen Checkout $\rightarrow$ Khalti Sandbox ePayment v2 (or COD) $\rightarrow$ Confirmation $\rightarrow$ Merchant Fulfillment Console (`/merchant/brewmellow/orders`) $\rightarrow$ Tenant Isolation Guard (Store B denied access).**

| Step | Tested Behavior | Status | Actual Evidence & Boundaries |
|---|---|---|---|
| **1. Storefront Discovery** | Navigating to `/s/brewmellow` renders BrewMellow's single-origin coffees (Gulmi, Ilam, Nuwakot) with elevation and roast profiles. | **PASS** | Deployed live on Vercel over HTTPS. Store theme and catalog bound to Store #1. |
| **2. Cart Drawer & State** | Adding items to cart preserves quantities in store-scoped storage without cross-store collision. | **PASS** | Verified via `check-surfaces.mjs` and browser session testing. |
| **3. Single-Screen Checkout** | Navigating to checkout renders address inputs (Province, City, Street, 10-digit Phone) and server-authoritative totals in NPR. | **PASS** | Form validation blocks submission on invalid mobile numbers. |
| **4. Khalti Sandbox Payment** | Selecting Khalti redirects to Khalti Sandbox checkout; entering `9800000000` / OTP `987654` returns to callback with `pidx`. | **PASS** | Server verifies transaction via Khalti `epayment/lookup/` and sets order to `PAID`. *Boundary: Sandbox credits only; no real money moves.* |
| **5. Cash on Delivery Fallback** | Selecting Cash on Delivery completes checkout without external gateway, creating order with status `CONFIRMED / COD_PENDING`. | **PASS** | Verified local and production behavior; instant zero-network fallback. |
| **6. Merchant Fulfillment** | Merchant opens `/merchant/brewmellow/orders`, sees new order, and transitions status: `PAID → PROCESSING → SHIPPED → DELIVERED`. | **PASS** | Backed by `OrderEvent` audit log and customer order timeline. |
| **7. Multi-Tenant Isolation** | Merchant from Store B attempts to query Store A's orders or products. | **PASS** | 51/51 Django tests pass; returns HTTP 404 via Postgres RLS and `StoreScopedAPIViewMixin`. |

---

## 7. Individual Contribution Entries — One Row Per Enrolled Student

| Student Login | Canonical Name | Concrete Contribution in Week 9 | Evidence Link |
|---|---|---|---|
| **`notyouradhee`** | Aditya Kumar Gupta | Architected and implemented Khalti Sandbox ePayment v2 integration (`epayment/lookup/` with `pidx` verification) and Cash on Delivery fallback (Commit `1374b23`); built merchant order fulfillment queue with 5-second undo (Commit `f54333c`); corrected roadmap chronology in `.planning/ROADMAP.md`; verified 51/51 Django tests pass. | [Receipt](receipts/receipt-aditya.md)<br>[Commit 1374b23](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23)<br>[Commit f54333c](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c) |
| **`Kushan2191`** | Kushan Sunuwar | Conducted independent non-author testing of the single-screen checkout flow and Khalti Sandbox payment redirection on an external machine; tested payment cancellation edge case (verifying cart is preserved when cancelling Khalti modal) and Cash on Delivery fallback; authored test receipts. | [Receipt](receipts/receipt-kushan.md)<br>[Receipt Note](receipts/receipt-kushan.md#receipt-1-independent-sandbox-payment--cod-verification)<br>[Issue #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/57) |
| **`jaasly07`** | Aanchal Chand Thakuri | Audited storefront and checkout UI at 390px (iPhone 13/14) and 360px (Android) viewports for WCAG 2.1 AA compliance; verified 52px touch-friendly targets (`py-3 px-6`) on all checkout and payment buttons; designed responsive order summary sheet and delivery address forms. | [Receipt](receipts/receipt-aanchal.md)<br>[Receipt Note](receipts/receipt-aanchal.md#receipt-1-storefront-checkout-mobile-audit--touch-targets)<br>[Issue #58](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/58) |
| **`Rohit-coder201`** | Rohit Chhantyal | **Identity Confirmation:** Confirmed exact canonical identity: display name `Rohit Chhantyal` $\leftrightarrow$ GitHub login `@Rohit-coder201` (resolving spelling notes). Tested backend outage resilience and `/api/health/` uptime endpoint; audited order status machine transitions (`PAID → PROCESSING → SHIPPED → DELIVERED`) and repeatability smoke test commands in README. | [Receipt](receipts/receipt-rohit.md)<br>[Receipt Note](receipts/receipt-rohit.md#receipt-1-identity-confirmation--backend-health-audit)<br>[README Smoke Section](../../README.md#4-repeatable-smoke-command-script) |

---

## 8. Blockers & Risks Register

| Blocker / Risk | Severity | Owner | Mitigation Plan |
|---|---|---|---|
| **1. Khalti Sandbox Latency / Downtime** | High | `notyouradhee` | Strict 8s API timeouts, client-side error notifications, and instant **Cash on Delivery (COD)** checkout fallback that requires zero external network calls. |
| **2. Independent Reproduction Lapses** | Medium | `Kushan2191` | Kushan maintains a dedicated clean-checkout runbook and executes tests on a separate machine without author assistance, recording exact setup and results. |
| **3. Mobile Viewport Layout Cutoffs** | Low | `jaasly07` | Continuous regression testing across 390px viewports ensuring sticky checkout bars and modal overlays never obscure CTAs. |

---

## 9. Decision Record

| Decision | Why We Chose It | Owner | Evidence / Link |
|---|---|---|---|
| **Pivot from BrewMellow to ShopCraft** | Post-midterm evaluation challenged single-store scope; pivoted to multi-tenant platform for Nepali craft merchants with BrewMellow as Tenant #1. | All Teammates | [Commit 1374b23](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) |
| **Retain Khalti Sandbox & Add COD Fallback** | Fulfills our post-midterm commitment to deliver real payment processing while ensuring the demo can never be blocked by third-party gateway downtime. | All Teammates | [Commit 1374b23](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) |
| **Verify Multi-Tenant Isolation with 404 Guards** | Proved that Store Owner A querying Store B's endpoints returns HTTP 404, preventing cross-tenant data leaks. | `notyouradhee` & `Rohit-coder201` | [`test_isolation.py`](../../backend/stores/tests/test_isolation.py) |
| **Formalize Scope Cuts in MVP Contract** | Dropped recurring card auto-debit, live courier APIs, and AI recommender quizzes to protect our delivery schedule for the Week 11 MVP Freeze. | All Teammates | [mvp-contract.md](mvp-contract.md) |

---

## 10. Next Week's Bridge Task (Week 10: Code Ownership & AI Audit)

- Perform a comprehensive **Code Ownership & AI-use Audit** across all backend and frontend modules.
- Ensure every student can explain the specific code, models, and UI components they authored.
- Lock final MVP feature set in preparation for the **Week 11 MVP Freeze Gate** (Nov 12).
