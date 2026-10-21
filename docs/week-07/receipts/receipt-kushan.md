# Individual Evidence Receipt — Kushan Sunuwar

**Student:** Kushan Sunuwar  
**GitHub Login:** `Kushan2191`  
**Team:** Team 2 — BrewMellow  
**Week:** 7  
**Date:** October 15, 2026 (Updated October 21, 2026)  

---

## Receipt 1: Independent Rehearsal of the Midterm Demo Path & PR #44 Merge

- **What I did:** Re-verified the end-to-end demo path from a non-author perspective on an independent machine without author coaching. Reviewed PR #44 thoroughly, verified origin parameter validation, and merged the pull request into main via merge commit `9d45f95`.
- **Evidence link:** [tested-by-note.md](../../week-06/tested-by-note.md), [Merge Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95), [presentation-slides.md](../presentation-slides.md#slide-7-68-individual-contribution-kushan-sunuwar-kushan2191)
- **How I checked it:** Followed the exact steps in [midterm-demo-script.md](../midterm-demo-script.md) on my machine, checking the origin cards, selecting Gulmi Reserve, and verifying the order confirmation modal.
- **What I learned or changed:** Having the non-author tester rehearse the run steps ensures that the presentation steps work without implicit assumptions or local caching.

---

## Receipt 2: Defensive Edge Case & Dedicated Slide 7 Presentation

- **What I did:** Prepared and rehearsed Slide 7 of the midterm presentation, explaining my QA leadership, the PR #44 merge, and the empty-cart defensive edge case where navigating directly to `/checkout` without parameters displays a friendly empty state rather than throwing an application error.
- **Evidence link:** [checkout-empty-state.png](../../week-06/evidence/checkout-empty-state.png), [Commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e), [midterm-demo-script.md](../midterm-demo-script.md#slide-7-68-individual-contribution-kushan-sunuwar-250--315)
- **How I checked it:** Tested direct navigation in Chrome DevTools with cleared session storage; confirmed the "Build Your Plan" button successfully routes the user back to `/origins`.
- **What I learned or changed:** Demonstrating defensive edge cases during the midterm highlights the team's engineering rigor and attention to user experience.
