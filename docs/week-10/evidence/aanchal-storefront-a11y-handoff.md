# Week 10 Code Ownership Handoff — Aanchal Chand Thakuri

**Student:** Aanchal Chand Thakuri  
**GitHub Login:** `@jaasly07`  
**Role:** Storefront UI/UX, Mobile Viewport Ergonomics & Accessibility Lead  
**Primary Stewarded Area:** **Area 3: Storefront UI/UX, Mobile & Accessibility**  
**Repository Boundary:** `frontend/src/app/s/[storeSlug]/`, `frontend/src/components/storefront/`, `frontend/src/components/ui/`  
**Learning Partner / Backup:** Kushan Sunuwar (`@Kushan2191`)  
**Submission Date:** Monday, November 9, 2026 (For Week 10 Review)

---

## 1. Roadmap Slice Explanation & Behavior

### Slice Name
**Responsive Single-Screen Checkout with Localized Nepali Address Validation & Mobile Ergonomics**

### Repository Location
- [`frontend/src/components/storefront/CheckoutForm.tsx`](../../../frontend/src/components/storefront/CheckoutForm.tsx) — Main checkout form component
- [`frontend/src/components/storefront/CartDrawer.tsx`](../../../frontend/src/components/storefront/CartDrawer.tsx) — Store-scoped sliding cart drawer
- [`frontend/src/components/ui/sheet.tsx`](../../../frontend/src/components/ui/sheet.tsx) — Mobile order summary bottom sheet

### Purpose & Plain Language Behavior
E-commerce conversion rates on mobile devices drop significantly when multi-step checkout forms force users through multiple loading screens or when inputs are poorly formatted for local addresses. My slice delivers a unified, single-screen checkout optimized for physical mobile devices:
1. **Localized Nepali Addressing:** Replaces generic international address fields with a dropdown for Nepal's 7 Provinces (Bagmati, Gandaki, Koshi, Lumbini, Madhesh, Karnali, Sudurpashchim), City/District inputs, and a strict 10-digit mobile number validator (`/^9[78]\d{8}$/`).
2. **Mobile Ergonomics (48px+ Touch Targets):** All payment selectors and submit buttons have a minimum clickable height of 52px (`py-3 px-6`), preventing mis-taps.
3. **Accessibility (WCAG 2.1 AA):** All form labels include explicit `htmlFor` and `id` bindings; text contrast ratios exceed $4.5:1$ against both light and dark theme surfaces.

### Input, Output, and Dependencies
- **Input:** Recipient full name, 10-digit mobile number, province selection, city, street address, and payment method choice (`Khalti` or `Cash on Delivery`).
- **Output:** Validated payload dispatched to backend checkout API; client-side validation errors displayed if inputs are invalid.
- **Dependencies:** React 19, Tailwind CSS, Lucide React icons, Next.js App Router.

---

## 2. Area Stewardship & Health Check

### Repository Responsibility
As Area 3 steward, I maintain frontend UI styling consistency, accessibility standards, responsive layouts, and surface isolation. I ensure that storefront components (`/s/`) never import internal merchant console or platform administration state.

### Repeatable Health Check Command
```bash
npx tsc --noEmit && node scripts/check-surfaces.mjs
```
**Expected Result:** Zero TypeScript compilation errors and confirmation of `SURFACE_ISOLATION_OK`.  
**Actual Result:** **PASS.** TypeScript compiled with 0 errors; surface guard returned `SURFACE_ISOLATION_OK`.

---

## 3. Responsive Viewport Audit Matrix

- **Exact Test Environment:** Chrome 130 DevTools mobile emulation; tested across: (1) 360x800 (Samsung Galaxy S8/S21 compact Android), (2) 390x844 (Apple iPhone 13/14 / mobile Safari), and (3) 412x915 (Google Pixel 7).
- **Failure-Path Result:** Submitting checkout with an invalid 8-digit phone (`98412345`) or unsupported prefix halts form submission before POST; renders inline accessible error alert *"Please enter a valid 10-digit Nepali mobile number starting with 98 or 97"*; submit button remains disabled (`cursor-not-allowed`).
- **Demo Promise Alignment:** Confirmed frozen checkout path strictly executes direct one-time retail purchases (`Storefront -> Cart -> Checkout -> Khalti Sandbox / COD -> Confirmation`), matching final demo promise with zero subscription dependencies.

| Viewport Tested | Simulated Device | Behavior Tested | Result |
|---|---|---|---|
| **360 x 800 px** | Samsung Galaxy S21 / Android | Single-screen layout, touch targets, on-screen keyboard dismiss | **PASS** |
| **390 x 844 px** | Apple iPhone 13/14 / iOS Safari | Sticky bottom CTA bar, accordion summary sheet, modal overlay | **PASS** |
| **412 x 915 px** | Google Pixel 7 / Android | Fluid grid scaling, 10-digit phone regex validation | **PASS** |
| **768 x 1024 px** | Apple iPad / Tablet | 2-column split checkout (Address form left, Order Summary right) | **PASS** |
| **1440 x 900 px** | Desktop Chrome | Hero layout, responsive product grid, and merchant console | **PASS** |

---

## 4. Disclosed AI Usage & Human Refactoring
- **Tool:** GitHub Copilot.
- **Assistance:** Suggested ARIA attribute names (`aria-invalid`, `aria-describedby`) and Tailwind utility classes.
- **Human Authoring:** Manually structured form layout, authored custom CSS for sticky bottom action bars, and conducted manual contrast ratio checks using Chrome DevTools Color Picker ($>4.5:1$).

---

## 5. Non-Author Peer Check

- **Independent Peer Reviewer:** **Rohit Chhantyal** (`@Rohit-coder201`, DevOps Lead — Outside Area 3)
- **What Rohit Tested:** Tested form validation boundary on a 360px Android mobile emulator. Entered an invalid 9-digit phone (`984123456`) and left Province unselected.
- **Outcome:** **PASS.** Form halted submission with accessible inline red warning messages; submit CTA remained disabled until valid 10-digit number was entered. Keyboard did not obscure submit button.
