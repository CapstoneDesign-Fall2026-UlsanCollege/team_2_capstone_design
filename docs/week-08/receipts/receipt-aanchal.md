# Individual Evidence Receipt — Aanchal Chand Thakuri

**Student:** Aanchal Chand Thakuri  
**GitHub Login:** `jaasly07`  
**Team:** Team 2 — BrewMellow  
**Week:** 8 (Midterm Gate Checkpoint)  
**Date:** October 28, 2026  

---

## Receipt 1: Post-Midterm Accessibility Review & Mobile Checkout Audit

- **What I did:** Reviewed our Midterm presentation feedback regarding user accessibility and mobile readiness. Audited our 390px mobile viewport implementation across the `/origins` and `/checkout` routes, confirming that our safe-area padding (`pb-28`) and 52px touch-friendly CTA buttons (`py-3 px-6`) conform to WCAG 2.1 AA standards.
- **Evidence link:** [Commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72), [`docs/week-06/accessibility-and-mobile-check.md`](../../week-06/accessibility-and-mobile-check.md), [`../weekly-report.md#8-individual-contribution-entries--one-row-per-enrolled-student`](../weekly-report.md#8-individual-contribution-entries--one-row-per-enrolled-student)
- **How I checked it:** Tested mobile touch ergonomics using Chrome DevTools emulating iPhone 13/14 (390x844px) and verified that all interactive elements are reachable with one thumb without obscuring subscription summary data.
- **What I learned or changed:** Accessibility guidelines are not merely design polish; they prevent real customer drop-offs during critical checkout interactions.

---

## Receipt 2: Mobile Khalti Payment Sheet Specification & UX Flow

- **What I did:** Drafted the user experience specifications for the upcoming Sprint 2 Khalti payment sheet on mobile screens, ensuring that redirecting to Khalti's payment interface and returning to our `/dashboard` order confirmation preserves mobile state seamlessly.
- **Evidence link:** [`../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911`](../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911), [Live Vercel Application](https://team-2-capstone-design-one.vercel.app/origins)
- **How I checked it:** Verified that mobile viewports handle iframe/modal popups cleanly without causing viewport zoom or horizontal scrolling.
- **What I learned or changed:** Designing the mobile payment redirect flow before backend implementation prevents jarring user navigation loops.
