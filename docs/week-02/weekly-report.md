# Weekly Report

**Team:** Group 5  
**Week:** 2  
**Date:** 2026-09-11  

Use this template in Weeks 2-3, 5-14, and 16. Weeks 1, 4, and 15 have special reports.

## This week's goal

What did your team try to improve this week?

> We worked on narrowing down our project scope, finalizing our midterm demo idea, and investigating key technical risks like payment integration and logistics.

## What we committed to do

- [x] Select the primary project direction (Coffee Subscription).
- [x] Complete individual investigations into technical risks.
- [x] Draft Design Doc v1 and the 3-5 step user flow sketch.

## Evidence links

If it is not linked, it does not count.

| Evidence | Link |
|---|---|
| Issue(s) | [#6 Finalize week 2 report](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/6) |
| PR(s) / commits | Merged to main branch |
| Screenshot / demo | [User Flow Sketch](user-flow-sketch.jpg) |
| Test/check note | Checked payment integration documentation (Khalti API). |
| Document update | [Design Doc v1](design-doc-v1.md), [Idea Selection](idea-selection-table.md) |

## Individual receipts

| Student | What they did | Evidence link |
|---|---|---|
| notyouradhee | Investigated Payment Gateway options | [#5 Payment Gateway](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/5) |
| Kushan2191 | Investigated Local Delivery APIs | [#7 Delivery API](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/7) |
| Rohit-coder201 | Investigated Tech Stack for MVP | [#11 Tech Stack](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/11) |
| Aanchal | Investigated Database options | [#15 Database](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/15) |

## Blockers or risks

| Blocker/risk | Owner | Next action |
|---|---|---|
| Integrating Khalti API widget in plain HTML | notyouradhee | Create a simple test page to prove the widget loads |
| Connecting Python backend to MongoDB | Rohit-coder201 | Set up a free MongoDB Atlas cluster and test connection |

## Decision record

Record only decisions that change scope, approach, ownership, or the next plan.

| Decision | Why we chose it | Owner | Evidence / Issue link |
|---|---|---|---|
| We will build a Coffee Subscription App | Strongest MVP potential with clear users | Team | [Idea Table](idea-selection-table.md) |
| We will use Khalti for payments | Easier API widget for our MVP timeline | notyouradhee | [#5](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/5) |
| We will use Upaya CityCargo (B2B Logistics) | Better suited for scheduled monthly deliveries | Kushan2191 | [#7](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/7) |
| We will use Python (Backend) + HTML/JS PWA | Fastest way to build backend logic without heavy frontend build tools | Rohit-coder201 | [#11](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/11) |

## Next week's bridge task

- Build the basic Khalti checkout prototype (Uncertainty Check).
- Setup the initial HTML/JS frontend environment.
