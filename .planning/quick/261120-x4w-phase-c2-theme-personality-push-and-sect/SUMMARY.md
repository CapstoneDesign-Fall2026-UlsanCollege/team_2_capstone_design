---
quick_id: "261120-x4w"
phase: "Phase C2"
title: "Theme personality push, grid density, section chrome, and contact sheets"
branch: "feature/storefront-template-system"
date: "2026-11-21"
status: "complete"
---

# Phase C2 Summary — CSS-Only Theme Personality Push, Grid Density & Section Chrome

## What Changed

1. **Pure CSS Structural & Section Chrome Differentiation (`frontend/src/app/globals.css`):**
   - **Zero DOM changes**: no `.tsx` component markup was modified.
   - **Zero `box-shadow` and zero gradients**: removed the Phase C `box-shadow` rule on `midnight-obsidian` and enforced a unit test forbidding `box-shadow` and `*-gradient(` in `globals.css`.
   - **Per-theme tokens**: added `--radius-field`, `--bw`, `--bw-field`, and `--space-section` alongside `--radius-control` (`2px`, `22px`, `0px`, `6px`) and `--radius-card` (`4px`, `24px`, `0px`, `0px`).
   - **Grid density & card chrome**:
     - `editorial-warm`: roomy 2-column gallery grid (`max-w: 56rem`), double-rule hero mat (`outline: 1px solid var(--border); outline-offset: 10px`), open transparent cards with bottom hairline border and underlined `Add` button.
     - `pahadi-sage`: 4-column desktop grid (`1:1` square), `24px` card radius, `22px` pill controls, centered serif product titles/prices, and solid pine-green pill `Add` buttons.
     - `ktm-bold`: 4-column desktop grid (`3:4` tall), `0px` sharp corners, `3px` ink borders, solid cobalt-blue offset blocks behind cards (`::after` with `3px` ink border) and `3px/9px` solid ink border + `2px` cobalt `outline` offset blocks on story & shipping boxes, uppercase `Space Grotesk` display type.
     - `midnight-obsidian`: 4-column flush hairline-divided gallery wall (`gap: 0`, `margin: 0 -1px -1px 0`, `border-radius: 0`), `1:1` square hero frame on left with vertical hairline divider on right copy column.
   - **Devanagari script protection & accessibility**:
     - `:is(:lang(ne), :lang(hi), :lang(mai), :lang(sa))` forces `letter-spacing: normal !important; text-transform: none !important;`.
     - Mobile `44px` minimum tap targets, `3px solid var(--primary)` `:focus-visible` outline, and `@media (prefers-reduced-motion: reduce)` support.

2. **Registry Metadata Sync & Tests (`storefront-themes.ts`, `storefront-themes.test.ts`):**
   - Updated `radius` (`control`/`card`) and `shortDescription` in `STOREFRONT_THEMES` to match the CSS tokens.
   - Added Vitest assertions verifying `--radius-control` / `--radius-card` parity, zero `box-shadow` / gradients, `:lang(ne)` protection, and `prefers-reduced-motion`.

3. **Screenshots & Contact Sheets (`.theme-review/phase-c/`):**
   - Set A (`40` PNGs): `brewmellow` across all 4 themes x 5 pages (`home`, `pdp`, `cart`, `checkout`, `account`) x 2 viewports (`360`, `desktop`) + `set-a-brewmellow-1280-contact-sheet.png` and `set-a-brewmellow-360-contact-sheet.png`.
   - Set B (`8` PNGs): matching store per theme (`brewmellow` on `editorial-warm`, `himalayan-artisans` on `pahadi-sage`, `ktm-streetwear` on `ktm-bold`, `himalayan-roasters` on `midnight-obsidian`) at `1280` and `360` + `set-b-matching-stores-1280-contact-sheet.png` and `set-b-matching-stores-360-contact-sheet.png`.
   - Devanagari verification (`4` PNGs + `devanagari-sample-contact-sheet.png`): verified `textTransform: "none"` and `letterSpacing: "normal"` on `lang="ne"` across all 4 themes.
