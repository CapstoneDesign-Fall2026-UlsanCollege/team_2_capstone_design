# Week 10 Work Checklist — Code Ownership and Responsible AI Audit

**Date:** Thu 2026-11-05 to Wed 2026-11-11  
**Team:** Team 2 — **ShopCraft** (Multi-Tenant E-Commerce Platform for Nepal's Craft Economy)  
**Status:** Completed & Cross-Verified  

> Advance the roadmap with work the team can explain, review, and verify. Each student keeps a bounded delivery slice and helps steward a codebase area. Stewardship supports shared work; it does not make one person a gatekeeper. Follow course and assignment rules on whether AI assistance is permitted.

---

## 1. Map the Codebase Areas

- [x] Look at the actual repository and choose useful areas. Possible examples: frontend, backend/API, data/storage, UI/UX/accessibility, testing/integration, or deployment.
  - *Result:* Mapped repository into 4 concrete areas: (1) Core Multi-Tenant Backend, RLS & Payments, (2) QA, Non-Author Verification & Runbooks, (3) Storefront UI/UX, Mobile & Accessibility, (4) DevOps, Backend Health & State Machine.
- [x] Record each area with the real folder, files, component, or responsibility it covers. Do not force a layer that the project does not have.
  - *Result:* Area boundaries match real directories: `backend/core/` & `backend/stores/` & `backend/orders/`, `backend/stores/tests/` & `scripts/`, `frontend/src/app/s/` & `frontend/src/components/storefront/`, `backend/orders/models.py` & `/api/health/`.
- [x] Each student names one primary area they help steward, based on current strengths. Pair a learner with a co-steward or backup when useful.
  - *Result:* Aditya (Area 1, Backup: Rohit); Kushan (Area 2, Backup: Aanchal); Aanchal (Area 3, Backup: Kushan); Rohit (Area 4, Backup: Aditya).
- [x] Record one simple health, documentation, or review check for each area.
  - *Result:* Area 1: `python manage.py test stores.tests.test_isolation`; Area 2: `python manage.py test accounts catalog orders stores`; Area 3: `npx tsc --noEmit && node scripts/check-surfaces.mjs`; Area 4: `curl http://localhost:8000/api/health/`.
- [x] Confirm teammates can still contribute to any area. The steward keeps context clear; they do not reserve code or approve every change alone.
  - *Result:* Confirmed across all 4 areas with documented peer handoffs in [`evidence/`](evidence/).

---

## 2. Choose a Roadmap Slice

- [x] Open the team's Final Demo Roadmap and select its next milestone.
  - *Result:* Sprint 2 Milestone: Multi-Tenant One-Time Checkout & Payment Boundary with Cash on Delivery fallback.
- [x] Name the smallest vertical slice that moves the milestone, including the behavior and the area(s) it touches.
  - *Result:* Server-side Khalti Sandbox v2 token initiation and lookup verification (`epayment/lookup/`) with instant COD fallback and cart preservation on cancellation.
- [x] State how the team will check that behavior.
  - *Result:* Initiating sandbox payment with test credentials `9800000000` / OTP `987654` and verifying database order status `PAID`.
- [x] Create or update an Issue with a slice owner, an area steward/co-steward to consult, a checkable result, and an evidence link.
  - *Result:* Issues #48, #49, #50, and #51 updated with designated owners, checkable criteria, and evidence links.
- [x] Adjust the slice to the team's actual progress:
  - *Result:* Following PR #45, recurring shopper subscriptions were formally removed from MVP. Platform strictly executes direct one-time retail purchases.

---

## 3. Explain One Slice Per Student

- [x] Each student locates a function, component, test, or document they touched or that supports the next milestone.
  - *Aditya:* `initiate_khalti_payment` and `verify_khalti_payment` in `backend/orders/api.py`.
  - *Kushan:* Gateway cancellation return handling in `frontend/src/app/s/[storeSlug]/checkout/page.tsx` and clean-clone runbook.
  - *Aanchal:* `CheckoutForm.tsx` validation logic with 7 Provinces dropdown and 10-digit phone regex.
  - *Rohit:* `Order.transition_status()` in `backend/orders/models.py` and `/api/health/` uptime probe.
- [x] Name both the roadmap slice and the primary codebase area this work touches.
  - *Result:* Documented in dedicated slice files in [`slices/`](slices/).
- [x] Explain the slice's purpose, one input, what it changes or returns, and one dependency in plain language.
  - *Result:* Plain-language walkthroughs documented in each student's slice file and handoff note.
- [x] Point to the relevant file, PR, commit, or test.
  - *Result:* Linked to commits `1374b23`, `89b1420`, `7a72592`, `5406c14`.
- [x] Label anything you cannot yet explain as a question; do not guess.
  - *Result:* Open questions recorded in Section 4 of [ai-use-and-code-ownership-audit.md](ai-use-and-code-ownership-audit.md#4-code-we-need-to-rewrite-understand-better-or-freeze).

---

## 4. Review and Verify the Behavior

- [x] Ask a teammate one specific question about the slice.
  - *Result:* Cross-area questions documented in peer review logs.
- [x] Check one expected path and record the expected and actual result.
  - *Result:* 4 cross-area checks executed with expected vs actual results recorded in [weekly-report.md](weekly-report.md#5-cross-area-independent-peer-checks).
- [x] Ask the relevant area steward or backup to help locate area conventions, tests, or known risks; invite a second reviewer where possible.
  - *Result:* Backup stewards consulted on test runners, Cloudinary fallbacks, and connection pooling.
- [x] Review any AI-assisted or outside material before relying on it; record what was used and how it was checked.
  - *Result:* Documented in Section 1 of [ai-use-and-code-ownership-audit.md](ai-use-and-code-ownership-audit.md#1-responsible-ai-use-notes).
- [x] Add relevant review or test evidence to the PR or Issue.
  - *Result:* Test logs, terminal output, and verification receipts linked in Issues #48–#51.
- [x] If code is not understood or verified, record its location, what is unknown, an owner, and the next test, rewrite, or removal step.
  - *Result:* Gaps cataloged with owners and due dates for Week 11 Feature Freeze.

---

## 5. Record Ownership and Advance the Roadmap

- [x] Update the [AI Use and Code Ownership Audit](ai-use-and-code-ownership-audit.md) in the team's repository.
  - *Result:* Audit fully updated and cross-linked.
- [x] Record AI use accurately for relevant PRs, commits, or files, including what the team reviewed.
  - *Result:* Completed with transparent human refactoring disclosures.
- [x] Add each student's vertical slice, primary area, area support/backup, explanation status, check, and evidence link.
  - *Result:* Matrix completed in Section 3 of audit.
- [x] Map each area to its real repository boundary and one health/review check; mark shared or cross-cutting areas honestly.
  - *Result:* Completed in Section 2 of audit.
- [x] Link the area map from the team's Working Agreement and shared Weekly Report; keep the map itself in the audit so area details have one source of truth.
  - *Result:* Linked in `weekly-report.md` and `docs/week-01/team-working-agreement.md`.
- [x] Assign an owner and a due point for every code gap that remains.
  - *Result:* Assigned to Aditya, Kushan, Aanchal, and Rohit with due date Nov 12, 2026.
- [x] Update the roadmap with the Week 10 result, evidence, and next step.
  - *Result:* Documented in Section 8 of `weekly-report.md`.
- [x] Add each student's own contribution and evidence row to the team's one shared Weekly Report.
  - *Result:* Table with 4 complete rows in Section 4 of `weekly-report.md`.

---

## Evidence to Link in GitHub

- [x] Roadmap milestone and its Issue: [final-demo-roadmap.md](../week-09/final-demo-roadmap.md) · Issues #48–#51
- [x] Area map with repository boundaries, steward/co-steward, backup, and health/review check: [ai-use-and-code-ownership-audit.md#2-codebase-area-map](ai-use-and-code-ownership-audit.md#2-codebase-area-map)
- [x] AI-use note in each relevant PR or change record: [ai-use-and-code-ownership-audit.md#1-responsible-ai-use-notes](ai-use-and-code-ownership-audit.md#1-responsible-ai-use-notes) · [`slices/`](slices/)
- [x] Ownership audit with one slice and area responsibility per student: [ai-use-and-code-ownership-audit.md#3-individual-slice-and-stewardship-check](ai-use-and-code-ownership-audit.md#3-individual-slice-and-stewardship-check)
- [x] Expected and actual result from the code check: [weekly-report.md#5-cross-area-independent-peer-checks](weekly-report.md#5-cross-area-independent-peer-checks)
- [x] Shared Weekly Report with every student's own contribution/evidence row: [weekly-report.md#4-individual-contribution-entries--one-row-per-enrolled-student](weekly-report.md#4-individual-contribution-entries--one-row-per-enrolled-student)
- [x] Individual Evidence Receipts: [`receipts/`](receipts/)

---

## Optional Stretch Checks Completed

- [x] **Edge Case Verification:** Tested payment gateway cancellation and verified that cart items and address inputs are restored without loss.
- [x] **Non-Author Review:** Teammate outside the area independently reproduced the test and clean setup without author coaching.
- [x] **Clean Handoff Documentation:** Authored explicit handoff notes in `evidence/` enabling fresh clone reproduction.

---

## Final Check

- [x] Every student can explain one linked slice, name a codebase area they help steward, and show a check or a clearly owned follow-up.
- [x] Another teammate can locate the area and its current check; no one is treated as its sole gatekeeper.
- [x] AI use and outside sources are recorded accurately; no secrets or unapproved real-user data are included.
- [x] The Week 11 status is supported by evidence, not only by a claim.
