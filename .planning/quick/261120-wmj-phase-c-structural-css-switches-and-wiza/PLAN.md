---
quick_id: "261120-wmj"
phase: "Phase C"
title: "Structural CSS switches + /merchant/new Step 2 lightweight previews"
status: "in_progress"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
---

# Quick Task 261120-wmj: Phase C — Structural CSS Switches & Wizard Previews

## Tasks
1. Implement CSS-driven structural switches via `[data-store-theme]` in `frontend/src/app/globals.css` with shared hook classes across `StorefrontHeader.tsx`, `StorefrontCatalogView.tsx`, and `ProductGrid.tsx`:
   - Header alignment: `left` (`editorial-warm`, `ktm-bold`) vs `centered` (`pahadi-sage`, `midnight-obsidian`)
   - Hero composition: `editorial-split`, `centered-story`, `full-bleed-poster`, `dark-spotlight`
   - Product card aspect ratio + theme radius: `4/5` (`editorial-warm`, `midnight-obsidian`), `1/1` (`pahadi-sage`), `3/4` (`ktm-bold`) via `--product-card-aspect`, `--radius-card`, and `--radius-control`
2. Upgrade `/merchant/new` Step 2 template cards with lightweight registry-driven live previews showing swatches, font sample, merchant-entered store name, Best-for line, and structural layout labels without iframes or heavy runtime cost.
3. Keep merchant theme settings aligned with `storefront-themes.ts` (compact structural summary, zero column/light-dark/arbitrary palette controls).
4. Extend `storefront-themes.test.ts` and ensure `theme-contrast.test.ts`, `check:surfaces`, `typecheck`, `build`, and all 40 Phase C Playwright screenshots + seeded store matrix pass.
