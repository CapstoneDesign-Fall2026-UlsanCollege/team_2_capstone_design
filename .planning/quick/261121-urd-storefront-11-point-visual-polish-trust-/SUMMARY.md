---
quick_id: "261121-urd"
phase: "Phase C4 (11-Point Visual Polish & Screenshot Suite)"
title: "Trust strip, story heading dedup, auto-fit grid, announcement tokens, origin badges, demo data images, and full screenshot suite"
branch: "feature/storefront-template-system"
date: "2026-11-21"
status: "complete"
---

# Summary — 11-Point Storefront Polish & Complete Screenshot Suite

## What Changed

1. **Compact Trust Strip (`StorefrontCatalogView.tsx`, `globals.css`):** Replaced the full Delivery table + FAQ accordion on the home page with `.sf-trust-section` / `.sf-trust-box` showing delivery rates, COD/Khalti payment availability, WhatsApp/Contact link, and a direct link to `/s/[storeSlug]/shipping`.
2. **Story Heading & Empty-State Guard (`StorefrontCatalogView.tsx`):** `storyHeading` uses `store.story_headline` only when distinct from the hero `headline` (otherwise `"Our story"`), and the section hides completely when `store.about_text` is empty. Populated `himalayan-roasters` story headline and about text in local demo data.
3. **Complete-Row Auto-Fit Grid (`ProductGrid.tsx`, `globals.css`):** Added `data-item-count` and `data-grid-cols` (`3 -> 3`, `6 -> 3x2`, `2 -> 2` centered, `1 -> 1` centered) with `Editorial = 3 columns` on desktop and zero orphan cells.
4. **Per-Theme Announcement Bar Tokens (`StorefrontHeader.tsx`, `globals.css`):** Added `--announcement-bg`, `--announcement-fg`, `--announcement-border` across all 4 presets (`#141821` bg / `#E5B143` fg on `midnight-obsidian`).
5. **Header Tagline Hidden (`StorefrontHeader.tsx`):** Removed the truncated header tagline span beneath the store name.
6. **Tokenized Filter Bar & Sort `<select>` (`StorefrontCatalogView.tsx`):** Styled category pills, `In stock only` toggle, and `appearance-none` sort `<select>` with custom Lucide `ChevronDown`, `--radius-control`, and theme tokens.
7. **`ktm-bold` Outline Cleanup (`globals.css`):** Removed `outline: 2px solid var(--primary)` from `ktm-bold` story and trust boxes, keeping clean `3px / 9px` solid `--ink` offset borders.
8. **`pahadi-sage` Origin Badge (`ProductGrid.tsx`, `globals.css`):** Added `.sf-origin-badge` displaying `origin`/`district` metadata as a botanical pill badge on `pahadi-sage` product cards.
9. **Product-Relevant Demo Data (`frontend/public/images/products/*.svg` + local DB):** Created 7 product-relevant SVG illustrations (`ilam-black-tea.svg`, `himalayan-chamomile.svg`, `wild-turmeric-ginger.svg`, `ktm-boxy-tee.svg`, `thamel-hoodie.svg`, `heritage-corduroy-cap.svg`, `matte-pour-over-dripper.svg`), mapped `Raw Mountain Cliff Honey` to `himalayan-honey.svg`, and removed the stray `sub-tea-1` row from `brewmellow` (`0` `"No image"` tiles across all demo stores).
10. **Home Sticky Bar Removed (`StorefrontCatalogView.tsx`):** Removed the mobile sticky `Quick order bar` from the home page so it appears only on product detail pages (`ProductDetailView.tsx`) and never overlaps `"Shop all"` at `360px`.
11. **Complete Screenshot Suite (`.theme-review/`):** Saved `91` PNGs (Home, PDP, Cart with item, Checkout, Account Sheet, Matching Stores, 3 Hero Cases, Devanagari sample, and 13 contact sheets at `360` and `1280`) directly in `.theme-review/` and `.theme-review/phase-c/`.
