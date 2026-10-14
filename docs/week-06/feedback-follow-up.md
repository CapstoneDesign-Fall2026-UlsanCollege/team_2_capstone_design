# Week 6 Formative Feedback Follow-Up & Action Log

**Team:** Team 2 — BrewMellow  
**Date:** October 14, 2026  
**Audited Against:** Monday 2026-10-12 7:00 PM KST Formative Review  
**Status:** 100% Completed & Verified

---

## 1. Team-Level Action Items Follow-Up

| Instructor Action Item | Completed Solution & Evidence | Status |
|---|---|---|
| **1. Create shared Week 6 Weekly Report** and link Issue #43, PR, implementation commit, and current Tested-By Note. | Authored and published [`weekly-report.md`](weekly-report.md). Linked [Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43), [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95), and [`tested-by-note.md`](tested-by-note.md). | **VERIFIED** |
| **2. Rerun origin → checkout → simulated payment** with non-author tester; record success and stopped-backend error state. | Primary test rerun by `Kushan2191` ([`tested-by-note.md`](tested-by-note.md)). Backend stopped/outage recovery state tested by `Rohit-coder201` ([`api-smoke-test-record.md`](api-smoke-test-record.md)). | **VERIFIED** |
| **3. Keep scope boundary visible:** simulated payment is not live payment. Name what test proves vs does not prove. | Explicit "Scope Boundary" sections embedded in `weekly-report.md` (Sec 7), `tested-by-note.md` (Sec 5), `definition-of-done.md` (Sec 4), and [Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43). Explicitly stated `is_fake_payment=True` and deferred SMTP email. | **VERIFIED** |
| **4. Add personal evidence row for all four logins.** Commit history by one login is not a substitute for individual entries. | Created dedicated 4-row table in `weekly-report.md` (Sec 5) and authored individual evidence receipts for `notyouradhee`, `Kushan2191`, `jaasly07`, and `Rohit-coder201` in [`individual-evidence-receipts.md`](individual-evidence-receipts.md) and [`receipts/`](receipts/). | **VERIFIED** |

---

## 2. Individual Member Feedback Follow-Up

### Aditya Kumar Gupta (`notyouradhee`)
- **Instructor Note:** *"Choose the smallest stable path, rerun it with a non-author tester, and update the Issue DoD with expected/actual results. Stretch: make the API outage behavior a repeatable smoke test and include a clear retry/recovery result."*
- **Action Taken:**
  1. Focused the core test on the bounded Origin Selection path (`/origins` → `/checkout`).
  2. Coordinated independent verification with `Kushan2191` on a separate laptop.
  3. Updated [Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43) body with checkable Definition of Done items, tester attribution, and actual results.
  4. Implemented retry/recovery state and curl smoke commands documented in `api-smoke-test-record.md` and `README.md`.
- **Status:** **COMPLETE**

### Kushan Gautam (`Kushan2191`)
- **Instructor Note:** *"Add your own Week 6 contribution row and link the review or test you performed. If you reviewed the selection flow, record one expected/actual observation and one follow-up. Stretch: test direct navigation to checkout with no selected origin and confirm the empty-cart behavior is clear."*
- **Action Taken:**
  1. Added personal contribution row in `weekly-report.md` linking merge commit [9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95).
  2. Documented observations in `tested-by-note.md` (suggested higher contrast for body text on dark backgrounds).
  3. Tested edge case: navigated directly to `http://localhost:3000/checkout` in incognito; verified empty cart banner. Proof captured in [`evidence/checkout-empty-state.png`](evidence/checkout-empty-state.png).
- **Status:** **COMPLETE**

### Aanchal Jaiswal (`jaasly07`)
- **Instructor Note:** *"Add a personal report row with exact evidence or own a current test. A responsive/mobile check on the origin-selection or checkout path would be a useful bounded contribution."*
- **Action Taken:**
  1. Conducted mobile viewport audit at 390x844px for `/origins` and `/checkout`.
  2. Identified sticky bottom bar overlap bug on mobile and resolved it with `pb-28` padding in [commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72).
  3. Documented full audit and WCAG 2.1 touch target verifications in [`accessibility-and-mobile-check.md`](accessibility-and-mobile-check.md) with proof screenshot [`evidence/origins-mobile.png`](evidence/origins-mobile.png).
- **Status:** **COMPLETE**

### Rohit Kumar Sharma (`Rohit-coder201`)
- **Instructor Note:** *"Add a personal row and run a specific checkout/API test with expected and actual results. Stretch: turn the test into a documented smoke check that another teammate can repeat after a frontend or backend change."*
- **Action Taken:**
  1. Tested `POST /api/orders/` under live Django/Neon DB execution (HTTP 201) vs. terminated backend process (connection error & offline fallback banner).
  2. Authored full test steps, expected vs. actual JSON payloads, and recovery validation in [`api-smoke-test-record.md`](api-smoke-test-record.md).
  3. Added the repeatable 60-second curl smoke test commands to the project [`README.md`](../../README.md#repeatable-smoke-test).
- **Status:** **COMPLETE**
