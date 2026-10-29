# Phase 1: Foundation, Auth & Tenant Core - Research

**Researched:** 2026-10-30
**Domain:** Django 6 / DRF Multi-Tenant Core, Passwordless Email OTP + Google OAuth Session Auth, Next.js 16 Same-Origin Proxy & 3-Surface Token Split, CI/Staging Readiness
**Confidence:** HIGH

## Summary

The existing repository (`team_2_capstone_design`) runs Next.js `16.3.5` + React `19.2.8` + Tailwind CSS v4 (`frontend/`) alongside a Django `6.1.1` + DRF `3.18.1` project (`backend/`, Python `3.13.1` in `backend/venv`). In the legacy BrewMellow midterm baseline (`c5668de`), Next.js bypassed Django completely via `@neondatabase/serverless` raw SQL route handlers (`frontend/src/app/api/**`) and `localStorage["demo_user"]`, while `backend/core/settings.py` lacked `AUTH_USER_MODEL`, `Procfile`, `requirements.txt`, `whitenoise`, and `gunicorn`.

Phase 1 eliminates the split-brain architecture by making Django + DRF the single backend of record behind Next.js same-origin `rewrites()` (`/api/:path*` → `${DJANGO_API_ORIGIN}/api/:path*`), resetting onto a clean multi-tenant migration graph (`accounts`, `stores`, `catalog`, `orders`, `subscriptions`) against isolated ShopCraft Neon Postgres databases (`dev`, `staging`, `prod-saas`), implementing passwordless 6-digit Email OTP + Google OAuth with `HttpOnly` session + CSRF cookies, refactoring Next.js into three isolated CSS token surfaces per `DESIGN.md`, seeding BrewMellow as Tenant #1 (`manage.py seed_brewmellow`), and enforcing cross-tenant 404 isolation + surface token guards in GitHub Actions CI.

**Primary recommendation:** Decompose Phase 1 into focused vertical tracer-first plans (2–3 tasks each) starting with a Walking Skeleton (`01-01-PLAN.md` + `SKELETON.md`) that proves Next.js → `/api/*` rewrite → Django `/api/health/` + `Store` DB read/write + CI/Heroku scaffold end-to-end before layering passwordless auth + Nepali addresses (`01-02`), full multi-tenant catalog/order/subscription schema + `seed_brewmellow` + cross-tenant 404 isolation suite (`01-03`), and the 3-surface UI split + `/login`, `/signup`, and saved address drawer UI (`01-04`).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Tenant scoping (`StoreScopedManager`, `StorePublicMixin`, `StoreMerchantMixin`) | API / Backend (`backend/`) | Database (`Postgres FK + constraints`) | Tenant isolation must never rely on client parameters or writable serializer fields |
| Passwordless Email OTP generation, hashing, rate limiting, session & CSRF issuance | API / Backend (`backend/accounts/`) | — | Credentials, OTP hashes, attempt counters, and `HttpOnly` session cookies belong strictly on Django |
| Google OAuth ID-token cryptographic verification | API / Backend (`backend/accounts/`) | Browser / Client (Google button / redirect trigger) | Token signature, `aud`, and `iss` verification must execute server-side via `google-auth` |
| Nepali `DeliveryAddress` validation (`^9[78]\d{8}$`, default address uniqueness) | API / Backend (`backend/accounts/`) | Browser / Client (UX inline validation) | Authoritative phone/address validation and user ownership scoping live in DRF serializers/querysets |
| Same-origin `/api/*` cookie & CSRF forwarding | Frontend Server (`frontend/next.config.ts` `rewrites()`) | API / Backend | Avoids third-party cookie blocking on mobile Safari and Instagram/TikTok in-app browsers |
| Three-surface CSS token isolation (`--sc-*`, `.console`, `[data-store-theme]` `--sf-*`) | Browser / Client & Frontend App Router layouts (`frontend/src/app/`) | CI static guard (`check:surfaces`) | Route-group layouts isolate brand styles so Console stays neutral and Storefront uses zero raw hex |
| Money storage (`*_minor` integer paisa) vs `Rs.` display formatting | Database & API / Backend (integer paisa) | Browser / Client (`Intl.NumberFormat('en-IN')`) | Arithmetic and persistence stay integer paisa; display formatting renders `Rs. 1,200` on frontend |

