# Individual Evidence Receipt — Aditya Kumar Gupta

**Student:** Aditya Kumar Gupta  
**GitHub Login:** `notyouradhee`  
**Team:** Team 2 — BrewMellow  
**Week:** 7  
**Date:** October 15, 2026  

---

## Receipt 1: Production Deployment & Live Demo Path Alignment

- **What I did:** Verified and maintained the live production deployment of BrewMellow on Vercel at [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app), ensuring that the origin selection, dynamic pricing calculation, and checkout routing work flawlessly in production over HTTPS.
- **Evidence link:** [Live Vercel Application](https://team-2-capstone-design-one.vercel.app), [Commit a84d7a2](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/a84d7a2), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44)
- **How I checked it:** Ran HTTP status checks against `https://team-2-capstone-design-one.vercel.app/origins` and verified that query parameters carry from `/origins` into `/checkout` in production without hydration mismatches.
- **What I learned or changed:** Standardizing on the production Vercel domain allows the team to present a true cloud-hosted demo during the midterm while retaining local servers as an instant fallback.

---

## Receipt 2: Midterm Demo Scripting & Timed Rehearsal Execution

- **What I did:** Co-authored the [Midterm Demo Script](../midterm-demo-script.md), defined the 3:45 timed run of show, and rehearsed the core live vertical slice demonstration (Home $\rightarrow$ `/origins` $\rightarrow$ `/checkout` $\rightarrow$ Confirmation).
- **Evidence link:** [midterm-demo-script.md](../midterm-demo-script.md), [presentation-slides.md](../presentation-slides.md)
- **How I checked it:** Rehearsed the live walkthrough with teammates using a stopwatch, clocking the demonstration at 3 minutes 40 seconds.
- **What I learned or changed:** Explicitly stating the scope boundary (`is_fake_payment=True`) during the live walkthrough satisfies Criterion 2 of the Midterm Rubric by demonstrating engineering honesty.
