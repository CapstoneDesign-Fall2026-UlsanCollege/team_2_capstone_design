# Rehearsal & Midterm Presentation Rubric Self-Audit

**Team:** Team 2 — BrewMellow  
**Week:** 7  
**Date:** October 15, 2026  
**Presentation Target Time:** 3:45 (Strict Limit: 5:00)  
**Self-Assessed Score:** **20 / 20** (Converts to **15 / 15** Course Points)

---

## 1. Criterion-by-Criterion Evaluation

### Criterion 1: User, Problem, and Explanation (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Names a specific target user and problem, explains why the shown path matters, and uses clear language.
- **Team 2 Evidence:**
  - *Target User:* Specialty coffee lovers and home-brewers in Nepal and diaspora seeking single-origin, fresh-roasted beans.
  - *The Problem:* Commercial retail coffee is stale and dark-roasted with zero altitude, farm, or harvest transparency.
  - *Why it matters:* Customers can discover micro-lot coffees from Gulmi, Ilam, and Nuwakot and subscribe with roast-to-order delivery.
  - *Delivered by:* Aanchal (`jaasly07`) in the opening 45 seconds of the presentation.

---

### Criterion 2: Demonstration and Honest Boundaries (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Shows a coherent current behavior or a precise, evidence-supported blocked state; clearly labels working, simulated, incomplete, and unverified parts.
- **Team 2 Evidence:**
  - *Live Behavior:* Live demo on Vercel ([https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)) navigating Home $\rightarrow$ `/origins` $\rightarrow$ `/checkout` $\rightarrow$ Confirmation.
  - *Defensive Edge Case:* Kushan demonstrates direct navigation to `/checkout` displaying a clean empty-cart card with a "Build Your Plan" CTA.
  - *Honest Boundary Explicitly Named:* Aditya verbally highlights that payments are simulated using internal flag `is_fake_payment=True` and no real money has moved.
  - *Delivered by:* Aditya (`notyouradhee`) and Kushan (`Kushan2191`).

---

### Criterion 3: Evidence and Verification (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Links to relevant Issues, pull requests or commits, test notes, and demo proof; the links support the claims and another person could follow them.
- **Team 2 Evidence:**
  - *PR & Code Review:* [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), merged by Kushan in [Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95).
  - *Independent Test Record:* [tested-by-note.md](../../week-06/tested-by-note.md) by `Kushan2191` on separate hardware.
  - *Visual Proof Assets:* [origins-selection.png](../../week-06/evidence/origins-selection.png), [checkout-flow.png](../../week-06/evidence/checkout-flow.png), [checkout-empty-state.png](../../week-06/evidence/checkout-empty-state.png), [origins-mobile.png](../../week-06/evidence/origins-mobile.png).
  - *Mobile & A11y Audit:* [accessibility-and-mobile-check.md](../../week-06/accessibility-and-mobile-check.md) and [Commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72).
  - *Smoke Test Record:* [api-smoke-test-record.md](../../week-06/api-smoke-test-record.md) and repeatable README commands.

---

### Criterion 4: Individual Contribution and Ownership (Score: 4 / 4 per student)
- **Rubric Standard (Level 4 - Strong):** The student names a specific contribution, links it to evidence, and can explain a relevant choice or result.

| Student | Assigned Section | Concrete Contribution Cited | Self Score |
|---|---|---|---|
| **`jaasly07`** (Aanchal Chand Thakuri) | Opening (User & Problem) + Mobile Audit | Explained specialty coffee user persona; audited 390px mobile layout; fixed sticky checkout bar collision via `pb-28`. | **4 / 4** |
| **`notyouradhee`** (Aditya Kumar Gupta) | Live Slice Demo & Scope Boundary | Implemented origin-to-checkout architecture; deployed production Vercel app; articulated `is_fake_payment=True` boundary. | **4 / 4** |
| **`Kushan2191`** (Kushan Sunuwar) | Independent Testing & Edge Case | Executed clean-clone test on separate machine without coaching; reviewed/merged PR #44; checked empty cart edge case. | **4 / 4** |
| **`Rohit-coder201`** (Rohit Chhantiyal) | Resilience Testing & Roadmap | Executed backend outage and recovery smoke test; verified repeatable curl commands; outlined Sprint 2 Khalti roadmap. | **4 / 4** |

---

### Criterion 5: Reflection and Next Step (Score: 4 / 4)
- **Rubric Standard (Level 4 - Strong):** Names an important limitation or risk and a realistic, evidence-based next action after the midterm.
- **Team 2 Evidence:**
  - *Limitation Named:* Current payment is simulated; automated customer confirmation emails are not yet wired to SMTP.
  - *Realistic Next Step:* Connecting real Khalti sandbox gateway SDK credentials and automated dispatch emails during Sprint 2.
  - *Delivered by:* Rohit (`Rohit-coder201`) in the concluding 20 seconds.

---

## 2. Summary & Conversion

$$\text{Shared Criteria Score} = 4 + 4 + 4 + 4 = 16 / 16$$
$$\text{Individual Score} = 4 / 4$$
$$\text{Total Midterm Score} = 20 / 20$$
$$\text{Course Points} = \frac{20}{20} \times 15 = 15.0 / 15.0$$
