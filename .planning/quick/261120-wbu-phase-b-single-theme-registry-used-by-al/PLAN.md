---
quick_id: "261120-wbu"
phase: "Phase B"
title: "Single theme registry used by all 5 surfaces"
status: "in_progress"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
---

# Quick Task 261120-wbu: Phase B — Single Theme Registry Used by All 5 Surfaces

## Tasks
1. Create `frontend/src/lib/storefront-fonts.ts` loading `Fraunces`, `Inter`, `Plus_Jakarta_Sans`, `Space_Grotesk`, and `Noto_Sans_Devanagari` via `next/font/google` (at most 2 new font families beyond `Fraunces` and `Inter`).
2. Create `frontend/src/lib/storefront-themes.ts` as the single source of truth for all 4 backend presets (`editorial-warm`, `pahadi-sage`, `ktm-bold`, `midnight-obsidian`): display names, descriptions, best-for categories, honest loaded font pairings with Devanagari fallback, token definitions, structural switch IDs, and preview metadata.
3. Align `frontend/src/lib/theme-contrast.ts` with the registry (removing duplicate token fixtures while keeping `resolveSafeAccentOverride` and contrast helpers intact).
4. Update `frontend/src/app/globals.css` and `frontend/src/app/s/[storeSlug]/layout.tsx` so all 4 presets load and apply their real font CSS variables (`--font-fraunces`, `--font-plus-jakarta`, `--font-space-grotesk`, `--font-inter`, `--font-devanagari`).
5. Refactor all remaining surfaces to consume `storefront-themes.ts` with zero duplicated preset definitions:
   - `frontend/src/components/platform/ThemeTemplateStudio.tsx`
   - `frontend/src/app/(platform)/merchant/new/page.tsx`
   - `frontend/src/app/merchant/[storeSlug]/themes/page.tsx`
   - `frontend/src/components/merchant/SettingsForm.tsx`
   - `frontend/src/app/s/[storeSlug]/layout.tsx`
6. Update and expand Vitest tests (`storefront-themes.test.ts`, `theme-contrast.test.ts`) to assert exact 4 backend slugs, required metadata, loaded font parity, Devanagari fallback, and WCAG AA contrast.
7. Run `npm run check:surfaces`, `npm run test`, `npm run typecheck`, `npm run build`, and capture all 40 Phase B Playwright screenshots under `.theme-review/phase-b/` + seeded-store matrix verification.
