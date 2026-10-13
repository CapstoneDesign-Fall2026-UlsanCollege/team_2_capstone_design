# Week 6 Work Checklist — Test the Vertical Slice

**Date:** Thu 2026-10-08 to Wed 2026-10-14  
**Team:** Team 2 (BrewMellow)

> Show one visible behavior, ask a teammate who did not build it to test the behavior, and record what actually happened. Keep an unfinished behavior marked incomplete; a failed test is useful evidence for the next Issue.

---

## Core work — complete all

### Run one real test

- [x] Choose one small user-visible behavior from the Week 5 vertical slice: **Browse Coffee Origins (`/origins`) → Select Origin → Carry to Checkout (`/checkout`)**.
- [x] Start from a clear place and write repeatable test steps (clean local checkout, `npm run dev`, navigate from homepage).
- [x] State the expected result before running the test (routes to `/checkout?origin=gulmi`, updates summary card, allows simulated order completion).
- [x] Ask a teammate other than the author to follow the steps without coaching (tested by `Kushan2191`, authored by `notyouradhee`).
- [x] Record the actual result, including confusing or missing behavior (all 3 origins rendered, selection passed smoothly to checkout; noted text contrast improvement).
- [x] If the test fails, record the first failing step and keep the related Issue incomplete (initial test passed; edge-case empty cart issue was recorded and resolved in [commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e)).

### Connect the test to the work

- [x] Complete a Tested-By Note with the tester, date, steps, expected result, actual result, proof link, problem found, and next action ([tested-by-note.md](tested-by-note.md)).
- [x] Update the relevant Issue’s Definition of Done and status to match the result ([Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43)).
- [x] Link the commit or pull request and a screenshot, demo, or short video when safe and useful ([PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [origins-selection.png](evidence/origins-selection.png), [checkout-flow.png](evidence/checkout-flow.png)).
- [x] If blocked, create or update an Issue with the exact blocker, one owner, and a next action (live Khalti credentials tracked under Issue #31).

### Record team and individual evidence

- [x] Update the team’s one shared Week 6 Weekly Report; do not create separate weekly reports ([weekly-report.md](weekly-report.md)).
- [x] Each student enters their own contribution sentence and evidence link in the shared report (all 4 logins: `notyouradhee`, `Kushan2191`, `jaasly07`, `Rohit-coder201`).
- [x] Each student completes and links the requested Individual Evidence Receipt ([individual-evidence-receipts.md](individual-evidence-receipts.md)).
- [x] Keep personal data, secrets, and unapproved real-user data out of shared evidence (only fake/mock customer names and sandbox data used).

---

## Evidence to link

- [x] Relevant implementation Issue with current Definition of Done and status: [Issue #43](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43)
- [x] Commit or pull request for the behavior tested: [PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44), [Commit 9d45f95](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/9d45f95)
- [x] Tested-By Note with steps, expected and actual results, and proof: [tested-by-note.md](tested-by-note.md)
- [x] Screenshot, demo link, or short video that supports the claim: [evidence/origins-selection.png](evidence/origins-selection.png), [evidence/checkout-flow.png](evidence/checkout-flow.png)
- [x] One shared Weekly Report with a contribution/evidence row from every member: [weekly-report.md](weekly-report.md)
- [x] Individual Evidence Receipt from each student: [individual-evidence-receipts.md](individual-evidence-receipts.md)
- [x] Any bug or blocker Issue with an owner and next action: [Issue #31 — Khalti Integration Risk](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31)

---

## Stretch menu — completed extensions

### Stronger user test
- [x] Tested direct navigation to `/checkout` with no selected origin to confirm the empty-cart behavior ([evidence/checkout-empty-state.png](evidence/checkout-empty-state.png)).
- [x] Conducted mobile viewport responsiveness and touch target audit at 390x844px ([accessibility-and-mobile-check.md](accessibility-and-mobile-check.md), [evidence/origins-mobile.png](evidence/origins-mobile.png)).

### Better technical evidence
- [x] Executed backend offline outage test and documented retry recovery behavior ([api-smoke-test-record.md](api-smoke-test-record.md)).
- [x] Documented repeatable 60-second curl smoke test commands in the project README ([README.md](../../README.md)).

### Better midterm path
- [x] Outlined the first 3–5 steps of the midterm demonstration path:
  1. Open homepage and click "Browse Origins".
  2. Select "Gulmi Reserve" single origin.
  3. Customize subscription tier and review price breakdown.
  4. Submit order and observe simulated payment modal.
  5. Confirm order persistence in Customer Dashboard (`/dashboard`) and Django Admin (`/admin`).
- [x] Explicitly stated the scope boundary: simulated payments are functional; live gateway credentials and live email dispatch are out-of-scope for the midterm.

---

## Risks and exceptions

| Item | Owner | Next action | Review point |
|---|---|---|---|
| Khalti Live Gateway Integration | `notyouradhee` | Keep sandbox flag `is_fake_payment=True` active for midterm; integrate live merchant secret keys post-midterm | Week 7 Rehearsal |
| Automated Email Alerts | `notyouradhee` | Orders are stored in database; defer SMTP server integration to Sprint 2 | Week 9 |

---

## Final check

- [x] Another teammate can repeat the test using the written steps.
- [x] The evidence supports the claim and the Issue status is honest.
- [x] The next midterm-demo improvement is assigned and visible in GitHub.
