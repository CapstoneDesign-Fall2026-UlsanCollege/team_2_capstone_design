# Phase 3 Context: Multi-Tenant Storefront, Checkout & Payments

## 1. Executive Summary

Phase 3 delivers the shopper-facing surface of ShopCraft: dynamic, tenant-themed storefronts at `/s/[storeSlug]`, a slide-out cart drawer namespaced per store (`sc:{storeSlug}:cart`), a distraction-free single-screen mobile checkout with Nepali address validation and automatic inside/outside Kathmandu Valley delivery fee computation, server-authoritative Khalti Sandbox & Cash on Delivery payment execution, and the merchant fulfillment queue at `/merchant/[storeSlug]/orders`.

---

## 2. Applicable Requirements

- **SHOP-01**: Multi-tenant dynamic storefront rendering under `/s/[storeSlug]` with theme presets (`editorial-warm`, `pahadi-sage`, `ktm-bold`), strictly semantic utilities (`bg-sf-canvas`, `text-sf-ink`, `bg-sf-cta`), and zero raw hex colors.
- **SHOP-02**: Tenant-namespaced shopper cart (`sc:{storeSlug}:cart`), preventing item or cart state leakage across stores.
- **SHOP-03**: Single-screen mobile-first checkout with Nepali phone (`^9[78]\d{8}$`), cascading address selector, and automatic delivery fee calculation.
- **SHOP-04**: Dual payment options:
  - **Khalti Sandbox**: Server-side initiation (`epayment/initiate/`) with idempotency key, calm redirect, and server verification via `epayment/lookup/` with `pidx` verification.
  - **Cash on Delivery (COD)**: Tactile selection, instant order placement, disabled with clear notice when cart contains prepaid subscriptions.
- **SHOP-05**: Order confirmation screen with tracking timeline, receipt email trigger, and order detail lookup.
- **MERCH-05**: Merchant order queue at `/merchant/[storeSlug]/orders`:
  - Linear-density status tabs: `New`, `Packed`, `Shipped`, `Delivered`, `All`.
  - Slide-over order detail (customer address, tap-to-call, WhatsApp link).
  - Status progression button (`Mark as Packed` → `Add tracking & Mark Shipped` → `Mark Delivered`), 5-second non-blocking undo, and COD cash collection confirmation.

---

## 3. Architecture & Non-Negotiables

1. **Surface Isolation:**
   - Storefront components live strictly in `frontend/src/app/s/**` and `frontend/src/components/storefront/**`.
   - Use ONLY semantic tokens: `bg-sf-canvas`, `bg-sf-surface`, `text-sf-ink`, `text-sf-muted`, `border-sf-line`, `bg-sf-cta`, `text-sf-cta-ink`.
   - ZERO raw hex in storefront components (enforced by `node frontend/scripts/check-surfaces.mjs`).
2. **Strict Currency Integrity:**
   - All database amounts stored as integer paisa (`subtotal_minor`, `shipping_minor`, `total_minor`).
   - Displayed strictly as integer `Rs. 1,250` via `formatNpr()` with tabular numerals.
3. **Payments Security:**
   - Server-authoritative order totals (client cannot manipulate prices).
   - Server-verified Khalti callbacks (never trust redirect query string).
4. **Ergonomics & Tone:**
   - 48px primary CTAs in bottom third of mobile screen.
   - Plain Nepali voice, no AI marketing fluff ("Done. Your order is placed.").
