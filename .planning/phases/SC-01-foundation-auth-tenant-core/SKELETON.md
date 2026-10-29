# Walking Skeleton — ShopCraft

**Phase:** 1 (`SC-01-foundation-auth-tenant-core`)
**Generated:** 2026-10-30

## Capability Proven End-to-End

> A visitor or shopper can load a tenant-scoped `/s/brewmellow` storefront shell or sign in passwordlessly via 6-digit Email OTP through Next.js same-origin `/api/*` rewrites backed by Django 6 + DRF (`accounts.User`, `stores.Store`, and `/api/health/`) against an isolated ShopCraft database without touching the frozen legacy BrewMellow deployment.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js `16.3.5` App Router + React `19.2.8` + Tailwind CSS v4 (`frontend/`) | Already running in workspace; App Router route groups cleanly isolate Platform (`--sc-*`), Console (`.console`), and Storefront (`[data-store-theme]` `--sf-*`) surfaces while `rewrites()` keeps `/api/*` first-party (`D-02`, `D-10`). |
| Backend of record | Django `6.1.1` + Django REST Framework `3.18.1` (`backend/`, `gunicorn` + `whitenoise`) | Consolidates all tenant scoping, migrations, pricing in integer paisa (`*_minor`), and auth on one server tier; legacy Next.js `@neondatabase/serverless` SQL routes are deleted (`D-02`, `D-04`). |
| Data layer & tenancy | Shared PostgreSQL schema on isolated ShopCraft Neon branches (`dev`, `staging`, `prod-saas`) with mandatory `store` FK + `StoreScopedManager` | Zero mutation of frozen legacy Neon `main` (`D-01`); `StoreScopedQuerySet.for_store(store)`, `StorePublicMixin`, and `StoreMerchantMixin` enforce HTTP `404` on cross-tenant access (`D-03`). |
| Auth & customer identity | Custom `accounts.User` (`email` login, `0001_initial`) + 6-digit Email OTP (`django-anymail`/Resend) + Google OAuth (`google-auth`) + first-party `HttpOnly` session & CSRF cookies | Zero password-reset friction, mobile in-app browser compatibility via same-origin `/api/*` proxy, `localStorage["demo_user"]` eliminated (`D-06`, `D-07`), and per-store `Customer(store, user)` auto-provisioned (`D-08`). |
| Deployment & CI target | Vercel (Next.js) + Heroku Basic dyno (`backend/Procfile`) + Neon Postgres `us-east-1` + GitHub Actions (`.github/workflows/ci.yml`) | $0 out-of-pocket via GitHub Student Developer Pack credits, zero cold starts during capstone demo, automated Django isolation tests + surface token guard + `next build` on every push/PR (`D-10`). |
| Directory layout | `backend/{core,accounts,stores,catalog,orders,subscriptions}` + `frontend/src/app/{(platform),merchant/[storeSlug],s/[storeSlug]}` | Clean domain separation on Django and strict 3-surface CSS/font boundary on Next.js (`DESIGN.md` §0 & §2). |

## Stack Touched in Phase 1

- [x] Project scaffold (Django `6.1.1` + DRF `3.18.1`, Next.js `16.3.5` build & lint, `check-surfaces.mjs`, GitHub Actions CI, `backend/Procfile` & `backend/requirements.txt`)
- [x] Routing — `/api/health/`, `/api/stores/<store_slug>/`, `/api/auth/*`, `/login`, `/signup`, `/account/addresses`, `/merchant/[storeSlug]`, `/s/[storeSlug]`
- [x] Database — Fresh multi-tenant migration graph (`accounts`, `stores`, `catalog`, `orders`, `subscriptions`) with real DB reads/writes and idempotent `manage.py seed_brewmellow`
- [x] UI — Passwordless Email OTP (`OtpInput`) + Google sign-in + Nepali `DeliveryAddress` drawer (`AddressSheet`) wired through `/api/*` same-origin rewrites
- [x] Deployment — Heroku `Procfile` + staging readiness + documented local full-stack run commands against isolated ShopCraft DB

## Out of Scope (Deferred to Later Slices)

- Self-serve merchant "Create Store" onboarding wizard (`/merchant/new`), Cloudinary image uploads, and Product/Variant spreadsheet editor UI — **Phase 2** (`MERCH-01..04`).
- Full `/s/[storeSlug]` product detail purchase box, store-isolated cart drawer (`sc:{storeSlug}:cart`), single-screen checkout, Khalti ePayment v2 sandbox redirect/lookup verification, COD order placement, and merchant order queue transitions — **Phase 3** (`SHOP-01..05`, `MERCH-05`).
- Prepaid & pay-per-delivery subscription checkout, `manage.py run_subscription_cycles`, pause/skip/cancel controls, public ShopCraft marketing landing page (`/`), second demo tenant, legacy URL redirects, and production cutover — **Phase 4** (`SUBS-01..04`).
- `⌘K` command palette, `J`/`K` keyboard navigation, dominant-color logo extraction, bulk HTML packing slips, and map pin drop — **P2 Polish Backlog** (`DESIGN.md` §8).

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2 (Merchant Onboarding, Console & Catalog):** Self-serve store creation (`StoreMembership` `OWNER`), Cloudinary product/logo media, integer-paisa `Product`/`Variant`/`SellingPlan` management, branding presets, and Fernet-encrypted Khalti key settings inside `.console`.
- **Phase 3 (Multi-Tenant Storefront, Checkout & Payments):** Public themed `/s/[storeSlug]` catalog & PDP, tenant-scoped cart, Nepali address selection at checkout, server-repriced Khalti ePayment v2 (`epayment/initiate/` + `epayment/lookup/` `pidx` idempotency) + COD orders, receipts, and merchant fulfillment timeline (`OrderEvent`).
- **Phase 4 (Subscriptions, SaaS Landing & Production Launch):** Non-recurring prepaid (3/6/12) and pay-per-delivery subscriptions, idempotent `run_subscription_cycles`, shopper/merchant lifecycle actions, ShopCraft `/` marketing hero with live phone preview, second non-coffee demo store, legacy BrewMellow redirects, and production cutover.
