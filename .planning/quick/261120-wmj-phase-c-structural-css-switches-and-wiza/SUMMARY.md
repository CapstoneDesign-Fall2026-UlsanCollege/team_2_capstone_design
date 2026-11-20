---
quick_id: "261120-wmj"
phase: "Phase C"
title: "Structural CSS switches + /merchant/new Step 2 lightweight previews"
branch: "feature/storefront-template-system"
date: "2026-11-20"
status: "complete"
---

# Phase C Summary — Structural CSS Switches & Wizard Previews

## What Changed

1. **CSS-Driven Structural Switches (`frontend/src/app/globals.css`, `StorefrontHeader.tsx`, `StorefrontCatalogView.tsx`, `ProductGrid.tsx`):**
   - Added theme-driven `--product-card-aspect`, `.sf-product-media`, `.sf-card-radius`, and `.sf-control-radius` with zero duplicated JSX trees.
   - Desktop Header Alignment (`min-width: 768px`): `left` for `editorial-warm` & `ktm-bold`; `centered` 3-column grid for `pahadi-sage` & `midnight-obsidian` (preserving 360px mobile ergonomics).
   - Desktop Hero Composition (`min-width: 768px`): `editorial-split` (`editorial-warm`), `centered-story` with `16:9` centered frame (`pahadi-sage`), `full-bleed-poster` with top `21:9` drop poster (`ktm-bold`), and `dark-spotlight` with left spotlight media (`midnight-obsidian`).
   - Product Card Aspect Ratios: `4/5` (`editorial-warm`, `midnight-obsidian`), `1/1` (`pahadi-sage`), `3/4` (`ktm-bold`) with per-theme `--radius-card` and `--radius-control`.

2. **Lightweight Wizard Step 2 Previews (`frontend/src/app/(platform)/merchant/new/page.tsx`):**
   - Upgraded Step 2 preset cards to render compact live mini-storefront previews showing 4 color swatches, loaded Google font specimens (`storeName` + product preview), dynamic merchant store name, `"Best for"` category label, and structural layout labels (`heroLabel`, `productCardAspect`, `headerAlignment`) without iframes.

3. **Merchant Theme Settings Alignment (`frontend/src/app/merchant/[storeSlug]/themes/page.tsx`):**
   - Added concise structural summary row (`heroLabel`, card aspect ratio, header alignment) sourced from `STOREFRONT_THEMES` with no column picker, light/dark toggle, or arbitrary palette controls.

4. **Tests & Runtime Verification (`frontend/src/lib/storefront-themes.test.ts`, `frontend/src/lib/theme-contrast.test.ts`):**
   - Updated `theme-contrast.test.ts` regex so CSS layout rules under `[data-store-theme="..."] .sf-*` never shadow base token blocks.
   - Added Phase C structural & wizard preview unit assertions in `storefront-themes.test.ts`.
   - Verified `SURFACE_ISOLATION_OK`, `8` test files / `86` Vitest tests passed, `tsc --noEmit` (`0` errors), Next.js production build succeeded, `40` screenshots saved under `.theme-review/phase-c/`, `8/8` live Chromium structural layout/aspect checks passed, and `27/27` seeded-store matrix checks (`brewmellow`, `himalayan-artisans`, `ktm-streetwear`) passed with `0` console/page errors.
