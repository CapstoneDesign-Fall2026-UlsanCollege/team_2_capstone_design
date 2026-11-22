---
gsd_state_version: "1.0"
current_phase: "Shopify Parity & Production Hardening — COMPLETE"
current_slice: "Slice 6: Dashboard Home, Analytics, Discounts, Settings & Final Polish"
status: "All 6 Slices Complete — 100% Verified"
last_updated: "2026-11-03T19:32:00.000Z"
last_activity: 2026-11-03
last_activity_desc: Completed Slice 6 (Polaris Dashboard Home with 7-day pulse & recent orders, Nepal 7-province Analytics & Khalti/COD rail mix, Discount promo codes with Postgres RLS & live checkout redemption, Settings hub with COD toggle, custom .com.np domain routing, Staff RBAC & tamper-evident Audit Log, 51/51 automated & isolation tests passing, SURFACE_ISOLATION_OK)
state_head: slice-6-complete
progress:
  audit_phase: complete
  total_slices: 6
  completed_slices: 6
  percent: 100
---

# Project State: ShopCraft

## Project Reference

See: `.planning/PROJECT.md` and `.planning/SHOPIFY_PARITY_ROADMAP.md`

**Core value:** Strict multi-tenant isolation and end-to-end checkout integrity — any merchant can launch an isolated storefront and fulfill verified Khalti or COD orders without ever leaking data across stores or breaking the frozen BrewMellow baseline.  
**Current milestone:** Shopify-Equivalent Parity for Nepal (6 Vertical Slices) — **100% COMPLETE**

## Current Position

Phase: Slice 6 (Dashboard Home, Analytics, Discounts, Settings, Staff RBAC & Final Polish) — COMPLETED  
All 6 Vertical Slices Delivered & Verified  
Roadmap File: `.planning/SHOPIFY_PARITY_ROADMAP.md`  

Progress: [==========] 100%

## Accumulated Context

### Active Decisions & Guidelines
- **Dual-Layer Tenant Isolation:** Enforced at both PostgreSQL Row-Level Security (`TENANT_TABLES` = 11 tables under `shopcraft_app` role) AND Django ORM `StoreScopedManager` (`get_current_tenant_id()` auto-scoping + `.for_store(store)`).
- **Security Hardening:** Removed `admin@` backdoor; store-prefixed authenticated media uploads; unguessable UUID `order.token` on public tracking & 1-click renewal payment links; Fernet AES-256 encrypted Khalti keys never sent to client; `OWNER` vs. `STAFF` RBAC with sole-owner protection and `MerchantAuditLog`.
- **Three-Surface CSS Token Isolation:** Verified via `npm run check:surfaces` (`SURFACE_ISOLATION_OK`). Merchant console stays strictly neutral zinc (`#18181B`); storefronts render 100% via `--sf-*` CSS tokens.
- **Nepal-Adapted Commerce Rails:** Integer `Rs.` NPR formatting with tabular numerals; 7-province ward delivery & province analytics; Khalti ePayment v2 + Cash on Delivery toggle; store-scoped Promo Codes (`DASHAIN15`, `WELCOME100`); direct one-time retail purchases with Khalti Sandbox v2 + COD fallback (subscriptions cut in PR #45).

## The 6 Slices
1. `Slice 1`: Fix data model + Postgres RLS + isolation tests (COMPLETED)
2. `Slice 2`: Auth + onboarding ("What you sell", City, "Your store is ready") + store creation & switcher (COMPLETED)
3. `Slice 3`: Merchant shell + Customers directory + Products + Orders (Polaris standard with shadcn/ui primitives) (COMPLETED)
4. `Slice 4`: Theme system + Story page + storefront + cart drawer + checkout (COMPLETED)
5. `Slice 5`: Subscriptions [FORMALLY CUT IN PR #45 — OUT OF MVP SCOPE]
6. `Slice 6`: Dashboard home, analytics, discounts, settings, staff RBAC & polish (COMPLETED)

## Quick Tasks Completed

| ID | Description | Branch | Date | Status | Directory |
|----|-------------|--------|------|--------|-----------|
| `261120-vme` | Phase A — Storefront theme correctness, contrast, token cleanup, and banner priority | `feature/storefront-template-system` | 2026-11-20 | complete | [.planning/quick/261120-vme-phase-a-storefront-theme-correctness-con](.planning/quick/261120-vme-phase-a-storefront-theme-correctness-con) |
| `261120-wbu` | Phase B — Single theme registry used by all 5 surfaces & loaded Google fonts | `feature/storefront-template-system` | 2026-11-20 | complete | [.planning/quick/261120-wbu-phase-b-single-theme-registry-used-by-al](.planning/quick/261120-wbu-phase-b-single-theme-registry-used-by-al) |
| `261120-wmj` | Phase C — Structural CSS switches + /merchant/new Step 2 lightweight previews | `feature/storefront-template-system` | 2026-11-20 | complete | [.planning/quick/261120-wmj-phase-c-structural-css-switches-and-wiza](.planning/quick/261120-wmj-phase-c-structural-css-switches-and-wiza) |
| `261120-x4w` | Phase C2 — Theme personality push, grid density, section chrome & contact sheets | `feature/storefront-template-system` | 2026-11-21 | complete | [.planning/quick/261120-x4w-phase-c2-theme-personality-push-and-sect](.planning/quick/261120-x4w-phase-c2-theme-personality-push-and-sect) |
| `261121-frt` | Hero clarity fix — 3 hero states (banner only, featured product + label, compact brand panel) | `feature/storefront-template-system` | 2026-11-21 | complete | [.planning/quick/261121-frt-hero-clarity-fix-three-hero-states-and-t](.planning/quick/261121-frt-hero-clarity-fix-three-hero-states-and-t) |
| `261121-urd` | 11-point storefront visual polish, trust strip, auto-fit 3/3x2 grids, demo images & full screenshot suite | `feature/storefront-template-system` | 2026-11-21 | complete | [.planning/quick/261121-urd-storefront-11-point-visual-polish-trust-](.planning/quick/261121-urd-storefront-11-point-visual-polish-trust-) |
| `261121-w8w` | 4 mobile polish fixes, 3-step Account Sheet captures & 80-page readable PDF/PNG review packet | `feature/storefront-template-system` | 2026-11-21 | complete | [.planning/quick/261121-w8w-4-mobile-polish-fixes-and-full-readable-](.planning/quick/261121-w8w-4-mobile-polish-fixes-and-full-readable-) |
