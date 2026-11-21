---
quick_id: "261121-w8w"
phase: "Phase C5 (4 Mobile Polish Fixes & Readable PDF/PNG Review Packet)"
title: "Mobile announcement wrap, odd-card 2-col span, Editorial >=44px Add button, Pahadi trust strip radius, 3-step Account Sheet, and multi-page PDF packet"
status: "in_progress"
branch: "feature/storefront-template-system"
base_branch: "dev/storefront-themes"
---

# Quick Task 261121-w8w: 4 Mobile Polish Fixes & Full Readable PDF/PNG Review Packet

## Tasks
1. Fix `ktm-bold` announcement bar mobile truncation by replacing `h-9` + `truncate` in `StorefrontHeader.tsx` with `min-h-9 py-1.5` and wrapping text (`break-words`) with `0.02em` tracking.
2. Eliminate the orphan 3rd card in 2-column mobile product grids via `#collection-section > .grid > *:last-child:nth-child(odd) { grid-column: 1 / -1; }` and `16/10` media aspect ratio on mobile.
3. Make `editorial-warm` `"Add"` a clear bordered button control with a `>= 44px` (`44px × 56px`) tap target on mobile.
4. Change `pahadi-sage` `.sf-trust-box` from `border-radius: 9999px` (pill) to `border-radius: var(--radius-card)` (`24px`).
5. Capture all required PNGs at `360` and `1280` across all 4 themes — including all 3 Account Sheet steps (`email`, `otp`, `signedin`), PDP, Cart (with item), Checkout, 3 Hero Cases at `1280`, Set A/B `1280` Home pages, and Devanagari samples — and generate a readable one-image-per-page PDF (`storefront-theme-review-packet.pdf`) + direct full-size image embeds in `theme_previews.md`.
