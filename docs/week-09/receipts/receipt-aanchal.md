# Week 9 Contribution Receipt — Aanchal Chand Thakuri

**Student:** Aanchal Chand Thakuri  
**GitHub Login:** `@jaasly07`  
**Role:** Storefront UI/UX, Mobile Viewport Ergonomics & Accessibility Lead  
**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Submission Date:** Wednesday, November 4, 2026

---

## 1. Look Back: Course & Project Reflection

- **01 • LESSON (What did we learn?):**  
  Mobile usability cannot be assumed from responsive desktop resizing. On physical touch devices (e.g., 360px–390px widths), software keyboards obscure submit buttons, and small touch targets lead to checkout abandonment.
- **02 • SOURCE (What event or proof supports it?):**  
  Usability audit of earlier checkout prototype showing that mobile keyboards obscured the Khalti payment CTA, and form labels lacked explicit field bindings.
- **03 • ROUTE (What might we change?):**  
  Redesigned the single-screen checkout and product detail sheets across ShopCraft storefronts with sticky bottom action bars, minimum 52px touch targets (`py-3 px-6`), and explicit field labels adhering to WCAG 2.1 AA accessibility.
- **04 • QUESTION (What do we need to decide?):**  
  How do we present order summary details on compact mobile screens without forcing the user to scroll through dozens of items before reaching the payment button?  
  *Decision:* Implemented an expandable accordion bottom sheet for order totals with sticky bottom confirmation bar.

---

## 2. Concrete UI & Accessibility Contributions

| Component / Task | Implementation Detail | Status |
|---|---|---|
| **Single-Screen Checkout Layout** | Structured delivery address form, payment method toggles (Khalti / COD), and server-authoritative totals into a single fluid view. | **PASS** |
| **Mobile Touch Targets (48px+)** | Enforced minimum 52px clickable height on all buttons (`Cart Drawer checkout button`, `Payment selector tabs`, `Submit button`). | **PASS** |
| **WCAG 2.1 AA Contrast Review** | Verified text contrast across dark roast labels, amber accents (`#B45309`), and neutral dark text (`#1C1917`) against light backgrounds exceeding $4.5:1$ ratio. | **PASS** |
| **Form Accessibility & ARIA** | Added explicit `htmlFor`, `id`, `aria-required`, and autocomplete attributes (`tel`, `address-line1`, `address-level2`) to all checkout inputs. | **PASS** |

---

## 3. Responsive Viewport Audit Matrix

| Viewport Tested | Device Simulation | Tested Behavior | Result |
|---|---|---|---|
| **360 x 800 px** | Samsung Galaxy S21 / Android | Single-screen checkout layout, payment toggles, touch targets | **PASS** |
| **390 x 844 px** | Apple iPhone 13/14 / iOS Safari | Bottom navigation, sticky checkout action bar, modal overlay | **PASS** |
| **768 x 1024 px** | Apple iPad / Tablet | 2-column split checkout (Address form left, Order Summary right) | **PASS** |
| **1440 x 900 px** | Desktop Chrome | Full storefront hero, product grid, and merchant console | **PASS** |

---

## 4. Boundaries & Week 10 Priorities
- Storefront catalog currently displays BrewMellow's 3 Himalayan micro-lots (Gulmi, Ilam, Nuwakot) on `/s/brewmellow` and Pahadi Honey on `/s/pahadi-honey`.
- For Week 10, I will audit the merchant console UI for tablet viewports and assist in code ownership documentation.
