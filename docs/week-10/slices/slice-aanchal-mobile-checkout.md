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

> **Exact Test Environment:** Chrome 130 DevTools mobile emulation; tested across: (1) 360x800 (Samsung Galaxy S8 compact Android), (2) 390x844 (iPhone 14 / mobile Safari), and (3) 412x915 (Pixel 7).  
> **Failure-Path Validation:** Submitting an invalid 8-digit phone number (`98412345`) or unsupported prefix halts form submission before POST.  
> **Expected result:** Submission halted; renders inline accessible error alert *"Please enter a valid 10-digit Nepali mobile number starting with 98 or 97"*; submit button disabled (`cursor-not-allowed`); touch targets $\ge 48\text{px}$.  
> **Actual result:** Submission correctly blocked with red alert text; all buttons measured $\ge 52\text{px}$ touch height (`py-3 px-6`). Valid 10-digit input (`9841234567`) cleanly submits.  
> **Demo Promise Alignment:** Confirmed frozen checkout path strictly executes direct one-time retail purchases (`Storefront -> Cart -> Checkout -> Khalti Sandbox / COD -> Confirmation`), matching final demo promise with zero subscription dependencies.  
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
