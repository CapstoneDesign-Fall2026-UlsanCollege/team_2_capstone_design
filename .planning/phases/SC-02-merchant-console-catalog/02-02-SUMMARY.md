# Plan 02-02 Summary: Store Branding, Delivery Rates & Encrypted Khalti Settings

**Phase:** SC-02-merchant-console-catalog  
**Plan:** 02-02  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope
- **Backend Store Settings API (`MERCH-01`, `MERCH-04`):**
  - Implemented `MerchantStoreSettingsView` (`GET`, `PATCH`) in `backend/stores/api.py` guarded by `StoreMerchantMixin`.
  - Encrypted storage of Khalti Secret Key using Fernet AES-256 (`set_khalti_secret_key` and masked preview `••••••••••••1a2b`).
  - Supports updating `theme_preset`, `name`, `tagline`, `contact_phone`, `inside_valley_shipping_minor`, `outside_valley_shipping_minor`, `free_shipping_threshold_minor`, `khalti_mode` (`TEST` vs `LIVE`), and `khalti_secret_key`.
  - Added isolation test `test_merchant_settings_isolation_and_encryption` in `backend/stores/tests/test_isolation.py` proving cross-tenant access returns HTTP 404.
- **Frontend Settings Client (`api.ts`):**
  - Added `MerchantStoreSettings`, `MerchantSettingsUpdatePayload`, `fetchMerchantSettings`, and `updateMerchantSettings`.
- **Reactive Settings Form (`SettingsForm.tsx`):**
  - **Identity & Branding:** Name, bio/tagline, contact phone, and 3 interactive theme preset cards (`editorial-warm`, `pahadi-sage`, `ktm-bold`) with theme palette swatches.
  - **Delivery Rates:** Inside Valley (default Rs. 100), Outside Valley (default Rs. 200), and optional Free Delivery threshold inputs with integer Rs. currency validation.
  - **Khalti Gateway:** Environment switcher (`TEST` Sandbox vs `LIVE` Production), masked secret key input with hide/reveal toggle, direct link to `admin.khalti.com`, and prominent `"Platform Sandbox Active (Ready for Test Orders)"` / `"Live Merchant Key Connected"` status indicators.
- **Merchant Settings Page (`/merchant/[storeSlug]/settings/page.tsx`):**
  - Dynamic client page with loading skeletons, error guards, breadcrumbs, and live storefront link.
  - Surface isolation verified (`check-surfaces.mjs`) with zero `--sf-*` leakage into the neutral `.console` surface.

---

## 2. Verification Results
1. `node frontend/scripts/check-surfaces.mjs`:
   - `SURFACE_ISOLATION_OK` (0 raw hex in `/s/**`, 0 `--sf-*` in `/merchant/**`).
2. ESLint:
   - `npm run lint -- "src/app/merchant" "src/components/merchant"` passed with 0 errors and 0 warnings.
3. Production Build:
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `ƒ /merchant/[storeSlug]/settings`
4. Backend Isolation Tests:
   - `python manage.py test accounts stores.tests.test_isolation`: 19 tests passing in 6.1s.

---

## 3. Next Plan
- Proceeding to **Plan 02-03**: Product Catalog Management & Cloudinary Image Uploads (`MERCH-02`).
