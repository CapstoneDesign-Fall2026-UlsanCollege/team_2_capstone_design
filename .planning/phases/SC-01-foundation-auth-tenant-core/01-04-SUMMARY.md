# Plan 01-04 Summary: Three-Surface CSS Tokens & Route Shells

**Phase:** SC-01-foundation-auth-tenant-core  
**Plan:** 01-04  
**Status:** Complete  
**Commit:** `b109202`  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope
- **CSS Token Architecture:** Implemented exact `DESIGN.md` §2 custom properties across three isolated surfaces:
  - Surface 1 (`:root` Platform): `--sc-paper`, `--sc-surface`, `--sc-ink`, `--sc-ink-2`, `--sc-ink-3`, `--sc-line`, `--sc-marigold`, `--sc-marigold-soft`, `--sc-success`, `--sc-danger`.
  - Surface 2 (`.console` & `.console.dark` Merchant Console): zinc tokens with `--st-*` order status colors (`--st-new`, `--st-packed`, `--st-shipped`, `--st-delivered`, `--st-cancelled`). Zero `--sf-*` leakage.
  - Surface 3 (`@theme inline` & `[data-store-theme]` Presets): scoped `--sf-*` tokens for `editorial-warm`, `pahadi-sage`, and `ktm-bold` with zero raw hex in `/s/**`.
- **Shared Utility:** Created `frontend/src/lib/utils.ts` exporting `cn(...inputs: ClassValue[])` combining `clsx` and `tailwind-merge`.
- **Chrome Cleanup:** Removed legacy single-tenant `frontend/src/components/Navbar.tsx` and refactored `frontend/src/app/layout.tsx` into a neutral root shell with `Noto_Sans_Devanagari` (`preload: false` for Nepali 4G mobile font budget).
- **Surface Shells:**
  - Platform (`frontend/src/app/(platform)/layout.tsx`): 3 font families (`Bricolage_Grotesque`, `Geist`, `Geist_Mono`), hairline topbar, live marigold indicator.
  - Merchant Console (`frontend/src/app/merchant/[storeSlug]/`): wrapped in `.console`, `Geist` + `Geist_Mono`, neutral header badge, and routable overview page with `--st-new` indicator.
  - Storefront (`frontend/src/app/s/[storeSlug]/`): Server Component fetching `GET /api/stores/<slug>/` (with fallback for build probes), scoping `data-store-theme={themePreset}`, attaching active preset fonts (`<= 3` families per route), hairline header, and leaf page with zero raw hex literals.

---

## 2. Verification Results
1. `node frontend/scripts/check-surfaces.mjs`:
   - Output: `SURFACE_ISOLATION_OK`
   - Verified 0 raw hex colors in `/s/**` and 0 `--sf-*` tokens in `/merchant/**`.
2. `npm --prefix frontend run build`:
   - Next.js 16.3.5 compiled all routes cleanly with zero TypeScript or webpack errors.
   - Routable App Router paths confirmed:
     - `○ /` (Platform root)
     - `ƒ /merchant/[storeSlug]` (Dynamic Console shell)
     - `ƒ /s/[storeSlug]` (Dynamic Storefront shell)
3. `backend/venv/Scripts/python.exe backend/manage.py test accounts stores.tests.test_isolation`:
   - 18 tests passing in 7.6s with memory SQLite database.

---

## 3. Deviations & Decisions
- Scoped font variable loading in `StorefrontLayout` to ensure that on any given store page, only 3 font families (Display + Body + JetBrains Mono) are loaded, adhering strictly to the Nepali mobile font budget in `DESIGN.md` §0.
