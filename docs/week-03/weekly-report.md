# Weekly Report

**Team:** Team 2 (BrewMellow)
**Week:** 3  
**Date:** September 26, 2026

## This week's goal

We completed all Week 3 planning deliverables: comparing tech stacks, defining the system architecture, sketching UI wireframes, creating GitHub issues for the first sprint, and explicitly scoping down our Candidate Vertical Slice for the midterm.

## What we committed to do

- [x] Finalize the tech stack choice and document it.
- [x] Draw wireframes for the core selection and checkout flow.
- [x] Scope the midterm vertical slice and cut unnecessary features.
- [x] Set up initial GitHub issues with clear owners and Definitions of Done.

## Evidence links

| Evidence | Link |
|---|---|
| Issue(s) | [Week 3 Sprint 0 Issues](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues) |
| Vertical Slice | [Candidate Slice](candidate-vertical-slice.md) |
| Data Contract (Stretch) | [Fake Data Contract](fake-data-contract.md) |
| Sprint 0 Report | [Sprint 0 Report](sprint-0-report.md) |
| Chuseok Checkpoint | [Week 4 Checkpoint Issue #38](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/38) |
| PR(s) / commits | [Frontend PWA Setup PR #37](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/37) |
| Screenshot / demo | [UI Wireframe Notes](wireframe-notes.md) (and [Error State](wireframe-error.jpg)) |
| Test/check note | [Dashboard Check / Done criteria](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/28#issuecomment-5847758590) |
| Document update | [Architecture Sketch](architecture-sketch.md) |

## Individual contributions

| Student | What they did | Evidence link |
|---|---|---|
| **@notyouradhee** | Led tech stack decision, defined architecture, explicitly cut the vertical slice scope. | [Candidate Slice](candidate-vertical-slice.md) |
| **@jaasly07** | Setup Next.js/PWA and global styling. | [Commit: Update globals.css](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/d4d9c51e43594012ae6a1b397c9b577375747da3) |
| **@Kushan2191** | Built frontend plan selection UI and managed README/setup. | [Plan Selection UI](../../frontend/src/app/page.tsx) |
| **@Rohit-coder201** | Implemented test/check for the dashboard path. | [Issue #28 Done Definition](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/28#issuecomment-5847758590) |

## Blockers or risks

| Blocker/risk | Owner | Next action |
|---|---|---|
| **Learning Curve** | @jaasly07 | The frontend team must spend time learning Next.js/React fundamentals. |
| **Khalti Payment Sandbox** | @notyouradhee | Verify the Khalti test environment matches production documentation before coding checkout. |
| **Chuseok Coordination** | @notyouradhee | Distribute clear, independent tasks so work continues despite the holiday. |

## Decision record

| Decision | Why we chose it | Owner | Evidence / Issue link |
|---|---|---|---|
| Use Django/PostgreSQL over Flask | Django provides a free, built-in admin panel which the business owner requires immediately. | @notyouradhee | [Tech Stack](tech-stack-comparison.md) |
| Restrict Midterm Demo Scope | The architecture is too large. We cut login and emails to focus solely on the checkout flow. | @notyouradhee | [Candidate Slice](candidate-vertical-slice.md) |

## Next week's bridge task

- Build the Django REST API endpoints for Origins and Plans (Issue #24).
- Connect the frontend selection UI to the live Django backend (Issue #25).