## Standard Stack

### Core (Measured in Workspace)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `Django` | `6.1.1` (installed in `backend/venv`) | Web framework, ORM, migrations, session/CSRF auth | Already installed in workspace `backend/venv` (Python `3.13.1`) |
| `djangorestframework` | `3.18.1` (installed) | REST API views, serializers, permissions, throttling | Already installed; pairs cleanly with `StoreScopedMixin` |
| `dj-database-url` | `3.1.2` (installed) | `DATABASE_URL` parsing for Neon Postgres / SQLite test runs | Already configured in `backend/core/settings.py` |
| `psycopg2-binary` | `2.9.13` (installed) | PostgreSQL adapter for Django | Already installed in `backend/venv` |
| `django-cors-headers` | `4.9.0` (installed) | Explicit origin allowlist for local/staging safety | Already installed; tighten from `CORS_ALLOW_ALL_ORIGINS=True` to explicit allowlist |
| `next` | `16.3.5` (installed) | App Router frontend & `/api/:path*` proxy rewrites | Already installed in `frontend/package.json` |
| `react` / `react-dom` | `19.2.8` (installed) | UI runtime | Already installed |
| `tailwindcss` | `^4` (installed) | `@theme inline` CSS variable token system | Already installed |
| `lucide-react` | `^1.52.0` (installed) | Crisp `1.5px–1.75px` stroke icons | Already installed; mandated by `DESIGN.md` |

### Supporting (Phase 1 Additions)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `gunicorn` | `26.2.0` | Production WSGI HTTP server | Heroku `Procfile` web dyno |
| `whitenoise` | `6.12.0` | Static file serving for Django admin/DRF assets | Heroku dyno middleware |
| `django-anymail` | `15.2` | Resend ESP email backend (`anymail.backends.resend.EmailBackend`) | Production OTP & transactional emails (`console` backend in dev/test) |
| `cryptography` | `50.0.2` | `Fernet` symmetric encryption for `Store.khalti_secret_key_encrypted` | Encrypting per-store gateway keys at rest |
| `google-auth` + `requests` | `2.62.0` / `2.34.2` | Server-side `google.oauth2.id_token.verify_oauth2_token` | Verifying Google Sign-In ID tokens without heavyweight `django-allauth` |
| `clsx` + `tailwind-merge` + `class-variance-authority` | `2.1.1` / `3.7.0` / `0.7.1` | `cn()` utility and variant styling for `shadcn/ui` primitives | Shared across Platform, Console, and Storefront UI primitives |
| `@radix-ui/react-dialog` + `@radix-ui/react-slot` | `1.3.1` / `1.5.0` | Accessible drawer/sheet (`AddressSheet`) and polymorphic `Button` | Mobile bottom sheet / desktop right sheet per `01-UI-SPEC.md` |

### Packages to Remove in Phase 1
- `@neondatabase/serverless` (`frontend/package.json` + `frontend/src/lib/db.ts`) — removed per `D-02` to guarantee zero direct browser/Next.js SQL connections to Postgres.

## Package Legitimacy Audit

> Verified via `gsd-tools package-legitimacy check` (Step 1) + `pip index versions` and `npm view <pkg> version scripts.postinstall` (Steps 2 & 3) on 2026-10-30. Note: PyPI's JSON endpoint reports `weeklyDownloads: null` and latest-patch timestamp rather than initial project registration; Step 2/3 verification confirmed canonical upstream repositories, 8–18 year histories, and zero `postinstall` scripts on all packages below.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `gunicorn` (`26.2.0`) | PyPI | 16 yrs | PyPI top-100 | `github.com/benoitc/gunicorn` (`gunicorn.org`) | [OK] | Approved |
| `whitenoise` (`6.12.0`) | PyPI | 11 yrs | PyPI standard | `github.com/evansd/whitenoise` | [OK] | Approved |
| `django-anymail` (`15.2`) | PyPI | 10 yrs | PyPI standard | `github.com/anymail/django-anymail` | [OK] | Approved |
| `cryptography` (`50.0.2`) | PyPI | 12 yrs | PyPI top-20 | `github.com/pyca/cryptography` | [OK] | Approved |
| `google-auth` (`2.62.0`) | PyPI | 9 yrs | PyPI top-20 | `github.com/googleapis/google-cloud-python` | [OK] | Approved |
| `requests` (`2.34.2`) | PyPI | 15 yrs | PyPI top-5 | `github.com/psf/requests` | [OK] | Approved |
| `clsx` (`2.1.1`) | npm | 6 yrs | 161.5M/wk | `github.com/lukeed/clsx` | [OK] | Approved |
| `tailwind-merge` (`3.7.0`) | npm | 4 yrs | 104.5M/wk | `github.com/dcastil/tailwind-merge` | [OK] | Approved |
| `class-variance-authority` (`0.7.1`) | npm | 4 yrs | 79.4M/wk | `github.com/joe-bell/cva` | [OK] | Approved |
| `@radix-ui/react-dialog` (`1.3.1`) | npm | 5 yrs | 90.5M/wk | `github.com/radix-ui/primitives` | [OK] | Approved |
| `@radix-ui/react-slot` (`1.5.0`) | npm | 5 yrs | 227.7M/wk | `github.com/radix-ui/primitives` | [OK] | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
Browser (Shopper / Merchant)
   │  First-party HTTPS + HttpOnly sessionid & csrftoken cookies
   ▼
