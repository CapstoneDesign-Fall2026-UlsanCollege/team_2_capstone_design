# Plan 03-01 Summary: Dynamic Storefront Catalog & Scoped Product Detail

**Phase:** SC-03-multi-tenant-storefront-checkout  
**Plan:** 03-01  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope

- **Public Store Catalog API & Frontend Client (`SHOP-01`):**
  - Confirmed `StoreCatalogView` (`GET /api/stores/<storeSlug>/catalog/`) returning active products and variants scoped strictly to the requested store.
  - Added typed interface `StoreCatalogResponse` and `fetchStoreCatalog(storeSlug: string)` to `frontend/src/lib/api.ts`.
  - Updated `ProductItem` attributes typing to `Record<string, any>` to accurately reflect structured Nepali coffee attributes (`roast_level`, `process`, `altitude_masl`, `tasting_notes`).
- **Storefront Header Component (`StorefrontHeader.tsx`):**
  - Sticky minimal header: `bg-sf-surface/90 backdrop-blur-xs border-b border-sf-line`.
  - Store logo with auto-fallback to bold typography name.
  - Support contact pill linking to `tel:` with tabular numerals.
  - Cart trigger button with live counter badge (`0` hidden, `1+` visible in `bg-sf-cta text-sf-cta-ink`).
- **Mobile-Responsive Product Catalog Grid (`ProductGrid.tsx`):**
  - 2 columns on mobile (`375px`), 3 columns on desktop.
  - Product cards: thumbnail image, title, starting price in integer Rs. (`formatNpr` with tabular numerals), `↻ Subscribe & Save` badge, and "Select" CTA trigger.
  - Empty state fallback for newly created stores.
- **Progressive Disclosure Product Detail Purchase Sheet (`ProductDetailSheet.tsx`, DESIGN.md §5):**
  - Slide-over drawer on desktop, bottom sheet on mobile with safe-area support (`@radix-ui/react-dialog`).
  - Origin attributes summary (origin district, wash/natural process, roast level, altitude in meters).
  - Variant chips (`150g · 250g · 500g · 1kg`) dynamically updating prices, with sold-out states.
  - Segmented control: **One-time** (selected by default) | **Subscribe & Save {discount}%** (rendered only when variant and product allow subscriptions).
  - Inline expansion (`180ms`): commitment plan chips (`3 · 6 · 12`), live computed discounted price preview, and reassurance notice: *"No auto-charge. Ever. We send a payment reminder link before each delivery."*
  - Quantity stepper (`− 1 +`) with boundary safeguards.
  - Sticky bottom action bar with dynamic CTA: *"Add to cart · Rs. 850"* or *"Subscribe · Rs. 2,295"*.
- **Dynamic Themed Storefront Shell (`StorefrontCatalogView.tsx`, `layout.tsx`, `page.tsx`):**
  - Server-side data loading via `Promise.all([fetchStore, fetchCatalog])` with 404 guard for unknown store slugs.
  - Theme injection via `[data-store-theme]` and typography presets (`editorial-warm`, `pahadi-sage`, `ktm-bold`).
  - Scoped cart persistence to `localStorage.getItem("sc:<storeSlug>:cart")` ensuring zero multi-tenant cart leakage.

---

## 2. Verification Results

1. **Surface Isolation Check:**
   - `node frontend/scripts/check-surfaces.mjs` exits 0 with `SURFACE_ISOLATION_OK`.
   - Verified 0 raw hex colors across all storefront routes and components (`src/app/s/**` and `src/components/storefront/**`).
   - Verified 0 `--sf-*` token leakage in merchant console components.
2. **ESLint Verification:**
   - `npx eslint "src/app/s" "src/components/storefront"` passed with 0 errors and 0 warnings.
3. **TypeScript & Production Build:**
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `ƒ /s/[storeSlug]` server-rendered dynamically on demand.
4. **Backend Multi-Tenant Isolation Tests:**
   - `python manage.py test accounts stores.tests.test_isolation`: 21 tests passing in 7.1s.
5. **Live Route Verification:**
   - `GET http://localhost:3000/s/brewmellow` returns HTTP 200 with `BrewMellow`, `Gulmi Reserve`, and `data-store-theme="editorial-warm"`.
   - `GET http://localhost:3000/s/non-existent-store-xyz` returns HTTP 404 cleanly.

---

## 3. Next Plan

- Proceeding to **Plan 03-02** (Wave 2: Cart Drawer & Server Pricing):
  - `frontend/src/lib/cart.ts` scoped to `sc:${storeSlug}:cart`.
  - `CartContext.tsx` and `CartDrawer.tsx` with free delivery threshold progress bar.
