# Individual Evidence Receipt — Week 11

**Student:** Rohit Chhantyal ([`@Rohit-coder201`](https://github.com/Rohit-coder201))  
*(Canonical GitHub identifier: `@Rohit-coder201`; display name standardized as Rohit Chhantyal, harmonizing with earlier Week 8 draft spelling "Chhantiyal")*  
**Team:** Team 2 — ShopCraft  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Submitted for Wednesday, November 18, 2026 EOD KST Deadline)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Verified the order lifecycle state machine in `MerchantOrderStatusTransitionView` ([`backend/stores/api.py`](../../../backend/stores/api.py)) alongside merchant UI actions in [`frontend/src/components/merchant/OrderDetailSheet.tsx`](../../../frontend/src/components/merchant/OrderDetailSheet.tsx) and `frontend/src/lib/merchant-status.test.ts`.
- **Roadmap slice / behavior (if relevant):** Order State Machine Slice.
- **Area I helped steward or hand off (if relevant):** Area 4: DevOps, Backend Health & State Machine (Backup: Aditya Kumar Gupta).
- **Evidence link:** [Issue #53](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53) · [Tested-By Note](../tested-by-note.md) · [w11-frontend-checks.txt](../evidence/w11-frontend-checks.txt) · [Commit `b53f520`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b53f520) · [MVP Verification Checklist](../mvp-verification-checklist.md#2-verification-checklist).
- **How I checked it:** Verified `test_merchant_order_queue_and_transition_isolation` in `backend/stores/tests/test_isolation.py` and `merchant-status.test.ts` (`19/19` tests passed); verified illegal backward transition (`DELIVERED → PENDING`) returns `HTTP 400 Bad Request` (`Invalid transition from DELIVERED to PENDING`).
- **What I learned or changed:** Enforcing state transitions server-side inside `MerchantOrderStatusTransitionView` prevents invalid order mutations and protects merchants from accidental status clicks.

---

## Receipt 2

- **What I did:** Audited and verified `health_view` (`/api/health/`) in [`backend/core/urls.py`](../../../backend/core/urls.py) and `test_health_check_zero_db_queries_ssl_exemption_hsts_and_cookies` in [`backend/stores/tests/test_hardening.py`](../../../backend/stores/tests/test_hardening.py).
- **Roadmap slice / behavior (if relevant):** Health & Uptime Probe (`health_view`, zero-DB-query check for Heroku/uptime monitors).
- **Area I helped steward or hand off (if relevant):** Area 4: DevOps, Backend Health & State Machine.
- **Evidence link:** [w11-backend-tests.txt](../evidence/w11-backend-tests.txt) · [Commit `b53f520`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b53f520) · [Health Check Log](../../week-10/evidence/rohit-resilience-health-handoff.md#health-probe-response).
- **How I checked it:** 
  - *Local Development Scope:* Verified `GET /api/health/` returns `HTTP 200 OK` with JSON `{"status": "ok"}` and executes zero DB queries (`test_health_check_zero_db_queries_ssl_exemption_hsts_and_cookies`).
  - *Scope Distinction:* Local `/api/health/` (`127.0.0.1:8000`) verification is kept explicitly distinct from deployed production frontend `https://shopcraft.me` (documented in [`tested-by-note.md`](../tested-by-note.md)).
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
