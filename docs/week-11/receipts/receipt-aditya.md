# Individual Evidence Receipt — Week 11

**Student:** Aditya Kumar Gupta ([`@notyouradhee`](https://github.com/notyouradhee))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Updated November 18, 2026 on frozen `main` commit `8098426`)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Managed the Week 11 MVP Verification and Scope Freeze Gate ([Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)), hardened Khalti Sandbox ePayment v2 verification and checkout retry actions ([Issue #50](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50), removing `KhaltiCheckoutSimulatorModal.tsx`), delivered OTP client email validation + domain typo hint ([Issue #55](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/55), `0a0ec4d`), authored RLS migration `0013_drop_legacy_rls_policies.py` dropping legacy `bypass_rls` policies (`64a31f9`), merged freeze recovery [`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57) (`8098426`), and verified **154** Django backend tests + **73** frontend Vitest tests.
- **Roadmap slice / behavior (if relevant):** Khalti Sandbox v2 Gateway, OTP Email Validation (`0a0ec4d`), & PostgreSQL `0013` Single-Policy RLS Enforcement (`backend/stores/migrations/0013_drop_legacy_rls_policies.py`, `backend/stores/khalti.py`, `frontend/src/lib/email-validation.ts`).
- **Area I helped steward or hand off (if relevant):** Area 1: Core Multi-Tenant Backend, RLS & Payments (Backup: Rohit Chhantyal).
- **Evidence link:** [PR #54 (Merged)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54) · [PR #57 (Merged)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57) · [Issues #50, #55, #56 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50) · [Main CI Run `44248144770`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770) · [w11-verification-checks.json](../evidence/w11-verification-checks.json) · [MVP Freeze Record](../mvp-freeze-record.md).
- **How I checked it:** 
  - *Candidate Branch -> Frozen `main` (`8098426`):* Khalti hardening (`PR #54` / `6559ea2`), OTP validation (`0a0ec4d`), RLS `0013` cleanup (`64a31f9`), and `#56` auth fix merged into **`main` (`8098426`)** via [PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57).
  - *Frozen `main` (`8098426`) Backend Verification:* Ran `.\venv\Scripts\python.exe manage.py test accounts catalog orders stores --verbosity 2` locally on SQLite (`154` tests found: `144` passed in `15.06s`, `10` Postgres-only RLS tests skipped locally); all `154` tests ran and passed under PostgreSQL 16 (`NOSUPERUSER NOBYPASSRLS`) with migration `0013` asserted in GitHub Actions [CI Run `44248144770`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770).
  - *Test Count Reconciliation:* Earlier Week 10 baseline (`8cff53d`) reported `114` tests; PR #54 raised backend tests to `154` (`+40`) and frontend Vitest to `63`, and PR #57 raised Vitest to `73/73` (`+8` `email-validation.test.ts`, `+2` `#56` regression checks).
  - *Frontend & Live Sandbox Boundary:* Ran `npm test` (`73/73` passed in `1.63s`), `tsc --noEmit` (`0` errors), scoped ESLint (`0` errors), and `SURFACE_ISOLATION_OK` on `8098426`. Sandbox checkout uses official Khalti test phone `9800000000` / OTP `987654` — **no real fiat currency moves**. Nov 18 live browser check also documented that `https://shopcraft.me/s/brewmellow/checkout` currently shows `Khalti Unavailable — Not configured by merchant` in prod DB (tracked in `#51`).
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
- **How I checked it:** Followed the step-by-step instructions in `README.md` from a fresh terminal; seeded Store #1, and verified `154` backend tests (`144` passed on local SQLite, `10` Postgres RLS tests covered in CI `#74`) and `73/73` Vitest unit tests passed cleanly.
- **What I learned or changed:** Clear prerequisites and environment variable documentation prevent setup friction for external evaluators and new teammates.
