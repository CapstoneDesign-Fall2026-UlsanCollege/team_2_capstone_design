# Individual Evidence Receipt — Aanchal Jaiswal

**Student:** `jaasly07` (Aanchal Jaiswal)  
**Team:** Team 2 — BrewMellow  
**Week:** 6  
**Date:** October 14, 2026  

---

## Receipt 1: Mobile Viewport & Responsiveness Audit
- **What I did:** Executed mobile responsiveness audit on the vertical slice (Origins and Checkout) at 390x844px viewport. Verified card stacking, touch target sizing, and absence of horizontal overflow.
- **Evidence link:** [Commit 7b55d72](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7b55d72), [Commit 4103af2](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/4103af2), [Proof Image](../evidence/origins-mobile.png)
- **How I checked it:** Emulated iPhone 13/14 in DevTools, inspected touch target dimensions (minimum 48px height), checked `scrollWidth` vs `innerWidth`.
- **What I learned or changed:** Fixed a layout collision where the sticky checkout bottom bar was overlapping the submit button on mobile devices by adding `pb-28` safe-area padding.

---

## Receipt 2: Accessibility (A11y) & Contrast Review
- **What I did:** Conducted WCAG 2.1 contrast checks across origin badges and added descriptive `aria-label` attributes to navigation elements.
- **Evidence link:** [Commit b0d0c3d](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b0d0c3d), [Accessibility Check](../accessibility-and-mobile-check.md)
- **How I checked it:** Evaluated color ratios of amber/gold text against `#121212` container background; verified ratios exceed 4.5:1.
- **What I learned or changed:** Subtly lightening muted body text from `#71717A` to `#A1A1AA` significantly improved legibility without compromising the premium aesthetic.
