# ShopCraft

## What This Is

ShopCraft is a multi-tenant e-commerce and subscription SaaS platform ("Shopify for Nepal") where Nepali merchants sign up, launch a branded storefront at `/s/{storeSlug}`, sell products as one-time purchases or non-recurring subscriptions, and receive payments directly via Khalti (sandbox/live) or Cash on Delivery (COD). BrewMellow (Boutique Himalayan Coffee) is preserved and seeded as Tenant #1, the flagship demo store.

## Core Value

Strict multi-tenant isolation and end-to-end checkout integrity — any merchant can launch an isolated storefront and fulfill verified Khalti or COD orders without ever leaking data across stores or breaking the frozen BrewMellow baseline.

## Business Context

- **Customer**: Nepali D2C brands and specialty merchants (free during capstone; SaaS subscription post-capstone) and their online shoppers
- **Revenue model**: Free for merchants in capstone v1; direct-to-merchant Khalti keys avoid holding merchant funds (avoiding NRB payment-aggregator licensing)
- **Success metric**: Two visually distinct stores completing verified Khalti sandbox & COD orders + subscription renewals with 100% green cross-tenant isolation tests by Nov 26, 2026
- **Strategy notes**: `docs/saas-pivot/BUILD-DECISIONS.md` and `docs/saas-pivot/ARCHITECTURE-BLUEPRINT.md`

## Requirements

### Validated

- ✓ Single-tenant BrewMellow storefront, origin selection, URL-preserved checkout slice, and midterm baseline frozen at tag `v1.0-midterm-brewmellow` (`legacy/brewmellow-v1`) — pre-pivot baseline

### Active

- [ ] Consolidate on Django 5 + DRF as the sole backend of record behind Next.js same-origin `/api/*` rewrites on a fresh Neon database
- [ ] Enforce shared-schema `store_id` isolation via `StoreScopedManager`, URL-slug DRF permission mixins, and automated cross-tenant 404 tests
- [ ] Implement passwordless 6-digit Email OTP (Resend) + Google OAuth authentication (`accounts.User`), `HttpOnly` session cookies, and per-store `Customer` records
- [ ] Enforce `DESIGN.md` across all 3 isolated surfaces: Platform (`--sc-*`), Neutral Console (`.console` zinc), and Token-Scoped Storefront (`[data-store-theme]` presets: `editorial-warm`, `pahadi-sage`, `ktm-bold`)
- [ ] Build self-serve merchant onboarding ("Create Store" wizard) and scoped `/merchant/[storeSlug]` console (products, variants, Cloudinary images, selling plans, branding, Khalti keys, orders)
- [ ] Deliver themed `/s/[storeSlug]` storefronts, store-namespaced multi-item cart, structured Nepali address capture, Khalti ePayment v2 sandbox (`initiate` + `lookup`) + COD checkout, and confirmation emails
- [ ] Deliver non-recurring subscriptions (prepaid 3/6/12-cycle commitments + pay-per-delivery renewal orders with "Pay Now" links, pause/skip/cancel) and public ShopCraft SaaS landing page (`/`)

### Out of Scope

- Automated recurring card/wallet auto-debit — Nepal payment rails lack general-purpose tokenized auto-debit without commercial bank agreements; use prepaid cycles + pay-per-delivery "Pay Now" links instead
- Custom domains or wildcard subdomains (`*.shopcraft.me`) — path-based `/s/[storeSlug]` delivers full tenant isolation without DNS/SSL ops risk in 4 weeks
- Platform fee splitting / holding merchant funds — each store uses its own Khalti key (with platform sandbox fallback) to avoid NRB payment-aggregator licensing
- Drag-and-drop theme builder, eSewa/Fonepay, stock/inventory ledger, coupon codes, multi-staff RBAC beyond OWNER, live courier APIs, multi-currency (NPR minor units / paisa only) — deferred to post-capstone v2 to protect the Nov 26 deadline

## Context

- **Pivot origin**: Midterm capstone feedback required pivoting the hardcoded single-shop BrewMellow app into a multi-tenant SaaS engine while preserving BrewMellow as Tenant #1.
- **Codebase audit findings**: Prior app had split-brain persistence (Next.js raw SQL routes writing directly into Django tables), mock `localStorage["demo_user"]` auth, hardcoded TypeScript price matrices (`SERVER_PRICES`), and silent fallback fixtures (`FALLBACK_ORDERS`). All four are retired on `saas/main`.
- **Deployment topology**: Co-located in US-East (`iad1` / `us-east-1`): Next.js 16 on Vercel, Django 5 + DRF + Gunicorn on Heroku Basic dyno ($0 via GitHub Student Pack $13/mo credit), Neon Postgres branches (`dev`, `staging`, `prod-saas`), Cloudinary signed uploads, Resend via `django-anymail`, GitHub Actions CI, Sentry.

## Constraints

- **Timeline**: Hard deadline **2026-11-26** (4 weeks: Oct 30 – Nov 26); feature freeze **2026-11-24** — solo developer executing end-to-end
- **Budget**: $0 out-of-pocket — all infrastructure covered by GitHub Student Developer Pack credits and free tiers
- **Safety / Baseline**: Legacy BrewMellow production (`main` / `legacy/brewmellow-v1` + original Neon `main` branch) is frozen read-only until final cutover rehearsal passes
- **Security**: Money stored as integer paisa (`price_minor`) and repriced exclusively on the server; Khalti return URL query params never trusted without server-side `epayment/lookup/` verification; `store` never accepted from request bodies

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Same repo (`saas/main` branch) + frozen `v1.0-midterm-brewmellow` tag + fresh Neon DB | Preserves team git history & Vercel setup for capstone grading while guaranteeing zero risk to live midterm demo | ✓ Good |
| Django 5 + DRF on Heroku Basic as single backend; delete Next.js raw-SQL `/api/*` routes | Eliminates dual-backend tenant-scoping drift; Heroku Basic avoids cold starts during live grading demo | — Pending |
| Shared Postgres schema with `store_id` FK + `StoreScopedManager` | Compatible with Neon serverless & simple migrations; `django-tenants` schema-per-tenant adds weeks of infra overhead | — Pending |
| Same-origin Next.js `/api/*` rewrite + Django `HttpOnly` session & CSRF cookies | Eliminates cross-domain cookie headaches and `localStorage` token XSS exposure | — Pending |
| Per-store encrypted Khalti secret key with platform sandbox fallback + COD | Mirrors real Nepali commerce (COD dominance) and routes live funds directly to merchants | — Pending |
| Prepaid commitments + scheduled `PENDING_PAYMENT` renewal orders instead of auto-charging | Respects Nepal payment gateway constraints while delivering genuine subscription operations | — Pending |

---
*Last updated: 2026-10-29 after ShopCraft GSD project initialization*
