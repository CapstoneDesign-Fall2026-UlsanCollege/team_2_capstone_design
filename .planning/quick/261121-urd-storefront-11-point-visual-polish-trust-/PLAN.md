---
quick_id: "261121-urd"
phase: "Phase C4 (11-Point Visual Polish & Screenshot Suite)"
title: "Trust strip, story heading dedup, auto-fit grid, announcement tokens, origin badges, demo data images, and full screenshot suite"
status: "in_progress"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
---

# Quick Task 261121-urd: 11-Point Storefront Polish & Complete Screenshot Suite

## Tasks
1. Replace full Delivery table + FAQ on the home page (`StorefrontCatalogView.tsx`) with a compact trust strip (`sf-trust-section`) linking to `/s/[storeSlug]/shipping`.
2. Ensure Story section uses its own heading (`story_headline` if distinct from hero headline, else `"Our story"`), hides when `about_text` is empty, and populates `himalayan-roasters` story copy.
3. Implement complete-row auto-fit grid density by item count (`3 -> 3`, `6 -> 3x2`, `Editorial = 3 columns`) via `data-grid-cols` in `ProductGrid.tsx` and `[data-store-theme]` rules in `globals.css`.
4. Add per-theme `--announcement-bg`, `--announcement-fg`, `--announcement-border` tokens so `midnight-obsidian` renders a dark slate/gold bar instead of white.
5. Remove the truncated header tagline from `StorefrontHeader.tsx`.
6. Style sort `<select>` and filter controls with theme tokens and custom Lucide chevron.
7. Remove the thin blue `outline` from `ktm-bold` story and trust/shipping boxes.
8. Add `.sf-origin-badge` on `pahadi-sage` product cards.
9. Replace all missing/mismatched demo product images with product-relevant SVG illustrations (`ilam-black-tea.svg`, `himalayan-chamomile.svg`, `wild-turmeric-ginger.svg`, `ktm-boxy-tee.svg`, `thamel-hoodie.svg`, `heritage-corduroy-cap.svg`, `matte-pour-over-dripper.svg`, `himalayan-honey.svg`) and delete the stray `sub-tea-1` row from `brewmellow`.
10. Remove the mobile sticky `"Add to bag"` bar from the home page (`StorefrontCatalogView.tsx`).
11. Capture all PNGs (`home`, `pdp`, `cart`, `checkout`, `account`, `matched`, `devanagari`, and contact sheets) at `360` and `1280` into `.theme-review/`.
