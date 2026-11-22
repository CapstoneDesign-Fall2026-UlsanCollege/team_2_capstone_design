---
quick_id: "261120-vme"
phase: "Phase A"
title: "Storefront theme correctness, contrast, token cleanup, and banner priority"
status: "in_progress"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
---

# Quick Task 261120-vme: Phase A — Storefront Theme Correctness, Contrast, Token Cleanup, and Banner Priority

## Tasks
1. Fix inline-style token override in `frontend/src/app/s/[storeSlug]/layout.tsx` so `[data-store-theme="..."]` CSS rules are authoritative, plus propagate `?preview_theme=` in `ThemePreviewWatcher.tsx` across all `[data-store-theme]` nodes and portals (`CartDrawer`, `AccountSheet`).
2. Fix dark theme (`midnight-obsidian`) button readability (`--primary` / `--primary-foreground`) and all storefront primary CTAs.
3. Standardize canonical status tokens (`--status-success-bg/fg/border`, `--status-warning-bg/fg/border`, `--status-error-bg/fg/border`) across `globals.css`, `ui/chip.tsx`, and storefront pages/components, with backwards-compatible aliases.
4. Remove all hardcoded colors (`#hex`, `rgb()`, `hsl()`, and hardcoded Tailwind palette classes like `text-white`, `bg-black/*`, `bg-emerald-*`, `text-emerald-*`, `text-blue-*`) from `/s/**` and `components/storefront/**`.
5. Extend `frontend/scripts/check-surfaces.mjs` to fail on raw hex, CSS color functions (`rgb()`, `hsl()`, etc.), and hardcoded Tailwind palette utilities in storefront surfaces, while preserving console `--sf-*` protection.
6. Fix banner priority in `StorefrontCatalogView.tsx` (`store.banner_url` -> `featuredProduct?.image_url` -> neutral fallback).
7. Update `DESIGN.md` Section 2A to document the 4 curated presets including `midnight-obsidian` dark mode, canonical tokens, and WCAG AA rules.
8. Add Vitest WCAG contrast tests, safe accent override tests, surface scanner tests (`frontend/src/lib/theme-contrast.test.ts`), and banner priority tests (`frontend/src/lib/storefront-placeholders.test.ts`).
9. Run `check:surfaces`, `test`, `typecheck`, `build`, and capture 40 real Playwright screenshots under `.theme-review/phase-a/` plus verify seeded stores (`brewmellow`, `himalayan-artisans`, `ktm-streetwear`) across all 4 themes.
