# API Smoke Test & Outage Recovery Record

**Course:** Capstone Design  
**Week:** 6 — Test the Vertical Slice  
**Date:** October 12, 2026 (Verified October 13, 2026)  
**Tester:** `Rohit-coder201`  
**Co-Tester / Implementation Lead:** `notyouradhee`  
**Related Endpoints:** `POST http://localhost:8000/api/orders/`, `GET http://localhost:8000/api/orders/`

---

## 1. Goal

Verify how the BrewMellow frontend and checkout flow behaves under two distinct network conditions:
1. **Normal State (Backend Online):** Django backend is running with Neon PostgreSQL connected.
2. **Outage State (Backend Offline):** Django backend is terminated, testing frontend error handling, user messaging, and recovery.

---

## 2. Test Setup & Environment

- **Frontend:** Next.js 16 running on `http://localhost:3000`
- **Backend:** Django 5 / Django REST Framework on `http://localhost:8000`
- **Database:** Neon Serverless PostgreSQL (`ep-coffee-subscription-xxx.neon.tech`)

---

## 3. Test Cases & Execution

### Test Case 1: Backend Online — Successful Order Creation

- **Steps:**
  1. Start Django: `cd backend && python manage.py runserver 8000`.
  2. Navigate to `http://localhost:3000/checkout?origin=gulmi&plan=monthly`.
  3. Enter customer name: `Rohit Tester`, Address: `Patan, Lalitpur`, Phone: `9841000000`.
  4. Click **"Complete Subscription Order"**.
- **Expected Result:**
  - Frontend makes `POST` request to `http://localhost:8000/api/orders/`.
  - HTTP `201 Created` returned with order JSON payload.
  - Checkout displays order confirmation with order ID.
  - Order appears in the Customer Portal (`/dashboard`) and Django Admin (`/admin`).
- **Actual Result:**
  - Order created successfully with HTTP 201.
  - Payload returned:
    ```json
    {
      "id": 14,
      "customer_name": "Rohit Tester",
      "origin": "gulmi",
      "plan": "monthly",
      "total_amount": 2200,
      "status": "confirmed",
      "is_fake_payment": true,
      "created_at": "2026-10-12T14:22:10Z"
    }
    ```
  - Order immediately reflected in `/dashboard` under active subscriptions.

---

### Test Case 2: Backend Offline — Graceful Degradation & Retry (Stretch)

- **Steps:**
  1. Stop Django backend process (`Ctrl+C` or terminate terminal).
  2. With frontend still running, refresh `/checkout?origin=gulmi&plan=monthly`.
  3. Attempt to submit an order.
- **Expected Result:**
  - Application does NOT crash with an uncaught runtime exception or white screen.
  - A clear user-facing error banner appears: *"Backend service unavailable. Your order will be stored locally or please retry shortly."*
  - Retry button is visible and active.
- **Actual Result:**
  - Fetch failed with `ERR_CONNECTION_REFUSED` in console.
  - Frontend caught error in `try...catch` block.
  - User-facing warning badge displayed: *"Order server unreachable. Offline fallback active."*
  - When backend was restarted (`python manage.py runserver`), clicking **"Retry Order"** immediately succeeded with HTTP 201 without requiring re-entry of customer form data.
- **Commit Reference:** [commit 5d61dd6](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5d61dd6) (Loading & Error States), [commit 64e93b9](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/64e93b9) (Offline fallback screen)

---

## 4. Repeatable Smoke Command Script

To allow any teammate to reproduce this test in under 60 seconds:

```bash
# 1. Quick check backend API health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/orders/
# Expected: 200 or 405 (endpoint active)

# 2. Check frontend page health
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/origins
# Expected: 200 OK
```

---

## 5. Scope Boundary & Limitations

- **What this proves:** The application reliably recovers from local network and API downtime; form inputs are preserved; retry logic functions without page refreshes.
- **What this does NOT prove:** Does not test high-concurrency database connection pooling or Redis caching (planned for post-midterm).
