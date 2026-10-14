# Follow-Up Problems & Edge-Case Bug Log

**Team:** Team 2 — BrewMellow  
**Date:** October 14, 2026  
**Auditor:** Team 2 Engineering Core  
**Related Issue:** [#43 Feature: Coffee Origin Selection Page](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/43)

This document honestly logs every bug, collision, and edge-case failure discovered during our Week 6 testing sprint, the first failing step, how it was diagnosed, and the verified resolution.

---

## Problem 1: Sticky Checkout Bar Overlapping Mobile Navigation

- **Discovered by:** `jaasly07` (Aanchal)
- **Viewport:** 390 x 844 px (Mobile Portrait)
- **First Failing Step:** Navigating to `/checkout` on mobile and scrolling to the bottom of the delivery form.
- **Symptom:** The fixed bottom checkout button ("Complete Subscription Order") was visually obscured by the mobile browser navigation bar and the PWA bottom tab navigation. Form fields underneath were unclickable.
- **Root Cause:** Missing viewport safe-area padding at the bottom of the container.
- **Resolution:** Added `pb-28` safe-area bottom padding to the checkout main wrapper and adjusted z-index hierarchy.
- **Commit Fix:** [Commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72) (*"fix(ui): resolve overlapping fixed bottom bars and scroll padding on mobile screens"*)
- **Retest Status:** **PASSED** (Proof: [`evidence/origins-mobile.png`](evidence/origins-mobile.png))

---

## Problem 2: Direct Checkout Navigation Causing Undefined Calculation

- **Discovered by:** `Kushan2191` (Kushan)
- **First Failing Step:** Directly visiting `http://localhost:3000/checkout` in an incognito window without visiting `/origins` or `/subscribe` first.
- **Symptom:** The checkout page attempted to read `searchParams.get("origin")` and `searchParams.get("price")`. Without these parameters, the summary card displayed `Rs. NaN` and the UI threw a hydration warning.
- **Root Cause:** Lack of defensive fallback logic for missing query parameters.
- **Resolution:** Implemented an explicit `hasSelection` guard. If no coffee origin or subscription plan is selected, the page renders a clean empty-cart notice (*"Your Cart is Empty — It looks like you haven't built your coffee subscription plan yet."*) with a direct button back to plan builder.
- **Commit Fix:** [Commit f69700e](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f69700e) (*"fix(checkout): add empty cart state if user navigates directly without selecting a plan"*)
- **Retest Status:** **PASSED** (Proof: [`evidence/checkout-empty-state.png`](evidence/checkout-empty-state.png))

---

## Problem 3: Client-Side Hydration Lag in Automated Snapshots

- **Discovered by:** `notyouradhee` (Aditya)
- **First Failing Step:** Running headless Chrome against `/checkout` and `/dashboard`.
- **Symptom:** The captured screenshots showed a white screen with a centered loading spinner instead of the form or customer portal tabs.
- **Root Cause:** Next.js 16 requires `<Suspense>` wrappers around components using `useSearchParams()`. Headless Chrome's default timing captured the initial SSR suspense fallback before client-side hydration finished.
- **Resolution:** Upgraded the capture harness to use `puppeteer-core`, explicitly waiting for `networkidle0` and using `waitForFunction(() => !document.querySelector('.animate-spin'))` before triggering viewport screenshots.
- **Retest Status:** **PASSED** (All 6 screenshots in `evidence/` are fully hydrated with visible UI and form inputs).

---

## Problem 4: Backend API Outage During Order Submission

- **Discovered by:** `Rohit-coder201` (Rohit)
- **First Failing Step:** Submitting an order on `/checkout` while the Django backend process was intentionally terminated.
- **Symptom:** Browser console showed `ERR_CONNECTION_REFUSED`; previous versions would hang indefinitely in a loading state.
- **Root Cause:** Fetch promise lacked a localized timeout and graceful fallback handler.
- **Resolution:** Implemented localized error boundary with a user-facing status badge: *"Order server unreachable. Offline fallback active."* and an enabled "Retry Order" button that preserves all filled customer information without requiring a page refresh.
- **Commit Fix:** [Commit 5d61dd6](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/5d61dd6) (*"feat: add loading and error states for API unavailability"*)
- **Retest Status:** **PASSED** (Documented in [`api-smoke-test-record.md`](api-smoke-test-record.md)).
