# Individual Evidence Receipt — Aditya Kumar Gupta

**Student:** Aditya Kumar Gupta  
**GitHub Login:** `notyouradhee`  
**Team:** Team 2 — BrewMellow  
**Week:** 8 (Midterm Gate Checkpoint)  
**Date:** October 28, 2026  

---

## Receipt 1: Post-Midterm Reset, Scope Boundary & MVP Gap Analysis

- **What I did:** Analyzed the Week 8 formative feedback and Midterm Presentation evaluation. Co-authored the Week 8 Weekly Report and the post-midterm reset, converting our presentation scope boundary (`is_fake_payment=True`) into an explicit MVP gap analysis and establishing our single focus milestone for Sprint 2 (Khalti Sandbox E-Payment integration).
- **Evidence link:** [`../weekly-report.md`](../weekly-report.md#section-2-post-midterm-lessons-learned-course--project), [`../post-midterm-reset-and-mvp-gap-analysis.md`](../post-midterm-reset-and-mvp-gap-analysis.md), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44)
- **How I checked it:** Audited the course feedback in `scratch/grades-and-feedback/Week 8/feedback.md` against our live deployment, verifying that the order flow is fully functional but honestly acknowledging that real payment verification is the primary remaining gap.
- **What I learned or changed:** Engineering honesty regarding system boundaries builds far more credibility than pretending simulated payment modals are live payment systems.

---

## Receipt 2: Khalti Sandbox API Architecture & Sprint 2 Technical Specification

- **What I did:** Formulated the technical architecture for integrating the Khalti Sandbox SDK (E-Payment API v2), designing the backend verification endpoint in Django (`POST /api/payments/khalti/verify/`) to ensure order records transition from `PENDING` to `PAID` only upon verified signature validation.
- **Evidence link:** [`../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911`](../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911), [Live Vercel Application](https://team-2-capstone-design-one.vercel.app/checkout)
- **How I checked it:** Tested Khalti's sandbox initiation payload format with test mobile credentials (`9800000000`) and mapped required fields (`return_url`, `website_url`, `amount`, `purchase_order_id`) against our PostgreSQL `Order` schema.
- **What I learned or changed:** Decoupling payment initiation from order creation guarantees that an uncompleted or cancelled payment session leaves a clear audit trail in the database rather than a corrupted order state.
