# Week 6 Stretch Menu Validation Record

**Team:** Team 2 — BrewMellow  
**Date:** October 14, 2026  
**Status:** Completed & Validated

The core work for Week 6 (proving one visible slice via non-author test) is the floor. Below is our validation record for the four stretch extensions chosen from the course menu.

---

## 1. Stretch Idea 1: Stronger User Test — Empty, Error & Recovery States

- **Check 1: Empty Cart Direct Access**
  - **Action:** Visiting `/checkout` without query params in incognito.
  - **Outcome:** Renders the clean fallback component guiding users back to `/origins` or `/subscribe`.
  - **Proof:** [`evidence/checkout-empty-state.png`](evidence/checkout-empty-state.png)
- **Check 2: Backend API Outage & Recovery**
  - **Action:** Terminating Django backend and attempting checkout submission.
  - **Outcome:** Displays non-blocking warning badge; clicking "Retry Order" after restarting Django immediately creates the order without lost inputs.
  - **Proof:** [`api-smoke-test-record.md`](api-smoke-test-record.md)

---

## 2. Stretch Idea 2: Mobile Viewport & Ergonomics Audit (390 x 844 px)

- **Action:** Audited the vertical slice under iPhone 13/14 portrait emulation.
- **Criteria Evaluated:**
  - Responsive Card Stacking: 3-column desktop layout collapses into 1-column stack.
  - Horizontal Overflow: Verified `document.documentElement.scrollWidth === window.innerWidth`.
  - Touch Target Size: CTA buttons measured at 52px height (exceeding WCAG 44px threshold).
- **Proof:** [`evidence/origins-mobile.png`](evidence/origins-mobile.png), [`accessibility-and-mobile-check.md`](accessibility-and-mobile-check.md)

---

## 3. Stretch Idea 3: Repeatable Smoke Test Script

- **Action:** Created copy-pasteable curl commands in the project `README.md` allowing any teammate to verify server health in under 60 seconds:
  ```bash
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/origins
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/orders/
  ```
- **Proof:** [`README.md`](../../README.md#repeatable-smoke-test), [Commit e25efce](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/e25efce)

---

## 4. Stretch Idea 4: Midterm Demo Path & Claims Matrix

### First 5 Steps of the Midterm Demo Path:
1. Open homepage and click "Browse Origins".
2. Select "Gulmi Reserve" single origin card.
3. Observe URL parameter propagation into `/checkout?origin=gulmi`.
4. Submit order and observe 2-second simulated payment confirmation modal.
5. Navigate to Customer Portal (`/dashboard`) and show order reflection in active subscriptions.

### Claims Matrix: Provable vs. Unprovable
| System Claim | Verification Status | Evidence Link |
|---|---|---|
| Single-Origin Selection & Price Calculation | **PROVEN** | [Tested-By Note](tested-by-note.md) / [origins-selection.png](evidence/origins-selection.png) |
| Empty-cart state handling | **PROVEN** | [checkout-empty-state.png](evidence/checkout-empty-state.png) |
| Backend offline recovery | **PROVEN** | [api-smoke-test-record.md](api-smoke-test-record.md) |
| Neon DB Order Record Persistence | **PROVEN** | [admin-backoffice.png](evidence/admin-backoffice.png) |
| Live Khalti Payment Gateway Integration | **UNPROVEN (Out of Scope)** | Bypassed via `is_fake_payment=True` for midterm demo stability |
| Automated Transactional Email Dispatch | **UNPROVEN (Out of Scope)** | Orders are stored in DB; SMTP delivery deferred to Sprint 2 |
