# Week 10 Code Ownership Handoff — Rohit Chhantyal

**Student:** Rohit Chhantyal  
**GitHub Login:** `@Rohit-coder201`  
**Identity Confirmation:** Official canonical name is **Rohit Chhantyal** (`@Rohit-coder201`), resolving course spelling notes mentioning "Chhantiyal".  
**Role:** DevOps, Backend Health, Order Lifecycle State Machine & Resilience Lead  
**Primary Stewarded Area:** **Area 4: DevOps, Backend Health & State Machine**  
**Repository Boundary:** `backend/orders/models.py`, `backend/core/views.py` (`/api/health/`), `frontend/src/components/merchant/`  
**Learning Partner / Backup:** Aditya Kumar Gupta (`@notyouradhee`)  
**Submission Date:** Monday, November 9, 2026 (For Week 10 Review)

---

## 1. Roadmap Slice Explanation & Behavior

### Slice Name
**Order Lifecycle State Transition Machine with 5-Second Undo Toast & `/api/health/` Uptime Probe**

### Repository Location
- [`backend/orders/models.py`](../../../backend/orders/models.py) — `Order.transition_status()` & `OrderEvent` audit logging
- [`backend/core/views.py`](../../../backend/core/views.py) — `/api/health/` uptime probe endpoint
- [`frontend/src/components/merchant/OrderDetailSheet.tsx`](../../../frontend/src/components/merchant/OrderDetailSheet.tsx) — Merchant fulfillment queue & undo toast action

### Purpose & Plain Language Behavior
Merchant operations require strict order tracking and error recovery. A roaster fulfilling orders needs to advance orders through fulfillment stages, but mistakes happen in fast-paced warehouse environments. My slice delivers:
1. **Status Transition State Machine:** Orders strictly follow the linear progression `PENDING → PAID → PROCESSING → SHIPPED → DELIVERED`. Any attempt to trigger an illegal state transition (e.g., jumping from `DELIVERED` back to `PENDING`) is rejected by the backend with `HTTP 400 Bad Request`. Every transition creates an immutable `OrderEvent` audit log with timestamp and actor.
2. **5-Second Undo Toast Action:** When a merchant advances an order on the console, an undo toast appears for 5 seconds, allowing the merchant to reverse accidental clicks before the update is locked.
3. **System Health Probe (`/api/health/`):** Exposes an automated health endpoint that pings the PostgreSQL connection pool. If the database drops, it returns a structured JSON `HTTP 503 Service Unavailable` with customer-safe retry advice rather than an unhandled 500 error page.

### Input, Output, and Dependencies
- **Input:** Order ID, target status string (e.g. `"PROCESSING"`), and merchant authentication token.
- **Output:** Updated order object with new status and generated `OrderEvent` audit record.
- **Dependencies:** Django ORM, PostgreSQL connection pool, React Toast context.

---

## 2. Area Stewardship & Health Check

### Repository Responsibility
As Area 4 steward, I maintain backend operational resilience, health monitoring probes, database connection pooling configurations (`CONN_MAX_AGE = 600`), and order audit trails.

### Repeatable Health Check Command (Local Development Scope)
```bash
curl http://localhost:8000/api/health/
```
*(Scope Note: This probe is executed on the **Local Development Environment** testing local PostgreSQL engine connectivity and connection pool health; kept explicitly distinct from the deployed production frontend on Vercel).*  
**Expected Response:** `HTTP 200 OK` with JSON `{ "status": "ok", "database": "connected" }`.

### Live Verification Response
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-11-09T08:30:00Z",
  "version": "1.0.0-sprint2"
}
```

---

## 3. Disclosed AI Usage & Human Refactoring
- **Tool:** GitHub Copilot.
- **Assistance:** Suggested dictionary mapping of legal state transitions.
- **Human Authoring:** Implemented `transition_status` method on Django `Order` model, added `OrderEvent` foreign key cascade rules, and authored exception handling logic in `/api/health/` ensuring database reconnect attempts.

---

## 4. Non-Author Peer Check

- **Independent Peer Reviewer:** **Aanchal Chand Thakuri** (`@jaasly07`, UI Lead — Outside Area 4)
- **What Aanchal Tested:** Tested order status transitions on `/merchant/craftnepal/orders`. Tested illegal state transition boundary by sending a payload attempting to set a `DELIVERED` order back to `PENDING`.
- **Outcome:** **PASS.** Backend returned `HTTP 400 Bad Request` with message *"Invalid state transition from DELIVERED to PENDING"*. Aanchal verified that valid transitions (`PAID → PROCESSING`) rendered immediately with a working 5-second undo toast action.
