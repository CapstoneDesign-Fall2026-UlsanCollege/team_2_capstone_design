# Sprint Quality Quick Checks — Team 2: ShopCraft

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Evaluation Date:** Week 9 Review (November 4, 2026)

This document records our sprint quality checks at each major milestone, ensuring transparent progress tracking and verifiable deliverables.

---

## Sprint 0 — Launch & Scope (Week 3)

- [x] Every member can access the repository and project board (`notyouradhee`, `Kushan2191`, `jaasly07`, `Rohit-coder201`).
- [x] Meaningful work has an Issue, owner, and Definition of Done.
- [x] The initial project concept (BrewMellow artisanal coffee roastery) and boundaries were established.
- [x] The team agreement and communication protocol are documented and agreed upon.
- [x] No personal data, live payment secrets, or unapproved real-user data has been posted.

---

## Sprint 1 — Vertical Slice & Midterm Demo (Weeks 4–8)

- [x] One small end-to-end user path works: Storefront discovery $\rightarrow$ Roast profile view $\rightarrow$ Order placement.
- [x] The path is backed by screenshots, live demo URLs, and test execution scripts.
- [x] The team can explain what happens when the main path cannot complete (fallback mechanisms).
- [x] The `README.md` and setup note instruct an independent person how to clone, seed, and run the project locally.
- [x] The team verified that no API keys or database secrets exist in the git history.

### Midterm Evaluation Record (Week 8)
- **Result:** Team 2 was the **only team rated 'Exceeds'** across the entire capstone cohort (recorded in `Week 8/grades.md`).
- **Post-Midterm Pivot Directive:** Evaluators noted that a standalone single-store website lacked senior engineering depth. The team initiated the pivot to **ShopCraft** — a multi-tenant e-commerce platform for Nepal's craft economy, retaining BrewMellow as the flagship pilot tenant.
- **Identified Gap to Close:** Transitioning from simulated in-memory payments (`is_fake_payment=True`) to real sandbox payment gateway integration and securing independent non-author test verification.

---

## Sprint 2 — MVP Contract, Multi-Tenant Pivot & Feature Freeze (Weeks 9–11)

### Week 9 Review Check (Current Milestone — Nov 4, 2026)

- [x] **Post-Midterm Pivot to ShopCraft Formally Documented:** Architecture, scope decision, and tenant structure documented in [MVP Contract](mvp-contract.md) and [Weekly Report](weekly-report.md).
- [x] **End-to-End Tenant Isolation Check Passing:** Proved that Store Owner A probing Store B endpoints receives HTTP 404 (`test_isolation.py`).
- [x] **51/51 Django Backend Tests Passing:** Executed in 12.98 seconds with zero failures.
  ```bash
  python manage.py test
  # Ran 51 tests in 12.981s — OK
  ```
- [x] **Zero TypeScript Errors:** Verified across all frontend components and pages.
  ```bash
  npx tsc --noEmit
  # 0 errors
  ```
- [x] **Surface Isolation Guard Passing:** Script guarantees storefront (`/s/`), merchant console (`/merchant/`), and platform (`/`) codebases do not leak state.
  ```bash
  node scripts/check-surfaces.mjs
  # SURFACE_ISOLATION_OK
  ```
- [x] **Khalti Sandbox ePayment v2 Integration:** Server-side lookup endpoint (`epayment/lookup/` with `pidx`) operational (Commit `1374b23`).
- [x] **Cash on Delivery (COD) Fallback:** Instant zero-network offline checkout operational.
- [x] **Independent Non-Author Test Verified:** Kushan Sunuwar (`@Kushan2191`) executed checkout, payment, cancellation, and COD tests on an independent machine ([Receipt Note](receipts/receipt-kushan.md)).
- [x] **Mobile Viewport Accessibility Checked:** Aanchal Chand Thakuri (`@jaasly07`) audited 390px/360px touch targets and WCAG 2.1 AA contrast ([Receipt Note](receipts/receipt-aanchal.md)).
- [x] **Resilience & Health Probe Tested:** Rohit Chhantyal (`@Rohit-coder201`) verified `/api/health/` uptime and order state machine transitions ([Receipt Note](receipts/receipt-rohit.md)).
- [x] **Chronology Correction Complete:** All future-dated completion marks removed from `.planning/ROADMAP.md` and `.planning/STATE.md`.
- [x] **Definitive Scope Cuts Documented:** Official [MVP Contract](mvp-contract.md) published.

### Week 10–11 Forward Freeze Targets
- [ ] Complete Code Ownership & AI-use audit across all 4 student contributors (Week 10).
- [ ] Execute formal MVP Feature Freeze Gate (Week 11 — Nov 12, 2026).
- [ ] Freeze production branches against new feature commits.

---

## Sprint 3 — Non-Author QA & Polish (Weeks 12–14)

- [ ] Complete clean-clone installation reproduction by an external tester without author intervention.
- [ ] Conduct end-to-end load testing on order creation endpoints.
- [ ] Review keyboard navigation, visual contrast, and screen reader labels.
- [ ] Verify clean error messaging when backend service is unreachable.

---

## Sprint 4 — Final Readiness & Course Defense (Week 15)

- [ ] Rehearse 5-minute timed presentation with live dual-rail demonstration.
- [ ] Assign explicit speaking roles for all 4 team members.
- [ ] Package final evidence portfolio and repository defense documentation.
- [ ] Confirm clean working tree and tag final production release.
