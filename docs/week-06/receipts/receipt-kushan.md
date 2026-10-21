# Individual Evidence Receipt — Kushan Sunuwar

**Student:** `Kushan2191` (Kushan Sunuwar)  
**Team:** Team 2 — BrewMellow  
**Week:** 6  
**Date:** October 14, 2026  

---

## Receipt 1: Independent Teammate Testing of Origin Selection
- **What I did:** Performed independent teammate verification of the `/origins` to `/checkout` funnel on a separate machine without author coaching. Reviewed, approved, and merged PR #44.
- **Evidence link:** [Merge Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Tested-By Note](../tested-by-note.md)
- **How I checked it:** Cloned branch from origin, started `npm run dev`, navigated Home → Origins → Gulmi Reserve → Checkout, and verified origin name and price calculations.
- **What I learned or changed:** Independent review caught that card descriptions needed higher contrast text for better readability on darker background panels.

---

## Receipt 2: Edge Case Testing — Direct Navigation & Empty Cart State
- **What I did:** Tested direct URL navigation to `/checkout` without an origin parameter to observe unhandled state; verified that an empty cart warning is displayed.
- **Evidence link:** [Commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e), [Proof Image](../evidence/checkout-empty-state.png)
- **How I checked it:** Opened incognito browser, directly visited `http://localhost:3000/checkout`, verified the page rendered a friendly fallback message and a link back to selection.
- **What I learned or changed:** Defensive handling of missing URL params prevents Next.js client-side crashes and improves customer retention.
