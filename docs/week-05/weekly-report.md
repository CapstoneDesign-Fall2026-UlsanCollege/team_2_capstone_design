# Weekly Report

**Team:** Team 2 (BrewMellow)
**Week:** 5  
**Date:** October 5, 2026

## This week's goal

We confirmed our tech stack and vertical slice, generated the implementation issues, and built the Django backend API connected to a Neon PostgreSQL database. We successfully established a data contract boundary for simulated payments.

## What we committed to do

- [x] Confirm the tech stack and vertical slice.
- [x] Create the Week 5 implementation issues ([#39](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/39), [#40](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/40), [#41](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/41)).
- [x] Set up the Neon PostgreSQL database.
- [x] Build the Django backend `Order` model and API endpoints.

## Evidence links

| Evidence | Link |
|---|---|
| Issue(s) | [#39 Backend Init](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/39), [#40 Order API](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/40), [#41 UI Integration](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/41) |
| Vertical Slice | [Sprint 1 Vertical Slice Plan](sprint-1-vertical-slice-plan.md) |
| Boundary Note (Stretch) | **Simulated Payment Boundary:** Khalti payments are bypassed via an `is_fake_payment` flag for the midterm. Authentication is postponed entirely. |
| End-to-End Test Record | [API Test Record](api-test-record.md) |
| PR(s) / commits | [Commit: UI Polishing & API Integration](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/4b60bd8) |
| Test/check note | [Accessibility Check](accessibility-check.md) |
| Document update | [Repeatable Smoke Test (README)](../README.md) |

## Individual contributions

| Student | What they did | Evidence link |
|---|---|---|
| **Aditya (@notyouradhee)** | Implemented exact API endpoints, built UI styling pass, and ran end-to-end API tests including failure states. | [API Test Record](api-test-record.md) |
| **Aanchal (@jaasly07)** | Executed and documented accessibility and mobile responsiveness checks for the new checkout flow. | [Commit: A11y Check](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/ca35b07) |
| **Kushan (@Kushan2191)** | Added polished loading states and error states for API unavailability during checkout. | [Commit: Loading/Error UI](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5d61dd6) |
| **Rohit (@Rohit-coder201)** | Turned the initial checkout testing into a repeatable end-to-end smoke test in the README. | [Commit: Smoke Test](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/e25efce) |

## Blockers or risks

| Blocker/risk | Owner | Next action |
|---|---|---|
| **CORS Issues** | @notyouradhee | Configured `django-cors-headers` to allow Next.js to hit the Django API securely. |
| **Khalti Payment Sandbox** | @notyouradhee | Verify the Khalti test environment matches production documentation before coding checkout. |
| **Learning Curve** | @jaasly07 | The frontend team must spend time learning Next.js/React fundamentals. |

## Decision record

| Decision | Why we chose it | Owner | Evidence / Issue link |
|---|---|---|---|
| Use Django/PostgreSQL over Flask | Django provides a free, built-in admin panel which the business owner requires immediately. | @notyouradhee | [Tech Stack](tech-stack-comparison.md) |
| Restrict Midterm Demo Scope | The architecture is too large. We cut login and emails to focus solely on the checkout flow. | @notyouradhee | [Candidate Slice](candidate-vertical-slice.md) |

## Next week's bridge task

- Prove the "Ugly Slice" Definition of Done (Week 6).
- Rehearse the Midterm Presentation script.
