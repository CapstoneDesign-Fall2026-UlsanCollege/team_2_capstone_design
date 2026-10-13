# Accessibility & Mobile Responsiveness Test Record

**Course:** Capstone Design  
**Week:** 6 — Test the Vertical Slice  
**Date:** October 11, 2026 (Updated & Verified October 13, 2026)  
**Tester:** `jaasly07` (Aanchal)  
**Related Components:** `/origins`, `/checkout`, Global Navigation & Bottom Tab Bar

---

## 1. Goal

Verify that the BrewMellow vertical slice performs cleanly on mobile viewports (specifically modern smartphones with viewport width 390px, e.g., iPhone 13/14/15) with accessible color contrast, touch target sizes, and no horizontal scroll overflow.

---

## 2. Test Environment & Viewport Specifications

- **Device Profiles Tested:**
  - Viewport: `390 x 844 px` (Mobile Portrait)
  - Desktop Viewport: `1280 x 800 px`
- **Browser:** Chromium / Headless Chrome DevTools Mobile Emulation
- **A11y Standard Reference:** WCAG 2.1 AA Standards (minimum 4.5:1 text contrast, 44x44px touch targets)

---

## 3. Test Cases & Results

### Test Case 1: `/origins` Mobile Card Stacking & Horizontal Overflow

- **Steps:**
  1. Load `http://localhost:3000/origins` at viewport `390 x 844 px`.
  2. Inspect whether the 3-column grid collapses into a single-column stacked layout.
  3. Verify that `document.documentElement.scrollWidth <= window.innerWidth` (no accidental horizontal scrollbar).
  4. Test tap targets for the "Select Origin" CTA buttons.
- **Expected Result:**
  - Origin cards stack vertically with clean margins.
  - No horizontal overflow.
  - Buttons are at least 48px height for thumb tap ergonomics.
- **Actual Result:**
  - Grid successfully adapted to `grid-cols-1` on screens `< 768px`.
  - Horizontal scrollbar was completely absent.
  - Buttons rendered with `py-3 px-6` providing a 52px touch target height.
- **Proof:** [origins-mobile.png](evidence/origins-mobile.png)

---

### Test Case 2: Checkout Bottom Bar Collision & Padding Fix (Stretch)

- **Problem Identified:**
  - During early testing, the sticky bottom bar on `/checkout` overlapped the "Confirm Order" button when mobile navigation bars were present.
- **Fix Implemented:**
  - Added bottom padding `pb-28` to the checkout wrapper and safe-area margin classes in [commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72) (*"fix(ui): resolve overlapping fixed bottom bars and scroll padding on mobile screens"*).
- **Retest Result:**
  - Tested on `390 x 844 px`. Content scrolls cleanly with all form inputs, payment radios, and submit buttons accessible without obstruction.

---

### Test Case 3: Contrast & Aria Labels

- **Check Steps:**
  - Verify all icon buttons (cart, menu toggle, filter tags) include `aria-label` attributes for screen readers.
  - Verify gold/amber accents on dark backgrounds maintain readable contrast.
- **Actual Result:**
  - Added explicit aria-labels and increased contrast in commit [4103af2](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/4103af2) and commit [b0d0c3d](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b0d0c3d).

---

## 4. Scope Boundary

- **What this proves:** Confirms that the customer-facing vertical slice is mobile-responsive and thumb-friendly on typical mobile screens.
- **What this does NOT prove:** Does not test old legacy mobile browsers (e.g. iOS 12 Safari) or landscape tablet orientation.
