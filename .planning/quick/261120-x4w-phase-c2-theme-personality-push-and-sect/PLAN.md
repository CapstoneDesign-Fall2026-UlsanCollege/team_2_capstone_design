---
quick_id: "261120-x4w"
phase: "Phase C2"
title: "Theme personality push, grid density, section chrome, and contact sheets"
status: "in_progress"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
---

# Quick Task 261120-x4w: Phase C2 — Theme Personality Push & Section Chrome

## Tasks
1. Keep the shared component tree strictly untouched (zero DOM edits, zero behavior changes across cart, checkout, account, and variant sheet).
2. Add CSS-only differentiation in `frontend/src/app/globals.css` under `[data-store-theme]` with zero `box-shadow` and zero gradients:
   - Per-theme radii, border widths, field tokens, and section spacing scales (`--radius-control`, `--radius-card`, `--radius-field`, `--bw`, `--bw-field`, `--space-section`).
   - Grid density per theme (`editorial-warm`: roomy 2-column gallery grid; `pahadi-sage`: 4-column desktop centered cards with pill controls; `ktm-bold`: 4-column brutalist cards with `3px` ink borders + solid offset blocks; `midnight-obsidian`: 4-column flush hairline-divided gallery wall).
   - Section chrome per theme across story band, shipping/payment cards, and footer (full-bleed vs soft framed `28px` cards vs thick `3px/9px` border + outline offset blocks vs hairline-divided dark gallery).
   - Protect Devanagari (`:lang(ne)`, `:lang(hi)`, `:lang(mai)`, `:lang(sa)`) from uppercase and letter-spacing, preserve `44px` tap targets, visible `:focus-visible` rings, and `prefers-reduced-motion: reduce`.
3. Update `storefront-themes.ts` radii and descriptions to match the new CSS silhouettes and extend `storefront-themes.test.ts` assertions.
4. Capture Set A (`brewmellow` in all 4 themes at `360` and `1280` across `home`, `pdp`, `cart`, `checkout`, `account`), Set B (matching store per theme at `360` and `1280`), Devanagari typography samples, and contact sheets for each set.
