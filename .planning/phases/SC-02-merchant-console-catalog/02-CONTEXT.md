# Phase 2 Context: Merchant Onboarding, Console & Catalog

**Phase:** SC-02-merchant-console-catalog  
**Target Deadline:** 2026-11-26 (Feature Freeze: 2026-11-24)  
**Parent Requirements:** `MERCH-01`, `MERCH-02`, `MERCH-03`, `MERCH-04`, `MERCH-05`  
**Design Authority:** `DESIGN.md` §2 (.console surface), §4 (Console surface, wizard, variant editor)  

---

## 1. Phase Intent & Boundary

Phase 2 builds the core merchant management experience for ShopCraft:
1. **Merchant Shell (`/merchant/[storeSlug]`):** Neutral Linear-style console with desktop 232px sidebar, mobile bottom navigation tabs, and ⌘K command palette. Strictly neutral `.console` tokens with zero `--sf-*` leakage.
2. **Store Overview & Onboarding Checklist:** Live KPI metrics (total orders, integer revenue, active products, customers) and interactive launch checklist for newly created stores.
3. **Settings & Gateway Credentials (`/merchant/[storeSlug]/settings`):** Visual preset selection, delivery shipping rates (valley/outside/free threshold), and encrypted Khalti secret key storage (`TEST`/`LIVE` mode) with prominent "Platform Sandbox Active" fallback pill.
4. **Product Catalog & Cloudinary Uploads (`/merchant/[storeSlug]/products`):** Full CRUD for products with Cloudinary photos, category/attribute chips, and draft/active toggle.
5. **Spreadsheet-Style Variant Grid & Selling Plans (`/merchant/[storeSlug]/products/[id]`):** Keyboard-friendly row navigation, quick-add chips, integer paisa formatting, and subscription selling plan discounts.

---

## 2. Hard Constraints & Architectural Invariants

- **Surface Isolation:** All merchant pages must render inside the `.console` token scope (`--background`, `--foreground`, `--card`, `--border`, `--st-*`). Never import or reference `--sf-*` tokens in `/merchant/**`.
- **Zero Raw Hex in Storefront:** Only neutral console colors in `/merchant/**` and zero raw hex in `/s/**`. Lint-enforced via `check-surfaces.mjs`.
- **Tenant Scoping & 404 Isolation:** All merchant endpoints must inherit `StoreMerchantMixin`. A user attempting to access a store they do not own or belong to receives HTTP 404 (`D-03`).
- **Money Units:** Integer paisa (`100 paisa = Rs. 1`). Render formatted via `Intl.NumberFormat('en-IN')` without decimals.
- **Autosave & Ergonomics:** Prefer inline autosave and undo toasts over blocking modal confirmations.

---

## 3. Plan Decomposition (4 Plans, 4 Waves)

1. **`02-01-PLAN.md` (Wave 1):** Console Shell, Navigation, ⌘K Palette & Merchant Overview Dashboard
2. **`02-02-PLAN.md` (Wave 2):** Store Branding, Delivery Rates & Encrypted Khalti Credentials
3. **`02-03-PLAN.md` (Wave 3):** Product Catalog Management & Cloudinary Photo Uploads
4. **`02-04-PLAN.md` (Wave 4):** Spreadsheet-Style Variant Editor, Integer Paisa & Selling Plans
