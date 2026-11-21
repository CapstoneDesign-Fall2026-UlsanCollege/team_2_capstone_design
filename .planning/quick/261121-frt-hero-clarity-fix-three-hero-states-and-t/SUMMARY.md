---
quick_id: "261121-frt"
phase: "Phase C3 (Hero Clarity Fix)"
title: "Three hero states (banner only, featured product + label, compact brand panel)"
branch: "feature/storefront-template-system"
date: "2026-11-21"
status: "complete"
---

# Summary — Hero Clarity Fix (Three Explicit Hero States)

## What Changed

1. **Three Hero States (`frontend/src/components/storefront/StorefrontCatalogView.tsx`, `frontend/src/app/globals.css`):**
   - **Case 1 (`heroMode === "banner"` — `store.banner_url` exists):** Renders the banner image only; omits `.sf-hero-caption` (no product name, price, or `Add` button under the banner) and hides the mobile product quick-order bar.
   - **Case 2 (`heroMode === "featured-product"` — no banner, and a product has a valid non-placeholder image):** Renders the featured product image with a small uppercase `"Featured"` label (`.sf-hero-featured-label`) above the caption (`name`, `price`, `Add` button) at both `1280px` and `360px`.
   - **Case 3 (`heroMode === "brand-panel"` — neither banner nor product image exists):** Renders a compact horizontal brand panel (`.sf-hero-brand-panel` inside `.sf-hero-frame-compact` with `aspect-ratio: auto !important`) showing logo/initial + store name with no product caption beneath it.

2. **Optional Theme Studio Toggle Evaluation:**
   - Checked `Store` in `backend/stores/models.py`: there is no existing `JSONField`, `hero_mode` field, or `featured_product` foreign key on `Store` to persist a `"Hero shows: Banner | Featured product"` setting without a Django schema change. Skipped per governance (*"no schema change if an existing field can be reused; otherwise skip and tell me"*).

3. **Tests & Screenshots (`frontend/src/lib/storefront-placeholders.test.ts`, `.theme-review/phase-c/`):**
   - Updated unit tests in `storefront-placeholders.test.ts` to assert `data-hero-mode`, `.sf-hero-caption`, `.sf-hero-featured-label`, and `.sf-hero-brand-panel` across all 3 hero states.
   - Captured `24` hero screenshots (`hero-case{1-banner|2-featured|3-brand}-{theme}-{360|1280}.png`), 2 hero contact sheets (`hero-three-cases-1280-contact-sheet.png` and `hero-three-cases-360-contact-sheet.png`), and refreshed Set A / Set B full-page screenshots and contact sheets (`24/24` DOM state checks passed, `0` errors).
