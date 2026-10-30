# Plan 02-04 Summary: Spreadsheet Variant Editor, Integer Paisa & Selling Plans

**Phase:** SC-02-merchant-console-catalog  
**Plan:** 02-04  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope
- **Backend Variant CRUD & Selling Plan Endpoints (`MERCH-02`, `MERCH-03`):**
  - Implemented `MerchantVariantListCreateView` and `MerchantVariantDetailView` in `backend/stores/api.py`.
  - Implemented `MerchantSellingPlanListCreateView` for store-scoped recurring delivery selling plans.
  - Added isolation test `test_merchant_variant_crud_and_selling_plan_isolation` in `backend/stores/tests/test_isolation.py` proving multi-tenant 404 security across stores for variants and selling plans.
- **Frontend Variant & Plan Client (`api.ts`):**
  - Added typed interfaces `VariantPayload` and `SellingPlanItem`.
  - Added API methods `fetchProductVariants`, `createProductVariant`, `updateProductVariant`, `deleteProductVariant`, `fetchMerchantSellingPlans`, and `createMerchantSellingPlan`.
- **Keyboard-Friendly Spreadsheet Variant Grid (`VariantGridEditor.tsx`):**
  - Linear-style spreadsheet rows: Label, Price in NPR, In-Stock checkbox, Subscription availability checkbox, and Actions.
  - Quick-add chip presets: Weight (`250g · 500g · 1kg`), Apparel (`S · M · L · XL`), Volume (`100ml · 250ml · 500ml`).
  - Enter key in new row creates a variant row copying base values.
  - Price formatting: `Rs.` prefix, tabular mono numeric figures, integer values only (no decimals).
  - Mobile responsiveness: converts into card steppers for smaller screens.
- **Subscription Selling Plan Manager (`SellingPlanConfig.tsx`):**
  - Master subscription switch for the product.
  - Incentive discount % input (default 10%, capped at 50%).
  - Non-recurring commitment plan chips: Prepaid 3, 6, 12 deliveries, or Pay-per-delivery renewal links (no auto-debit).
  - Live computed pricing preview: *"Rs. {discounted_price} per delivery when subscribed ({discount}% off)"*.
- **Product Detail Page (`/merchant/[storeSlug]/products/[productId]/page.tsx`):**
  - Dynamic client page hosting product metadata summary, variant grid editor, and subscription plan manager.
  - Surface isolation verified (`check-surfaces.mjs`) with zero `--sf-*` leakage into the neutral `.console` surface.

---

## 2. Verification Results
1. `node frontend/scripts/check-surfaces.mjs`:
   - `SURFACE_ISOLATION_OK` (0 raw hex in `/s/**`, 0 `--sf-*` in `/merchant/**`).
2. ESLint:
   - `npm run lint -- "src/app/merchant" "src/components/merchant"` passed with 0 errors and 0 warnings.
3. Production Build:
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `ƒ /merchant/[storeSlug]/products/[productId]`
4. Backend Isolation Tests:
   - `python manage.py test accounts stores.tests.test_isolation`: 21 tests passing in 6.2s.

---

## 3. Phase 2 Completion
- Phase 2 (`SC-02-merchant-console-catalog`) is now **100% complete** across all 4 waves and 4 execution plans!
- Ready to proceed to **Phase 3**: Multi-Tenant Storefront, Checkout & Payments.
