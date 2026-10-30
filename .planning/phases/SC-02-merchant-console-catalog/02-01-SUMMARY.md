# Plan 02-01 Summary: Merchant Console Shell & Store Overview Dashboard

**Phase:** SC-02-merchant-console-catalog  
**Plan:** 02-01  
**Status:** Complete  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope
- **Backend Aggregation & Overview Endpoint (`MERCH-01`, `MERCH-05`):**
  - Updated `MerchantStoreOverviewView` in `backend/stores/api.py`.
  - Aggregated `orders_count`, `revenue_minor` (sum of `total_minor` for paid/confirmed orders), active `products_count`, `customers_count`, and computed launch checklist (`has_products`, `has_shipping`, `has_khalti`).
  - Added typed `MerchantStoreOverview` and `fetchMerchantStoreOverview(storeSlug)` in `frontend/src/lib/api.ts`.
  - Retained strict multi-tenant 404 isolation via `StoreMerchantMixin`.
- **Desktop 232px Sidebar (`MerchantSidebar`):**
  - Fixed 232px width left column (`hidden lg:flex w-[232px] border-r border-[var(--border)] bg-[var(--background)]`).
  - Active store indicator with colored dot (`--st-new`) and quick link to live storefront (`/s/[storeSlug]` ↗).
  - Navigation links: Overview, Products, Orders, Settings.
  - Interactive ⌘K trigger button.
- **Ergonomic Mobile Bottom Nav (`MerchantBottomNav`):**
  - Fixed mobile bottom navigation with safe-area padding (`pb-safe`) and tab icons.
  - Floating action button (`+`) linking directly to product creation.
- **Accessible Command Palette (`CommandPalette`):**
  - Triggered via `⌘K` / `Ctrl+K` or search button click.
  - Dialog modal using `@radix-ui/react-dialog` for quick navigation between Overview, Products, Orders, Settings, Live Storefront, and Account Addresses.
- **Console Shell (`ConsoleShell` & `layout.tsx`):**
  - Orchestrates sidebar, sticky mobile header, page container, bottom tabs, and ⌘K listener.
  - Restyles under `.console` zinc tokens (13px base text, hairline borders, zero `--sf-*` leakage).
- **Merchant Overview Dashboard (`/merchant/[storeSlug]/page.tsx`):**
  - 4 KPI summary cards: Orders Placed, Confirmed Revenue (`formatNpr` in integer Rs. without decimals), Active Products, and Direct Customers.
  - Store Launch Checklist (Step 1: Products, Step 2: Delivery Fees, Step 3: Khalti) with progress counter and step completion checks.
  - Copy store link button for easy sharing on social platforms.
  - Quick action navigation cards for catalog, orders, and store settings.

---

## 2. Verification Results
1. `node frontend/scripts/check-surfaces.mjs`:
   - `SURFACE_ISOLATION_OK` (0 raw hex in `/s/**`, 0 `--sf-*` in `/merchant/**`).
2. ESLint:
   - `npm run lint -- "src/app/merchant" "src/components/merchant"` passed with 0 errors and 0 warnings.
3. Production Build:
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `ƒ /merchant/[storeSlug]`
     - `ƒ /s/[storeSlug]`
     - `○ /merchant/new`
4. Backend Isolation Tests:
   - `python manage.py test accounts stores.tests.test_isolation`: 18 tests passing in 6.0s.

---

## 3. Next Plan
- Proceeding to **Plan 02-02**: Store Branding, Delivery Rates & Encrypted Khalti Settings (`MERCH-01`, `MERCH-04`).
