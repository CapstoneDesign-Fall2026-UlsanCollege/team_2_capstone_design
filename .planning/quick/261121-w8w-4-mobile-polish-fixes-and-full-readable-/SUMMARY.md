---
quick_id: "261121-w8w"
phase: "Phase C5 (4 Mobile Polish Fixes & Readable PDF/PNG Review Packet)"
title: "Mobile announcement wrap, odd-card 2-col span, Editorial >=44px Add button, Pahadi trust strip radius, 3-step Account Sheet, and multi-page PDF packet"
branch: "feature/storefront-template-system"
date: "2026-11-21"
status: "complete"
---

# Summary — 4 Mobile Polish Fixes & Full Readable PDF/PNG Review Packet

## What Changed

1. **`ktm-bold` Announcement Bar Wrap (`StorefrontHeader.tsx`, `globals.css`):** Replaced fixed `h-9` + `truncate` with `min-h-9 py-1.5` and `break-words` + `0.02em` letter-spacing so the announcement bar wraps cleanly on `360px` mobile without truncating (`annTruncated: false` across all 4 themes).
2. **2-Column Mobile Grid Odd-Card Span (`globals.css`):** Added `@media (max-width: 767px) { [data-store-theme] #collection-section > .grid > *:last-child:nth-child(odd) { grid-column: 1 / -1; } }` with a `16/10` media aspect ratio so 3-item mobile grids have zero orphan half-rows (`lastCardWidth: 320–328px`).
3. **`editorial-warm` Clear `"Add"` Control (`globals.css`):** Styled `#collection-section .sf-card-radius button` and `.sf-hero-caption button` as a bordered button control (`background: var(--surface); border: var(--bw) solid var(--ink); border-radius: var(--radius-control); min-height: 44px; min-width: 56px` on mobile).
4. **`pahadi-sage` Trust Strip Card Radius (`globals.css`):** Changed `.sf-trust-box` from `border-radius: 9999px` (pill) to `border-radius: var(--radius-card)` (`24px`).
5. **Full-Size Readable PNGs & 80-Page One-Image-Per-Page PDF (`.theme-review/` & `theme_previews.md`):**
   - Captured all 3 Account Sheet steps (`account-email`, `account-otp`, `account-signedin`), PDP, Cart (with item), Checkout, Set A/B Home pages, 3 Hero Cases, and Devanagari samples across all 4 themes at `360` and `1280` (`115` PNGs in `.theme-review/`).
   - Generated `D:\Team2_Capstone_project\team_2_capstone_design\.theme-review\storefront-theme-review-packet.pdf` (`80` pages, 1 image per A4 page).
   - Embedded all individual PNGs directly at full width in `theme_previews.md` (no carousels or tiny 4-up strips).
