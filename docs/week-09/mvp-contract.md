# MVP Contract — ShopCraft (Post-Midterm Pivot from BrewMellow)

**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Course:** Capstone Design — Fall 2026  
**Week:** 9 (MVP Contract and Scope Cut)  
**Date:** Wednesday, November 4, 2026 (Submitted for Nov 4 EOD Deadline)  
**Live Deployed Application:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)  
**Repository:** [https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design)

> *“After the midterm, your job is not to make the project bigger. Your job is to make it real.”*

---

## 1. Architectural Pivot: From BrewMellow to ShopCraft

Following the Midterm review, our team acted on feedback received in class:
- **The Problem with Single-Store Scope:** Building a standalone website for a single coffee brand was architecturally narrow and lacked the technical depth demanded of a senior capstone engineering project.
- **The Pivot to ShopCraft:** We evolved the project into **ShopCraft** — a multi-tenant e-commerce SaaS platform engineered specifically for Nepal's growing craft economy (artisanal coffee roasters, wild honey harvesters, handloom weavers).
- **Tenant Structure:**
  - **Store #1 (Flagship Roastery):** **BrewMellow** (`/s/brewmellow`), selling single-origin coffees from Gulmi, Ilam, and Nuwakot.
  - **Store #2 (Isolation Verification Tenant):** **Pahadi Honey** (`/s/pahadi-honey`), selling wild cliff honey to prove multi-tenant isolation.
- **Payment Gateway Continuity:** We kept and delivered our **Khalti Sandbox ePayment v2** milestone as the native digital wallet payment integration for all ShopCraft stores, paired with an offline Cash on Delivery (COD) fallback.

---

## 2. What We Are Definitely Finishing (Finish List)

1. **Khalti Sandbox E-Payment v2 & Cash on Delivery (COD):**
   - Server-side signature initiation (`POST /api/payments/khalti/initiate/`) returning valid `pidx` and checkout URL.
   - Redirect to Khalti Sandbox checkout, completing test payment with official test credentials (`9800000000`, PIN `1111`, OTP `987654`).
   - Server-side verification via Khalti `epayment/lookup/` with idempotent order state transition to `PAID`.
   - Zero-network Cash on Delivery (COD) fallback with 10-digit mobile number validation and server-authoritative pricing.

2. **Single-Screen Storefront Checkout & Order Tracking:**
   - Unified checkout at `/s/[storeSlug]/checkout` with Nepali delivery address collection (Province 1–7, City, Street, Phone).
   - Order receipt generation with immutable snapshots of item prices and shipping addresses.
   - Post-purchase order status tracking in customer portal and merchant fulfillment console (`/merchant/[storeSlug]/orders`).

3. **Multi-Tenant Data Isolation & RLS Security:**
   - PostgreSQL Row-Level Security (RLS) and Django `StoreScopedManager` enforcing complete data isolation across stores.
   - 51 automated tests, including 6 dedicated tenant-isolation tests (`test_isolation.py`), proving that Store Owner A probing Store B receives HTTP 404.

4. **Merchant Order Fulfillment Queue:**
   - Status machine transitions (`PAID → PROCESSING → SHIPPED → DELIVERED`) backed by `OrderEvent` audit logs.
   - 5-second undo toast action for merchant operational error recovery.

---

## 3. What We Are Cutting or Postponing (Scope Cut List)

In strict accordance with the Week 9 Scope Cut mandate, we formally cut or postpone the following items from the MVP:

| Cut / Postponed Feature | Reason for Cut | Impact on Final Demo |
|---|---|---|
| **CUT: Shopper Recurring Subscriptions (PR #45)** | Recurring shopper subscriptions were formally removed from the MVP in PR #45. Digital wallets in Nepal require explicit user OTP per transaction; eliminating subscriptions bounds the system to robust one-time purchases with Khalti Sandbox v2 and Cash on Delivery fallback. | **Zero negative impact.** Preserves full focus on multi-tenant RLS isolation and reliable checkout. |
| **CUT: Live Third-Party Courier API Tracking** | Domestic couriers in Nepal (Pathao, Himalayan Express) lack public developer sandbox APIs. | **Zero negative impact.** Managed through internal fulfillment status transitions (`CONFIRMED → PROCESSING → SHIPPED → DELIVERED`). |
| **CUT: Algorithmic AI Coffee Recommender Quiz** | Specialty craft buyers value terroir transparency (altitude, wash process, cupping notes) over generic chatbot questionnaires. | **Zero negative impact.** Curated micro-lot descriptions and roast profiles are directly available on product cards. |
| **CUT: Multi-Vendor Public Marketplace Directory** | The core vision is self-serve merchant storefronts (Shopify model), not a centralized cluttered marketplace (Daraz model). | **Zero negative impact.** Preserves brand autonomy via `/s/[storeSlug]` dedicated storefronts. |
| **CUT: Multi-Currency Foreign Exchange Conversion (USD/EUR)** | Multi-currency introduces FX rate volatility; Khalti sandbox operates exclusively in Nepalese Rupees (NPR / paisa). | **Zero negative impact.** All transactions are strictly denominated in NPR. |

---

## 4. Final Demo Proof (How We Prove It Works)

On final demonstration day, our team will run a live 5-minute evaluation covering:

1. **Merchant Storefront Experience:** Customer browses `/s/brewmellow`, adds 250g Gulmi Bourbon to cart, fills in Kathmandu address, and clicks Checkout.
2. **Khalti Sandbox Payment:** Customer completes sandbox payment via official test credentials; server verifies transaction via `epayment/lookup/` and displays confirmation receipt.
3. **Resilience Fallback:** Second customer checks out via Cash on Delivery (COD) with zero network delay.
4. **Merchant Fulfillment:** Roaster opens `/merchant/brewmellow/orders`, inspects order items, and updates status to `PROCESSING` and `SHIPPED`.
5. **Multi-Tenant Isolation Guard:** Authenticating as Store B merchant and attempting to read Store A's orders returns HTTP 404.

---

## 5. Week 11 Feature Freeze Criteria

By **November 12, 2026 (Week 11 MVP Freeze Gate)**, the following gates must be met:
- Zero open regression bugs on checkout and payment callback flows.
- 100% pass rate on the 51-test Django test suite.
- Zero TypeScript compilation errors (`tsc --noEmit`).
- Zero surface isolation violations (`check-surfaces.mjs`).
- Clean-clone reproduction verified on an external machine by Kushan Sunuwar.

---

## 6. Team Ownership & Responsibilities

| Student | GitHub Login | Primary Ownership |
|---|---|---|
| **Aditya Kumar Gupta** | `@notyouradhee` | Full-Stack Architecture, Khalti Sandbox ePayment v2, Merchant Queue |
| **Kushan Sunuwar** | `@Kushan2191` | QA Lead, Independent Non-Author Sandbox Testing, Clean Clone Runbook |
| **Aanchal Chand Thakuri** | `@jaasly07` | Storefront UI/UX, Mobile Viewport Ergonomics (360px/390px), WCAG AA Contrast |
| **Rohit Chhantyal** | `@Rohit-coder201` | DevOps, Backend Health Probe (`/api/health/`), Order Lifecycle State Machine |
