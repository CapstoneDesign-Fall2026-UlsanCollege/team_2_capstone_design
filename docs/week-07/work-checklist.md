# Week 7 Work Checklist — Rehearse the Midterm Path

**Date:** Thu 2026-10-15 to Wed 2026-10-21  
**Team:** Team 2 — BrewMellow  
**Course:** Capstone Design — Fall 2026  
**Status:** Completed

---

## Core work — complete all

### Build a believable demo path

- [x] Start from a clear point another person can reach ([https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app) or clean clone `localhost:3000`).
- [x] Name the target user, the problem, and the one path the demo will show (Specialty coffee lovers in Nepal; origin transparency; Home $\rightarrow$ `/origins` $\rightarrow$ `/checkout`).
- [x] Write the main demo steps in the reusable [Midterm Demo Script](midterm-demo-script.md).
- [x] Mark what is working, simulated, incomplete, or unverified. Do not present a mock-up, recording, or plan as proof of a live behavior (Payment explicitly labeled as `is_fake_payment=True`).
- [x] Give each speaker a short part, including each student's evidence-backed contribution (Aanchal: Problem & Mobile; Aditya: Live Demo & Core Slice; Kushan: Independent Test & Empty Cart; Rohit: Outage Test & Roadmap).
- [x] Keep one limitation or risk and one realistic next step in the story (Live Khalti integration and automated dispatch emails scheduled for Sprint 2).

### Check Sprint 1 and current status

- [x] Complete the Sprint 1 section in [Sprint Quality Quick Checks](sprint-1-quality-quick-checks.md).
- [x] Link proof for the end-to-end path or clearly document the blocker preventing it (Linked [origins-selection.png](../week-06/evidence/origins-selection.png) and [checkout-flow.png](../week-06/evidence/checkout-flow.png)).
- [x] Check that the README or setup note tells another person how to view or run the work ([README.md](../../README.md) verified with clean setup steps).
- [x] Create or update one Midterm Prep Issue with an owner, current status, risks/blockers, next actions, and links to the script and proof.
- [x] Check that shared evidence contains no secrets, private data, or unapproved real-user data (Verified: `.env` excluded, only synthetic demo users used).

### Rehearse and record evidence

- [x] Run a timed 3–5 minute rehearsal from the stated start point (Rehearsal clocked at 3 minutes 40 seconds).
- [x] Use the [Midterm Presentation Rubric](rehearsal-and-rubric-self-audit.md) to choose one strength and one improvement (Strength: Seamless deployed live demo and honest simulated payment boundary; Improvement: Smooth transitions between speakers).
- [x] Update the script and prep Issue with the rehearsal result, current status, proof, and next action.
- [x] Update the team's one shared Weekly Report; each student adds their own contribution and evidence row ([weekly-report.md](weekly-report.md)).
- [x] Each student completes a linked [Individual Evidence Receipt](receipts/) to support their row.

---

## Evidence to link

- [x] Midterm prep Issue with owner, current status, risks, and next actions ([Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43) / [Issue #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/54)).
- [x] Midterm demo script and run steps ([midterm-demo-script.md](midterm-demo-script.md)).
- [x] Slide presentation deck ([presentation-slides.md](presentation-slides.md)).
- [x] Current screenshot, test note, live demo, or recording that supports the claims being made ([docs/week-06/evidence/](../week-06/evidence/)).
- [x] Completed Sprint 1 quality quick checks ([sprint-1-quality-quick-checks.md](sprint-1-quality-quick-checks.md)).
- [x] Shared Weekly Report with a row from every student and each student's receipt link ([weekly-report.md](weekly-report.md)).
- [x] Self-audit against rubric ([rehearsal-and-rubric-self-audit.md](rehearsal-and-rubric-self-audit.md)).

---

## Stretch menu — optional after the core work

### Stronger presentation

- [x] Ask a person outside the build discussion to follow the run steps without coaching (`Kushan2191` tested on independent hardware).
- [x] Rehearse a recovery or fallback if the live environment fails (Documented emergency switch to localhost or pre-loaded evidence gallery).
- [x] Make one simple slide that shows the user, problem, and scope boundary (Incorporated into [presentation-slides.md](presentation-slides.md)).

### Stronger evidence

- [x] Repeat the main path from a clean start and record the result (Recorded in [tested-by-note.md](../week-06/tested-by-note.md)).
- [x] Link one important Issue, pull request, commit, or test note at the moment it supports a claim (Linked [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95), [Commit 30081cc](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/30081cc)).
- [x] Check the start instructions from another teammate's device or workspace.

---

## Final check

- [x] Another person can follow the demo path from its stated start point.
- [x] The rehearsal took 3–5 minutes and stayed within the team's actual evidence (Clocked at 3:40).
- [x] Every speaker can name their part and point to their evidence.
- [x] The next rehearsal improvement and the Oct 21 freeze action are assigned.
