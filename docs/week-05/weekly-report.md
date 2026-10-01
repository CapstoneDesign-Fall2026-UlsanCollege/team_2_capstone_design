# Weekly Report

**Team:** Team 2 (BrewMellow)
**Week:** 5  
**Date:** October 1, 2026

## This week's goal

We confirmed our tech stack and vertical slice, generated the implementation issues, and built the Django backend API connected to a Neon PostgreSQL database. We successfully established a data contract boundary for simulated payments.

## What we committed to do

- [x] Confirm the tech stack and vertical slice.
- [x] Create the Week 5 implementation issues.
- [x] Set up the Neon PostgreSQL database.
- [x] Build the Django backend `Order` model and API endpoints.

## Evidence links

| Evidence | Link |
|---|---|
| Issue(s) | [Week 3 Sprint 0 Issues](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues) |
| Vertical Slice | [Candidate Slice](candidate-vertical-slice.md) |
| Data Contract (Stretch) | [Fake Data Contract](fake-data-contract.md) |
| Boundary Note (Stretch) | [Fake Payment Boundary](fake-payment-boundary-note.md) |
| Sprint 0 Report | [Sprint 0 Report](sprint-0-report.md) |
| Chuseok Checkpoint | [Week 4 Checkpoint Issue #38](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/38) |
| PR(s) / commits | [Frontend PWA Setup PR #37](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/37) |
| Screenshot / demo | [UI Wireframe Notes](wireframe-notes.md) (and [Error State](wireframe-error.jpg)) |
| Test/check note | [Dashboard Check / Done criteria](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/28#issuecomment-5847758590) |
| Document update | [Architecture Sketch](architecture-sketch.md) |

## Individual contributions

| Student | What they did | Evidence link |
|---|---|---|
| **Aditya (@notyouradhee)** | Led tech stack decision, defined architecture, explicitly cut the vertical slice scope. | [Candidate Slice](candidate-vertical-slice.md) |
| **Aanchal (@jaasly07)** | Setup Next.js/PWA and global styling. | [Commit: Update globals.css](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/d4d9c51e43594012ae6a1b397c9b577375747da3) |
| **Kushan (@Kushan2191)** | Built frontend plan selection UI and managed README/setup. | [Plan Selection UI](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f01f015c94c48c6e5e9973b5c7afbe8cebbf2cc8) |
| **Rohit (@Rohit-coder201)** | Implemented test/check for the dashboard path. | [Issue #28 Done Definition](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/28#issuecomment-5874481073) |

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
