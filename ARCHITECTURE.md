# Architecture

Multi-tenant storefront builder ("ShopCraft"). Backend: Django + DRF + Postgres (`backend/`). Frontend: Next.js App Router (`frontend/`). Paths are relative to this repo root.
Note: `Product`, `Variant`, `Order`, `OrderItem`, `Discount` etc. live in `backend/stores/models.py`; most REST endpoints live in `backend/stores/api.py`.

## Auth / session
- `backend/accounts/api.py` – `/api/auth/*` endpoints (signup, login, OTP, session).
- `backend/accounts/otp.py` – one-time-code generation and verification.
- `backend/accounts/google_auth.py` – Google sign-in token verification.
- `backend/core/authentication.py` – DRF authentication class that resolves the request user.
- `frontend/src/lib/auth.ts` – client-side token/session helpers (with `components/auth/*` UI).

## Stores & tenancy / RLS
- `backend/stores/models.py` – `Store`, `StoreMembership`, `Customer`, and store-scoped managers/querysets.
- `backend/core/tenant_context.py` – holds the current store/user for the request (feeds RLS settings).
- `backend/core/middleware.py` – sets tenant context per request.
- `backend/stores/migrations/0008_force_rls_policies.py` – FORCE RLS policies (see also `0011_*` membership policy).
- `backend/core/management/commands/setup_postgres_rls.py` – applies/verifies RLS; `backend/scripts/neon_roles.sql` creates DB roles; `scripts/run_rls_neon_concurrency.py` tests isolation.

## Merchant console routes
- `frontend/src/app/merchant/[storeSlug]/layout.tsx` – console shell and store guard.
- `frontend/src/app/merchant/[storeSlug]/{page,products,orders,customers,discounts,analytics,settings}` – console pages.
- `frontend/src/components/merchant/MerchantStoreGuard.tsx` – blocks access to stores the user doesn't own.
- `frontend/src/lib/merchant-guard.ts` – guard logic (tested by `merchant-guard.test.ts`).
- `frontend/src/context/MerchantStoreContext.tsx` – current-store state for the console.

## Online store / themes
- `frontend/src/app/merchant/[storeSlug]/themes/page.tsx` – theme picker page.
- `frontend/src/components/platform/ThemeStudio.tsx` – theme editing/preview UI.
- `frontend/src/components/storefront/ThemePreviewWatcher.tsx` – applies live theme preview to the storefront.
- `frontend/src/lib/theme-contrast.ts` – contrast checks for theme colours.
- `backend/stores/models.py` (`Store.theme_preset` etc.) – theme and branding fields.

## Media / uploads
- `frontend/src/app/api/upload/route.ts` – Next.js upload route handler.
- `frontend/src/lib/cloudinary.ts` – Cloudinary client helpers.
- `backend/stores/cloudinary_upload.py` – server-side Cloudinary upload/signing.
- `frontend/src/lib/storefront-media.ts` and `components/storefront/StoreImage.tsx` – image URL handling and rendering.

## Catalog
- `backend/stores/models.py` – `Product` and `Variant` models (`backend/catalog/` is a thin app).
- `backend/stores/api.py` – product/variant CRUD and public catalog endpoints.
- `frontend/src/app/merchant/[storeSlug]/products/` – merchant product list and editor.
- `frontend/src/components/merchant/{ProductSheet,ProductListTable}.tsx` – product editing UI.

## Orders
- `backend/stores/models.py` – `Order`, `OrderItem`, `OrderEvent` (`backend/orders/` holds migrations/tests).
- `backend/stores/api.py` – order create, status transitions, merchant order endpoints.
- `backend/stores/analytics_discounts_api.py` – analytics and discount endpoints.
- `frontend/src/app/merchant/[storeSlug]/orders/page.tsx` – merchant order queue.
- `frontend/src/components/merchant/{OrderQueueTable,OrderDetailSheet}.tsx` – order list and detail UI.

## Payments
- `backend/stores/khalti.py` – Khalti payment initiate/verify integration (COD toggle on `Store`).
- `frontend/src/lib/khalti-return.ts` – return verification deduplication, 202 polling, and retry controller.
- `frontend/src/app/s/[storeSlug]/checkout/khalti-return/page.tsx` – Khalti redirect return handler.
- `frontend/src/components/storefront/OrderPaymentActions.tsx` – failed retry / pending re-check controls on order detail.
- `frontend/src/components/storefront/CheckoutForm.tsx` – payment method selection and submit.

## Storefront routes
- `frontend/src/app/s/[storeSlug]/layout.tsx` and `page.tsx` – storefront shell and home.
- `frontend/src/app/s/[storeSlug]/products/[productId]/page.tsx` – product detail.
- `frontend/src/app/s/[storeSlug]/{checkout,orders/[orderId],account}/` – checkout, order tracking, customer account.
- `backend/stores/storefront_account_api.py` – storefront customer account API.
- `frontend/src/components/storefront/CartContext.tsx` (with `lib/cart.ts`) – cart state.

## CI / deploy
- `.github/workflows/ci.yml` – backend job (Django + Postgres with FORCE RLS) and frontend job (Next.js).
- `backend/Procfile`, `backend/runtime.txt`, `backend/requirements.txt` – backend process/runtime definition.
- `PRODUCTION_SETUP.md` – production env, Neon, and hosting setup steps.
- `.vercel/` and `frontend/next.config.ts` – frontend Vercel deploy and Next config.
- `.env.example` – required environment variables.
