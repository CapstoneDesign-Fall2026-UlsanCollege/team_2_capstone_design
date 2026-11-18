# Week 11 Architecture & Hardening Source Notes

**Purpose:** Concise source-linked walkthrough reference across ShopCraft's hardened Week 11 flows (RLS policy enforcement, Khalti verification, OTP input validation, and Issue `#56` storefront auth crash recovery).  
*Note: These notes summarize verified source modules for peer walkthroughs and code ownership preparation; they do not replace individual human explain-backs or independent teammate sign-off.*

---

## 1. Single-Policy PostgreSQL RLS Enforcement (`64a31f9`)

- **Migration:** [`forwards_drop_legacy_rls_policies`](../../backend/stores/migrations/0013_drop_legacy_rls_policies.py#L4-L76) inspects `pg_policies` in schema `public` when running on PostgreSQL:
  1. Drops any policy referencing legacy `app.bypass_rls` or any non-canonical policy name on tenant tables listed in `TENANT_TABLES`.
  2. Re-applies canonical RLS policies via `apply_postgres_rls_policies(schema_editor=schema_editor)`.
  3. Verifies zero `app.bypass_rls` policies remain and asserts every tenant table has **exact policy set `['tenant_isolation_policy']`**.
- **PostgreSQL 16 Test Verification:** [`test_all_store_fk_tables_in_database_enforce_rls`](../../backend/stores/tests/test_hardening.py#L142-L222) and [`test_set_local_atomic_guard_and_two_tenant_pooled_connection_isolation`](../../backend/stores/tests/test_hardening.py#L224-L276) run in CI [`Run #74`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44248144770) under non-superuser `NOBYPASSRLS` role `shopcraft_app`. Under local SQLite development runs, these PostgreSQL-specific checks are skipped (`skipped=10`).

---

## 2. OTP Email Format Validation, Typo Hint & Spam Note (`0a0ec4d` — Issue `#55`)

- **Shared Helpers:** [`frontend/src/lib/email-validation.ts`](../../frontend/src/lib/email-validation.ts):
  - `validateEmailFormat(rawEmail)` normalizes whitespace/case via `coerceEmailString(rawEmail).trim().toLowerCase()`, rejects malformed addresses (`..`, missing TLD, leading/trailing dots) before dispatching OTP POST requests, and returns an actionable inline message.
  - `getEmailTypoSuggestion(rawEmail)` detects common domain typos (`gmial.com`, `gmai.com`, `gamil.com`, `hotmial.com`, `yaho.com`) and suggests correction without mutating user input automatically.
- **UI Integration:** Wired identically into both merchant/platform [`PasswordlessAuthCard`](../../frontend/src/components/auth/OtpInput.tsx#L103-L163) and storefront [`AccountSheet`](../../frontend/src/components/storefront/AccountSheet.tsx#L87-L111), alongside `"Wrong email? Change it"` reset control and a short `"Check your spam folder"` hint on the OTP step.

---

## 3. Storefront `"Sign in to your account"` Crash Guard (`aa62b2f` — Issue `#56`)

- **What broke on live `/s/brewmellow`:** [`StorefrontHeader.tsx`](../../frontend/src/components/storefront/StorefrontHeader.tsx#L189) passed `<button onClick={onOpenAccount}>`, while storefront pages passed `onOpenAccount={openAccount}` directly. Clicking the header CTA passed React's `MouseEvent` object into `openAccount(email?)`, storing a non-string object in `prefillEmail` and crashing `AccountSheet` with `TypeError: I.trim is not a function`.
- **How `PR #57` fixed it cleanly:**
  1. Added `coerceEmailString()` and `normalizePrefillEmail()` in [`email-validation.ts`](../../frontend/src/lib/email-validation.ts#L22-L35) so non-string inputs cleanly evaluate to `null`.
  2. Guarded [`AccountContext.openAccount`](../../frontend/src/components/storefront/AccountContext.tsx#L21-L27) using `normalizePrefillEmail(email)`.
  3. Wrapped all storefront header props cleanly as `onOpenAccount={() => openAccount()}` across `StorefrontCatalogView.tsx`, `ProductDetailView.tsx`, and `StorefrontAccountClient.tsx`.
  4. Added regression assertions in [`email-validation.test.ts`](../../frontend/src/lib/email-validation.test.ts#L101-L137) confirming synthetic click objects never throw.

---

## 4. Payment Boundary & State Machine Summary (Areas 1 & 4)

- **Khalti Sandbox v2 & COD Fallback:** Backend initiates and verifies transactions server-side via `epayment/lookup/` (`pidx` verification in `orders`). Gateway cancellation (`status=User%20canceled`) returns the shopper to checkout preserving cart and shipping state; stores without configured merchant Khalti keys disable Khalti (`"Not configured by merchant"`) while keeping offline `COD` available ([`CheckoutForm.tsx`](../../frontend/src/components/storefront/CheckoutForm.tsx#L865-L905)).
- **Merchant Order State Machine:** [`MerchantOrderStatusTransitionView`](../../backend/orders/) rejects invalid backward transitions such as `DELIVERED -> PENDING` with `HTTP 400 Bad Request` and supports UI 5-second undo reversal (`merchant-status.test.ts`, `19/19`).
