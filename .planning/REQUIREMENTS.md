# Requirements: ShopCraft

**Defined:** 2026-10-29
**Core Value:** Strict multi-tenant isolation and end-to-end checkout integrity — any merchant can launch an isolated storefront and fulfill verified Khalti or COD orders without ever leaking data across stores or breaking the frozen BrewMellow baseline.

## v1 Requirements

Requirements for the capstone SaaS release (deadline: 2026-11-26). Each maps to exactly one roadmap phase.

### Foundation & Tenant Isolation

- [ ] **FOUND-01**: Legacy BrewMellow baseline remains frozen on `legacy/brewmellow-v1` / tag `v1.0-midterm-brewmellow` with its original Neon database untouched while ShopCraft runs on isolated Neon branches (`dev`, `staging`, `prod-saas`)
- [ ] **FOUND-02**: Django 5 + DRF serves as the sole backend of record behind Next.js same-origin `/api/*` rewrites, with all legacy Next.js raw-SQL routes and silent `FALLBACK_ORDERS` mocks removed
- [ ] **FOUND-03**: Every tenant-owned model enforces `store` FK scoping via `StoreScopedManager` and URL-slug DRF permission mixins, verified by an automated CI test suite asserting HTTP 404 on cross-store access
- [ ] **FOUND-04**: Idempotent `manage.py seed_brewmellow` command seeds BrewMellow as Store #1 (`slug="brewmellow"`) with its theme, 3 origins × 4 weight variants (150g one-time only; 250g/500g/1kg subscription-eligible), selling plans, and demo orders
- [ ] **FOUND-05**: GitHub Actions CI runs Django tests, Next.js build, and lint on pushes/PRs, with `/api/health/` endpoint and Heroku staging deployment operational

### Identity & Accounts

- [ ] **AUTH-01**: User can sign up and sign in passwordlessly via 6-digit Email OTP (Resend, with console OTP banner in local dev) or Google OAuth on `accounts.User`, persisted with `HttpOnly` first-party Django session cookies and rate-limited endpoints
- [ ] **AUTH-02**: Auth flows enforce single-step progressive disclosure (email → 6-digit auto-advance code) with zero password-reset friction and automatic redirect back to Store Creation (`?name=`) or Checkout
- [ ] **AUTH-03**: One global `User` account automatically provisions per-store `Customer(store, user)` records on first interaction with a store so merchants only view customers of their own store
- [ ] **AUTH-04**: Authenticated shopper can create, edit, and select saved Nepali delivery addresses (Province, District, Municipality, Ward, Street/Landmark, and `98/97xxxxxxxx` mobile validation)

### Merchant Console & Catalog

