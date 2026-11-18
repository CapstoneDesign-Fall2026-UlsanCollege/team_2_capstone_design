# Sprint Quality Quick Checks — ShopCraft

**Team:** Team 2 — ShopCraft (Multi-Tenant SaaS for Nepal's Craft Economy)  
**Evaluation Gate:** Sprint 2 Exit Gate (Week 11 — MVP Verification and Scope Freeze)  
**Date:** November 12, 2026  

These are quick evidence checks across project milestones to ensure engineering integrity, scope compliance, and verified user journeys ahead of the final demonstration.

---

## Sprint 0 — Launch and Scope (Week 3)

- [x] **Every member can access the repository and board:** All 4 members (`@notyouradhee`, `@Kushan2191`, `@jaasly07`, `@Rohit-coder201`) have write permissions on GitHub.
- [x] **Meaningful work has an Issue, owner, and Definition of Done:** GitHub Issues track each delivery slice with explicit checkable completion criteria.
- [x] **The project purpose, target user, and scope boundary are visible:** Documented in [`README.md`](../../README.md) and [`.planning/PROJECT.md`](../../.planning/PROJECT.md).
- [x] **The team agreement is linked and current:** Documented in [`docs/week-01/team-working-agreement.md`](../week-01/team-working-agreement.md) with stewardship mappings.
- [x] **No personal data, secrets, or unapproved real-user data has been posted:** Khalti secret keys are encrypted with Fernet AES-256 and stored in `.env`; git commit history scanned clean.

---

## Sprint 1 — Vertical Slice (Week 7)

- [x] **One small end-to-end user path works or its blocker is clearly documented:** BrewMellow flagship roaster vertical slice verified during midterm review.
- [x] **The path has a screenshot, demo, or test note:** Midterm presentation slides and runtime test logs preserved in [`docs/week-07/presentation-slides.md`](../week-07/presentation-slides.md).
- [x] **The team can explain what happens when the main path cannot complete:** Empty cart redirects and missing product slugs return clear 404 views.
- [x] **The README or setup note tells another person how to view or run the current work:** Documented in `README.md` Clean-Clone Development & Verification Runbook.
- [x] **The team has checked that no secrets or private data are in its shared evidence:** Verified clean.

---

## Sprint 2 — MVP and Freeze (Week 11 — Current Gate)

- [x] **The MVP happy path has been tested and recorded:**
  * **Verified Path:** Storefront Discovery (`/s/brewmellow`) $\rightarrow$ Cart Drawer $\rightarrow$ Single-Screen Localized Checkout $\rightarrow$ Khalti Sandbox ePayment v2 (with server `epayment/lookup/`) OR Cash on Delivery (COD) fallback $\rightarrow$ Confirmation Invoice $\rightarrow$ Merchant Fulfillment Console (`/merchant/brewmellow/orders`) $\rightarrow$ PostgreSQL Row-Level Security (RLS) Cross-Tenant Isolation (HTTP 404 guard).
  * **Evidence:** Documented in [`mvp-verification-checklist.md`](mvp-verification-checklist.md) and [`weekly-report.md`](weekly-report.md).
- [x] **Known bugs are labeled by severity and have an owner or plan:**
  * Documented in [`issue-priority-guide.md`](issue-priority-guide.md) and tracked in real GitHub Issues ([`#49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)–[`#53`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53), [`#31`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31), [`#36`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/36)) with strict separation between bug severity and work priority (`P0–P3`).
- [x] **New features are frozen or explicitly justified against the MVP contract:**
  * **Scope Freeze Locked:** Zero new feature scope will be added for Sprint 3 ([`Issue #49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)).
  * **Scope Cut Reconciled:** Shopper recurring subscriptions and merchant subscription workspaces were formally cut in PR #45 (legacy Issues [`#33`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/33) and [`#34`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/34) closed); all purchases operate as direct one-time retail checkout with Khalti Sandbox v2 and COD fallback.
- [x] **The project has basic input/error handling or a documented limitation:**
  * Phone validation rejects invalid 8-digit numbers (`98412345`) with inline alert before POST.
  * Gateway cancellation on Khalti portal cleanly preserves cart items and address inputs in session storage (`khalti-return.test.ts`).
  * Illegal order transitions (`DELIVERED → PENDING`) return `HTTP 400 Bad Request`.
  * Simulated database connection loss returns graceful `HTTP 503 Service Unavailable`.
  * Negative check boundaries (what local SQLite/mocked tests do *not* establish) explicitly recorded in [`tested-by-note.md`](tested-by-note.md).
- [x] **AI-assisted or outside material is reviewed, explainable, and attributed where relevant:**
  * Documented in [`docs/week-10/ai-use-and-code-ownership-audit.md`](../week-10/ai-use-and-code-ownership-audit.md) and individual PR with AI Use notes in [`docs/week-10/slices/`](../week-10/slices/).
- [x] **Area boundaries, checks, and support/backup paths are linked in the ownership audit; a teammate outside a relevant area reproduces a key check:**
  * 4 Codebase Areas mapped with primary stewards and designated backups.
  * 4 cross-area independent non-author peer checks executed and documented in [`tested-by-note.md`](tested-by-note.md) alongside fresh logs [`w11-backend-tests.txt`](evidence/w11-backend-tests.txt) (`154` backend tests), [`w11-frontend-checks.txt`](evidence/w11-frontend-checks.txt) (`73/73` Vitest, `0` TS errors, `0` scoped ESLint errors, `SURFACE_ISOLATION_OK`), and [`w11-verification-checks.json`](evidence/w11-verification-checks.json) on frozen `8098426`.

---

## Sprint 3 — QA and Handoff (Week 14 — Target Schedule)

- [ ] Main demo path, error/empty state, and key links or buttons have been checked.
- [ ] Keyboard access, visible labels, and readable contrast have received a basic review.
- [ ] Setup and handoff instructions work for someone outside the team.
- [ ] The project has safe demo data and no secrets or private data in shared evidence.
- [ ] Demo fallback and remaining blocker plan are documented.
- [ ] Area boundaries and cross-area handoffs are reflected in the shared map; a new reader can find checks without the steward.

---

## Sprint 4 — Final Readiness (Week 15 — Target Schedule)

- [ ] The final demo has been rehearsed with its fallback plan.
- [ ] Presentation and demo roles are assigned.
- [ ] Final evidence, contribution receipts, setup guide, and handoff links are easy to find.
- [ ] Blocker and major-bug status is honest and current.
- [ ] The Final Readiness Report names any remaining action and owner.
- [ ] A backup can locate the critical area checks and follow the final handoff path if the usual steward is unavailable.
