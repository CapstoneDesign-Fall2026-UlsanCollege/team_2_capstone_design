# Weekly Report — Week 7: Midterm Demo Preparation and Rehearsal

**Team:** Team 2 — BrewMellow  
**Week:** 7  
**Date:** October 15, 2026 (Updated October 21, 2026)  
**Status:** Completed  
**PowerPoint Presentation:** [`BrewMellow_Midterm_Presentation.pptx`](BrewMellow_Midterm_Presentation.pptx)  
**Interactive Slides:** [`slides.html`](slides.html)  
**Live Deployed Application:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)  
**Repository:** [https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design)

---

## 1. This Week's Goal

Prepare and rehearse a believable, high-impact **3–5 minute midterm demo and pitch** for the upcoming Week 8 Midterm Presentation (worth 15% of the course grade). 

Specifically, we structured and timed our rehearsal around our proven vertical slice (Home $\rightarrow$ Origin Selection $\rightarrow$ Checkout $\rightarrow$ Order Confirmation), verified our live production deployment on Vercel, documented our defensive empty-cart edge case and backend outage recovery, completed Sprint 1 quality checks, authored a cohesive 9-slide presentation deck with side-by-side GitHub evidence screenshots, and assigned clear speaking roles with traceable evidence for all four students.

---

## 2. Verified Behavior (Rehearsal Record)

> **Rehearsal Statement:**  
> We ran a full timed rehearsal from our live production deployment ([https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)) with all four teammates presenting their assigned sections.  
> - **Total Rehearsal Time:** **3 minutes 50 seconds** (well within the strict 3:00 to 5:00 limit).  
> - **Expected Result:** Aanchal introduces the team, coffee problem, and target persona in $< 40\text{s}$ (Slides 1 & 2); Aditya establishes the technical scope and walks through the live vertical slice in $< 80\text{s}$ (Slides 3 & 4); each of the four teammates presents their dedicated contribution slide with GitHub evidence in 25s each (Slides 5–8: Aanchal, Aditya, Kushan, Rohit); Aditya presents the Sprint 2 roadmap and leads closing Q&A in $< 20\text{s}$ (Slide 9).  
> - **Actual Result:** Every speaker stayed within their time budget; live browser demo completed smoothly; empty cart fallback rendered cleanly; all claims were supported by direct commit/PR links and visible GitHub screenshots; rubric self-audit scored **20/20** (**15.0/15.0 course points**).  
> - **Proof Links:** [midterm-demo-script.md](midterm-demo-script.md), [presentation-slides.md](presentation-slides.md), [slides.html](slides.html), [BrewMellow_Midterm_Presentation.pptx](BrewMellow_Midterm_Presentation.pptx), [rehearsal-and-rubric-self-audit.md](rehearsal-and-rubric-self-audit.md), [sprint-1-quality-quick-checks.md](sprint-1-quality-quick-checks.md).

---

## 3. What We Committed to Do

- [x] Author the comprehensive [Midterm Demo Script](midterm-demo-script.md) with timestamps, speaker dialogue, and visual cues.
- [x] Author the visual [Midterm Presentation Slide Deck](presentation-slides.md) and PowerPoint file ([`BrewMellow_Midterm_Presentation.pptx`](BrewMellow_Midterm_Presentation.pptx)) embedding verified GitHub evidence screenshots side-by-side with contributions.
- [x] Author the standalone [Interactive Slide Deck](slides.html) for zero-dependency offline web presentation.
- [x] Verify live production deployment on Vercel ([https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)) and test local fallback servers.
- [x] Complete the [Sprint 1 Quality Quick Checks](sprint-1-quality-quick-checks.md) confirming zero secrets, safe demo data, and documented error states.
- [x] Complete individual evidence receipts for all 4 enrolled students in [receipts/](receipts/).
- [x] Conduct a self-audit against all 5 criteria of the [Midterm Presentation Rubric](rehearsal-and-rubric-self-audit.md).
- [x] Complete the [Week 7 Work Checklist](work-checklist.md).

