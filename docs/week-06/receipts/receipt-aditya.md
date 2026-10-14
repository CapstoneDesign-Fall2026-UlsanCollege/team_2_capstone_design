# Individual Evidence Receipt — Aditya Kumar Gupta

**Student:** `notyouradhee` (Aditya Kumar Gupta)  
**Team:** Team 2 — BrewMellow  
**Week:** 6  
**Date:** October 14, 2026  

---

## Receipt 1: Feature Implementation — Origins Page & Checkout Wiring
- **What I did:** Implemented the single-origin coffee showcase (`/origins`), configured cards for Gulmi Reserve, Ilam Gold, and Nuwakot Heritage, and wired URL state propagation to the `/checkout` route. Authored PR #44.
- **Evidence link:** [Commit 30081cc](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/30081cc), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43)
- **How I checked it:** Ran dev server on localhost:3000, clicked "Select Origin", and verified `/checkout?origin=gulmi` populated correctly.
- **What I learned or changed:** Passing selected state via URL parameters provides a resilient experience that survives page reloads.

---

## Receipt 2: Admin Backoffice & Django Order API Integration
- **What I did:** Built the roastery backoffice portal (`/admin`), registered the Django `Order` model in Django admin, and wired order creation to live Neon PostgreSQL.
- **Evidence link:** [Commit 2f3714b](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/2f3714b), [Commit 36b658e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/36b658e), [Proof Image](../evidence/admin-backoffice.png)
- **How I checked it:** Placed test orders and verified HTTP 201 responses and database persistence in Django admin.
- **What I learned or changed:** Keeping staff backoffice routes isolated prevents cluttering the customer storefront.
