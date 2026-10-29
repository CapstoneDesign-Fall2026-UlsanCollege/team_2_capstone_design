---
phase: "1"
slug: "foundation-auth-tenant-core"
status: draft
nyquist_compliant: true
wave_0_complete: true
created: "2026-10-30"
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution of `SC-01-foundation-auth-tenant-core`.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Django `TestCase` / DRF `APITestCase` (Python 3.13 + Django 6.1.1) + Node ESM surface guard + Next.js 16 TypeScript/Webpack build |
| **Config file** | `backend/core/settings.py`, `frontend/eslint.config.mjs`, `frontend/next.config.ts` |
| **Quick run command** | `backend/venv/Scripts/python.exe backend/manage.py test accounts stores.tests.test_isolation --verbosity 2 && node frontend/scripts/check-surfaces.mjs` |
| **Full suite command** | `backend/venv/Scripts/python.exe backend/manage.py check && backend/venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run && backend/venv/Scripts/python.exe backend/manage.py test --verbosity 2 && node frontend/scripts/check-surfaces.mjs && npm --prefix frontend run build` |
| **Estimated runtime** | ~25 seconds |

---

## Sampling Rate

- **After every task commit:** Run the task's `<verify><automated>` command from repo root (`d:/Team2_Capstone_project/team_2_capstone_design`).
- **After every plan wave:** Run `backend/venv/Scripts/python.exe backend/manage.py test --verbosity 2` and (from Wave 2 onward) `node frontend/scripts/check-surfaces.mjs && npm --prefix frontend run build`.
- **Before `/gsd-verify-work`:** Full suite must be green, `manage.py seed_brewmellow` verified idempotent across two runs, and zero `demo_user` / `@neondatabase/serverless` references present.
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01, FOUND-02, FOUND-05 | T-01-01, T-01-02, T-01-03 | `LEGACY_NEON_HOST` guard blocks frozen BrewMellow DB; Next.js SQL routes & `db.ts` deleted; `/api/health/` & `/api/stores/<slug>/` respond cleanly on fresh `0001_initial` migrations | integration / tracer | `backend/venv/Scripts/python.exe backend/manage.py migrate --noinput && backend/venv/Scripts/python.exe backend/manage.py check` | ✅ (in task) | ⬜ pending |
| 01-01-02 | 01 | 1 | FOUND-01, FOUND-02, FOUND-05 | T-01-01, T-01-03, T-01-SC | Audited `requirements.txt` pinned; `CORS_ALLOW_ALL_ORIGINS=False`; `SESSION_COOKIE_HTTPONLY=True`; Fernet encrypts `Store.khalti_secret_key_encrypted`; Next.js build succeeds | config / smoke | `backend/venv/Scripts/python.exe backend/manage.py check && npm --prefix frontend run build` | ✅ (in task) | ⬜ pending |
| 01-02-01 | 02 | 2 | AUTH-01, AUTH-02 | T-01-04, T-01-05 | 6-digit Email OTP issues `HttpOnly` `sessionid` cookie, enforces 10-min TTL + atomic 5-attempt lockout + `ScopedRateThrottle`, and suppresses `dev_otp_hint` when `DEBUG=False` | integration / tracer | `backend/venv/Scripts/python.exe backend/manage.py test accounts --verbosity 2` | ✅ (in task) | ⬜ pending |
| 01-02-02 | 02 | 2 | AUTH-01 | T-01-06, T-01-SC | `POST /api/auth/google/` verifies ID token audience/issuer/`email_verified` via `google-auth`; `@neondatabase/serverless` removed; `check-surfaces.mjs` active | unit + static guard | `backend/venv/Scripts/python.exe backend/manage.py test accounts --verbosity 2 && node frontend/scripts/check-surfaces.mjs` | ✅ (in task) | ⬜ pending |
| 01-02-03 | 02 | 2 | AUTH-04 | T-01-07 | Authenticated Nepali `DeliveryAddress` CRUD validates `^9[78]\d{8}$` and returns HTTP `404` when accessing another shopper's address ID | integration | `backend/venv/Scripts/python.exe backend/manage.py test accounts --verbosity 2 && npm --prefix frontend run build` | ✅ (in task) | ⬜ pending |
| 01-03-01 | 03 | 3 | FOUND-03, FOUND-04, AUTH-03 | T-01-08, T-01-09 | `StoreScopedAPIViewMixin` resolves tenant strictly from URL `store_slug`, binds `request.store`, and enforces `StoreMembership` / `Customer` boundaries across `catalog` & `orders` | integration / tracer | `backend/venv/Scripts/python.exe backend/manage.py makemigrations --check --dry-run && backend/venv/Scripts/python.exe backend/manage.py migrate --noinput` | ✅ (in task) | ⬜ pending |
| 01-03-02 | 03 | 3 | FOUND-03, FOUND-05 | T-01-08, T-01-SC | `Subscription` integer-paisa invariants hold and `manage.py seed_brewmellow` is strictly idempotent across repeated invocations | integration | `backend/venv/Scripts/python.exe backend/manage.py seed_brewmellow && backend/venv/Scripts/python.exe backend/manage.py seed_brewmellow` | ✅ (in task) | ⬜ pending |
| 01-03-03 | 03 | 3 | FOUND-04, AUTH-03 | T-01-08, T-01-09, T-01-10 | Merchant A gets HTTP `404` on Merchant B's store endpoints; Shopper X gets HTTP `404` on Shopper Y's orders/addresses; single user holds `OWNER` in Store A + `Customer` in Store B | security / isolation | `backend/venv/Scripts/python.exe backend/manage.py test accounts stores.tests.test_isolation --verbosity 2` | ✅ (in task) | ⬜ pending |
| 01-04-01 | 04 | 3 | FOUND-02 | T-01-12, T-01-13 | Three isolated CSS token scopes (`--sc-*`, `.console`, `[data-store-theme]` `--sf-*`) active; `Navbar.tsx` deleted; zero raw hex in `/s/**` and zero `--sf-*` in `/merchant/**` | static guard / tracer | `node frontend/scripts/check-surfaces.mjs` | ✅ (in task) | ⬜ pending |
| 01-04-02 | 04 | 3 | FOUND-02 | T-01-12, T-01-SC | Routable `/s/[storeSlug]` and `/merchant/[storeSlug]` layout and leaf page shells compile and pass surface isolation guard | static + build | `node frontend/scripts/check-surfaces.mjs && npm --prefix frontend run build` | ✅ (in task) | ⬜ pending |
| 01-05-01 | 05 | 4 | AUTH-01, AUTH-02 | T-01-11, T-01-12 | `/login` & `/signup` use `PasswordlessAuthCard` + sanitized `?next=`/`?name=` redirects; zero `demo_user` occurrences remain anywhere in `frontend/src/**` | static + build | `node frontend/scripts/check-surfaces.mjs` | ✅ (in task) | ⬜ pending |
| 01-05-02 | 05 | 4 | AUTH-04 | T-01-11, T-01-SC | `/account/addresses` + `AddressSheet` cascade Nepal `Province -> District -> Municipality -> Ward`, validate `^9[78]\d{8}$` inline, and remove with 5s `Undo` | lint + build | `node frontend/scripts/check-surfaces.mjs && npm --prefix frontend run lint -- "src/app/(platform)" "src/app/merchant" "src/app/s" "src/components/account" "src/components/auth" "src/lib" && npm --prefix frontend run build` | ✅ (in task) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing Django `manage.py test` and Next.js build infrastructure plus self-contained task tests (`backend/accounts/tests.py` in `01-02`, `frontend/scripts/check-surfaces.mjs` in `01-02`, and `backend/stores/tests/test_isolation.py` in `01-03`) cover all Phase 1 requirements without a separate Wave 0 scaffold plan.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Staging Vercel -> Heroku `/api/health/` same-origin proxy & live legacy BrewMellow preservation | FOUND-01, FOUND-02 | Requires live cloud credentials (`Vercel` preview env, `Heroku` staging dyno, `Neon` `staging` branch) outside local CI | 1. Verify production BrewMellow URL still loads untouched.<br>2. Open staging Vercel URL `/api/health/` and confirm HTTP `200` `{"status": "ok", "database": "ok"}` with zero CORS errors. |
| Interactive Google Identity Services browser sign-in button | AUTH-01 | Real Google OAuth consent popup requires live `NEXT_PUBLIC_GOOGLE_CLIENT_ID` origin registration in Google Cloud Console (server token verification is automated via `unittest.mock` in `01-02`) | Click `"Continue with Google"` on `/login`, complete consent, and confirm `sessionid` `HttpOnly` cookie is set and `/account/addresses` hydrates signed-in user. |
| 375px mobile viewport visual inspection of `/login` and `/account/addresses` `AddressSheet` | AUTH-01, AUTH-04 | Confirms visual rhythm, `48px` touch targets, `dvh` bottom-sheet ergonomics, and 5-second `Undo` status bar feel | Open Chrome DevTools (`375x812`), sign in via Email OTP, add a Kirtipur address in `AddressSheet`, and test `"Remove"` -> `"Undo"`. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands and immediate `<fails_when>` failure definitions
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 / self-contained test creation covers every requirement (`FOUND-01..05`, `AUTH-01..04`)
- [x] No watch-mode flags (`--watch`) or error-swallowing fallbacks (`|| true`, `2>/dev/null || echo`)
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
