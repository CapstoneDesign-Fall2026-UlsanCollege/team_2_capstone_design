# Roadmap: ShopCraft Multi-Tenant Platform (Post-Midterm Pivot from BrewMellow)

## Overview

Following our Midterm evaluation, Team 2 executed a post-midterm architectural pivot from a standalone single-store coffee website (**BrewMellow**) to **ShopCraft** — a multi-tenant e-commerce SaaS platform engineered specifically for Nepal's independent craft merchants.

BrewMellow is preserved as our flagship pilot tenant (Store #1) selling single-origin Himalayan coffees at `/s/brewmellow`, running alongside Store #2 (`pahadi-honey`) to rigorously verify multi-tenant PostgreSQL Row-Level Security (RLS) data isolation and localized Khalti Sandbox ePayment v2 processing.

This roadmap guides Sprint 2 (Weeks 9–11: October 29 – November 12, 2026), moving from our Midterm vertical slice to a verified, feature-frozen MVP.

---

## Phases (Sprint 2: MVP & Freeze Gate)

**Capstone Sprint 2 Schedule Alignment (Weeks 9–11 / MVP & Freeze Gate):**

- [x] **Phase 1: Foundation, Auth & Tenant Core** (Completed: Oct 30, 2026)  
  Single Django/DRF backend, CI pipeline, passwordless session auth, core multi-tenant schema with Postgres Row-Level Security (RLS) isolation, and idempotent `manage.py seed_brewmellow` populating BrewMellow as Store #1.

- [x] **Phase 2: Merchant Onboarding, Console & Catalog** (Completed: Oct 30, 2026)  
  Self-serve "Create Store" flow, `/merchant/[storeSlug]` Polaris-style console, products/variants management, Cloudinary photo uploads, selling plans, branding, and encrypted per-store Khalti key configuration.

- [x] **Phase 3: Multi-Tenant Storefront, Checkout & Khalti Sandbox Payments** (Completed: Nov 2, 2026)  
  Themed `/s/[storeSlug]` storefronts (`/s/brewmellow`), store-namespaced cart drawer, single-screen checkout with Nepali addresses, official Khalti ePayment v2 sandbox (`pidx` server-side verification) + Cash on Delivery (COD) fallback, immutable order snapshots, and merchant fulfillment queue.

- [ ] **Phase 4: Multi-Store Demo, Production Hardening & MVP Freeze (Subscriptions Cut in PR #45)** (Active / In Progress: Nov 3 – Nov 12, 2026; Freeze Gate: Nov 12)  
  *(Scope Note: Following PR #45 and Week 9 Scope Cut, recurring shopper subscriptions were formally removed from the MVP. All purchases are direct one-time retail).* Second demo tenant (`/s/pahadi-honey` / `himalayan-artisans`) proving PostgreSQL RLS isolation, platform landing showcase (`/`), Khalti Sandbox v2 + COD fallback verification, and end-to-end regression freeze (114 active tests) ahead of the Week 11 MVP Gate.

---

## Phase Details

### Phase 1: Foundation, Auth & Tenant Core
**Goal:** As a shopper or merchant, I want to sign in passwordlessly on an isolated multi-tenant store core, so that every store keeps its data private.  
**Mode:** MVP Core  
**Depends on:** Nothing (first phase)  
**Requirements**: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04]  
**Success Criteria** (Verified):
1. Legacy BrewMellow demo remains live and unmodified while platform runs against separate Neon branches, GitHub Actions CI is green, and `/api/health/` responds 200 through Next.js `/api/*` rewrites.
2. A user can sign in passwordlessly via 6-digit Email OTP or Google OAuth with `HttpOnly` session cookies and manage saved Nepali delivery addresses.
3. Core models (`Store`, `StoreMembership`, `Customer`, `Product`, `Variant`, `SellingPlan`, `Order`, `OrderItem`, `OrderEvent`, `Subscription`) exist on a fresh migration graph and `manage.py seed_brewmellow` idempotently populates BrewMellow as Store #1.
4. Automated isolation tests prove Merchant A receives HTTP 404 on Merchant B's store endpoints and Shopper X receives HTTP 404 on Shopper Y's orders/addresses (47/47 Django tests passing).

**Completed Plans:**
- [x] `01-01-PLAN.md` — Walking Skeleton: custom email `User`, `Store`/`StoreMembership`/`Customer` core, `/api/health/` + Next.js `/api/*` proxy, hardened settings, & CI
- [x] `01-02-PLAN.md` — Passwordless 6-digit Email OTP + Google OAuth session API, Nepali `DeliveryAddress` CRUD, typed CSRF client, `OtpInput` & `check-surfaces.mjs` guard
- [x] `01-03-PLAN.md` — Multi-tenant `Product`/`Variant`/`SellingPlan`/`Order`/`Subscription` models, `StoreScopedAPIViewMixin` isolation guards, `seed_brewmellow` & automated HTTP 404 isolation suite
- [x] `01-04-PLAN.md` — Three-surface CSS token architecture (`--sc-*`, `.console`, `--sf-*`), routable storefront & console shells (`s/[storeSlug]` & `merchant/[storeSlug]`)
- [x] `01-05-PLAN.md` — Passwordless `/login` & `/signup` Platform screens, complete `demo_user` removal, and `/account/addresses` cascading `AddressSheet` UI

---

### Phase 2: Merchant Onboarding, Console & Catalog
**Goal:** Enable any authenticated user to launch a new store and manage its branding, products, variants, Cloudinary images, selling plans, and Khalti payment credentials from a scoped merchant console.  
**Mode:** MVP Core  
**Depends on:** Phase 1  
**Requirements**: [MERCH-01, MERCH-02, MERCH-03, MERCH-04]  
**Success Criteria** (Verified):
1. A newly registered user completes `/merchant/new` ("Create Store" wizard) with slug validation and lands in `/merchant/[storeSlug]` as `OWNER`.
2. Merchant can create, edit, and archive products with Cloudinary-uploaded photos, custom `attributes` chips, and integer-paisa variants, plus toggle one-time/subscription availability and selling plans.
3. Merchant can update store logo, brand colors, contact info, and optional encrypted Khalti secret key (with clear "Sandbox Fallback Active" indicator when unset).
4. Non-members or owners of another store attempting to access `/merchant/[storeSlug]` or its APIs are blocked with 403/404.

**Completed Plans:**
- [x] `02-01-PLAN.md` — Console Shell, Navigation, ⌘K Palette & Merchant Overview Dashboard
- [x] `02-02-PLAN.md` — Store Branding, Delivery Rates & Encrypted Khalti Credentials
- [x] `02-03-PLAN.md` — Product Catalog Management & Cloudinary Photo Uploads
- [x] `02-04-PLAN.md` — Spreadsheet-Style Variant Editor, Integer Paisa & Selling Plans

---

### Phase 3: Multi-Tenant Storefront, Checkout & Khalti Sandbox Payments
**Goal:** Deliver dynamic themed storefronts at `/s/[storeSlug]`, store-isolated cart and login-gated checkout, verified Khalti sandbox and Cash on Delivery orders, confirmation emails, shopper order tracking, and merchant order fulfillment.  
**Mode:** MVP Core  
**Depends on:** Phase 2  
**Requirements**: [SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, MERCH-05]  
**Success Criteria** (Verified):
1. Visiting `/s/brewmellow` and a second merchant's `/s/[storeSlug]` renders each store's distinct theme, logo, and database catalog; unknown or inactive slugs return 404.
2. Shopper adds one-time items to a store-namespaced cart, selects/adds a Nepali address, and completes both a Khalti Sandbox payment (verified server-side via `epayment/lookup/` with `pidx` idempotency) and a COD order with server-authoritative pricing.
3. Confirmed orders trigger an email receipt and appear in `/s/[storeSlug]/account` with immutable price/address snapshots.
4. Merchant views store KPIs and customers in `/merchant/[storeSlug]` and transitions order statuses (`PAID/CONFIRMED → PROCESSING → SHIPPED → DELIVERED`), appending `OrderEvent` entries visible to the shopper.

**Completed Plans:**
- [x] `03-01-PLAN.md` — Dynamic Storefront Catalog & Scoped Product Detail
- [x] `03-02-PLAN.md` — Store-Scoped Cart Drawer & Server Price Calculation
- [x] `03-03-PLAN.md` — Single-Screen Checkout, Khalti Sandbox & Cash on Delivery
- [x] `03-04-PLAN.md` — Merchant Order Queue & Fulfillment Pipeline

---

### Phase 4: Multi-Store Demo, Production Hardening & MVP Freeze (Subscriptions Cut in PR #45)
**Goal:** Deliver a rock-solid multi-tenant demo with two distinct stores, public platform showcase, legacy URL redirects, and 100% regression freeze ahead of the Week 11 MVP Gate (Nov 12).  
**Mode:** MVP Hardening & Freeze  
**Depends on:** Phase 3  
**Requirements**: [SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, MERCH-05, LAUNCH-01, LAUNCH-02]  
*(Note: SUBS-01, SUBS-02, SUBS-03, SUBS-04 were formally cut from MVP in PR #45. All purchases operate as direct one-time transactions with Khalti Sandbox v2 and Cash on Delivery).*  
**Target Completion:** November 12, 2026 (Week 11 MVP Gate)  
**Success Criteria:**
1. Shopper completes direct one-time purchase on Store #1 (`/s/brewmellow`) and Store #2 (`/s/pahadi-honey`) with localized Nepali addresses.
2. Official Khalti Sandbox ePayment v2 completes via test credentials (`9800000000` / OTP `987654`) with server-authoritative `epayment/lookup/` verification, paired with instant zero-network Cash on Delivery (COD) fallback.
3. PostgreSQL Row-Level Security (RLS) isolation prevents Store B merchant from probing Store A data (HTTP 404).
4. Public landing page at `/` showcases the platform with live links to demo stores, legacy URLs redirect cleanly, and all 114 backend tests across active apps (`accounts catalog orders stores`) pass cleanly.

**Phase 4 Plan Status:**
- [-] `04-01-PLAN.md` — [CUT / RETIRED in PR #45] (Shopper Subscriptions formally cut per PR #45; out of MVP scope)
- [-] `04-02-PLAN.md` — [CUT / RETIRED in PR #45] (Merchant Subscriptions Workspace formally cut per PR #45; out of MVP scope)
- [x] `04-03-PLAN.md` — Second Demo Store (`Himalayan Artisans` / `Pahadi Honey`) & Multi-Tenant Isolation
- [x] `04-04-PLAN.md` — Public Platform Landing Page & Production Launch Readiness
- [ ] `04-05-PLAN.md` — Independent Teammate Regression Verification & MVP Freeze Sign-off (Target: Nov 10–12, 2026)

---

## Progress Summary (Current Snapshot: Week 10 / Nov 9, 2026)

| Phase | Plans Complete | Current Status | Completion / Target Date |
|---|---|---|---|
| **1. Foundation, Auth & Tenant Core** | 5/5 | Verified (47 Tests Pass) | Completed Oct 30, 2026 |
| **2. Merchant Onboarding & Catalog** | 4/4 | Verified | Completed Oct 30, 2026 |
| **3. Storefront, Checkout & Khalti Sandbox** | 4/4 | Verified (Sandbox + COD) | Completed Nov 2, 2026 |
| **4. Multi-Store Demo & MVP Freeze (Subscriptions Cut)** | Active | 114 Tests Pass; Subscriptions Cut in PR #45 | Target Nov 12, 2026 (Freeze Gate) |
