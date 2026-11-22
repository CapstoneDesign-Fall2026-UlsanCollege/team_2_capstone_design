---
quick_id: "261121-frt"
phase: "Phase C3 (Hero Clarity Fix)"
title: "Three hero states (banner only, featured product + label, compact brand panel)"
status: "in_progress"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
---

# Quick Task 261121-frt: Hero Clarity Fix

## Tasks
1. Update `frontend/src/components/storefront/StorefrontCatalogView.tsx` and `frontend/src/app/globals.css` to enforce three explicit hero states:
   - Case 1 (`store.banner_url` exists): hero image = banner only; no product caption/price/Add under it.
   - Case 2 (else if a featured product has an image): show the featured product image with a small `"Featured"` label above the caption (`name`, `price`, `Add`).
   - Case 3 (else): render a compact brand panel (logo/initial + store name) with `aspect-ratio: auto` (`.sf-hero-frame-compact`) and no product caption.
2. Evaluate optional Theme Studio setting (`"Hero shows: Banner | Featured product"` + merchant-selected featured product): skip because `Store` has no existing reusable field without a Django schema change, and report to the user.
3. Update `frontend/src/lib/storefront-placeholders.test.ts` to assert all 3 hero states.
4. Capture screenshots and contact sheets for all 3 cases at `360` and `1280` across all 4 themes (`24` hero captures + `hero-three-cases-1280-contact-sheet.png` and `hero-three-cases-360-contact-sheet.png` + refreshed Set A/B contact sheets).
