# ShopCraft: Shopify-Grade Multi-Tenant SaaS Evolution Roadmap

> **Milestone:** Shopify-Equivalent Parity for Nepal (Post-Audit Execution)  
> **Target:** 1:1 workflow, information architecture, and UX match of Shopify (Polaris Admin + Dawn Storefront), adapted for Nepal (NPR, 7-province ward delivery, Khalti, COD, prepaid subscriptions).  
> **Source Documents:** `.planning/PROJECT.md`, `DESIGN.md`, `docs/shopify-ui-upgrade-plan.md`

---

## 1. Executive Summary & Audit Baseline (Phase 0)

1. **Route Inventory:**
   - Platform: `/`, `/login`, `/signup`, `/account/addresses` are active. `/merchant` root route is missing.
   - Merchant Console (`/merchant/[storeSlug]`): Overview, Orders, Products, Subscriptions, and Settings exist. Missing dedicated `/customers`, `/analytics`, `/discounts`, and `/theme` (live customizer) pages.
   - Storefront (`/s/[storeSlug]`): Home, Products PDP, About/Story, Contact, Shipping, Checkout, Khalti return, and Order tracking exist. Dedicated collection pages and tenant customer account portal are missing.
2. **Component Inventory:**
   - Polaris merchant shell, order fulfillment queue, variant grid, cart drawer, and buy-box are solid.
   - 8 legacy files in `components/dashboard/` and 3 files in `components/subscribe/` are completely dead code (0 imports).
   - Zero standardized shadcn/ui primitives (`components/ui`); ad-hoc Tailwind classes lead to inconsistencies.
3. **Data Model & Database:**
   - 10 tenant-owned tables have `store_id` FK (`StoreMembership`, `Customer`, `Product`, `Variant`, `SellingPlan`, `Order`, `OrderItem`, `OrderEvent`, `Subscription`).
   - Missing tables: `Collection`, `Discount`, `MediaAsset`, `MerchantAuditLog`.
   - **Critical Vulnerability:** Postgres Row-Level Security (RLS) is missing.
4. **Auth & Tenant Resolution:**
   - Passwordless 6-digit Email OTP + Google OAuth with `HttpOnly` same-origin cookies.
   - Merchant console resolves tenant from URL kwargs + `StoreMembership`.
   - Missing store switcher for users with multiple stores and missing `/merchant` redirector.
5. **Theming Architecture:**
   - Semantic CSS variables in `globals.css` applied via `[data-store-theme="<preset>"]`.
   - Surface isolation enforced via `scripts/check-surfaces.mjs`.
   - Storefront does not inject custom `accent_color` overrides. Live visual theme customizer missing.