Next.js 16.3.5 App Router (frontend/)
   ├─ (platform)/           → --sc-* tokens (/ , /login , /signup , /account/addresses)
   ├─ merchant/[storeSlug]/ → .console zinc tokens
   ├─ s/[storeSlug]/        → [data-store-theme] --sf-* tokens (0 raw hex)
   └─ next.config.ts rewrites: /api/:path* ───────────────────────────┐
                                                                      ▼
                                               Django 6.1.1 + DRF 3.18.1 (backend/)
                                                  ├─ /api/health/
                                                  ├─ /api/auth/otp/{request,verify}/ , /google/ , /me/ , /logout/
                                                  ├─ /api/auth/addresses/ (user-scoped Nepali DeliveryAddress CRUD)
                                                  ├─ /api/stores/<store_slug>/... (StorePublicMixin → .for_store)
                                                  └─ /api/merchant/stores/<store_slug>/... (StoreMerchantMixin → 404 non-member)
                                                                      │
                                                                      ▼
                                               ShopCraft Neon Postgres (dev / staging / prod-saas)
                                               (Isolated from frozen legacy BrewMellow main DB)
```

### Key Implementation Rules & Edge-Case Contracts
1. **Fresh Custom User Migration (`D-06`):** `AUTH_USER_MODEL = "accounts.User"` MUST exist before running `migrate` on the fresh ShopCraft DB. Retire legacy `backend/orders` and `backend/subscriptions` flat single-tenant models/migrations on `saas/main` and build clean apps: `accounts`, `stores`, `catalog`, `orders`, `subscriptions`.
2. **Email Normalization & OTP Atomicity (`AUTH-01`, `D-07`):** Normalize emails with `.strip().lower()` (`BaseUserManager.normalize_email` + lowercase). Hash 6-digit OTP codes with `django.contrib.auth.hashers.make_password` / `check_password` (never store plaintext OTP in DB). Enforce `expires_at = now + 10 min`, `attempt_count <= 5` incremented atomically inside `transaction.atomic()` with `select_for_update()` to prevent parallel brute-force races, invalidate prior unused challenges on new request or successful verify, and return `dev_otp_hint` ONLY when `settings.DEBUG is True`.
3. **Tenant Isolation Return Code (`FOUND-05`, `D-03`):** Both `StoreMerchantMixin` (when authenticated user lacks `StoreMembership` on `store_slug`) and resource detail lookups across stores (`Product`, `Order`, `Customer`, `Subscription`) MUST raise `Http404` (HTTP `404`), never `403` or `200`, so cross-tenant existence is never leaked. Similarly, `DeliveryAddressViewSet` filters `DeliveryAddress.objects.filter(user=request.user)` so another user's address ID returns `404`.
4. **Idempotent `seed_brewmellow` (`FOUND-04`, `D-05`):** Wrap inside `transaction.atomic()` using `update_or_create` keyed on deterministic slugs/SKUs (`store.slug="brewmellow"`, product slugs `gulmi-reserve`, `ilam-gold`, `nuwakot-heritage`, variant SKUs `BM-GULMI-150G` etc., selling plan codes `BM-PAYG`, `BM-3M`, `BM-6M`, `BM-12M`, and deterministic demo order numbers) so running `python manage.py seed_brewmellow` twice produces identical row counts with zero duplicates.
5. **PWA Service Worker Exclusion (`D-02`):** Ensure `@ducanh2912/next-pwa` in `frontend/next.config.ts` stays disabled in development and never intercepts `/api/*` auth/session responses.

## Security Domain (OWASP ASVS L1 Mapping)

| Threat Area | STRIDE | ASVS L1 Control | Mitigation Required in Plans |
|-------------|--------|-----------------|------------------------------|
| Cross-tenant IDOR (`store_slug` / object PK tampering) | Tampering / Info Disclosure | V4.1 / V4.2 Access Control | `StoreScopedManager.for_store(store)` + `StoreMerchantMixin` membership check returning `404`; `store` excluded/read-only on all serializers |
| Cross-shopper IDOR on `DeliveryAddress` / `Order` | Info Disclosure | V4.2 Operation-level Access | Queryset strictly filtered by `user=request.user` (`404` on foreign PK) |
| Email OTP brute-force & leakage | Spoofing / Elevation | V2.2 / V2.8 Authenticator | 6-digit `secrets.randbelow(1_000_000)`, hashed storage, 10-min TTL, atomic `select_for_update` max-5-attempt lockout, DRF `ScopedRateThrottle` (`5/min` request, `10/min` verify), `dev_otp_hint` gated behind `if settings.DEBUG:` with test asserting absence under `override_settings(DEBUG=False)` |
| Session & CSRF cookie security | Spoofing | V3.4 Cookie-based Session | `SESSION_COOKIE_HTTPONLY=True`, `SESSION_COOKIE_SAMESITE="Lax"`, `SESSION_COOKIE_SECURE=not DEBUG`, `CSRF_COOKIE_SECURE=not DEBUG`, explicit `CSRF_TRUSTED_ORIGINS` |
| Supply chain (`pip` / `npm`) | Tampering | V14.2 Dependency | Pin exact/compatible verified versions in `backend/requirements.txt` and `frontend/package.json`; include `T-01-SC` in plan `<threat_model>` |

## Validation Architecture

- **Backend test runner:** Django's built-in unittest runner (`backend\venv\Scripts\python.exe backend/manage.py test` locally; `python manage.py test` in CI) running against fast in-memory SQLite by default (`DJANGO_TEST_DB=sqlite` fallback when `DATABASE_URL` is unset or overridden in test runner) plus Postgres in GitHub Actions service container. Runtime: `< 5 seconds` locally.
- **Frontend verification:** `npm --prefix frontend run lint`, `npm --prefix frontend run check:surfaces`, and `npm --prefix frontend run build`.
- **Cross-tenant isolation suite (`backend/stores/tests/test_isolation.py`):** Automated APITestCase covering Merchant A vs Merchant B (`404`), Shopper X vs Shopper Y addresses/orders (`404`), unauthenticated merchant route access (`401`/`403`), `DEBUG=False` OTP hint suppression, and double-run `seed_brewmellow` idempotency.

## Open Questions (RESOLVED)

1. **Django version in workspace (`5.x` vs `6.1.1`)** — RESOLVED: Live measurement of `backend/venv` shows Python `3.13.1` with `Django==6.1.1` and `djangorestframework==3.18.1` already installed and working. Pin `Django>=5.2,<6.2` (matching installed `6.1.1`) in `backend/requirements.txt` and test against Python `3.13` in GitHub Actions CI.
2. **BrewMellow catalog prices vs anti-placeholder round-price rule** — RESOLVED: Per `01-CONTEXT.md` `D-05`, preserve BrewMellow's canonical `ORIGIN_PRICES` matrix (`450/650/1200/2200`, `500/750/1400/2600`, `400/600/1100/2000` NPR = `40000..260000` paisa) verbatim for Tenant #1 parity, while demo customer identities, Nepali addresses, and shipping/order totals use realistic Nepali names, real municipalities, and non-placeholder totals.
3. **Google OAuth library choice** — RESOLVED: Use official `google-auth` (`google.oauth2.id_token.verify_oauth2_token`) to verify Google ID tokens directly in a clean DRF view (`POST /api/auth/google/`) and issue a standard Django session cookie via `django.contrib.auth.login(request, user)`, avoiding `django-allauth` template/form bloat.
