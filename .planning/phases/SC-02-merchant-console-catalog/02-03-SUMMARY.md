# Plan 02-03 Summary: Product Catalog Management & Cloudinary Image Uploads

**Phase:** SC-02-merchant-console-catalog  
**Plan:** 02-03  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope
- **Backend Product Detail & Scoped CRUD API (`MERCH-02`):**
  - Implemented `MerchantProductDetailView` supporting `GET`, `PATCH`, and `DELETE` (with soft-delete / archiving and optional `?permanent=true`) at `/api/merchant/stores/<storeSlug>/products/<int:productId>/`.
  - Updated `MerchantProductListCreateView.post` to auto-generate unique URL slugs when not provided, and optionally provision starter variants if `initial_price_minor` is specified.
  - Added isolation test `test_merchant_product_crud_and_cross_tenant_isolation` in `backend/stores/tests/test_isolation.py` proving multi-tenant 404 security across stores.
- **Frontend Product Client (`api.ts`):**
  - Added typed interfaces `ProductItem`, `ProductVariant`, `ProductPayload`.
  - Added API functions `fetchMerchantProducts`, `fetchMerchantProduct`, `createMerchantProduct`, `updateMerchantProduct`, and `deleteMerchantProduct`.
- **Linear-Style Product Table (`ProductListTable.tsx`):**
  - Displays thumbnail (with fallback icon), title, slug, subscription badge, variant count link, tabular mono integer price range (`formatNpr`), and status dot (`--st-delivered` Active vs `--st-cancelled` Draft).
  - Empty state with copy: *"No products in your catalog yet. Add your first item before your customers start asking on WhatsApp."*
  - 5-second non-blocking `Undo` removal bar: archiving a product filters it optimistically and provides an `Undo` button with countdown timer before finalizing deletion.
- **Product Drawer Editor (`ProductSheet.tsx`):**
  - Accessible `@radix-ui/react-dialog` right-side sheet.
  - Fields for title, description, starter price (in integer Rs.), photo URL (Cloudinary or direct image) with live preview loaded thumbnail, custom attribute tag chips (key-value pairs, e.g. `origin: Ilam`, `roast: Medium`), and one-time/subscription toggles.
- **Merchant Products Page (`/merchant/[storeSlug]/products/page.tsx`):**
  - Real-time search across product name, slug, description, and attribute tags.
  - Status filter chips: `All`, `Active`, `Draft`.
  - Direct integration with URL query param `?action=new` to automatically open the product creation drawer from the mobile bottom navigation FAB.

---

## 2. Verification Results
1. `node frontend/scripts/check-surfaces.mjs`:
   - `SURFACE_ISOLATION_OK` (0 raw hex in `/s/**`, 0 `--sf-*` in `/merchant/**`).
2. ESLint:
   - `npm run lint -- "src/app/merchant" "src/components/merchant"` passed with 0 errors and 0 warnings.
3. Production Build:
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `ƒ /merchant/[storeSlug]/products`
4. Backend Isolation Tests:
   - `python manage.py test accounts stores.tests.test_isolation`: 20 tests passing in 6.1s.

---

## 3. Next Plan
- Proceeding to **Plan 02-04**: Spreadsheet-Style Variant Editor, Integer Paisa & Selling Plans (`MERCH-03`).
