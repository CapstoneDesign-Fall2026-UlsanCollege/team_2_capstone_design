# Plan 01-05 Summary: Platform Auth & Saved Address Management

**Phase:** SC-01-foundation-auth-tenant-core  
**Plan:** 01-05  
**Status:** Complete  
**Commit:** `9149f11`  
**Date:** 2026-10-30  

---

## 1. Objectives & Delivered Scope
- **Passwordless `/login` & `/signup` Platform Auth:**
  - Deleted legacy single-tenant `frontend/src/app/login/page.tsx`, eliminating the last occurrences of `demo_user` in the repository.
  - Implemented `frontend/src/app/(platform)/login/page.tsx` serving both `/login` and `/signup` with editorial title adaptation (`Create your ShopCraft account` vs `Sign in to ShopCraft`).
  - Wired `?name=` and `?next=` parameters with `sanitizeRedirectTarget`, displaying `Launching "<name>"` pill.
  - Wired session hydration skeleton to prevent layout shift; authenticated users can continue directly or sign out.
- **Nepali Administrative `AddressSheet` Drawer:**
  - Implemented `frontend/src/components/account/AddressSheet.tsx` using accessible `@radix-ui/react-dialog`.
  - Full 7-Province static administrative dataset (77 Districts, Municipalities, and Ward 1..35).
  - Province -> District -> Municipality cascading dropdowns.
  - Form field phone validation using `^9[78]\d{8}$` on blur with inline red message: `Enter a 10-digit number starting with 98 or 97.`.
  - 48px primary action button (`Save address` / `Save changes`) with disabled pending state.
- **Saved Address Management (`/account/addresses`):**
  - Implemented `frontend/src/app/(platform)/account/addresses/page.tsx`.
  - Empty state strictly matching `01-UI-SPEC.md`: `No saved delivery address yet`, `Add your chowk and ward once so checkout takes one tap.`, and 48px `Add delivery address` button.
  - Populated cards showing address label, default badge, phone, ward, municipality, district, province, and Edit/Remove actions.
  - Non-blocking 5-second `Undo` bar with countdown for accidental removal before triggering API deletion.
  - Fully mobile-responsive at 375px with zero horizontal scroll.

---

## 2. Verification Results
1. `node frontend/scripts/check-surfaces.mjs`:
   - `SURFACE_ISOLATION_OK` (0 raw hex in `/s/**`, 0 `--sf-*` in `/merchant/**`).
2. Zero mock user verification:
   - `ZERO_DEMO_USER_OK` confirmed across entire `frontend/src/**`.
3. ESLint:
   - `npm run lint -- "src/app/(platform)" "src/app/merchant" "src/app/s" "src/components/account" "src/components/auth" "src/lib"` exited 0.
4. Production Build:
   - `npm --prefix frontend run build` compiled all routes cleanly with Next.js 16.3.5:
     - `○ /login`
     - `○ /account/addresses`
     - `ƒ /merchant/[storeSlug]`
     - `ƒ /s/[storeSlug]`
5. Backend Tests:
   - `python manage.py test accounts stores.tests.test_isolation`: 18 tests passing in 7.8s.

---

## 3. Deviations & Decisions
- Used key-based resetting for `AddressForm` (`key={initialAddress ? 'edit-' + id : 'create'}`) inside `AddressSheet` to satisfy strict React hook lint rules without requiring `useEffect` `setState` calls.
