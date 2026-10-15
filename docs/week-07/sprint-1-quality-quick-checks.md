# Sprint 1 Quality Quick Checks — Vertical Slice

**Team:** Team 2 — BrewMellow  
**Week:** 7 (End of Sprint 1 Checkpoint)  
**Date:** October 15, 2026  
**Auditor:** Team 2 (`notyouradhee`, `Kushan2191`, `jaasly07`, `Rohit-coder201`)

---

## Sprint 1 - Vertical Slice (Week 7) — Quality Gate

- [x] **One small end-to-end user path works or its blocker is clearly documented.**  
  *Evidence:* The path from Home $\rightarrow$ `/origins` (browse 3 Nepali coffee cards) $\rightarrow$ `/checkout?origin=1` (dynamic pricing & customer input) $\rightarrow$ simulated payment confirmation works end-to-end both on local machines (`localhost:3000`) and in production on Vercel ([https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)).

- [x] **The path has a screenshot, demo, or test note.**  
  *Evidence:* Supported by desktop screenshots ([origins-selection.png](../week-06/evidence/origins-selection.png), [checkout-flow.png](../week-06/evidence/checkout-flow.png)), mobile screenshot ([origins-mobile.png](../week-06/evidence/origins-mobile.png)), non-author test note ([tested-by-note.md](../week-06/tested-by-note.md)), and PR review record ([PR #44](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/44)).

- [x] **The team can explain what happens when the main path cannot complete.**  
  *Evidence:*
  1. *Empty Cart State:* Direct navigation to `/checkout` without an origin query parameter renders a defensive empty-cart card with a "Build Your Plan" CTA ([checkout-empty-state.png](../week-06/evidence/checkout-empty-state.png)).
  2. *Backend Outage:* When the Django API is unavailable, the frontend catches the network exception, alerts the user, and does not crash ([api-smoke-test-record.md](../week-06/api-smoke-test-record.md)).
  3. *Validation Failures:* Blank required inputs (Name, Email, Address, Password) trigger clear inline validation errors before payment is initiated.

- [x] **The README or setup note tells another person how to view or run the current work.**  
  *Evidence:* The project [README.md](../../README.md) contains clean, verified setup instructions for cloning the repository, creating virtual environments, installing dependencies, starting both servers, and running repeatable curl smoke tests.

- [x] **The team has checked that no secrets or private data are in its shared evidence.**  
  *Evidence:* Git history and committed files have been audited. `.env` and `.env.local` files are ignored in `.gitignore`. All test customer accounts use synthetic mock data (e.g. `Aarav Sharma`, `aarav.sharma@gmail.com`, `+977 9801234567`). No real customer or payment secrets exist in the repository.
