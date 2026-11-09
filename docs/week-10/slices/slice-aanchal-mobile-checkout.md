# PR with AI Use Note — Localized Nepali Mobile Checkout & Accessibility Slice

**Author / Owner:** Aanchal Chand Thakuri ([`@jaasly07`](https://github.com/jaasly07))  
**Stewardship Area:** Area 3: Storefront UI/UX, Mobile & Accessibility  
**Backup Steward:** Kushan Sunuwar ([`@Kushan2191`](https://github.com/Kushan2191))  
**Date:** Monday, November 9, 2026 (Week 10)  
**Related Pull Request / Commit:** [Commit `7a72592`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7a72592) · [Commit `c1b48b1`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/c1b48b1)  
**Related Issue:** Issue #50 (Mobile Storefront Ergonomics & WCAG AA Compliance)

---

## 1. What Changed?

- Refactored [`frontend/src/components/storefront/CheckoutForm.tsx`](../../../frontend/src/components/storefront/CheckoutForm.tsx) for compact, responsive single-screen checkout.
- Added localized Nepal 7 Provinces dropdown selector (Koshi, Madhesh, Bagmati, Gandaki, Lumbini, Karnali, Sudurpashchim).
- Added strict 10-digit mobile number regex validation (`^(98|97)[0-9]{8}$`) tailored to Nepal telecom operators (NTC, Ncell).
- Enforced mobile-first ergonomics across 360px (compact Android) and 390px (iOS) viewports with minimum 52px touch targets (`py-3 px-6`).
- Audited and verified WCAG 2.1 AA color contrast compliance ($>4.5:1$) across all checkout form elements and error badges.

---

## 2. Why Did We Change It?

- Over 75% of e-commerce traffic in South Asia originates from mobile devices. Standard desktop input forms caused horizontal scrolling and difficult touch interactions on small screens.
- Generic international address fields (e.g. "State/ZIP Code") confuse local Nepali shoppers; replacing them with familiar Provinces and 10-digit phone verification streamlines purchase completion.
- To meet accessibility standards ensuring readability for visually impaired users.

---

## 3. How Did We Check It?

> We checked this using Chrome DevTools device mode at 360px and 390px widths, testing invalid input validation and touch target spacing.  
> **Expected result:** Submitting a 9-digit phone number halts submission with an inline accessible alert; buttons are easily clickable with thumb touch ($>48\text{px}$).  
> **Actual result:** Submission was correctly blocked with message *"Please enter a valid 10-digit Nepali mobile number"*; all buttons measured $\ge 52\text{px}$ touch height.  
> **Non-Author Peer Check:** Rohit Chhantyal verified the form on a 360px simulated mobile screen ([Evidence Receipt](../../week-10/evidence/rohit-resilience-health-handoff.md)).

---

## 4. AI Use Note

Choose one:
- [x] No AI was used for this change.
- [ ] AI helped with planning or explanation only.
- [ ] AI helped generate or edit code/text.

### Details:
- **What AI helped with:** N/A — Authored directly by Aanchal Chand Thakuri.
- **What the team reviewed:** Reviewed CSS layout classes to ensure no fixed pixel widths break responsive wrapping on narrow mobile displays.
- **What the team changed after review:** Added `z-50` sticky bottom action bar so mobile keyboards do not obscure the "Place Order" button.
- **Who can explain this change:** Aanchal Chand Thakuri (Author) and Kushan Sunuwar (Backup Steward).

---

## 5. Outside-Material Attribution

- **Source / creator:** Government of Nepal Administrative Boundaries (7 Provinces classification)
- **Link:** [https://nepal.gov.np](https://nepal.gov.np)
- **License or permission:** Public domain administrative division data
- **What we changed or how we used it:** Encoded the 7 provinces as a TypeScript enum for form validation dropdowns.

---

## 6. Evidence Links

- **Issue:** Issue #50 (Storefront Mobile Accessibility & Localized Fields)
- **Commits:** [`7a72592`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7a72592), [`c1b48b1`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/c1b48b1)
- **Visual Evidence & Test Log:** Documented in [`docs/week-10/evidence/aanchal-storefront-a11y-handoff.md`](../evidence/aanchal-storefront-a11y-handoff.md)
