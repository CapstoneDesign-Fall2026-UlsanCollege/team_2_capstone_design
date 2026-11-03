# Week 9 Contribution Receipt — Rohit Chhantyal

**Student:** Rohit Chhantyal  
**GitHub Login:** `@Rohit-coder201`  
**Identity Clarification:** Confirmed official canonical spelling is **Rohit Chhantyal** (resolving course feedback spelling note mentioning "Chhantiyal").  
**Role:** DevOps, Backend Health & Order Lifecycle Resilience  
**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Submission Date:** Wednesday, November 4, 2026

---

## 1. Look Back: Course & Project Reflection

- **01 • LESSON (What did we learn?):**  
  Operational resilience and identity consistency are foundational to software engineering integrity. If a service goes down or an endpoint fails silently, evaluators lose trust. Systems must expose explicit health checks and handle outages gracefully.
- **02 • SOURCE (What event or proof supports it?):**  
  Instructor's Week 9 feedback noting the naming ambiguity ("Chhantiyal" vs "Chhantyal") and requiring demonstrable uptime and backend reliability verification.
- **03 • ROUTE (What might we change?):**  
  Confirmed canonical identity as **Rohit Chhantyal** (`@Rohit-coder201`); verified backend `/api/health/` uptime probe; tested order lifecycle transitions and exception handlers to ensure clean JSON responses during database dropouts.
- **04 • QUESTION (What do we need to decide?):**  
  What happens when the backend database connection encounters intermittent packet loss during checkout submission?  
  *Decision:* Configured connection pooling and graceful error wrapping; returning a structured `503 Service Unavailable` with customer-safe retry advice rather than an unhandled Django 500 error page.

---

## 2. Concrete DevOps & Resilience Contributions

| Task / Feature | Implementation & Verification | Status |
|---|---|---|
| **Identity & Logins Audit** | Verified GitHub commit author matches `@Rohit-coder201` and canonical course roster. | **CONFIRMED** |
| **Backend Health Endpoint (`/api/health/`)** | Tested `/api/health/` probe verifying database query execution and returning `{ "status": "ok", "database": "connected" }`. | **PASS** |
| **Order Lifecycle State Machine** | Audited transitions: `PAID → PROCESSING → SHIPPED → DELIVERED`. Verified illegal transitions (e.g. `DELIVERED → PENDING`) are rejected with HTTP 400. | **PASS** |
| **Repeatable Smoke Test Script** | Documented and executed automated smoke test script in `README.md` testing migrations, seeds, test suites, and frontend build. | **PASS** |
| **Database Failure Graceful Degradation** | Injected simulated database drop; verified API returns JSON `{ "error": "Database temporarily unreachable" }` (HTTP 503). | **PASS** |

---

## 3. Health Probe & Smoke Execution Logs

### Automated Health Check Response
```http
GET /api/health/ HTTP/1.1
Host: team-2-capstone-design-one.vercel.app

HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-11-04T05:30:00Z",
  "version": "1.0.0-sprint2"
}
```

### Smoke Test Script Verification
Executed smoke commands from project root:
```powershell
python manage.py check --deploy
python manage.py test stores.tests.test_isolation
```
**Result:** 0 deployment security issues; 100% tenant isolation tests passed.

---

## 4. Transparent Boundaries & Week 10 Priorities
- The `/api/health/` endpoint monitors database and API readiness; automated alerting via PagerDuty/Slack is omitted to keep infrastructure lightweight.
- For Week 10, I will lead the AI-use and code ownership audit for backend modules and document dependency licenses.
