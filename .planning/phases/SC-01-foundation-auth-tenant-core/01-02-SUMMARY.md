# Phase 1 Plan 02: Passwordless Auth, Google OAuth & Nepali Address Books Summary

**Execution Date:** 2026-10-30  
**Phase:** `SC-01-foundation-auth-tenant-core`  
**Plan:** `01-02-PLAN.md` (Wave 2)  
**Status:** Complete (All acceptance criteria verified green)  

---

## 1. Objectives & Outcomes

Plan `01-02` delivered complete passwordless session authentication, Google OAuth verification, user-scoped Nepali address book management, and surface isolation linting:

1. **Passwordless 6-digit Email OTP Flow (`AUTH-01`, `AUTH-02`, `D-06`, `D-07`):**
   - `POST /api/auth/otp/request/`: Normalizes email, issues single-use challenge, sends email via `send_mail` (`settings.DEFAULT_FROM_EMAIL`), and returns `dev_otp_hint` strictly when `settings.DEBUG=True`.
   - `POST /api/auth/otp/verify/`: Verifies 6-digit code against hashed challenge, atomically enforces 5-attempt brute-force lockout, creates or fetches `accounts.User` (`set_unusable_password()`), and logs in via `django.contrib.auth.login`, setting a first-party `HttpOnly`, `SameSite=Lax` `sessionid` cookie.
   - Exact `01-UI-SPEC.md` copy returned on failure: `"That code didn't match or expired. Request a fresh 6-digit code."`
2. **Google OAuth 2.0 ID-Token Verification (`AUTH-01`, `D-07`):**
   - `POST /api/auth/google/`: Validates token signature, issuer (`accounts.google.com`), audience (`GOOGLE_OAUTH_CLIENT_ID`), and `email_verified=True` via `google-auth`. Automatically provisions/updates the user and issues a session cookie.
3. **Session & CSRF Management (`D-07`):**
   - `GET /api/auth/csrf/`: Issues and ensures `csrftoken` cookie for same-origin fetch clients.
   - `GET /api/auth/me/`: Returns `authenticated: True` with user profile when logged in, or `authenticated: False` with `user: None` when anonymous, ensuring smooth Next.js hydration without noisy 401 console logs.
   - `PATCH /api/auth/me/`: Updates `full_name` and `phone` with Nepali mobile validation.
   - `POST /api/auth/logout/`: Clears Django session and rotates cookies.
4. **Nepali Delivery Address Management (`AUTH-04`, `D-09`):**
   - `GET/POST /api/auth/addresses/` & `GET/PATCH/DELETE /api/auth/addresses/<id>/`.
   - Validates phone strictly against `^9[78]\d{8}$` and ward between `1` and `35`.
   - Automatically maintains `is_default=True` for the user's primary address, promoting the next remaining address on deletion.
   - Cross-shopper access on any foreign address ID strictly returns HTTP 404 (preventing IDOR enumeration).
5. **Typed Frontend Client & UI Primitives (`DESIGN.md`, `D-10`):**
   - `frontend/src/lib/api.ts`: Typed same-origin API client with automatic `X-CSRFToken` handling, `sanitizeRedirectTarget`, and `formatNpr` integer formatting.
   - `frontend/src/components/auth/OtpInput.tsx`: Accessible 6-digit `OtpInput` with auto-advance, backspace navigation, paste distribution, and calm single-step progressive disclosure `PasswordlessAuthCard`.
   - `frontend/scripts/check-surfaces.mjs`: Zero-dependency CI lint script enforcing zero raw hex colors in `src/app/s/**` and zero `--sf-*` variables in `src/app/merchant/**`.
   - Uninstalled `@neondatabase/serverless` and installed audited UI packages (`clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-dialog`, `@radix-ui/react-slot`).
   - Removed legacy single-tenant mock pages (`/admin`, `/dashboard`, `/checkout`, `/subscribe`).

---

## 2. Tasks Executed

| Task | Title | Commit | Status |
|------|-------|--------|--------|
| Task 1 | End-to-end Passwordless Email OTP Session Tracer (`/api/auth/otp/*`, `/me/`, `/logout/`, `/csrf/`, `frontend/src/lib/api.ts`, `OtpInput.tsx`) | `1f36b59` | Done |
| Task 2 | Google OAuth ID-Token Verification, Surface Isolation Guard, Audited UI Dependencies & Environment Template (`.env.example`, `check-surfaces.mjs`, package updates) | `1f36b59` | Done |
| Task 3 | User-Scoped Nepali DeliveryAddress CRUD API & Cross-Shopper 404 Verification | `1f36b59` | Done |

---

## 3. Verification Evidence

1. **Automated Django Unit Tests:**
   - `backend/venv/Scripts/python.exe backend/manage.py test accounts --verbosity 2`
   - Ran 13 tests in 5.85s: **OK**.
     - `EmailOTPAuthTests`: 5 tests passed (happy path session issue, 5-attempt atomic lockout, 10-minute expiry rejection, `DEBUG=False` hint suppression, CSRF token retrieval).
     - `GoogleOAuthTests`: 4 tests passed (mocked valid JWT login, unverified email rejection, invalid token signature rejection, unconfigured 503).
     - `DeliveryAddressAPITests`: 4 tests passed (unauthenticated rejection, atomic default promotion & fallback on delete, invalid Nepali phone rejection, cross-shopper 404 isolation).
2. **Surface Boundary Linter:**
   - `node frontend/scripts/check-surfaces.mjs` executed: **`SURFACE_ISOLATION_OK`**.
3. **Package Integrity:**
   - Verified `@neondatabase/serverless` is absent and `@radix-ui/react-dialog` + `check:surfaces` are present: **`PKG_CLEAN_OK`**.
4. **Next.js Production Build:**
   - `npm --prefix frontend run build` completed with zero TypeScript errors.
   - Clean 11 static routes generated without deprecated mock routes.

---

## 4. Key Decisions & Discoveries

- **Package Init Requirement:** Under Python 3.13, Django's test loader (`unittest.loader.discover`) requires `__init__.py` in app directories to locate `tests.py`. Created `backend/accounts/__init__.py` and `backend/stores/__init__.py`.
- **Test Runner Debug Mode:** Django's test runner sets `DEBUG = False` by default; applied `@override_settings(DEBUG=True)` on `EmailOTPAuthTests` to verify `dev_otp_hint` behavior while retaining dedicated `@override_settings(DEBUG=False)` test for production suppression.

---

## 5. Next Steps

Proceed directly to **Wave 3: Plan `01-03-PLAN.md`** (Multi-Tenant Catalog, Order & Subscription Models + Store Isolation Suite + `seed_brewmellow`):
- Implement multi-tenant models (`Product`, `Variant`, `SellingPlan`, `Order`, `OrderItem`, `OrderEvent`, `Subscription`) in `backend/stores/models.py`.
- Enforce integer minor units (`paisa`) across all prices and discounts.
- Implement `StoreScopedAPIViewMixin` and multi-tenant isolation tests.
- Author `manage.py seed_brewmellow` idempotently provisioning Store #1 (BrewMellow).
