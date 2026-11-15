# Individual Evidence Receipt — Week 11

**Student:** Aditya Kumar Gupta ([`@notyouradhee`](https://github.com/notyouradhee))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Submitted for Wednesday, November 18, 2026 EOD KST Deadline)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Managed the Week 11 MVP Verification and Scope Freeze Gate, verified server-side Khalti Sandbox ePayment v2 initiation and signature verification (`epayment/lookup/` with `pidx`), and confirmed zero regressions across 114 automated backend tests.
- **Roadmap slice / behavior (if relevant):** Khalti Sandbox v2 Gateway & Multi-Tenant Payment Verification (`backend/orders/api.py`).
- **Area I helped steward or hand off (if relevant):** Area 1: Core Multi-Tenant Backend, RLS & Payments (Backup: Rohit Chhantyal).
- **Evidence link:** [Commit `776c34e`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/776c34e) · [Commit `1374b23`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) · [MVP Verification Checklist](../mvp-verification-checklist.md).
- **How I checked it:** 
  - Ran `python manage.py test accounts catalog orders stores`; all 114 tests passed in 8.475s with 0 failures and 0 errors.
  - Executed checkout on live Vercel deployment using official Khalti test phone `9800000000` / OTP `987654`; verified server lookup transitioned order status to `PAID` with token `ORD-2026-SC-001`.
  - *Explicit Sandbox Boundary:* Tested strictly in official Khalti Sandbox mode (Test Phone: `9800000000`, Test PIN: `1111`, Test OTP: `987654`); strictly simulated credits, **no real fiat currency moves**.
  - *Scope Alignment:* Reconciled Phase 4 subscription roadmap with PR #45; shopper recurring subscriptions were formally cut from the active MVP to guarantee single-order checkout stability.
- **What I learned or changed:** Moving payment status updates strictly server-side prevents client tampering. Having an immediate offline Cash on Delivery fallback guarantees checkout availability even during third-party gateway downtime.

---

## Receipt 2

- **What I did:** Configured and validated PostgreSQL Row-Level Security (RLS) policies on 11 tables and verified cross-tenant isolation guards.
- **Roadmap slice / behavior (if relevant):** Multi-tenant RLS isolation policies (`backend/core/tenant_context.py` and `backend/stores/models.py`).
- **Area I helped steward or hand off (if relevant):** Area 1: Core Multi-Tenant Backend, RLS & Payments.
- **Evidence link:** [Commit `cdb1c0e`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/cdb1c0e) · [Commit `7abc09c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7abc09c) · [test_isolation.py](../../../backend/stores/tests/test_isolation.py).
- **How I checked it:** Ran `python manage.py test stores.tests.test_isolation`; all 6 isolation test methods passed, confirming that Store Owner B probing Store Owner A's orders receives an immediate HTTP 404 Not Found.
- **What I learned or changed:** Dual-layer protection (Django ORM scoping + database engine RLS) guarantees tenant isolation even if an application-layer endpoint forgets a tenant filter.

---

## Receipt 3, optional

- **What I did:** Verified Kushan's clean-clone development runbook on an external machine without author assistance.
- **Roadmap slice / behavior (if relevant):** Non-author reproduction of repository setup and test runners.
- **Area I helped steward or hand off (if relevant):** Cross-area verification with Area 2 (QA & Runbooks).
- **Evidence link:** [Weekly Report Peer Check Note](../weekly-report.md#5-cross-area-independent-peer-checks) · [Kushan Handoff](../../week-10/evidence/kushan-independent-qa-handoff.md).
- **How I checked it:** Followed the step-by-step instructions in `README.md` from a fresh terminal; seeded Store #1, and verified all 114 automated backend tests passed cleanly.
- **What I learned or changed:** Clear prerequisites and environment variable documentation prevent setup friction for external evaluators and new teammates.
