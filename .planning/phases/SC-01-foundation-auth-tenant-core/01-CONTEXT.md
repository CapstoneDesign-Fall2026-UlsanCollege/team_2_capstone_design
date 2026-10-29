# Phase 1: Foundation, Auth & Tenant Core - Context

**Gathered:** 2026-10-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Stand up the consolidated Django 5 + DRF backend, staging/CI pipeline, passwordless 6-digit Email OTP + Google OAuth session authentication, core tenant-scoped schema, BrewMellow Store #1 seed, foundational 3-surface CSS token split, and automated cross-tenant isolation tests while keeping legacy BrewMellow untouched.

Merchant store creation wizard, catalog CRUD UI, storefront checkout, Khalti gateway integration, and subscription cycle runner belong to Phases 2–4.

</domain>

<decisions>
## Implementation Decisions

### Baseline & Database Isolation
- **D-01:** Legacy BrewMellow baseline stays frozen on branch `legacy/brewmellow-v1` and tag `v1.0-midterm-brewmellow` (`c5668de`), and ShopCraft uses fresh Neon Postgres branches/databases (`dev`, `staging`, `prod-saas`) — never mutate the legacy Neon `main` database.
- **D-02:** Consolidate on Django + DRF (`backend/`, running Django `6.1.1` + DRF `3.18.1` on Python `3.13` in `backend/venv`) as the single backend of record behind Next.js `rewrites()` (`/api/:path*` → `${DJANGO_API_ORIGIN}/api/:path*`) in `frontend/next.config.ts`. Delete all legacy Next.js raw-SQL route handlers (`frontend/src/app/api/**`) and `frontend/src/lib/db.ts` (`@neondatabase/serverless`) on `saas/main`.

### Multi-Tenant Schema & Isolation
- **D-03:** Shared Postgres schema with mandatory `store` ForeignKey on every tenant-owned model (`StoreMembership`, `Customer`, `Product`, `Variant`, `SellingPlan`, `Order`, `OrderItem`, `OrderEvent`, `Subscription`), enforced by `StoreScopedQuerySet` / `StoreScopedManager` (`.for_store(store)`) and URL-slug DRF mixins (`StorePublicMixin` for `/api/stores/{store_slug}/...`, `StoreMerchantMixin` for `/api/merchant/stores/{store_slug}/...`). `store` is never writable from request payloads.
- **D-04:** Money and pricing fields (`Variant.price_minor`, `Store.inside_valley_shipping_minor` / `outside_valley_shipping_minor`, `Order.subtotal_minor`, `Order.shipping_minor`, `Order.discount_minor`, `Order.total_minor`, `OrderItem.unit_price_minor`) are stored strictly as integer minor units (paisa; `Rs. 1 = 100 paisa`) — never floats.
- **D-05:** `manage.py seed_brewmellow` idempotently seeds BrewMellow as Tenant #1 (`slug="brewmellow"`, `theme_preset="editorial-warm"`) preserving the canonical BrewMellow `ORIGIN_PRICES` matrix (`Gulmi Reserve`: `450/650/1200/2200` NPR; `Ilam Gold`: `500/750/1400/2600` NPR; `Nuwakot Heritage`: `400/600/1100/2000` NPR stored in paisa `40000..260000`), 4 variants each (`150g` one-time only `allow_subscription=False`; `250g`, `500g`, `1kg` subscription-eligible), 4 selling plans (`PAYG` 0%, `3M` 5%, `6M` 10%, `12M` 15%), and realistic Nepali demo customers/orders (no `"John Doe"` or generic `Rs. 1,000` placeholder orders).

### Passwordless Authentication & Customer Scoping
- **D-06:** Custom `accounts.User` model (`AUTH_USER_MODEL = "accounts.User"`, `email` as `USERNAME_FIELD`, no `username` field) created at migration `0001_initial` on the fresh database.
- **D-07:** Passwordless authentication via 6-digit Email OTP (`EmailOTPChallenge` hashed code, 10-minute expiry, max 5 attempts, sent via `django-anymail`/Resend in prod and logged/returned in `dev_otp_hint` ONLY when `DEBUG=True`) plus Google OAuth ID-token / OAuth2 callback endpoint, issuing first-party `HttpOnly` Django session + CSRF cookies through the same-origin `/api/*` rewrite. Delete `localStorage["demo_user"]` everywhere.
- **D-08:** One global `accounts.User` identity maps to per-store `Customer(store, user)` rows (`unique_together = [("store", "email")]`) provisioned automatically on first store interaction; merchants only ever query their own store's `Customer` records.
- **D-09:** Authenticated users can create, list, update, and delete saved Nepali `DeliveryAddress` records (`label`, `recipient_name`, `phone` validated against `^9[78]\d{8}$`, `province`, `district`, `municipality`, `ward`, `street_landmark`, `is_default`).

