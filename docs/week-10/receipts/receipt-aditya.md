# Individual Evidence Receipt — Week 10

**Student:** Aditya Kumar Gupta ([`@notyouradhee`](https://github.com/notyouradhee))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 10 (Sprint 2: MVP and Freeze)  
**Date:** Monday, November 9, 2026 (Submitted for Wednesday, November 11, 2026 EOD KST Deadline)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Implemented server-side Khalti Sandbox ePayment v2 initiation and server-authoritative signature verification (`epayment/lookup/` with `pidx`), paired with an instant Cash on Delivery (COD) checkout fallback.
- **Roadmap slice / behavior (if relevant):** Khalti Sandbox v2 & Server Verification Slice (`backend/orders/api.py`).
- **Area I helped steward or hand off (if relevant):** Area 1: Core Multi-Tenant Backend, RLS & Payments (Backup: Rohit Chhantyal).
- **Evidence link:** [Commit `1374b23`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) · [Slice Note](../slices/slice-aditya-khalti-backend.md) · [Handoff Document](../evidence/aditya-backend-rls-handoff.md).
- **How I checked it:** Executed checkout on live Vercel deployment using official Khalti test phone `9800000000` / OTP `987654`; verified server lookup transitioned order status to `PAID` with token `ORD-2026-SC-001`. Kushan Sunuwar independently reproduced this test without author coaching.
  - *Explicit Sandbox Boundary:* Tested strictly in official Khalti Sandbox mode (Test Phone: `9800000000`, Test PIN: `1111`, Test OTP: `987654`); strictly simulated credits, **no real fiat currency moves**.
  - *Scope Alignment:* Reconciled Phase 4 subscription roadmap with PR #45; shopper recurring subscriptions were formally cut from the active MVP to guarantee single-order checkout stability.
- **What I learned or changed:** Payment state must never be trusted from the browser client. Moving signature verification server-side eliminates client tampering, and keeping an immediate Cash on Delivery fallback protects conversions during gateway latency spikes.

---

## Receipt 2

- **What I did:** Configured and validated PostgreSQL Row-Level Security (RLS) policies on 11 tables and verified backend test suite integrity across 114 automated tests (including new merchant authorization matrix tests).
- **Roadmap slice / behavior (if relevant):** Multi-tenant RLS isolation policies (`backend/core/tenant_context.py` and `backend/stores/models.py`).
- **Area I helped steward or hand off (if relevant):** Area 1: Core Multi-Tenant Backend, RLS & Payments.
- **Evidence link:** [Commit `cdb1c0e`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/cdb1c0e) · [Commit `7abc09c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7abc09c) · [Audit Document](../ai-use-and-code-ownership-audit.md#2-codebase-area-map).
- **How I checked it:** Ran `python manage.py test accounts catalog orders stores`; all 114 tests passed in 8.475s with 0 failures and 0 errors (subscriptions cleanly excluded).
- **What I learned or changed:** Tenant scoping must be enforced at both the database query layer (thread-local tenant filter) and the database engine layer (Postgres RLS) to ensure Store Owner A cannot access Store Owner B's catalog or orders even if application code contains a bug.

---

## Receipt 3, optional

- **What I did:** Verified Kushan's clean-clone development runbook on a separate laptop without author intervention.
- **Roadmap slice / behavior (if relevant):** Non-author reproduction of repository setup and test runners.
- **Area I helped steward or hand off (if relevant):** Cross-area verification with Area 2 (QA & Runbooks).
- **Evidence link:** [Weekly Report Peer Check Note](../weekly-report.md#5-cross-area-independent-peer-checks) · [Kushan Handoff](../evidence/kushan-independent-qa-handoff.md).
- **How I checked it:** Cloned repo from scratch, ran setup commands, seeded Store #1, and ran automated tests.
- **What I learned or changed:** Explicit documentation of prerequisite environment variables in `README.md` prevents setup friction for new contributors and graders.
