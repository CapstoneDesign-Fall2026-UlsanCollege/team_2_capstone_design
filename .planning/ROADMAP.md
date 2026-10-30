# Roadmap: ShopCraft

## Overview

ShopCraft pivots the single-tenant BrewMellow app into a production-structured multi-tenant e-commerce & subscription SaaS over four weekly vertical phases (Oct 30 – Nov 26, 2026). Phase 1 establishes the single Django/DRF backend, deployment pipeline, real session authentication, tenant-scoped core schema, and BrewMellow Store #1 seed. Phase 2 unlocks self-serve merchant store creation, catalog/variant management, branding, and per-store payment settings. Phase 3 delivers themed `/s/[storeSlug]` storefronts, cart & address checkout, verified Khalti sandbox + COD payments, and merchant order fulfillment. Phase 4 completes non-recurring subscriptions, the public ShopCraft SaaS landing page, second demo store, legacy redirects, and production cutover ahead of the Nov 26 deadline.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned weekly capstone phases
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [ ] **Phase 1: Foundation, Auth & Tenant Core** - Single Django/DRF backend, CI/staging pipeline, real session auth, core multi-tenant models, isolation guards, and `seed_brewmellow` (Oct 30 – Nov 5)
- [ ] **Phase 2: Merchant Onboarding, Console & Catalog** - Self-serve "Create Store" wizard, `/merchant/[storeSlug]` console, products/variants/images, selling plans, branding, and Khalti key config (Nov 6 – Nov 12)
- [x] **Phase 3: Multi-Tenant Storefront, Checkout & Payments** - Themed `/s/[storeSlug]` storefronts, cart, Nepali addresses, Khalti ePayment v2 sandbox + COD, emails, shopper account, and merchant order management (Nov 13 – Nov 19)
- [ ] **Phase 4: Subscriptions, SaaS Landing & Production Launch** - Prepaid & pay-per-delivery subscriptions, cycle generator, pause/skip/cancel, ShopCraft `/` landing page, 2nd demo tenant, redirects, and cutover (Nov 20 – Nov 26; Freeze Nov 24)

## Phase Details

### Phase 1: Foundation, Auth & Tenant Core
**Goal:** As a shopper or merchant, I want to sign in passwordlessly on an isolated multi-tenant store core, so that every store keeps its data private.
**Mode:** mvp
**UI hint**: yes
**Depends on**: Nothing (first phase)
**Requirements**: [FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04]
**Success Criteria** (what must be TRUE):
  1. Legacy BrewMellow demo remains live and unmodified while ShopCraft runs against separate Neon branches, GitHub Actions CI is green, and `/api/health/` responds 200 through Next.js `/api/*` same-origin rewrites on staging.
  2. A user can sign in passwordlessly via 6-digit Email OTP or Google OAuth with `HttpOnly` session cookies and manage saved Nepali delivery addresses (`localStorage["demo_user"]` and Next.js SQL routes are gone).
  3. Core models (`Store`, `StoreMembership`, `Customer`, `Product`, `Variant`, `SellingPlan`, `Order`, `OrderItem`, `OrderEvent`, `Subscription`) exist on a fresh migration graph and `manage.py seed_brewmellow` idempotently populates BrewMellow as Store #1.
  4. Automated isolation tests prove Merchant A receives HTTP 404 on Merchant B's store endpoints and Shopper X receives HTTP 404 on Shopper Y's orders/addresses.
**Plans**: 5 plans

Plans:
- [x] `01-01-PLAN.md` — Walking Skeleton: custom email `User`, `Store`/`StoreMembership`/`Customer` core, `/api/health/` + Next.js `/api/*` proxy, legacy Next.js SQL removal, hardened settings, `Procfile` & CI (Wave 1)
- [x] `01-02-PLAN.md` — Passwordless 6-digit Email OTP + Google OAuth session API, Nepali `DeliveryAddress` CRUD, typed CSRF client, `OtpInput` & `check-surfaces.mjs` guard (Wave 2)
- [x] `01-03-PLAN.md` — Multi-tenant `Product`/`Variant`/`SellingPlan`/`Order`/`Subscription` models, `StoreScopedAPIViewMixin` isolation guards, `seed_brewmellow` & automated HTTP 404 isolation suite (Wave 3)
- [x] `01-04-PLAN.md` — Three-surface CSS token architecture (`--sc-*`, `.console`, `--sf-*`), routable storefront & console shells (`s/[storeSlug]` & `merchant/[storeSlug]`), and `utils.ts` (Wave 3)
- [x] `01-05-PLAN.md` — Passwordless `/login` & `/signup` Platform screens, complete `demo_user` removal, and `/account/addresses` cascading `AddressSheet` UI (Wave 4)

### Phase 2: Merchant Onboarding, Console & Catalog
**Goal**: Enable any authenticated user to launch a new store and manage its branding, products, variants, Cloudinary images, selling plans, and Khalti payment credentials from a scoped merchant console.
**Mode:** mvp
**UI hint**: yes
**Depends on**: Phase 1
**Requirements**: [MERCH-01, MERCH-02, MERCH-03, MERCH-04]
**Success Criteria** (what must be TRUE):
  1. A newly registered user completes `/merchant/new` ("Create Store" wizard) with slug validation and lands in `/merchant/[storeSlug]` as `OWNER`.
  2. Merchant can create, edit, and archive products with Cloudinary-uploaded photos, custom `attributes` chips, and integer-paisa variants, plus toggle one-time/subscription availability and selling plans.
  3. Merchant can update store logo, brand colors, contact info, and optional encrypted Khalti secret key (with clear "Sandbox Fallback Active" indicator when unset).
  4. Non-members or owners of another store attempting to access `/merchant/[storeSlug]` or its APIs are blocked with 403/404.
