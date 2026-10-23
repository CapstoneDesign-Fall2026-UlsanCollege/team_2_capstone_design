# Rehearsal & Midterm Presentation Rubric Self-Audit

**Team:** Team 2 — BrewMellow  
**Course:** Capstone Design — Fall 2026  
**Week:** 7 (Midterm Presentation Preparation)  
**Date:** October 15, 2026 (Updated October 21, 2026)  
**Presentation Target Time:** 3:45 to 4:00 (Strict Limit: 5:00)  
**Self-Assessed Score:** **20 / 20** (Converts to **15 / 15** Course Points)

---

## 1. Criterion-by-Criterion Evaluation

### Criterion 1: User, Problem, and Explanation (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Names a specific target user and problem, explains why the shown path matters, and uses clear language.
- **Team 2 Evidence:**
  - *Target User:* Specialty coffee enthusiasts and home-brewers in Nepal and diaspora seeking single-origin, fresh-roasted beans with harvest altitude and processing transparency.
  - *The Problem:* Commercial retail coffee in Kathmandu supermarkets is stale, dark-roasted blend with zero altitude, farm, or roast date transparency; high-grade micro-lots are exported without local access.
  - *Why it matters:* Customers can discover micro-lot coffees from Gulmi, Ilam, and Nuwakot and subscribe to roast-to-order delivery.
  - *Delivered by:* Aanchal Chand Thakuri (`@jaasly07`) in Slide 2 (`0:10 – 0:40`).

---

### Criterion 2: Demonstration and Honest Boundaries (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Shows a coherent current behavior or a precise, evidence-supported blocked state; clearly labels working, simulated, incomplete, and unverified parts.
- **Team 2 Evidence:**
  - *Live Behavior:* Live production demo on Vercel ([https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)) navigating Home $\rightarrow$ `/origins` $\rightarrow$ `/checkout` $\rightarrow$ Confirmation, customer dashboard, and roastery backoffice.
  - *Defensive Edge Case:* Direct navigation to `/checkout` without parameters renders a clean defensive empty-cart card with a "Build Your Plan" CTA instead of crashing.
  - *Honest Boundary Explicitly Named:* Aditya verbally and visually highlights on Slides 3 and 4 that payments are simulated using internal flag `is_fake_payment=True` and no real money has moved.
  - *Delivered by:* Aditya Kumar Gupta (`@notyouradhee`) in Slides 3 & 4 and Kushan Sunuwar (`@Kushan2191`) in Slide 7.

---

### Criterion 3: Evidence and Verification (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Links to relevant Issues, pull requests or commits, test notes, and demo proof; the links support the claims and another person could follow them.
- **Team 2 Evidence:**
  - *Feature Issue:* [Issue #43 “Feature: Coffee Origin Selection Page”](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43).
  - *PR & Code Review:* [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), merged by Kushan in [Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95).
  - *Independent Test Record:* [`docs/week-06/tested-by-note.md`](../week-06/tested-by-note.md) by `Kushan2191` on separate hardware.
  - *Defensive Fallback Commit:* Commit `f69700e` (*“add defensive empty cart fallback”*).
  - *State Sync Commit:* Commit `30081cc` (*“connect origin selection to checkout state”*).
  - *Mobile & A11y Audit:* Commit `ca35b07`, [accessibility-and-mobile-check.md](../week-06/accessibility-and-mobile-check.md), and commit `7b55d72` (`pb-28` fix).
  - *Smoke Test Record:* [api-smoke-test-record.md](../week-06/api-smoke-test-record.md) and repeatable README commands.

---

### Criterion 4: Individual Contribution and Ownership (Score: 4 / 4 per student)
- **Rubric Standard (Level 4 - Strong):** The student names a specific contribution, links it to evidence, and can explain a relevant choice or result.

| Student | Assigned Slides & Focus | Concrete Contribution Cited | Self Score |
|---|---|---|---|
| **`jaasly07`**<br>(Aanchal Chand Thakuri) | **Slide 1, Slide 2 & Slide 5**<br>Opening, User Persona & Frontend A11y | Formulated target persona; audited 390px mobile viewport against WCAG 2.1 AA; verified 52px touch targets; resolved sticky bar collision via `pb-28` (Commit `ca35b07`). | **4 / 4** |
| **`notyouradhee`**<br>(Aditya Kumar Gupta) | **Slide 3, Slide 4, Slide 6 & Slide 9**<br>Scope, Live Demo, Full-Stack & Roadmap | Architected Next.js/Django/Neon stack; built URL parameter state sync; deployed Vercel production app; articulated simulated payment boundary; authored post-midterm roadmap (Issue #43, PR #44). | **4 / 4** |
| **`Kushan2191`**<br>(Kushan Sunuwar) | **Slide 7**<br>QA Lead & Defensive Edge Case | Ran independent clean-clone test on separate computer without coaching; reviewed and merged PR #44 (Commit `9d45f95`); verified empty-cart fallback error handling (Commit `f69700e`). | **4 / 4** |
| **`Rohit-coder201`**<br>(Rohit Chhantyal) | **Slide 8**<br>DevOps & Resilience Lead | Executed backend outage test verifying explicit frontend connection alert; wrote repeatable curl smoke tests in README; completed Sprint 1 quality checks verifying zero secrets. | **4 / 4** |

---

### Criterion 5: Reflection and Next Step (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Names an important limitation or risk and a realistic, evidence-based next action after the midterm.
- **Team 2 Evidence:**
  - *Limitation Named:* Current payment is simulated (`is_fake_payment=True`); automated customer confirmation emails are not yet wired to SMTP.
  - *Realistic Next Step:* Connecting real Khalti sandbox gateway SDK credentials and automated dispatch emails during Sprint 2.
  - *Delivered by:* Aditya Kumar Gupta (`@notyouradhee`) in Slide 9 (`3:40 – 4:00`).

---

## 2. Summary & Conversion

$$\text{Shared Criteria Score} = 4 + 4 + 4 + 4 = 16 / 16$$
$$\text{Individual Score} = 4 / 4$$
$$\text{Total Midterm Score} = 20 / 20$$
$$\text{Course Points} = \frac{20}{20} \times 15 = 15.0 / 15.0$$
