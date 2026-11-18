# Individual Evidence Receipt — Week 11

**Student:** Aanchal Chand Thakuri ([`@jaasly07`](https://github.com/jaasly07))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Updated November 18, 2026 on frozen `main` commit `8098426`)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Audited and verified responsive single-screen checkout with localized Nepal 7 Provinces dropdown and 10-digit mobile number validation, and resolved the live `StorefrontHeader` *"Sign in to your account"* `MouseEvent.trim` crash ([Issue #56 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) / `aa62b2f` merged via [`PR #57`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)).
- **Roadmap slice / behavior (if relevant):** Localized Nepali Mobile Checkout & Storefront Account Drawer Auth (`AccountContext.tsx`, `email-validation.ts`).
- **Area I helped steward or hand off (if relevant):** Area 3: Storefront UI/UX, Mobile & Accessibility (Backup: Kushan Sunuwar).
- **Evidence link:** [Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) · [Issue #56 (Closed)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56) · [PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57) · [Tested-By Note](../tested-by-note.md) · [`w11-04` mobile screenshot](../evidence/screenshots/w11-04-mobile-390-checkout-phone-rejection.png) · [`w11-07` fixed sign-in](../evidence/screenshots/w11-07-issue-56-storefront-signin-fixed-live.png).
- **How I checked it:** 
  - *Frozen Build & Exact Test Environment:* Verified on frozen `main` (`8098426`) / live `https://shopcraft.me` across DevTools mobile device emulation (`360x800`, `390x844`, `412x915`) and live Nov 18 browser runs (`1440x900` & `390x844`).
  - *Issue #56 Before/After Recovery:* Live click test on `/s/brewmellow` initially hit `TypeError: I.trim is not a function` (`w11-06` diagnostic screenshot); guarded `openAccount` with `normalizePrefillEmail` (`aa62b2f` / PR #57), added Vitest regression checks, and verified live post-deploy (`w11-07`, `0` crash errors).
  - *Boundary / Negative Note:* DevTools mobile emulation verifies responsive layout and client validation, **not** physical hardware iOS Safari keyboard behavior (scheduled for Sprint 3 Week 13 hardware QA in [Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52)).
  - *Failure-Path Result:* Submitting with an invalid 8-digit phone (`98412345`) or unsupported prefix halts submission before POST; renders inline accessible error *"Please enter a valid 10-digit Nepali mobile number starting with 98 or 97"*; submit button disabled (`cursor-not-allowed`). All 7 provinces render cleanly in dropdown.
  - *Demo Promise Alignment:* Confirmed frozen checkout path strictly executes direct one-time retail purchases (`Storefront -> Cart -> Checkout -> Khalti Sandbox / COD -> Confirmation`), matching final demo promise with zero subscription dependencies.
- **What I learned or changed:** Standardizing address fields to Nepal's administrative divisions prevents incorrect deliveries for craft merchants and speeds up checkout completion. Explicit failure-path handling prevents invalid payloads from reaching backend APIs.

---

## Receipt 2

- **What I did:** Audited mobile ergonomics and WCAG 2.1 AA accessibility across 360px (Android) and 390px (iOS) viewports, enforcing minimum 52px touch targets (`py-3 px-6`) and $>4.5:1$ color contrast ratios.
- **Roadmap slice / behavior (if relevant):** Mobile Accessibility & Ergonomics.
- **Area I helped steward or hand off (if relevant):** Area 3: Storefront UI/UX, Mobile & Accessibility.
- **Evidence link:** [w11-frontend-checks.txt](../evidence/w11-frontend-checks.txt) · [Commit `c1b48b1`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/c1b48b1) · [Surface Isolation Script](../../../frontend/scripts/check-surfaces.mjs).
- **How I checked it:** Ran `npm test && npm run typecheck && npm run check:surfaces` confirming `73/73` Vitest unit tests (`storefront-placeholders.test.ts` `18/18`, `email-validation.test.ts` `10/10`), `0` TypeScript errors, and `SURFACE_ISOLATION_OK`; verified live responsive mobile checkout & phone rejection (`w11-04`, `390x844`) and live Issue `#56` Account drawer fix (`w11-07`). Negative boundary (`Chrome emulation vs. physical iOS Safari`) noted in [`tested-by-note.md`](../tested-by-note.md).
- **What I learned or changed:** Small screen viewports easily break when using desktop-proportioned padding. Explicit minimum touch target dimensions ensure touch accuracy on mobile devices.

---

## Receipt 3, optional

- **What I did:** Independently tested Rohit's merchant order lifecycle state machine on the merchant dashboard.
- **Roadmap slice / behavior (if relevant):** Non-author verification of Area 4 (DevOps, Health & State Machine).
- **Area I helped steward or hand off (if relevant):** Cross-area verification with Area 4.
- **Evidence link:** [Weekly Report Peer Check Note](../weekly-report.md#5-cross-area-independent-peer-checks) · [Rohit Handoff](../../week-10/evidence/rohit-resilience-health-handoff.md).
- **How I checked it:** Tested status transitions on `/merchant/brewmellow/orders`; verified that transitioning from `DELIVERED` back to `PENDING` is rejected by backend with HTTP 400.
- **What I learned or changed:** Validating state machine constraints on both client and server prevents inconsistent merchant records.