**Plans**: 4 plans

Plans:
- [x] `02-01-PLAN.md` — Console Shell, Navigation, ⌘K Palette & Merchant Overview Dashboard (Wave 1)
- [x] `02-02-PLAN.md` — Store Branding, Delivery Rates & Encrypted Khalti Credentials (Wave 2)
- [x] `02-03-PLAN.md` — Product Catalog Management & Cloudinary Photo Uploads (Wave 3)
- [x] `02-04-PLAN.md` — Spreadsheet-Style Variant Editor, Integer Paisa & Selling Plans (Wave 4)

### Phase 3: Multi-Tenant Storefront, Checkout & Payments
**Goal**: Deliver dynamic themed storefronts at `/s/[storeSlug]`, store-isolated cart and login-gated checkout, verified Khalti sandbox and Cash on Delivery orders, confirmation emails, shopper order tracking, and merchant order fulfillment.
**Mode:** mvp
**UI hint**: yes
**Depends on**: Phase 2
**Requirements**: [SHOP-01, SHOP-02, SHOP-03, SHOP-04, SHOP-05, MERCH-05]
**Success Criteria** (what must be TRUE):
  1. Visiting `/s/brewmellow` and a second merchant's `/s/[storeSlug]` renders each store's distinct theme, logo, and database catalog; unknown or inactive slugs return 404.
  2. Shopper adds one-time items to a store-namespaced cart, selects/adds a Nepali address, and completes both a Khalti Sandbox payment (verified server-side via `epayment/lookup/` with `pidx` idempotency) and a COD order with server-authoritative pricing.
  3. Confirmed orders trigger an email receipt and appear in `/s/[storeSlug]/account` with immutable price/address snapshots.
  4. Merchant views store KPIs and customers in `/merchant/[storeSlug]` and transitions order statuses (`PAID/CONFIRMED → PROCESSING → SHIPPED → DELIVERED`), appending `OrderEvent` entries visible to the shopper.
**Plans**: 4 plans

Plans:
- [x] `03-01-PLAN.md` — Dynamic Storefront Catalog & Scoped Product Detail (Wave 1)
- [x] `03-02-PLAN.md` — Store-Scoped Cart Drawer & Server Price Calculation (Wave 2)
- [x] `03-03-PLAN.md` — Checkout, Khalti Sandbox & Cash on Delivery (Wave 3)
- [x] `03-04-PLAN.md` — Merchant Order Queue & Fulfillment Pipeline (Wave 4)

### Phase 4: Subscriptions, SaaS Landing & Production Launch
**Goal**: Ship prepaid and pay-per-delivery subscription lifecycles, the public ShopCraft SaaS marketing experience, a polished second non-coffee demo tenant, legacy BrewMellow URL redirects, and production cutover before Nov 26.
**Mode:** mvp
**UI hint**: yes
**Depends on**: Phase 3
**Requirements**: [SUBS-01, SUBS-02, SUBS-03, SUBS-04]
**Success Criteria** (what must be TRUE):
  1. Shopper purchases both a prepaid commitment subscription (3/6/12 cycles) and a pay-per-delivery subscription on eligible variants.
  2. Running `manage.py run_subscription_cycles` (or clicking "Run Cycle Now" in the merchant console) idempotently creates `$0` fulfillment orders for prepaid subscriptions and `PENDING_PAYMENT` renewal orders with working "Pay Now" links for pay-per-delivery subscriptions.
  3. Shopper and merchant can pause, resume, skip next cycle, or cancel a subscription from their respective consoles.
  4. `/` showcases ShopCraft with live links to at least two distinct demo stores (`BrewMellow` + Store #2) and "Launch Your Store" CTA, legacy BrewMellow URLs redirect cleanly to `/s/brewmellow/...`, and production cutover + rollback checklist are verified by Nov 24–26.
**Plans**: 4 plans

Plans:
- [x] `04-01-PLAN.md` — Subscription Checkout & Idempotent Recurring Cycle Runner (Wave 1)
- [x] `04-02-PLAN.md` — Merchant Subscriptions Workspace & Shopper Lifecycle Controls (Wave 2)
- [ ] `04-03-PLAN.md` — Second Demo Store (Himalayan Artisans) & Legacy Next.js Redirects (Wave 3)
- [ ] `04-04-PLAN.md` — Public SaaS Platform Landing Page & Production Launch Readiness (Wave 4)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|---|---|---|---|
| 1. Foundation, Auth & Tenant Core | 5/5 | Completed | 2026-10-30 |
| 2. Merchant Onboarding, Console & Catalog | 4/4 | Completed | 2026-10-30 |
| 3. Multi-Tenant Storefront, Checkout & Payments | 4/4 | Completed | 2026-10-30 |
| 4. Subscriptions, SaaS Landing & Production Launch | 2/4 | In Progress | - |
