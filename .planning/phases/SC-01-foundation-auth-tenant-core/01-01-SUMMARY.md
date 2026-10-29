# Phase 1 Plan 01: Foundation Walking Skeleton & Production Manifests Summary

**Execution Date:** 2026-10-30  
**Phase:** `SC-01-foundation-auth-tenant-core`  
**Plan:** `01-01-PLAN.md` (Wave 1)  
**Status:** Complete (All acceptance criteria verified green)  

---

## 1. Objectives & Outcomes

Plan `01-01` successfully established the **Walking Skeleton** for ShopCraft's multi-tenant architecture:
1. **Isolated Database Safety Guard (`D-01`, `FOUND-01`):**
   - The frozen BrewMellow baseline database (`ep-dark-term-avy8vnke`) is protected unconditionally in `backend/core/settings.py`.
   - Any database connection configuration matching `LEGACY_NEON_HOST` immediately aborts startup with `django.core.exceptions.ImproperlyConfigured`.
   - Dev runs cleanly on an isolated local SQLite instance (`shopcraft_dev.sqlite3`), ignoring any legacy `.env` `DATABASE_URL` unless `SHOPCRAFT_ALLOW_DATABASE_URL=1`.
2. **Single Backend of Record (`D-02`, `FOUND-02`):**
   - All legacy Next.js raw-SQL route handlers (`frontend/src/app/api/auth/login`, `register`, `orders`, `orders/[id]`) and `@neondatabase/serverless` helper (`frontend/src/lib/db.ts`) have been permanently removed.
   - `frontend/next.config.ts` now proxies `/api/:path*` same-origin to Django (`DJANGO_API_ORIGIN`), with PWA service worker caching explicitly disabled on `/api/*` (`NetworkOnly` and `navigateFallbackDenylist`).
3. **Core Identity & Tenant Models (`D-06`, `D-07`, `D-08`, `D-09`):**
   - `accounts.User` (`AUTH_USER_MODEL = "accounts.User"`) configured at `0001_initial` with email-only primary authentication and lowercase normalization.
   - `accounts.EmailOTPChallenge` with cryptographically secure 6-digit challenge issuance and brute-force attempt lockout (`attempt_count >= 5`).
   - `accounts.DeliveryAddress` with Nepali mobile regex validation (`^9[78]\d{8}$`) and atomic `is_default` enforcement.
   - `stores.Store` with reserved slug collision defense (`RESERVED_STORE_SLUGS`), integer minor units (paisa) for shipping rates (`inside_valley_shipping_minor`), and Fernet encryption for merchant Khalti secret keys.
   - `stores.StoreMembership` and `stores.Customer` with `StoreScopedQuerySet` (`for_store()`).
4. **Health & Tenant API Endpoints:**
   - `GET /api/health/` runs a live database cursor query (`SELECT 1`) and returns HTTP 200 `{"status": "ok", "service": "shopcraft-api", "database": "ok"}`.
   - `GET /api/stores/<slug:store_slug>/` returns public tenant metadata and yields HTTP 404 on missing or inactive stores.
5. **Production Hardening & CI (`D-10`, `FOUND-05`):**
   - `backend/requirements.txt` pinned to audited versions (`Django==6.1.1`, `djangorestframework==3.18.1`, `gunicorn==26.2.0`, `whitenoise==6.12.0`, `django-anymail==15.2`, `cryptography==50.0.2`, `google-auth==2.62.0`, `requests==2.34.2`).
   - `backend/Procfile` configured for Heroku releases (`migrate --noinput` + `gunicorn`).
   - `backend/core/settings.py` enforces `CORS_ALLOW_ALL_ORIGINS = False`, `SESSION_COOKIE_HTTPONLY = True`, `SESSION_COOKIE_SAMESITE = "Lax"`, `WhiteNoiseMiddleware`, and Resend email backend via Anymail.
   - `.github/workflows/ci.yml` operational with parallel `backend` (Postgres 16 service container) and `frontend` (lint, typecheck, Next.js build) jobs.

---

## 2. Tasks Executed

| Task | Title | Commit | Status |
|------|-------|--------|--------|
| Task 1 | End-to-end Walking Skeleton (`accounts.User` 0001_initial, `stores.Store` core, `/api/health/` + `/api/stores/<slug>/`, Next.js `/api/*` rewrites) | `644d57c` | Done |
| Task 2 | Production Dependencies, Hardened Cookie/CSRF/CORS Settings, Heroku Procfile & GitHub Actions CI | `35aab4e` | Done |

---

## 3. Verification Evidence

1. **Automated Safety Guard Verification:**
   - Evaluated subprocess with `SHOPCRAFT_DATABASE_URL` pointing to `ep-dark-term-avy8vnke`: Process aborted with `django.core.exceptions.ImproperlyConfigured: Refusing to connect to legacy Neon host: ep-dark-term-avy8vnke`.
   - Evaluated default configuration: confirmed `'ep-dark-term-avy8vnke'` is absent from `settings.DATABASES['default']`.
2. **Model & Auth Logic:**
   - `accounts.User.objects.create_user("Maya.Gurung@Example.com")` correctly normalized email to `"maya.gurung@example.com"`.
   - `Store.objects.update_or_create(slug="brewmellow")` stored integer shipping minor units `10000`.
   - Fernet key encryption test: `s.set_khalti_secret_key("live_secret_xyz")` encrypted payload at rest (`!= "live_secret_xyz"`) and `s.get_khalti_secret_key()` decrypted back to `"live_secret_xyz"`.
3. **API Responses:**
   - `GET /api/health/` returned `200 OK` with `{"status": "ok", "service": "shopcraft-api", "database": "ok"}`.
   - `GET /api/stores/brewmellow/` returned `200 OK` with `inside_valley_shipping_minor: 10000`.
   - `GET /api/stores/missing-shop/` returned `404 Not Found`.
4. **Frontend Cleanliness & Build:**
   - Absence of legacy SQL route handlers verified (`assert not os.path.exists('frontend/src/lib/db.ts') and not os.path.exists('frontend/src/app/api')`).
   - `npm --prefix frontend run build` completed with zero TypeScript errors and static routes generated.

---

## 4. Key Decisions & Discoveries

- **Discovery (`dj_database_url` behavior):** When `dj_database_url.config(default=...)` is called, it inspects `os.environ["DATABASE_URL"]` before checking `default`. To prevent local developers from accidentally hitting legacy `DATABASE_URL` loaded from `backend/.env`, `settings.py` uses `dj_database_url.parse()` explicitly when falling back to SQLite, combined with the hard-blocking `LEGACY_NEON_HOST` assertion.
- **Cache Invalidation:** Deleting `src/app/api/**` required clearing stale `.next` type cache so Next.js type generation no longer looked for removed route files.

---

## 5. Next Steps

Proceed directly to **Wave 2: Plan `01-02-PLAN.md`** (`SC-01` Auth & Address Book Core):
- Implement SMS OTP and Email OTP passwordless authentication endpoints (`/api/auth/otp/request/`, `/api/auth/otp/verify/`).
- Implement Google OAuth ID token verification endpoint (`/api/auth/google/`).
- Implement user session read/logout endpoints (`/api/auth/me/`, `/api/auth/logout/`).
- Implement per-user Nepali Delivery Address book CRUD endpoints (`/api/account/addresses/`).