### Three-Surface UI Foundation & CI/Staging Readiness
- **D-10:** Refactor Next.js root `app/layout.tsx` and `globals.css` per `DESIGN.md`: strip global BrewMellow navbar/footer/coffee colors out of root layout into isolated route-group layouts (`(platform)` with `--sc-*` tokens, `merchant` wrapped in `.console` shadcn zinc tokens, `s/[storeSlug]` wrapped in `[data-store-theme]` `--sf-*` tokens with zero hex values in `/s/*`), ship passwordless `/login` + `/signup` + saved address management UI, and add GitHub Actions CI (Django tests + cross-tenant 404 suite + Next.js build/lint) plus Heroku `Procfile`/`requirements.txt` and `/api/health/`.

### the agent's Discretion
- Exact Django app split (`config/` or keeping `core/` refactored into `core/settings/` + domain apps `accounts`, `stores`, `catalog`, `orders`, `subscriptions`) as long as URLs, `AUTH_USER_MODEL`, and migrations are clean.
- Nepal Province → District → Municipality JSON dataset structure bundled on frontend/backend for cascading selects.
- Exact rate-limit numbers on OTP request/verify endpoints (`AnonRateThrottle` / DRF throttling).

</decisions>

<specifics>
## Specific Ideas

- Follow `DESIGN.md` strictly for `/login` and `/signup`: left-aligned or calm focused card on `--sc-paper` (`#FAFAF7`), single-step progressive disclosure (Email input → 6-digit OTP auto-advance cells with `autocomplete="one-time-code"` + "Continue with Google" secondary button), zero gradients/shadows, `1px` `--sc-line` borders, `48px` primary ink button.
- Include a lightweight lint/check script (e.g. `npm run check:surfaces`) that fails CI if any file under `frontend/src/app/s/` contains raw hex colors (`#[0-9a-fA-F]{3,8}`) or if `frontend/src/app/merchant/` references `--sf-`.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design & Architecture Contracts
- `DESIGN.md` — Mandatory source of truth for all tokens, typography, route-scoped fonts, anti-AI-look rules, auth UX, and Definition of Done.
- `docs/saas-pivot/BUILD-DECISIONS.md` — Stack, Heroku + Vercel + Neon architecture, session cookie proxy design, Khalti/COD & subscription rules.
- `docs/saas-pivot/ARCHITECTURE-BLUEPRINT.md` — Entity-relationship model, legacy BrewMellow audit findings, and route map.
- `docs/archive/legacy-planning/brewmellow-subscription-and-pricing.md` — Exact BrewMellow Tenant #1 product weights (`150g` one-time only; `250g/500g/1kg` subscription) and NPR prices for `seed_brewmellow`.

### Project Governance
- `.planning/PROJECT.md` — Core value, constraints, and key decisions.
- `.planning/REQUIREMENTS.md` — Phase 1 requirements `FOUND-01..05` and `AUTH-01..04`.
- `GEMINI.md` — Mandatory UI rule and GSD workflow contract.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/Navbar.tsx`, `Footer.tsx`, `MobileNav.tsx`: Existing BrewMellow navigation components — move/adapt under Storefront `/s/[storeSlug]` shell rather than leaving them in root `app/layout.tsx`.
- `frontend/src/components/subscribe/OriginCard.tsx`: Existing BrewMellow card reference for `editorial-warm` preset styling.

### Established Patterns
- Tailwind CSS v4 (`@import "tailwindcss";` and `@theme` in `frontend/src/app/globals.css`) is already installed on Next.js `16.3.5` + React `19.2.8`.
- `backend/core/settings.py` already uses `dj_database_url` and `django-cors-headers` + `djangorestframework`.

### Integration Points
- `frontend/next.config.ts` currently wraps config with `@ducanh2912/next-pwa` — add `rewrites()` for `/api/:path*` and ensure `/api/*` is never cached by PWA service workers.
- Retire `backend/orders` and `backend/subscriptions` legacy flat migrations on `saas/main` in favor of the clean multi-tenant migration graph on the fresh ShopCraft Neon DB.

</code_context>

<deferred>
## Deferred Ideas

- Self-serve "Create Store" wizard UI and Product/Variant spreadsheet editor — Phase 2 (`MERCH-01..04`).
- Full Storefront cart, checkout, and Khalti ePayment v2 integration — Phase 3 (`SHOP-01..05`, `MERCH-05`).
- Subscription cycle generator (`run_subscription_cycles`) and public ShopCraft marketing landing page — Phase 4 (`SUBS-01..04`).
- `⌘K` command palette, `J/K` shortcuts, logo color extraction, bulk slip print — Section 8 P2 Polish in `DESIGN.md`.

</deferred>

---

*Phase: SC-01-foundation-auth-tenant-core*
*Context gathered: 2026-10-30*
