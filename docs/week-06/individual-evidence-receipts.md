# Individual Evidence Receipts — Week 6

**Course:** Capstone Design  
**Week:** 6 — Test the Vertical Slice  
**Team:** Team 2 (BrewMellow)  
**Date:** October 13, 2026

This document records the individual evidence receipts for each enrolled student on Team 2, matching canonical GitHub logins as evaluated by course staff.

---

## 1. Student: Aditya Kumar Gupta (`notyouradhee`)

### Receipt 1: Feature Implementation — Origins Page & Checkout Wiring
- **What I did:** Implemented the Nepali single-origin selection page (`/origins`), created origin cards (Gulmi, Ilam, Nuwakot), wired selection query state to the `/checkout` route, and authored PR #44.
- **Evidence link:** [Commit 30081cc](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/30081cc), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43)
- **How I checked it:** Ran local dev server, tested button click transitions, verified URL query parameters propagated into checkout state.
- **What I learned or changed:** Passing selected state via URL query params (`/checkout?origin=gulmi`) provides a cleaner, refresh-resilient user experience than storing transient state only in memory.

### Receipt 2: Admin Backoffice & Django Order API Integration
- **What I did:** Built the backoffice admin interface (`/admin`), registered the Django `Order` model in Django admin, and wired customer orders to the live Django/Neon backend.
- **Evidence link:** [Commit 2f3714b](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/2f3714b), [Commit 36b658e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/36b658e), [Proof Image](evidence/admin-backoffice.png)
- **How I checked it:** Created an order from the frontend checkout, verified HTTP 201 response in network tab, and confirmed the record appeared in Django Admin and the customer portal (`/dashboard`).
- **What I learned or changed:** Keeping admin routes discreet and separated from the consumer navigation ensures the customer funnel remains uncluttered.

---

## 2. Student: Kushan Gautam (`Kushan2191`)

### Receipt 1: Independent Teammate Testing of Origin Selection
- **What I did:** Performed independent teammate verification of the `/origins` to `/checkout` funnel on a separate machine without coaching from the author. Reviewed and approved PR #44 and executed the merge.
- **Evidence link:** [Merge Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Tested-By Note](tested-by-note.md)
- **How I checked it:** Cloned branch, started `npm run dev`, navigated through home → origins → selected Gulmi Reserve → confirmed checkout displayed Gulmi.
- **What I learned or changed:** Independent review caught that card descriptions needed higher contrast text for better readability on darker background panels.

### Receipt 2: Edge Case Testing — Direct Navigation & Empty Cart State
- **What I did:** Tested direct URL navigation to `/checkout` without an origin parameter to observe unhandled state; verified that an empty cart warning is displayed.
- **Evidence link:** [Commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e), [Proof Image](evidence/checkout-empty-state.png)
- **How I checked it:** Opened incognito browser, directly visited `http://localhost:3000/checkout`, verified the page rendered a friendly fallback message and a link back to selection.
- **What I learned or changed:** Defensive handling of missing URL params prevents Next.js client-side crashes and improves customer retention.

---

## 3. Student: Aanchal Jaiswal (`jaasly07`)

### Receipt 1: Mobile Viewport & Responsiveness Check
- **What I did:** Executed mobile responsiveness audit on the vertical slice (Origins and Checkout) at 390x844px viewport. Verified card stacking, touch target sizing, and absence of horizontal overflow.
- **Evidence link:** [Commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72), [Commit 4103af2](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/4103af2), [Proof Image](evidence/origins-mobile.png)
- **How I checked it:** Emulated iPhone 13/14 in DevTools, inspected touch target dimensions (minimum 48px height), checked `scrollWidth` vs `innerWidth`.
- **What I learned or changed:** Fixed a layout collision where the sticky checkout bottom bar was overlapping the submit button on mobile devices by adding `pb-28` safe-area padding.

### Receipt 2: Accessibility (A11y) & Contrast Review
- **What I did:** Conducted WCAG 2.1 contrast checks across origin badges and added descriptive `aria-label` attributes to navigation elements.
- **Evidence link:** [Commit b0d0c3d](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b0d0c3d), [Accessibility Check](accessibility-and-mobile-check.md)
- **How I checked it:** Evaluated color ratios of amber/gold text against `#121212` container background; verified ratios exceed 4.5:1.
- **What I learned or changed:** Subtly lightening muted body text from `#71717A` to `#A1A1AA` significantly improved legibility without compromising the premium aesthetic.

---

## 4. Student: Rohit Kumar Sharma (`Rohit-coder201`)

### Receipt 1: End-to-End API Smoke Testing & Recovery Validation
- **What I did:** Conducted API integration smoke tests on `POST /api/orders/` under two test scenarios: backend service active vs. backend service stopped.
- **Evidence link:** [API Smoke Test Record](api-smoke-test-record.md), [Commit 5d61dd6](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5d61dd6)
- **How I checked it:** Ran curl command checks and manual UI submissions with Django online (HTTP 201) and offline (connection refused). Confirmed error banner and retry logic.
- **What I learned or changed:** Handling API unavailability gracefully in the frontend prevents lost customer input and allows immediate recovery once the server restarts.

### Receipt 2: Repeatable Smoke Test Script in Project Documentation
- **What I did:** Documented repeatable curl and health-check command steps in the project documentation so any team member can verify backend/frontend readiness in under 60 seconds.
- **Evidence link:** [Repeatable Smoke Test in README.md](../../README.md), [Commit e25efce](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/e25efce)
- **How I checked it:** Ran the commands from a clean terminal session and verified expected HTTP status codes.
- **What I learned or changed:** Automated smoke commands provide immediate confidence before committing or rehearsing demos.
