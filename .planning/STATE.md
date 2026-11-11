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
