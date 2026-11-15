# Individual Evidence Receipt — Week 11

**Student:** Rohit Chhantyal ([`@Rohit-coder201`](https://github.com/Rohit-coder201))  
*(Canonical GitHub identifier: `@Rohit-coder201`; display name standardized as Rohit Chhantyal, harmonizing with earlier Week 8 draft spelling "Chhantiyal")*  
**Team:** Team 2 — ShopCraft  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Submitted for Wednesday, November 18, 2026 EOD KST Deadline)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Implemented and validated the order lifecycle state machine in [`backend/orders/models.py`](../../../backend/orders/models.py) with transition validation (`Order.transition_status()`) and connected the 5-second undo toast action in [`frontend/src/components/merchant/OrderDetailSheet.tsx`](../../../frontend/src/components/merchant/OrderDetailSheet.tsx).
- **Roadmap slice / behavior (if relevant):** Order State Machine Slice.
- **Area I helped steward or hand off (if relevant):** Area 4: DevOps, Backend Health & State Machine (Backup: Aditya Kumar Gupta).
- **Evidence link:** [Commit `b53f520`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b53f520) · [Commit `5406c14`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5406c14) · [Commit `f54333c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c) · [MVP Verification Checklist](../mvp-verification-checklist.md#2-verification-checklist).
- **How I checked it:** Attempted an illegal backward transition (`DELIVERED → PENDING`); verified backend returned `HTTP 400 Bad Request` with descriptive error payload. Tested valid transitions (`PAID → PROCESSING`) and confirmed 5-second undo toast successfully rolls back state.
- **What I learned or changed:** Hardcoding state transitions inside model methods prevents corrupted records and protects merchants from accidental status misclicks.

---

## Receipt 2

- **What I did:** Maintained the `/api/health/` database uptime probe in [`backend/core/views.py`](../../../backend/core/views.py) testing PostgreSQL connectivity and connection pool status.
- **Roadmap slice / behavior (if relevant):** Database Health & Uptime Probe (Local Development Environment).
- **Area I helped steward or hand off (if relevant):** Area 4: DevOps, Backend Health & State Machine.
- **Evidence link:** [Commit `5406c14`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5406c14) · [Health Check Response](../../week-10/evidence/rohit-resilience-health-handoff.md#health-probe-response).
- **How I checked it:** 
  - *Local Development Scope:* Curled `http://127.0.0.1:8000/api/health/` in local terminal and verified HTTP 200 with JSON `{ "status": "ok", "database": "connected", "latency_ms": 42 }`. Verified simulated local DB drop yields HTTP 503.
  - *Scope Distinction:* This health probe is strictly a **Local Development Environment** verification check of database engine connectivity; kept distinct from the deployed production frontend on Vercel.
  - *Canonical Name Spelling:* Canonical identifier is GitHub login [`@Rohit-coder201`](https://github.com/Rohit-coder201); full name standardized as **Rohit Chhantyal** (harmonizing with earlier Week 8 draft spelling "Chhantiyal").
- **What I learned or changed:** Having an explicit health probe is vital when running serverless PostgreSQL (Neon) to monitor and mitigate cold-start latency before the midterm demo. Local health testing must remain distinct from live multi-region production metrics.

---

## Receipt 3, optional

- **What I did:** Independently tested Aanchal's mobile checkout form validation on a 360px Android viewport simulator.
- **Roadmap slice / behavior (if relevant):** Non-author verification of Area 3 (Storefront UI/UX & Mobile).
- **Area I helped steward or hand off (if relevant):** Cross-area verification with Area 3.
- **Evidence link:** [Weekly Report Peer Check Note](../weekly-report.md#5-cross-area-independent-peer-checks) · [Aanchal Handoff](../../week-10/evidence/aanchal-storefront-a11y-handoff.md).
- **How I checked it:** Tested form input with an invalid 8-digit phone number (`98412345`); verified that submission was halted before POST and inline accessible red alert was displayed.
- **What I learned or changed:** Independent non-author testing ensures cross-functional alignment between backend API expectations and frontend client validation.
