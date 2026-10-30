# Phase 1: Foundation, Auth & Tenant Core — Milestone Verification Report

**Phase:** SC-01-foundation-auth-tenant-core  
**Target Deadline:** 2026-11-26 (Feature Freeze: 2026-11-24)  
**Completed Date:** 2026-10-30  
**Status:** PASSED (100% verified, 5 of 5 plans complete)  
**Branch:** `saas/main` (commit `bac5710`)  

---

## 1. Executive Summary
Phase 1 established ShopCraft as a clean, multi-tenant e-commerce and subscription SaaS foundation while strictly preserving the legacy BrewMellow midterm baseline (`v1.0-midterm-brewmellow` at `c5668de` on separate Neon branch `ep-dark-term-avy8vnke`). All legacy Next.js SQL routes and client-side `localStorage["demo_user"]` mocks have been purged, replaced by a single Django 6 + DRF backend of record and a mobile-first Next.js 16 frontend with isolated three-surface CSS token boundaries.

---

## 2. Requirement Traceability Matrix

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| **FOUND-01** | Midterm code freeze & zero DB mutation | **PASSED** | Tag `v1.0-midterm-brewmellow` untouched; `settings.py` unconditionally blocks `ep-dark-term-avy8vnke` host. |
| **FOUND-02** | Three isolated CSS token surfaces (`DESIGN.md` §2) | **PASSED** | `:root` (`--sc-*`), `.console` (neutral zinc), and `[data-store-theme]` (`--sf-*`). Verified by `check-surfaces.mjs`. |
| **FOUND-03** | Heroku single-process Procfile & CI | **PASSED** | `backend/Procfile` with `release:` migrations & `web:` gunicorn; `.github/workflows/ci.yml` runs test suite on push. |
| **FOUND-04** | Flagship BrewMellow Seed as Store #1 | **PASSED** | `manage.py seed_brewmellow` seeds 3 origins, 12 variants, 4 plans, 3 orders, 2 subscriptions. Idempotency verified. |
| **FOUND-05** | Strict Integer Paisa Money Storage | **PASSED** | All monetary columns stored as integer minor units (`price_minor`, `subtotal_minor`, `total_minor`). No floats. |
| **AUTH-01** | Passwordless 6-digit Email OTP Auth | **PASSED** | `POST /api/auth/otp/request/` and `/verify/` with 10-min TTL, atomic 5-attempt lockout, dev hint suppression in prod. |
| **AUTH-02** | Google OAuth ID Token Authentication | **PASSED** | `POST /api/auth/google/` verifies ID token with Google Auth library, provisions or authenticates global `accounts.User`. |
| **AUTH-03** | Cross-Tenant HTTP 404 Isolation | **PASSED** | `stores.tests.test_isolation` proves Merchant A gets 404 probing Store B; Shopper X gets 404 on Shopper Y's orders/addresses. |
| **AUTH-04** | Saved Delivery Addresses & Cascading Select | **PASSED** | `/account/addresses` with full 7-Province cascading `AddressSheet`, `^9[78]\d{8}$` validation, and 5-second non-blocking Undo. |

---

## 3. Automated Test Suite Verification

### Backend Tests
```
Ran 18 tests in 7.889s
OK
- accounts.tests.DeliveryAddressAPITests (4 tests)
- accounts.tests.EmailOTPAuthTests (5 tests)
- accounts.tests.GoogleOAuthTests (4 tests)
- stores.tests.test_isolation.TenantIsolationTests (5 tests)
```

### Frontend Linters & Build
```
- check-surfaces.mjs: SURFACE_ISOLATION_OK (0 raw hex in /s/**, 0 --sf-* in /merchant/**)
- zero-mock check: ZERO_DEMO_USER_OK (0 occurrences of demo_user / cached_admin_orders)
- eslint: 0 errors, 0 warnings across Phase 1 surfaces
- next build --webpack: Next.js 16.3.5 production build successful with 12 routes compiled
```

---

## 4. Phase 1 Deliverables & Artifacts
1. **Domain Models & Migrations:**
   - `accounts`: custom `User`, `DeliveryAddress`, `EmailOTPChallenge`
   - `stores`: `Store`, `StoreMembership`, `Customer`
   - `catalog`: `Product`, `Variant`, `SellingPlan`
   - `orders`: `Order`, `OrderItem`, `OrderEvent`
   - `subscriptions`: `Subscription`
2. **APIs & Middleware:**
   - Same-origin proxy via `next.config.ts` rewrites to `/api/*`
   - `StorePublicMixin`, `StoreMerchantMixin`, `StoreScopedSerializerMixin`
   - Hardened `settings.py` with legacy Neon DB firewall
3. **Frontend Surfaces & UI:**
   - Platform Surface: `(platform)/layout.tsx`, `(platform)/login/page.tsx`
   - Account Addresses: `(platform)/account/addresses/page.tsx` + `AddressSheet.tsx` (Radix Dialog)
   - Merchant Console Shell: `merchant/[storeSlug]/layout.tsx` + `merchant/[storeSlug]/page.tsx`
   - Storefront Shell: `s/[storeSlug]/layout.tsx` + `s/[storeSlug]/page.tsx` with dynamic theme scoping
