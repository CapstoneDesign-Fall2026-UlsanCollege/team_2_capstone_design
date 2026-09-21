# Sprint 0 Report — Launch and Scope

**Team:** Team 2  
**Sprint:** Sprint 0 — Launch and Scope  
**Date:** 2026-09-21  
**Status:** [x] Ready to close  [ ] Ready with an explicitly owned exception

## Sprint 0 outcome

In one or two sentences, what is your team now ready to build next?

> We have fully defined our architecture, tech stack, and initial design for Coffee Subscription Nepal, and are ready to begin the repository setup and the first vertical slice after the Chuseok break.

## Project snapshot

| Field | Current answer | Evidence link |
|---|---|---|
| Project purpose | A subscription service for premium Nepali coffee beans. | [Design Doc v1](../week-02/design-doc-v1.md) |
| Target user | Nepali coffee drinkers looking for quality and convenience. | [Design Doc v1](../week-02/design-doc-v1.md) |
| In-scope boundary | Origin selection, plan configuration, Khalti payment. | [Vertical Slice](candidate-vertical-slice.md) |
| Out-of-scope boundary | Complex recurring billing logic and live partner integrations. | [Vertical Slice](candidate-vertical-slice.md) |
| Possible midterm demo sentence | Our midterm demo will show a customer picking an origin, selecting a plan, and making a test payment via Khalti. | [Chuseok Checkpoint](chuseok-checkpoint.md) |

## Sprint 0 exit evidence

| Requirement | Evidence link | Status or short note |
|---|---|---|
| Team repository and Project board work | [GitHub Repo](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design) | Complete |
| Team Working Agreement is linked and current | [Week 2 Docs](../week-02/) | Complete |
| Six to ten next-work Issues exist | [Issues Board](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues) | Complete (10 issues created) |
| Important Issues have first owners | [Issues Board](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues) | Complete |
| At least three Issues have a checkable Definition of Done | [Issues Board](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues) | Complete (7 issues have DoD) |
| Tech stack comparison is recorded | [Tech Stack Comparison](tech-stack-comparison.md) | Complete |
| Rough wireframe placeholders are linked | [Wireframe Notes](wireframe-notes.md) | Complete |
| Rough architecture placeholder is linked | [Architecture Sketch](architecture-sketch.md) | Complete |
| Candidate vertical slice is linked | [Vertical Slice](candidate-vertical-slice.md) | Complete |
| Sprint 0 Quality Quick Checks are complete | [Quality Checks](sprint-quality-quick-checks.md) | Complete |
| Week 3 Weekly Report is complete | [Weekly Report](weekly-report.md) | Complete |

## Candidate vertical slice

- **User or actor:** Customer  
- **Start state:** Arrives at the landing page.  
- **Smallest end-to-end path:** Clicks "Get Started" → Picks coffee origin → Chooses commitment plan → Checks out with Khalti test payment.  
- **What the demo should prove:** The Next.js frontend can connect to the Django API, which successfully verifies a Khalti sandbox payment and stores the order in PostgreSQL.  
- **What is deliberately out of scope:** Customer dashboard, pause/skip logic, and automated emails to delivery partners.  
- **Evidence link:** [Vertical Slice Document](candidate-vertical-slice.md)  

## Risks and owned exceptions

| Risk or exception | Owner | Next action | Due or review point |
|---|---|---|---|
| Khalti Sandbox behavior mismatch | notyouradhee | Create a test payment script isolated from the frontend | Week 5 |
| Next.js / React learning curve | Aanchal / Kushan2191 | Setup base React boilerplate and do basic tutorials | Week 5 |

## Bridge into Week 4 and Sprint 1

- **Week 4 Chuseok Checkpoint Issue:** Completed as a Markdown file.  
- **Rough sketch or photo link:** [Landing Page Wireframe](wireframe-landing-page.jpg)  
- **One blocker or question for Week 5:** Need to ensure the Khalti sandbox behaves correctly.  
- **First action after the break:** Initialize the Django repository and the Next.js frontend repository.  

## Final check

- [x] Every evidence link resolves for a reader with team-repository access.
- [x] The team can explain the project purpose, target user, scope boundary, and candidate slice.
- [x] The next work is represented by small Issues with owners and checkable completion criteria.
- [x] The team has not posted personal data, secrets, or unapproved real-user data.
- [x] This report is linked from the team’s Week 3 evidence or Weekly Report.
