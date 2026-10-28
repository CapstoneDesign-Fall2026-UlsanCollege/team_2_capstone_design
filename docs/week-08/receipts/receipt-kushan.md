# Individual Evidence Receipt — Kushan Sunuwar

**Student:** Kushan Sunuwar  
**GitHub Login:** `Kushan2191`  
**Team:** Team 2 — BrewMellow  
**Week:** 8 (Midterm Gate Checkpoint)  
**Date:** October 28, 2026  

---

## Receipt 1: Independent Clean-Clone Verification & QA Lessons

- **What I did:** Reflected on the QA findings from our clean-clone test on separate hardware that formed a core part of our Midterm presentation. Documented the course lesson that independent testing without author intervention is critical to catching implicit caching and environment assumptions.
- **Evidence link:** [Merge Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95), [`docs/week-06/tested-by-note.md`](../../week-06/tested-by-note.md), [`../weekly-report.md#8-individual-contribution-entries--one-row-per-enrolled-student`](../weekly-report.md#8-individual-contribution-entries--one-row-per-enrolled-student)
- **How I checked it:** Validated that the test steps recorded in our Week 6 documentation remain 100% reproducible on a fresh machine cloning directly from `origin/main`.
- **What I learned or changed:** Having non-authors run tests uncovers documentation gaps and ensures repeatable results across different development machines.

---

## Receipt 2: Defensive Edge Cases & Khalti Test Suite Planning

- **What I did:** Formulated the test plan for the Sprint 2 Khalti payment flow, extending our empty-cart defensive edge case methodology (Commit `f69700e`) to cover payment cancellation, invalid OTPs, and network dropouts during gateway redirection.
- **Evidence link:** [Commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e), [`../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911`](../weekly-report.md#5-single-focus-milestone-for-sprint-2-week-911)
- **How I checked it:** Tested manual browser aborts and back-button presses during simulated checkout submission, confirming that user form inputs remain cached in local state rather than being wiped.
- **What I learned or changed:** Testing failure and cancellation paths is just as important as verifying successful happy paths.
