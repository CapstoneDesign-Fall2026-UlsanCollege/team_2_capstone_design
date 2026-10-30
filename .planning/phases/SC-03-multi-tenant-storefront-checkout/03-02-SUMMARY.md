# Plan 03-02 Summary: Tenant-Scoped Cart Drawer & Server Pricing

**Phase:** SC-03-multi-tenant-storefront-checkout  
**Plan:** 03-02  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope

- **Tenant-Scoped Cart Storage Manager (`frontend/src/lib/cart.ts`, `SHOP-02`):**
  - Scoped storage pattern: `sc:${storeSlug}:cart` stored in client `localStorage`.
  - Defined `CartItem` and `CartItemSellingPlan` supporting both one-time purchases and non-recurring recurring delivery subscriptions (prepaid and pay-per-delivery).
  - Provided pure functions: `getCart`, `addToCart`, `updateCartItemQuantity`, `removeFromCart`, `clearCart`.
  - Guaranteed zero cross-tenant cart leakage when switching between stores.
- **Cart Context & React Provider (`frontend/src/components/storefront/CartContext.tsx`):**
  - Storefront React Context providing `items`, `itemCount`, `subtotalMinor`, `isCartOpen`, and reactive handlers (`openCart`, `closeCart`, `toggleCart`, `addItem`, `updateQty`, `removeItem`, `clear`).
  - Safe async microtask initial hydration compliant with React 19 hook guidelines (0 `set-state-in-effect` violations).
- **Slide-Out Cart Drawer (`frontend/src/components/storefront/CartDrawer.tsx`, DESIGN.md §5):**
  - Uses Radix UI Dialog (`@radix-ui/react-dialog`) with smooth slide-over from right on desktop and bottom sheet on mobile.
  - Dynamic free delivery threshold meter:
    - Displays *"Add Rs. {remaining} for free delivery"* with animated progress bar when below store threshold.
    - Displays *"✓ Free delivery qualified!"* with 100% full progress bar when threshold is reached or exceeded.
  - Line items list with product thumbnail, title, variant tag, subscription renewal mode badge (`↻ 3 deliveries prepaid` / `↻ Pay-per-delivery`), quantity steppers (`− 1 +`), trash remove action, and line total in tabular numerals.
  - Subtotal summary row and primary 48px CTA button (*"Proceed to Checkout · Rs. {subtotal}"*) redirecting to `/s/[storeSlug]/checkout`.
  - Empty state with friendly illustration and "Continue Shopping" trigger.
  - Strictly semantic utilities (`bg-sf-surface`, `bg-sf-canvas`, `text-sf-ink`, `text-sf-muted`, `border-sf-line`, `bg-sf-cta`, `text-sf-cta-ink`, `text-sf-accent`) with ZERO raw hex.
- **Storefront Shell Integration (`layout.tsx`, `StorefrontCatalogView.tsx`):**
  - Wrapped storefront layout in `CartProvider` and mounted `CartDrawer`.
  - Wired `StorefrontHeader` cart icon badge and `ProductDetailSheet` purchase action directly into `useCart()`.

---

## 2. Verification Results

1. **Surface Isolation Check:**
   - `node frontend/scripts/check-surfaces.mjs` exits 0 with `SURFACE_ISOLATION_OK`.
   - 0 raw hex violations in `/s/**` and `components/storefront/**`.
   - 0 `--sf-*` token leakage in merchant console.
2. **ESLint Verification:**
   - `npx eslint "src/app/s" "src/components/storefront" "src/lib/cart.ts"` passed with 0 errors and 0 warnings.
3. **TypeScript & Production Build:**
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `ƒ /s/[storeSlug]` server-rendered dynamically on demand.

---

## 3. Next Plan

- Proceeding to **Plan 03-03** (Wave 3: Single-Screen Checkout, Khalti Sandbox & Cash on Delivery):
  - Backend checkout quote and order placement endpoints (`StoreCheckoutQuoteView`, `StoreCheckoutPlaceView`, `StoreKhaltiVerifyView`).
  - Distraction-free single-screen mobile checkout (`/s/[storeSlug]/checkout`).
  - Khalti return handler (`/s/[storeSlug]/khalti-return`).
  - Order confirmation & tracking timeline (`/s/[storeSlug]/orders/[orderId]`).
