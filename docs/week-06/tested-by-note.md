# Tested-By Note — Origin Selection to Checkout Flow

**Course:** Capstone Design  
**Week:** 6 — Test the Vertical Slice  
**Date:** October 8, 2026 (Updated & Re-verified October 13, 2026)  
**Team:** Team 2 (BrewMellow)

---

## 1. What We Checked

- **Behavior / Related Issue:** Browse Nepali Coffee Origins (`/origins`) → Select Origin → Carry Selection to Checkout (`/checkout`) with Plan & Delivery Options ([Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43))
- **Author of Implementation:** `notyouradhee` ([PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), commit [30081cc](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/30081cc), [5f650e8](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5f650e8))
- **Primary Non-Author Tester:** `Kushan2191`
- **Reviewer / Merge Author:** `Kushan2191` (PR merged in [commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95))
- **Test Environment:** Separate development machine running Node.js 20, Next.js 16 on `localhost:3000`

---

## 2. Check Steps (Repeatable Path)

1. Start the frontend application (`cd frontend && npm run dev` or `npm run build && npm run start`).
2. Navigate to the homepage at `http://localhost:3000`.
3. Click the **"Browse Origins"** button in the header or hero section.
4. Verify the `/origins` page renders three distinct Nepali single-origin cards:
   - **Gulmi Reserve** (Region: Gulmi, Western Nepal; Altitude: 1,450m; Washed process)
   - **Ilam Gold** (Region: Ilam, Eastern Nepal; Altitude: 1,650m; Honey process)
   - **Nuwakot Heritage** (Region: Nuwakot, Central Nepal; Altitude: 1,300m; Natural process)
5. Click **"Select Origin"** on the Gulmi Reserve card.
6. Verify URL transition to `/checkout?origin=gulmi`.
7. Verify that the order summary card on `/checkout` displays "Gulmi Reserve" and updates the calculation correctly.
8. Fill in customer delivery details (Name, Address, Phone) and click **"Complete Subscription Order"**.
9. Observe the simulated 2-second payment processing modal.

---

## 3. Results

- **Expected Result:**
  - Selecting an origin on `/origins` routes directly to `/checkout` with the corresponding origin URL parameter.
  - The checkout order summary displays the selected origin and calculated pricing.
  - Submitting payment triggers a simulated confirmation modal and creates an order record.
- **Actual Result:**
  - The `/origins` page displayed all three coffees with correct altitude, process, and tasting notes.
  - Clicking "Select Origin" on Gulmi Reserve redirected immediately to `/checkout?origin=gulmi`.
  - The order summary accurately reflected Gulmi Reserve.
  - Simulated payment processing took 2.0s and showed the green confirmation modal with order details.
- **Evidence / Proof:**
  - Desktop Origin Selection Proof: [origins-selection.png](evidence/origins-selection.png)
  - Desktop Checkout Flow Proof: [checkout-flow.png](evidence/checkout-flow.png)
  - GitHub PR: [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44)
  - Merge Commit: [9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95)

---

## 4. Edge Case Check: Direct Navigation Without Selected Origin (Stretch)

- **Tested by:** `Kushan2191`
- **Date:** October 9, 2026
- **Steps:** Navigate directly to `http://localhost:3000/checkout` in an incognito window without selecting any origin or plan first.
- **Expected Result:** App should not crash or show `undefined`; it should display an empty-cart state guiding the user back to `/origins` or `/subscribe`.
- **Actual Result:** App gracefully handled the missing query parameters by showing the empty selection notice: *"No coffee selected yet. Please choose your origin or subscription plan."* with a button back to selection. Fixed in commit [f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e).
- **Proof:** [checkout-empty-state.png](evidence/checkout-empty-state.png)

---

## 5. Scope Boundary (What This Proves vs. Does Not Prove)

- **What this proves:** Proves that origin metadata, visual routing, parameter passing, and simulated checkout state work end-to-end between Next.js pages and local state.
- **What this does NOT prove:**
  - This does **not** prove live Khalti payment gateway processing (payment is intentionally simulated via `is_fake_payment=True` for the midterm demo scope).
  - This does **not** prove production email dispatch (orders are queued in Django/Neon DB without sending live SMTP emails).

---

## 6. Next Action

- Connect order submission to the live Django backend API (`/api/orders/`) when the backend service is running, and verify graceful fallback when the backend service is stopped.
- Keep the verified Origin Selection → Checkout flow as the core 90 seconds of the Week 7 Midterm presentation.
