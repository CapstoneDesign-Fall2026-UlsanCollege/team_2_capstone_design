# Definition of Done — Week 6 Vertical Slice

**Course:** Capstone Design  
**Week:** 6 — Test the Vertical Slice  
**Related Issue:** [#43 Feature: Coffee Origin Selection Page](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43)  
**Implementation Branch:** `feature/origin-selection`  
**Pull Request:** [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44) (Merged in [commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95))

---

## 1. Feature / Task Description

Enable Nepali specialty coffee subscription customers to explore boutique single-origin coffee profiles (`/origins`), select their preferred bean (Gulmi, Ilam, or Nuwakot), and transition directly into the checkout funnel (`/checkout`) with their selection preserved in URL state.

---

## 2. Done Criteria (Checkable & Honest)

- [x] **Tangible Visible Result:** The `/origins` page renders three distinct Nepali single-origin cards (Gulmi Reserve, Ilam Gold, Nuwakot Heritage) with altitude, processing method, and flavor profiles.
- [x] **Seamless Navigation:** Each card has an active "Select Origin" CTA routing to `/checkout?origin=<id>` carrying state.
- [x] **Independent Verification:** Tested by a team member (`Kushan2191`) on a separate computer without coaching from the author (`notyouradhee`).
- [x] **Peer Review & Integration:** PR #44 was reviewed, approved, and merged to the `main` branch.
- [x] **Edge Case & Empty State:** Direct navigation to `/checkout` without an origin parameter displays a helpful empty-cart notice rather than throwing an error or displaying blank placeholders.
- [x] **Mobile Responsiveness:** Layout collapses into a clean 1-column stack with no horizontal document overflow at 390px viewport width (tested by `jaasly07`).
- [x] **Backend Availability Check:** Tested under both backend-connected (HTTP 201) and backend-offline states (tested by `Rohit-coder201`).

---

## 3. How We Checked It (Test Language)

> We checked this by having tester `Kushan2191` run the app from a clean checkout, click "Browse Origins" from the homepage, inspect the three coffee profile cards, and select "Gulmi Reserve".  
> **Expected result:** URL updates to `/checkout?origin=gulmi` and order calculation displays "Gulmi Reserve".  
> **Actual result:** Selection transitioned instantaneously and displayed Gulmi Reserve with calculated pricing.  
> **Proof:** [origins-selection.png](evidence/origins-selection.png), [checkout-flow.png](evidence/checkout-flow.png), and [Tested-By Note](tested-by-note.md).

---

## 4. Current Scope Boundary (What is NOT Done)

- **Simulated Payment Only:** Live Khalti API secret key integration is deferred; payment confirmation is simulated via mock status flag.
- **Transactional Email:** Live customer email confirmation receipts are not yet wired to an external SMTP relay.