6. **Payments:**
   - COD with 10-digit phone validation and order lifecycle transitions is operational.
   - Khalti ePayment v2 initiates and verifies server-side, but has an unrestricted sandbox bypass.
   - Direct one-time retail purchases with Khalti Sandbox v2 and Cash on Delivery fallback. (Shopper recurring subscriptions formally cut in PR #45).
7. **Security Gaps Identified:**
   - Absence of database-level Postgres RLS.
   - Unauthenticated, unscoped `/api/upload` route writing to local `public/uploads/`.
   - Debug backdoor in `StoreMerchantMixin` granting access to any `admin@*` email when `DEBUG=True`.
   - Sequential integer IDOR on `/api/stores/<slug>/public-orders/<order_id>/`.
   - Unrestricted sandbox verification check on Khalti returns.
   - Missing IP rate limiting on checkout and slug checks.

---

## 2. Parity Map

| Surface | Screen / Feature | Shopify Equivalent | Status | Nepal Adaptation | Priority |
|---|---|---|---|---|---|
| Platform | Marketing Home | Shopify.com Home | **Done** | NPR pricing, Nepal delivery proof, local showcase | P1 |
| Platform | Auth / Sign In | Shopify ID | **Done** | Passwordless 6-digit Email OTP + Google OAuth | P1 |
| Platform | Onboarding Wizard | Store Setup Flow | **Partial** | Needs "What you sell", City, and "Your store is ready" screen | P1 |
| Platform | Store Switcher | Multi-store picker | **Missing** | Switch between owned stores | P1 |
| Merchant | Console Shell | Polaris Frame | **Done** | Neutral zinc `#18181B`, ⌘K palette, 240px sidebar, bottom nav | P1 |
| Merchant | Dashboard Overview | Polaris Home | **Partial** | Needs quick actions, sales sparkline, contextual onboarding | P1 |
| Merchant | Orders Queue & Detail | Polaris Orders | **Done** | Status tabs, detail drawer, COD cash collection | P1 |
| Merchant | Courier Packing Slip | Shopify Shipping | **Adapted** | Pathao/Upaya/bike courier thermal & A4 slip with Chowk/Landmark | P1 |
| Merchant | Products & Variants | Polaris Products | **Done** | Grind & size variant matrix, integer paisa | P1 |
| Merchant | Customers Directory | Polaris Customers | **Missing** | Dedicated customer directory & order history | P2 |
| Merchant | Subscriptions Hub | Shopify Subscriptions | **CUT (PR #45)** | Formally removed from MVP scope in PR #45; one-time retail purchases only | N/A |
| Merchant | Theme Editor | Polaris Online Store | **Missing** | Side-by-side theme customizer with live preview | P2 |
| Merchant | Analytics | Polaris Analytics | **Missing** | Conversion rate, AOV, revenue chart, province breakdown | P3 |
| Merchant | Discounts Engine | Polaris Discounts | **Missing** | Promo codes, percentage/fixed discounts | P3 |
| Merchant | Settings & Staff | Polaris Settings | **Partial** | Needs staff role management and audit log | P2 |
| Storefront | Storefront Home | Dawn Theme Home | **Done** | Announcement bar, hero banner, category chips, 1:1 cards | P1 |
| Storefront | Product Detail (PDP) | Dawn PDP | **Done** | Dual purchase box, grind selector, sticky mobile CTA | P1 |
| Storefront | Cart Drawer | Dawn Ajax Drawer | **Done** | Kathmandu Valley free shipping threshold meter | P1 |
| Storefront | Story / About Page | Shopify About | **Done** | Brand story, terroir origin, contact links | P1 |
| Storefront | Mobile Checkout | 1-Page Checkout | **Adapted** | 7-Province ward address resolution, Khalti + COD | P1 |
| Storefront | Order Confirmation | Thank You Page | **Done** | 4-stage tracking timeline (Placed $\to$ Packed $\to$ Shipped $\to$ Delivered) | P1 |
| Storefront | Customer Account | Customer Portal | **Missing** | Saved addresses exists; tenant order history missing | P2 |

---

## 3. The 6 Vertical Slices (Execution Order)

### Slice 1: Fix Data Model + Postgres RLS + Isolation Tests
1. **Database-Level RLS (Neon PostgreSQL):**
   - Enable `ROW LEVEL SECURITY` on `catalog_product`, `catalog_variant`, `catalog_sellingplan`, `orders_order`, `orders_orderitem`, `orders_orderevent`, `stores_customer`, `subscriptions_subscription`.
   - Create Postgres session variable `app.current_store_id` and RLS policies ensuring tenant queries only access rows where `store_id = current_setting('app.current_store_id')::bigint`.
2. **Security Hardening:**
   - Remove the `admin@` backdoor from `StoreMerchantMixin`.
   - Deprecate `/api/upload`; replace with authenticated, store-prefixed, rate-limited upload endpoint or Cloudinary signed uploads.
   - Replace sequential integer order lookups with unguessable order access tokens (UUID/hash).
   - Guard Khalti sandbox verification strictly with `store.khalti_mode == "TEST"`.
3. **Dead Code Cleanup:**
   - Delete dead `components/dashboard/`, `components/subscribe/`, `mockData.ts`, and unused legacy files.
4. **Automated Multi-Tenant Isolation Tests:**
   - Automated tests proving cross-tenant read, write, delete, IDOR, and RLS bypass attempts fail with 404/403.

### Slice 2: Auth + Onboarding + Store Creation
1. **Onboarding Wizard Evolution:**
   - Update `/merchant/new` to capture: Store Name, Slug, Category ("What you sell": Coffee, Tea, Apparel, Bakery, Crafts, etc.), Phone, City/Province, and Theme Preset.
2. **"Your Store Is Ready" Screen:**
   - Confetti/celebration transition modal showing store URL, live link, and "Open Merchant Console" CTA.
3. **Tenant Routing & Store Switcher:**
   - Add `/api/auth/me/stores/` endpoint returning user's active store memberships.
   - Add `/merchant` redirector forwarding the user to their last active or primary store.
   - Add multi-store dropdown in `MerchantSidebar` for merchants with multiple stores.

### Slice 3: Merchant Shell + Products + Orders
1. **Standardized UI Primitives:**
   - Introduce clean shadcn-style UI primitives (`components/ui/button.tsx`, `input.tsx`, `badge.tsx`, `dialog.tsx`, `sheet.tsx`, `table.tsx`).
2. **Dedicated Customers Page:**
   - Build `/merchant/[storeSlug]/customers` with search, total spent, order count, and customer detail sheet.
3. **Catalog & Order Polish:**
   - Polish `ProductListTable` with bulk actions and status badges.
   - Refine `OrderDetailSheet` and `PackingSlipModal` with thermal printing layout.

### Slice 4: Theme System + Story Page + Storefront + Cart Drawer + Checkout
1. **Polaris Theme Editor (`/merchant/[storeSlug]/theme`):**
   - Side-by-side customizer: left control panel (colors, typography, announcement bar, hero text/banner, footer), right live preview iframe showing `/s/[storeSlug]`.
2. **Dynamic Store Identity:**
   - Store custom `accent_color` injected into CSS variables (`--sf-cta`, `--sf-accent`).
   - Dynamic announcement bar message and free shipping banner driven by store settings.
3. **Storefront Refinements:**
   - Mobile-first 375px audit: 44px tap targets, thumb-zone CTAs, zero horizontal overflow.
   - Single-screen checkout polish with validation feedback.

### Slice 5: Subscriptions [FORMALLY CUT IN PR #45 — OUT OF SCOPE]
- Shopper recurring subscriptions and merchant subscriptions workspace were formally removed from the MVP scope in PR #45.
- All purchases across ShopCraft operate strictly as direct one-time retail transactions with Khalti Sandbox v2 and Cash on Delivery fallback. This slice is not a requirement for Week 11 freeze or final demo.

### Slice 6: Dashboard Home, Analytics, Settings & Polish
1. **Dashboard Home Polish:**
   - Setup checklist with completed status, today's sales graph, quick action shortcuts.
2. **Dedicated Analytics Page (`/merchant/[storeSlug]/analytics`):**
   - KPI cards (Gross Sales, Orders, AOV, Conversion Rate), sales-by-province chart, top products.
3. **Settings Polish & Final Hardening:**
   - Staff invite modal (`OWNER` vs `STAFF`), audit log viewer, Khalti key status.
4. **Dual Breakpoint Verification:**
   - Browser verification at 375px (mobile) and 1280px (desktop) for both tenant storefronts and merchant console.