- [ ] **MERCH-01**: Authenticated user can create a new store via an onboarding wizard (`name`, validated unique non-reserved `slug`, brand color, logo upload, contact details) and become `OWNER` in `StoreMembership`
- [ ] **MERCH-02**: Merchant owner can create, update, and activate/archive products with Cloudinary-uploaded images, flexible key/value `attributes` JSON, and priced variants stored in integer paisa (`price_minor`)
- [ ] **MERCH-03**: Merchant owner can configure store selling plans (prepaid 3/6/12-cycle discount tiers and pay-per-delivery) and toggle one-time vs subscription eligibility per product/variant
- [ ] **MERCH-04**: Merchant owner can update store theme/branding settings and save an optional encrypted Khalti secret key (`test`/`live` mode, defaulting to ShopCraft's sandbox key with a visible "Test Mode" indicator)
- [ ] **MERCH-05**: Merchant owner can view scoped store overview stats (order count, revenue, active subscriptions), customer directory, and advance orders through the validated state machine with `OrderEvent` audit history

### Storefront, Cart & Payments

- [ ] **SHOP-01**: Visitor can browse any active store at `/s/[storeSlug]` with server-rendered store branding, CSS theme variables, product catalog, and `404` on unknown/inactive slugs
- [ ] **SHOP-02**: Shopper can manage a store-namespaced cart (`sc:{storeSlug}:cart`) for one-time items and proceed to login-gated checkout where Django reprices all line items from database variants
- [ ] **SHOP-03**: Shopper can pay via Khalti ePayment v2 Sandbox (`POST epayment/initiate/` redirect → return handler → server-side `POST epayment/lookup/` amount & `pidx` idempotency verification)
- [ ] **SHOP-04**: Shopper can place Cash on Delivery (COD) orders (`CONFIRMED` / `COD_PENDING`) and receive transactional order confirmation emails with immutable `OrderItem` and address snapshots
- [ ] **SHOP-05**: Shopper can view their store-scoped order history and live `OrderEvent` fulfillment timeline at `/s/[storeSlug]/account`

### Subscriptions & Platform Launch

- [ ] **SUBS-01**: Shopper can purchase an eligible variant on either a prepaid multi-cycle commitment (3/6/12 cycles paid upfront) or a pay-per-delivery selling plan in dedicated single-subscription checkout
- [ ] **SUBS-02**: Idempotent `manage.py run_subscription_cycles` command (plus a merchant console "Run Cycle Now" demo trigger) generates zero-charge fulfillment orders for prepaid plans and `PENDING_PAYMENT` renewal orders with emailed/dashboard "Pay Now" links for pay-per-delivery plans
- [ ] **SUBS-03**: Shopper and merchant can pause, resume, skip next delivery, or cancel a subscription with immediate state reflection in both `/s/[storeSlug]/account` and `/merchant/[storeSlug]/subscriptions`
- [ ] **SUBS-04**: Public ShopCraft marketing landing page (`/`), temporary redirects from legacy BrewMellow paths (`/origins`, `/subscribe`, `/checkout`, `/dashboard`, `/admin`) to `/s/brewmellow/...`, and a seeded second non-coffee demo store are live on production by Nov 26

## v2 Requirements

Deferred beyond the Nov 26 capstone release.

### Growth & Scale

- **GROW-01**: Custom merchant domains and wildcard subdomains (`{store}.shopcraft.com.np`)
- **GROW-02**: Additional Nepali gateways (eSewa ePay v2, Fonepay dynamic QR)
- **GROW-03**: Variant stock/inventory tracking with low-stock alerts
- **GROW-04**: Discount / promo codes and multi-bag bundle builder rules per store
- **GROW-05**: Multi-staff RBAC roles (`ADMIN`, `FULFILLMENT_STAFF`, `SUPPORT`) with staff invitations
- **GROW-06**: ShopCraft SaaS merchant subscription tiers & billing

## Out of Scope

Explicitly excluded to protect the 4-week solo timeline and regulatory compliance.

| Feature | Reason |
|---------|--------|
| Automated recurring card/wallet rebilling | Unavailable on standard Nepali wallets without commercial bank acquiring contracts; solved via prepaid commitments + "Pay Now" renewal orders |
| Platform escrow / split payouts | Holding merchant funds triggers Nepal Rastra Bank PSP/PSO licensing; merchants use their own Khalti keys |
| Drag-and-drop storefront page builder | Multi-week UI trap; structured theme tokens + clean default storefront template cover capstone & MVP needs |
| Per-tenant PWA manifests & offline API caching | Service worker API caching risks cross-tenant data leakage; PWA stays platform-level with `/api/*` excluded |
| Live domestic courier API integration | Nepali couriers lack public developer sandboxes; fulfillment tracked via merchant order state machine |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1 | Pending |
| FOUND-02 | Phase 1 | Pending |
| FOUND-03 | Phase 1 | Pending |
| FOUND-04 | Phase 1 | Pending |
| FOUND-05 | Phase 1 | Pending |
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| MERCH-01 | Phase 2 | Pending |
| MERCH-02 | Phase 2 | Pending |
| MERCH-03 | Phase 2 | Pending |
| MERCH-04 | Phase 2 | Pending |
| SHOP-01 | Phase 3 | Pending |
| SHOP-02 | Phase 3 | Pending |
| SHOP-03 | Phase 3 | Pending |
| SHOP-04 | Phase 3 | Pending |
| SHOP-05 | Phase 3 | Pending |
| MERCH-05 | Phase 3 | Pending |
| SUBS-01 | Phase 4 | Pending |
| SUBS-02 | Phase 4 | Pending |
| SUBS-03 | Phase 4 | Pending |
| SUBS-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0

---
*Requirements defined: 2026-10-29*
*Last updated: 2026-10-29 after roadmap initialization*