---

## 4. Evidence Links & Document Matrix

| Category | Document / Asset | Description & Direct Link |
|---|---|---|
| **PowerPoint File** | Official 9-Slide Deck | [`BrewMellow_Midterm_Presentation.pptx`](BrewMellow_Midterm_Presentation.pptx) |
| **Demo Script** | Timed Midterm Demo Script | [midterm-demo-script.md](midterm-demo-script.md) |
| **Presentation Deck** | Visual Slide Presentation with Screenshots | [presentation-slides.md](presentation-slides.md) |
| **Interactive Slides** | Standalone Browser Slide Deck | [slides.html](slides.html) |
| **Live Production** | Deployed Next.js App on Vercel | [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app) |
| **Work Checklist** | Completed Week 7 Checklist | [work-checklist.md](work-checklist.md) |
| **Sprint 1 Checks** | Vertical Slice Quality Gate | [sprint-1-quality-quick-checks.md](sprint-1-quality-quick-checks.md) |
| **Rubric Audit** | 20/20 Midterm Rubric Self-Audit | [rehearsal-and-rubric-self-audit.md](rehearsal-and-rubric-self-audit.md) |
| **Primary Code PR** | Origin Selection & Checkout Integration | [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44) / [Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95) |
| **Independent QA** | Non-Author Test Record | [tested-by-note.md](../week-06/tested-by-note.md) |
| **Visual Proof: Origins** | Desktop Selection Screenshot | [origins-selection.png](../week-06/evidence/origins-selection.png) |
| **Visual Proof: Checkout** | Full Form & Pricing Screenshot | [checkout-flow.png](../week-06/evidence/checkout-flow.png) |
| **Visual Proof: Edge Case**| Empty Cart State Screenshot | [checkout-empty-state.png](../week-06/evidence/checkout-empty-state.png) |
| **Visual Proof: Mobile** | 390px Mobile Viewport Screenshot | [origins-mobile.png](../week-06/evidence/origins-mobile.png) |
| **Visual Proof: Admin** | Roastery Backoffice Dashboard | [admin-backoffice.png](../week-06/evidence/admin-backoffice.png) |
| **Outage Smoke Test** | API Outage & Recovery Record | [api-smoke-test-record.md](../week-06/api-smoke-test-record.md) |
| **Mobile & A11y Audit** | WCAG AA Viewport Test Record | [accessibility-and-mobile-check.md](../week-06/accessibility-and-mobile-check.md) |

---

## 5. Individual Contributions — One Row Per Enrolled Student

