# Frontend Accessibility Check (Checkout Flow)

**Tester:** Aanchal (@jaasly07)
**Date:** 2026-10-05

As a stretch goal for Week 5, I ran an accessibility and responsive layout check on the newly styled checkout flow (`/checkout`).

## 1. Color Contrast
- Checked the contrast between our new boutique text color (`#1A1512`) and the background cream (`#F5F2EB`).
- **Result:** Contrast ratio is 14.8:1, which easily passes WCAG AAA standards for normal and large text.

## 2. Keyboard Navigation
- Tested the ability to select the Coffee Origin, Weight, and Delivery Plan entirely using the `Tab` and `Space` keys.
- **Result:** The hidden radio inputs are properly linked to the labels, meaning users can tab through the options. However, visible focus outlines on the labels were slightly hard to see.
- **Next Action:** Add a `focus-within:ring` tailwind class in Week 6 to make keyboard selection more obvious.

## 3. Mobile Responsiveness
- Checked the UI using Chrome DevTools on the iPhone 14 Pro viewport.
- **Result:** The main grid successfully collapses from `md:grid-cols-2` into a single column. The bottom action bar remains fixed `bottom-0` so the checkout button is always accessible on mobile.
