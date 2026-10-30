# Plan 03-03 Summary: Single-Screen Checkout, Khalti Sandbox & Cash on Delivery

**Phase:** SC-03-multi-tenant-storefront-checkout  
**Plan:** 03-03  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope

- **Backend Authoritative Checkout & Verification APIs (`backend/stores/api.py`, `SHOP-03`, `SHOP-04`):**
  - Implemented `StoreCheckoutQuoteView` (`POST /api/stores/<storeSlug>/checkout/quote/`): computes server-authoritative subtotal and dynamic inside/outside Kathmandu Valley delivery fees, factoring in the free delivery threshold.
  - Implemented `StoreCheckoutPlaceView` (`POST /api/stores/<storeSlug>/checkout/place/`): supports both registered user sessions and passwordless guest shopper customer provisioning. Enforces prepaid subscription restrictions on COD (prepaid requires Khalti).
  - Implemented `StoreKhaltiVerifyView` (`POST /api/stores/<storeSlug>/checkout/khalti-verify/`): verifies Khalti payments via `epayment/lookup/` with fallback sandbox support. Transitions order to `PAID` with verified `OrderEvent`.
  - Implemented `StorePublicOrderDetailView` (`GET /api/stores/<storeSlug>/public-orders/<orderId>/`): returns full immutable order snapshot, line items, and lifecycle events for the shopper tracking screen.
  - Added unit test `test_store_checkout_quote_and_placement_isolation` verifying quote accuracy, COD order creation, Khalti initiation, payment verification, and multi-tenant isolation against cross-store access.
- **Frontend Checkout & Order Types (`frontend/src/lib/api.ts`):**
  - Added typed payloads and responses: `CheckoutAddressPayload`, `CheckoutQuotePayload`, `CheckoutQuoteResponse`, `CheckoutPlacePayload`, `CheckoutPlaceResponse`, `KhaltiVerifyResponse`, `OrderDetail`, `OrderItemDetail`, `OrderEventDetail`.
  - Exported API client methods: `fetchCheckoutQuote`, `placeCheckoutOrder`, `verifyKhaltiPayment`, `fetchPublicOrder`.
- **Single-Screen Mobile Checkout Form (`CheckoutForm.tsx`, DESIGN.md §5):**
  - Collapsible order summary banner showing item count and total.
  - Contact inputs: Nepali mobile phone with `^9[78]\d{8}$` validation, email receipt address, and recipient name.
  - Cascading Nepali address inputs: Province, District, Municipality, Ward No., and strongly encouraged Nearest Chowk / Landmark.
  - Dual tactile 72px payment cards: **Khalti Sandbox** (default) and **Cash on Delivery**. Disabled with inline explanation when cart contains prepaid subscription plans.
  - Sticky bottom action bar with dynamic CTA: *"Pay with Khalti · Rs. {total}"* or *"Place Order · Rs. {total}"*.
- **Khalti Return Page (`/s/[storeSlug]/checkout/khalti-return/page.tsx`):**
  - Full-screen calm verification skeleton with live retry on error and redirect to order confirmation on verified payment.
- **Order Confirmation & Tracking Timeline (`/s/[storeSlug]/orders/[orderId]/page.tsx`, `SHOP-05`):**
  - Order confirmed / Payment verified header with order reference number.
  - 4-stage lifecycle timeline: Order Placed → Packed → Out for Delivery → Delivered.
  - Destination address snapshot and itemized line breakdown with integer NPR formatting (`formatNpr`).
  - Payment method & status badge with clear cash collection notice for COD orders.

---

## 2. Verification Results

1. **Surface Isolation Check:**
   - `node frontend/scripts/check-surfaces.mjs` exits 0 with `SURFACE_ISOLATION_OK`.
   - Verified 0 raw hex violations across all newly created checkout and order routes.
2. **TypeScript & Production Build:**
   - `npm run typecheck` passed with 0 errors.
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `ƒ /s/[storeSlug]/checkout`
     - `ƒ /s/[storeSlug]/checkout/khalti-return`
     - `ƒ /s/[storeSlug]/orders/[orderId]`
3. **Automated Backend Isolation Tests:**
   - `python manage.py test accounts stores.tests.test_isolation`: 22 tests passing in 12.9s.
4. **Live Route Verification:**
   - `GET http://localhost:3000/s/brewmellow/checkout` returns HTTP 200 with `Checkout` and `BrewMellow`.

---

## 3. Next Plan

- Proceeding to **Plan 03-04** (Wave 4: Merchant Order Queue & Fulfillment Pipeline):
  - Backend order queue and transition endpoints (`MerchantOrderListView`, `MerchantOrderDetailView`, `MerchantOrderStatusTransitionView`).
  - `/merchant/[storeSlug]/orders` queue table with status tabs (`New`, `Packed`, `Shipped`, `Delivered`, `All`).
  - Order detail slide-over drawer with tap-to-call, WhatsApp link, and 5-second non-blocking undo status transitions.
