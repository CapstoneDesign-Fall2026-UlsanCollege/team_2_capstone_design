# Individual Evidence Receipt — Week 11

**Student:** Aditya Kumar Gupta ([`@notyouradhee`](https://github.com/notyouradhee))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Submitted for Wednesday, November 18, 2026 EOD KST Deadline)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Managed the Week 11 MVP Verification and Scope Freeze Gate ([Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)), hardened Khalti Sandbox ePayment v2 verification and checkout retry actions ([Issue #50](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50), removing `KhaltiCheckoutSimulatorModal.tsx`), and verified **154** Django backend tests and **63** frontend Vitest tests.
- **Roadmap slice / behavior (if relevant):** Khalti Sandbox v2 Gateway, Mode-Based Verification & Retry Actions (`backend/stores/khalti.py`, `backend/stores/api.py`, `frontend/src/lib/khalti-return.ts`, `OrderPaymentActions.tsx`).
- **Area I helped steward or hand off (if relevant):** Area 1: Core Multi-Tenant Backend, RLS & Payments (Backup: Rohit Chhantyal).
- **Evidence link:** [Issue #50](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50) · [Commit `9629021`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9629021) · [Commit `07f1aeb`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/07f1aeb) · [w11-backend-tests.txt](../evidence/w11-backend-tests.txt) · [MVP Verification Checklist](../mvp-verification-checklist.md).
- **How I checked it:** 
  - Ran `python manage.py test accounts catalog orders stores` on `07f1aeb`; **154 tests found** (`144` passed in `47.296s`, `10` Postgres-only RLS tests skipped under local SQLite and verified in Postgres 16 CI).
  - Ran `npm test` in `frontend/`: `63/63` Vitest unit tests passed (including `khalti-return.test.ts` `6/6`).
  - Executed checkout on `https://shopcraft.me` using official Khalti test phone `9800000000` / OTP `987654`; verified server lookup transitioned order status to `PAID`.
  - *Explicit Sandbox & Negative Boundaries:* Strictly simulated Sandbox credits (**no real fiat currency moves**). Mocked unit tests (`test_khalti.py`) do not establish live external gateway uptime (documented in [`tested-by-note.md`](../tested-by-note.md) and Risk [#31](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31)).
  - *Scope Alignment:* Reconciled Phase 4 subscription roadmap with PR #45 and closed legacy subscription Issues [#33](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/33) & [#34](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/34).
- **What I learned or changed:** Choosing the Khalti endpoint cleanly by mode rather than brittle key prefixes prevents misconfiguration failures across environments, while retry actions + COD fallback protect checkout completion.

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
- **How I checked it:** Followed the step-by-step instructions in `README.md` from a fresh terminal; seeded Store #1, and verified `154` backend tests (`144` passed on local SQLite, `10` Postgres RLS tests covered in CI) and `63/63` Vitest unit tests passed cleanly.
- **What I learned or changed:** Clear prerequisites and environment variable documentation prevent setup friction for external evaluators and new teammates.
