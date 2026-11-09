# Individual Evidence Receipt — Week 10

**Student:** Aanchal Chand Thakuri ([`@jaasly07`](https://github.com/jaasly07))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 10 (Sprint 2: MVP and Freeze)  
**Date:** Monday, November 9, 2026 (Submitted for Wednesday, November 11, 2026 EOD KST Deadline)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Refactored the single-screen checkout form in [`frontend/src/components/storefront/CheckoutForm.tsx`](../../../frontend/src/components/storefront/CheckoutForm.tsx) with localized Nepal 7 Provinces dropdown and 10-digit mobile number regex validation.
- **Roadmap slice / behavior (if relevant):** Localized Nepali Mobile Checkout Slice.
- **Area I helped steward or hand off (if relevant):** Area 3: Storefront UI/UX, Mobile & Accessibility (Backup: Kushan Sunuwar).
- **Evidence link:** [Commit `7a72592`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7a72592) · [Slice Note](../slices/slice-aanchal-mobile-checkout.md) · [Handoff Document](../evidence/aanchal-storefront-a11y-handoff.md).
- **How I checked it:** 
  - *Exact Test Environment:* Chrome 130 DevTools mobile device emulation across: (1) 360x800 (Samsung Galaxy S8 compact Android), (2) 390x844 (iPhone 14 / mobile Safari), and (3) 412x915 (Pixel 7).
  - *Failure-Path Result:* Submitting with an invalid 8-digit phone (`98412345`) or invalid prefix halts submission before POST; renders inline accessible error *"Please enter a valid 10-digit Nepali mobile number starting with 98 or 97"*; submit button disabled (`cursor-not-allowed`). Verified all 7 provinces render cleanly in dropdown.
  - *Demo Promise Alignment:* Confirmed frozen checkout path strictly executes direct one-time purchases (`Storefront -> Cart -> Checkout -> Khalti Sandbox / COD -> Confirmation`), matching final demo promise with zero subscription dependencies.
- **What I learned or changed:** Standardizing address fields to Nepal's administrative divisions prevents incorrect deliveries for craft merchants and speeds up checkout completion. Explicit failure-path handling prevents invalid payloads from ever reaching backend APIs.

---

## Receipt 2

- **What I did:** Audited mobile ergonomics and WCAG 2.1 AA accessibility across 360px (Android) and 390px (iOS) viewports, enforcing minimum 52px touch targets (`py-3 px-6`) and $>4.5:1$ color contrast ratios.
- **Roadmap slice / behavior (if relevant):** Mobile Accessibility & Ergonomics.
- **Area I helped steward or hand off (if relevant):** Area 3: Storefront UI/UX, Mobile & Accessibility.
- **Evidence link:** [Commit `c1b48b1`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/c1b48b1) · [A11y Audit Matrix](../evidence/aanchal-storefront-a11y-handoff.md#mobile-ergonomics--wcag-audit).
- **How I checked it:** Inspected DOM elements in Chrome DevTools mobile simulator; verified button bounding rects are $\ge 52\text{px}$ in height and contrast tools report $>4.5:1$ against background.
- **What I learned or changed:** Small screen viewports easily break when using desktop-proportioned padding. Explicit minimum touch target dimensions ensure touch accuracy on mobile devices.

---

## Receipt 3, optional

- **What I did:** Independently tested Rohit's merchant order lifecycle state machine on the merchant dashboard.
- **Roadmap slice / behavior (if relevant):** Non-author verification of Area 4 (DevOps, Health & State Machine).
- **Area I helped steward or hand off (if relevant):** Cross-area verification with Area 4.
- **Evidence link:** [Weekly Report Peer Check Note](../weekly-report.md#5-cross-area-independent-peer-checks) · [Rohit Handoff](../evidence/rohit-resilience-health-handoff.md).
- **How I checked it:** Tested status transitions on `/merchant/craftnepal/orders`; verified that transitioning from `DELIVERED` back to `PENDING` is rejected by backend with HTTP 400.
- **What I learned or changed:** Validating state machine constraints on both client and server prevents inconsistent merchant records.
