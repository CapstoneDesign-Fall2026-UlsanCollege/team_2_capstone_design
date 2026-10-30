# Phase 3 UI Specification: Storefront, Checkout & Order Queue

**Authority:** `DESIGN.md` §2 (Storefront tokens), §5 (Storefront surface), §6 (Micro-interaction rules), §7 (Definition of Done)

---

## 1. Visual Token Architecture (`[data-store-theme]`)

Storefront routes render inside `[data-store-theme="{preset}"]`:
- `editorial-warm`: `--sf-canvas: #F5F2EB`, `--sf-surface: #FBF9F4`, `--sf-ink: #1A1512`, `--sf-cta: #A3432A`, `--sf-radius: 14px`, `--font-sf-display: Fraunces`.
- `pahadi-sage`: `--sf-canvas: #F3F7F4`, `--sf-surface: #FFFFFF`, `--sf-ink: #10241B`, `--sf-cta: #1F6F4A`, `--sf-radius: 22px`, `--font-sf-display: Young Serif`.
- `ktm-bold`: `--sf-canvas: #F4F4F0`, `--sf-surface: #FFFFFF`, `--sf-ink: #0B0B0B`, `--sf-cta: #2B3BFF`, `--sf-radius: 4px`, `--font-sf-display: Space Grotesk`.

### Strict Lint Enforcement:
- NO hex color values in `/s/*` components.
- NO `--sf-*` tokens in `/merchant/*` or `/account/*` components.

---

## 2. Storefront Surface Patterns

### A. Storefront Header & Hero (`/s/[storeSlug]`)
- Sticky minimalist header: Store logo or bold name, contact phone / WhatsApp icon, Cart trigger button with live counter badge (`0` hidden, `1+` visible).
- Hero section: Left-aligned, store tagline, verified merchant badge (`Nepal D2C`), direct scroll to products.
- Product catalog grid: 2 columns on mobile (375px), 3–4 columns on desktop.

### B. Product Detail Purchase Drawer / Section (`DESIGN.md §5`)
- Variant picker chips (`250g`, `500g`, `1kg`) showing price dynamically.
- Segmented control: **One-time** (selected by default) | **Subscribe & Save {discount}%** (rendered only when variant allows subscriptions).
- On Subscribe: inline expand (180ms): **Prepay & save** (default) or **Pay each delivery**; plan chips `3 · 6 · 12`. One line: *"No auto-charge. Ever. We send a reminder link before each delivery."*
- Sticky bottom action bar on mobile: Price + CTA (*"Add to cart · Rs. 850"*).

### C. Slide-Over Cart Drawer (`sc:{storeSlug}:cart`)
- Slide-over drawer on right (desktop) / bottom sheet (mobile).
- Line items with thumbnail, title, variant label, quantity stepper (`- 1 +`), remove link.
- Delivery threshold progress bar: *"Add Rs. 350 more for free delivery"* or *"✓ Free delivery qualified!"*.
- Sticky footer: Subtotal, estimated shipping disclaimer, primary 48px CTA: *"Proceed to Checkout"*.

### D. Single-Screen Mobile Checkout (`/s/[storeSlug]/checkout`)
- Distraction-free layout: no navbar/footer clutter.
- Collapsed order summary banner with expand toggle (*"2 items · Rs. 2,400 ▾"*).
- Customer contact: Phone first (`inputmode="tel"`, `^9[78]\d{8}$`), verified email session.
- Address selector: Saved address radio cards with *"Add new"* modal sheet.
- Dynamic delivery rate computation: Kathmandu / Lalitpur / Bhaktapur = Inside Valley rate; other 74 districts = Outside Valley rate. Free if above store threshold.
- Payment selection (72px tactile cards):
  - **Khalti**: Default, instant digital payment redirect.
  - **Cash on Delivery**: Tactile card (*"Pay Rs. {total} in cash to the rider"*). Disabled with inline badge if cart contains a prepaid subscription.
- Sticky pay button: *"Pay with Khalti · Rs. 2,550"* or *"Place order · Rs. 2,550"*.

### E. Order Confirmation & Tracking (`/s/[storeSlug]/orders/[orderId]`)
- Success check icon, order number (`#BM-2026-0001`), status badge.
- Timeline stages: Order Placed → Packed → Out for Delivery → Delivered.
- Delivery address summary and item breakdown.

---

## 3. Merchant Order Fulfillment Queue (`/merchant/[storeSlug]/orders`)

- Order queue tabs: `New` · `Packed` · `Shipped` · `Delivered` · `All`.
- Row items: Order No., Customer Name, Phone, Items count, Total in integer `Rs.`, Payment badge (`Khalti ✓ Paid` / `COD Due`), Order Age.
- Order slide-over drawer:
  - Full address with `tel:` and WhatsApp links.
  - Line items breakdown.
  - Sticky next-action button:
    - New: *"Mark as Packed"*
    - Packed: *"Mark Shipped"*
    - Shipped: *"Mark Delivered"* (for COD: *"Delivered · Collected Rs. 1,450"*)
  - 5-second non-blocking undo toast on advance.
