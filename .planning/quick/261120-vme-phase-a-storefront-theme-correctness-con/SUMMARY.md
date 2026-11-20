---
quick_id: "261120-vme"
phase: "Phase A"
title: "Storefront theme correctness, contrast, token cleanup, and banner priority"
status: "complete"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
completed_at: "2026-11-20"
---

# Summary — Quick Task 261120-vme (Phase A)

## Completed Work
- Removed the `DEFAULT_STOREFRONT_TOKENS` inline `style` override in `frontend/src/app/s/[storeSlug]/layout.tsx` so `[data-store-theme]` CSS rules are authoritative while allowing only contrast- and hue-safe merchant `accent_color` overrides (`resolveSafeAccentOverride`).
- Fixed `midnight-obsidian` dark-theme button contrast (`--primary: #E5B143`, `--primary-foreground: #0B0D11`) and defined explicit WCAG AA palettes (`>= 4.5:1` text/buttons, `>= 3.0:1` UI borders) for all 4 presets in `frontend/src/app/globals.css` and `frontend/src/lib/theme-contrast.ts`.
- Standardized canonical status tokens (`--status-success-{bg,fg,border}`, `--status-warning-{bg,fg,border}`, `--status-error-{bg,fg,border}`) across `globals.css`, `ui/chip.tsx`, and storefront components/pages.
- Removed raw hex, CSS color functions, and hardcoded Tailwind palette utilities across `/s/**` and `components/storefront/**`, and extended `frontend/scripts/check-surfaces.mjs` to enforce those rules automatically with zero allowlist exceptions.
- Propagated `?preview_theme=` cleanly across all `[data-store-theme]` elements and portal drawers (`CartDrawer`, `AccountSheet`) via `ThemePreviewWatcher.tsx` (`useEffectiveStoreTheme`).
- Fixed `StorefrontCatalogView.tsx` hero image priority (`store.banner_url` -> `featuredProduct?.image_url` -> neutral fallback) and fixed a 360px mobile header overflow on long store names (`ktm-streetwear`) in `StorefrontHeader.tsx`.
- Updated `DESIGN.md` Section 2A to reflect the 4 storefront presets including `midnight-obsidian`.
- Added Vitest tests in `frontend/src/lib/theme-contrast.test.ts` and banner priority tests in `frontend/src/lib/storefront-placeholders.test.ts`.

## Verification
- `npm run check:surfaces`: `SURFACE_ISOLATION_OK` (0 allowlist exceptions)
- `npm run test`: 7 files / 80 tests passed
- `npm run typecheck`: 0 errors
- `npm run build`: succeeded
- Playwright capture & seeded matrix: 40 screenshots in `.theme-review/phase-a/` (0 errors) + 27/27 seeded-store matrix checks passed (`brewmellow`, `himalayan-artisans`, `ktm-streetwear` across all 4 themes on `360px` and `1280px`, plus `about`, `shipping`, `contact` dark-mode check).