| Student Login | Canonical Name | Midterm Presentation Role | Concrete Contribution in Week 7 | Evidence Link |
|---|---|---|---|---|
| **`jaasly07`** | Aanchal Chand Thakuri | **Opener & Frontend Auditor (Slides 1, 2, 5)** | Authored opening problem pitch on specialty coffee transparency (Slide 2); prepared mobile presentation section demonstrating 390px responsive layout, 52px touch targets, and safe-area padding fix (`pb-28`) backed by commit `ca35b07` (Slide 5). | [Receipt](receipts/receipt-aanchal.md)<br>[midterm-demo-script.md](midterm-demo-script.md#slide-2-18-the-user--the-specialty-coffee-problem-010--040)<br>[Commit ca35b07](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/ca35b07) |
| **`notyouradhee`** | Aditya Kumar Gupta | **Project Lead & Core Slice Presenter (Slides 3, 4, 6, 9)** | Co-authored 9-slide presentation deck and 4:00 timed demo script; verified live Vercel production deployment; rehearsed live walkthrough; articulated simulated payment scope boundary (`is_fake_payment=True`); presented full-stack architecture and post-midterm roadmap. | [Receipt](receipts/receipt-aditya.md)<br>[midterm-demo-script.md](midterm-demo-script.md#slide-4-38-live-walkthrough-the-verified-vertical-slice-110--200)<br>[PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44) |
| **`Kushan2191`** | Kushan Sunuwar | **QA Lead & Code Reviewer (Slide 7)** | Rehearsed clean-clone run steps on separate hardware without coaching; reviewed and merged PR #44 via commit `9d45f95`; tested defensive empty-cart edge case on direct navigation (commit `f69700e`). | [Receipt](receipts/receipt-kushan.md)<br>[midterm-demo-script.md](midterm-demo-script.md#slide-7-68-individual-contribution-kushan-sunuwar-250--315)<br>[Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95) |
| **`Rohit-coder201`** | Rohit Chhantyal | **DevOps & Resilience Lead (Slide 8)** | Conducted backend outage resilience testing verifying explicit frontend connection alert; re-tested repeatable curl smoke test commands in README; completed Sprint 1 quality checks verifying zero secrets in repository. | [Receipt](receipts/receipt-rohit.md)<br>[midterm-demo-script.md](midterm-demo-script.md#slide-8-78-individual-contribution-rohit-chhantyal-315--340)<br>[sprint-1-quality-quick-checks.md](sprint-1-quality-quick-checks.md) |

---

## 6. Answers to Course Minimum Evidence Questions

1. **What exact user-visible behavior was rehearsed?**  
   The complete live user path: navigating from Home to `/origins`, reviewing three Nepali coffee cards, selecting "Gulmi Reserve", transitioning to `/checkout?origin=1` with pre-filled order parameters, submitting a simulated payment order, and demonstrating the defensive empty-cart edge case.
2. **Who tested/rehearsed it, and were they different from the author?**  
   Rehearsed with all four teammates. The core test path was independently verified on a separate machine by `Kushan2191`, while code was authored by `notyouradhee`.
3. **What were the repeatable steps, expected result, and actual result?**  
   Documented in full detail in [midterm-demo-script.md](midterm-demo-script.md) and [tested-by-note.md](../week-06/tested-by-note.md). Rehearsal completed in 3:50 without failures.
4. **What proof link supports the claim?**  
   Live deployment at [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app), backed by [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44) and [origins-selection.png](../week-06/evidence/origins-selection.png).
5. **Does the related Issue's Definition of Done and status match the result?**  
   Yes. [Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43) is marked closed with all checkable DoD items completed.
6. **Where is the personal contribution/evidence row for every current login?**  
   Fully detailed in Section 5 of this report and backed by dedicated receipt files in [receipts/](receipts/).
7. **What remains incomplete, who owns it, and what is the next action after the midterm?**  
   Live Khalti payment gateway credentials and automated customer email confirmations remain incomplete. Owned by `notyouradhee` and `Rohit-coder201`. Next action is implementing the Khalti SDK integration during Sprint 2.

---

## 7. Scope Boundary (What the Demo Proves vs. Does NOT Prove)

- **What the demo PROVES:**  
  1. Full client routing and URL parameter state preservation from `/origins` to `/checkout`.  
  2. Production deployment live on Vercel with HTTPS and mobile PWA manifest.  
  3. Defensive fallback handling for empty cart states and backend API connection failures.  
  4. Local and Neon database order record creation via Django REST Framework.  
- **What the demo DOES NOT PROVE:**  
  1. **Simulated Payment Boundary:** Payments use mock flag `is_fake_payment=True`. No real money or live Khalti wallet funds are deducted.  
  2. **Email Boundary:** Order records are saved to the database, but transactional customer dispatch emails are not yet connected.  
  3. **High-load Concurrency:** Multi-instance database pooling has not been load-tested.

---

## 8. Next Week's Bridge Task (Week 8 Graded Presentation)

- Deliver the 3–5 minute presentation live in class following the rehearsed 9-slide [Midterm Demo Script](midterm-demo-script.md).
- Keep local servers running in the background as an instant zero-latency backup in case classroom WiFi fluctuates.
- Transition immediately into Sprint 2 (MVP and Freeze) following the midterm evaluation.
