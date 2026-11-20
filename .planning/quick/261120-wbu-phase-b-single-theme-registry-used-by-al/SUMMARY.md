---
quick_id: "261120-wbu"
phase: "Phase B"
title: "Single theme registry used by all 5 surfaces"
branch: "feature/storefront-template-system"
date: "2026-11-20"
status: "complete"
---

# Phase B Summary — Single Theme Registry & Loaded Google Fonts

## What Changed

1. **Loaded Font Pairings (`frontend/src/lib/storefront-fonts.ts`, `frontend/src/app/globals.css`, `frontend/src/app/s/[storeSlug]/layout.tsx`, `frontend/src/app/(platform)/layout.tsx`):**
   - Loaded `Plus_Jakarta_Sans` and `Space_Grotesk` (2 new families beyond existing `Fraunces` and `Inter`) alongside `Noto_Sans_Devanagari` (`--font-devanagari`) via `next/font/google`.
   - Documented and mapped real pairings per theme in `globals.css`:
     - `editorial-warm`: `Fraunces + Plus Jakarta Sans` (`--font-fraunces` / `--font-plus-jakarta`)
     - `pahadi-sage`: `Fraunces + Inter` (`--font-fraunces` / `--font-inter`) — replaces earlier unloaded `Young Serif + Manrope` draft while preserving the `<= 2` new families limit
     - `ktm-bold`: `Space Grotesk + Inter` (`--font-space-grotesk` / `--font-inter`)
     - `midnight-obsidian`: `Fraunces + Plus Jakarta Sans` (`--font-fraunces` / `--font-plus-jakarta`)
   - Verified `Noto Sans Devanagari` remains in every theme's `--font-serif` and `--font-ui` fallback stacks.

2. **Canonical Theme Registry (`frontend/src/lib/storefront-themes.ts` & `frontend/src/lib/theme-contrast.ts`):**
   - Created `STOREFRONT_THEMES` with exact unchanged backend slugs (`editorial-warm`, `pahadi-sage`, `ktm-bold`, `midnight-obsidian`), unified `displayName`, `shortDescription`, `bestForLabel`, `bestForCategories`, `tokenGroupId`, `fontPairing`, `structural` (`heroComposition`, `productCardAspect`, `headerAlignment`), `preview` metadata, and full WCAG AA `tokens`.
   - Updated `theme-contrast.ts` to re-export tokens and preset helpers directly from `storefront-themes.ts` (zero duplicated token objects).

3. **All 5 Surfaces Consuming Registry:**
   - `frontend/src/components/platform/ThemeTemplateStudio.tsx`: replaced `LOOK_CARDS` and `.platform-look-*` styles with `STOREFRONT_THEMES` (also removed now-unused `.platform-look-*` rules from `frontend/src/app/(platform)/platform.css`).
   - `frontend/src/app/(platform)/merchant/new/page.tsx`: replaced `THEME_OPTIONS` with `STOREFRONT_THEMES`, `normalizeStorefrontThemePreset`, and `recommendStorefrontThemeId`.
   - `frontend/src/app/merchant/[storeSlug]/themes/page.tsx`: replaced `THEME_PRESETS` with `STOREFRONT_THEMES` and `getStorefrontTheme`.
   - `frontend/src/components/merchant/SettingsForm.tsx`: replaced `PRESETS` with `STOREFRONT_THEMES`.
   - `frontend/src/app/s/[storeSlug]/layout.tsx`: applies `storefrontFontVariablesClass` from `storefront-fonts.ts` cleanly with `[data-store-theme]` driving token & font CSS variables.

## Verification

- `npm run check:surfaces` -> `SURFACE_ISOLATION_OK`
- `npm run test` -> `8` test files, `85` tests passed (`src/lib/storefront-themes.test.ts` verified backend slug parity, `<= 2` new fonts, `globals.css` var alignment, `Noto Sans Devanagari` fallbacks, and zero duplicate preset arrays across surfaces; `theme-contrast.test.ts` verified WCAG AA contrast)
- `npm run typecheck` -> `0` errors
- `npm run build` -> Next.js production build succeeded
- Playwright Phase B verification -> `40` screenshots saved under `.theme-review/phase-b/`, `0` console/page errors, `/` platform showcase assertions passed (`6/6`), `27/27` seeded store checks (`brewmellow`, `himalayan-artisans`, `ktm-streetwear`) passed including computed font verification (`Plus Jakarta Sans`, `Space Grotesk`, `Fraunces`, `Inter`, `Noto Sans Devanagari`).
