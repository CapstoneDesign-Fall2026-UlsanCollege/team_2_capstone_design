# Local Setup & 5-Step Midterm Demo Guide

**Team:** Team 2 — BrewMellow  
**Date:** October 14, 2026  
**Audience:** Independent Teammates, Course Staff & Evaluators  

This guide allows any teammate or evaluator to clone, install, and run the BrewMellow vertical slice locally from a clean terminal in under 2 minutes.

---

## 1. Prerequisites

- **Node.js:** v18.17+ or v20.x
- **Python:** v3.11+
- **Git:** Installed and configured

---

## 2. Quickstart Run Instructions (Fresh Checkout)

### Step A: Clone & Enter Repository
```bash
git clone https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design.git
cd team_2_capstone_design
```

### Step B: Start Frontend (Next.js 16)
```bash
cd frontend
npm install
npm run dev
```
> The customer storefront will be available at: **`http://localhost:3000`**

### Step C: Start Backend (Django + Neon PostgreSQL) — Optional for UI Demo
The frontend includes full mock-state fallbacks, but to connect to live Neon PostgreSQL orders:
```bash
# In a separate terminal from repository root:
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
python manage.py runserver 8000
```
> API Endpoints: **`http://localhost:8000/api/orders/`**  
> Django Admin: **`http://localhost:8000/admin/`**

---

## 3. Fast Automated Smoke Check (< 60 Seconds)

To verify that both frontend and backend are healthy:

```bash
# Verify Frontend Origins Route
curl -s -o /dev/null -w "Frontend Origins HTTP: %{http_code}\n" http://localhost:3000/origins

# Verify Backend Order Endpoint
curl -s -o /dev/null -w "Backend API Orders HTTP: %{http_code}\n" http://localhost:8000/api/orders/
```
*Expected: Both return HTTP 200 or 405 (Method Not Allowed on GET without auth, indicating active routing).*

---

## 4. Five-Step Midterm Demonstration Path

Follow this exact path for a 3–5 minute live presentation:

1. **Step 1: Homepage & Origin Exploration (`/origins`)**  
   - Visit `http://localhost:3000`. Click **"Browse Origins"**.
   - Show the 3 single-origin coffee cards: Gulmi Reserve (1,450m), Ilam Gold (1,650m), Nuwakot Heritage (1,300m).
2. **Step 2: Selection & Carry-over into Checkout (`/checkout`)**  
   - Click **"Select Origin"** on **Gulmi Reserve**.
   - Observe immediate transition to `http://localhost:3000/checkout?origin=gulmi`.
   - Point out that the Order Summary automatically displays "Gulmi Reserve" and updates the total calculation.
3. **Step 3: Edge Case — Empty Cart Handling**  
   - Open a fresh incognito tab and navigate directly to `http://localhost:3000/checkout`.
   - Show that the application does not crash; it displays the friendly *"Your Cart is Empty"* guidance banner.
4. **Step 4: Simulated Payment Submission & Order Confirmation**  
   - Return to the active checkout. Fill in delivery details (Name: Aarav Sharma, Address: Baluwatar, Kathmandu).
   - Click **"Complete Subscription Order"**.
   - Observe the 2.0-second simulated payment processing modal, followed by the green success confirmation with order ID.
5. **Step 5: Customer Portal & Roastery Dashboard (`/dashboard`)**  
   - Click **"View Order in Portal"** or navigate to `http://localhost:3000/dashboard`.
   - Use the prefilled demo account button (`Aarav Sharma`) to open the authenticated dashboard tabs (Active Subscriptions, Delivery Address, Barista Brew Ratios).
   - (Optional) Open `http://localhost:3000/admin` to show the roastery operations clearance portal.

---

## 5. Scope Boundary Reminder

- **Simulated Payment:** Bypassed using mock verification flag for midterm safety (`is_fake_payment=True`).
- **Transactional Emails:** Deferred to Sprint 2; orders persist into Neon PostgreSQL without outbound SMTP traffic.
