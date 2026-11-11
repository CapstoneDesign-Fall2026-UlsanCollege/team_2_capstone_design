# PR with AI Use Note — Order State Machine & Uptime Health Probe Slice

**Author / Owner:** Rohit Chhantyal ([`@Rohit-coder201`](https://github.com/Rohit-coder201))  
**Stewardship Area:** Area 4: DevOps, Backend Health & State Machine  
**Backup Steward:** Aditya Kumar Gupta ([`@notyouradhee`](https://github.com/notyouradhee))  
**Date:** Monday, November 9, 2026 (Week 10)  
**Related Pull Request / Commit:** [Commit `5406c14`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5406c14) · [Commit `f54333c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c)  
**Related Issue:** Issue #51 (Order Lifecycle State Machine Transitions & Uptime Health Probe)

---

## 1. What Changed?

- Implemented strict order lifecycle state machine transitions in [`backend/orders/models.py`](../../../backend/orders/models.py):
  $$\text{PENDING} \longrightarrow \text{PAID} \longrightarrow \text{PROCESSING} \longrightarrow \text{SHIPPED} \longrightarrow \text{DELIVERED}$$
- Built transition validation method `Order.transition_status()` that rejects illegal backward jumps (e.g. `DELIVERED → PENDING` or `CANCELLED → PAID`) with `HTTP 400 Bad Request`.
- Connected state machine updates to an audit trail table `OrderEvent` logging timestamp, old status, new status, and acting user.
- Integrated a 5-second undo toast action on the merchant dashboard ([`frontend/src/components/merchant/OrderDetailSheet.tsx`](../../../frontend/src/components/merchant/OrderDetailSheet.tsx)) allowing merchants to instantly revert accidental clicks.
- Built `/api/health/` uptime probe in [`backend/core/views.py`](../../../backend/core/views.py) testing Neon PostgreSQL connectivity and connection pool status.

---

## 2. Why Did We Change It?

- To prevent corrupt database states where fulfilled or delivered orders could accidentally revert to unpaid or pending.
- To provide operational visibility into backend database health and cold-start latency on serverless PostgreSQL.
- To protect merchants from misclicks during high-volume shipping operations via the undo toast mechanism.

---

## 3. How Did We Check It?

> We checked this by attempting an illegal state transition (`DELIVERED → PENDING`) via the API and merchant dashboard, and curling the health probe on the local development environment.  
> • **Local Health Probe Scope:** Curled `http://127.0.0.1:8000/api/health/` strictly within the **Local Development Environment** to verify database engine connectivity and connection pool status (kept explicitly distinct from the deployed production frontend on Vercel).  
> **Expected result:** Backend rejects illegal transition with HTTP 400; `/api/health/` returns HTTP 200 with `{ "status": "ok", "database": "connected" }`.  
> **Actual result:** Illegal transition returned HTTP 400 *"Invalid state transition from DELIVERED to PENDING"*; local health probe returned HTTP 200 in 42ms with active database connection.  
> **Non-Author Peer Check:** Aanchal Chand Thakuri tested the merchant interface transitions and verified error handling ([Evidence Receipt](../../week-10/evidence/aanchal-storefront-a11y-handoff.md)).

---

## 4. AI Use Note

Choose one:
- [ ] No AI was used for this change.
- [ ] AI helped with planning or explanation only.
- [x] AI helped generate or edit code/text.

### Details:
- **What AI helped with:** GitHub Copilot drafted the initial dictionary mapping of permitted state transitions:
  `PERMITTED_TRANSITIONS = { 'PENDING': ['PAID', 'CANCELLED'], ... }`.
- **What the team reviewed:** Audited the transaction boundary to ensure status transitions and `OrderEvent` audit logs are wrapped inside an atomic database transaction (`transaction.atomic`).
- **What the team changed after review:** Added custom error messaging in the REST API response and connected the 5-second undo callback in Next.js state.
- **Who can explain this change:** Rohit Chhantyal (Author) and Aditya Kumar Gupta (Backup Steward).

---

## 5. Outside-Material Attribution

- **Source / creator:** Django Documentation on Atomic Database Transactions (`django.db.transaction.atomic`)
- **Link:** [https://docs.djangoproject.com/en/5.1/topics/db/transactions/](https://docs.djangoproject.com/en/5.1/topics/db/transactions/)
- **License or permission:** BSD 3-Clause License
- **What we changed or how we used it:** Standard Django transaction pattern for state machine integrity.

---

## 6. Evidence Links

- **Issue:** Issue #51 (Order Lifecycle Validation & Database Health Monitoring)
- **Commits:** [`5406c14`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5406c14), [`f54333c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c)
- **Health Check & Test Logs:** Documented in [`docs/week-10/evidence/rohit-resilience-health-handoff.md`](../evidence/rohit-resilience-health-handoff.md)
