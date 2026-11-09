# Final Demo Roadmap — Team 2: ShopCraft

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Evidence Review Date:** 2026/11/04 (Asia/Kathmandu)  
**Status:** Sprint 2 (MVP Contract & Scope Cut Phase)  
**Live Production URL:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)

This roadmap connects our project status, testing evidence, remaining work, and preparation for the final demonstration. Planned activities are explicitly separated from completed verification.

---

## 1. Final Demo Promise

Our final capstone demonstration will prove:

> **ShopCraft** is a multi-tenant e-commerce SaaS platform engineered for Nepal's craft economy that empowers independent producers (like our flagship tenant **BrewMellow**, an artisanal coffee roaster) to launch dedicated online storefronts, sell products with localized Nepali address validation, process payments securely via **Khalti Sandbox ePayment v2** (with instant **Cash on Delivery** fallback), fulfill orders through an isolated merchant operations console, and guarantee enterprise-grade data isolation across all stores via PostgreSQL Row-Level Security (RLS).

### Problem We Are Solving & Why We Pivoted
Specialty craft producers across Nepal (coffee roasters, honey harvesters, textile artisans) lack accessible direct-to-consumer software. Daraz is cluttered and commoditized; Shopify lacks native Khalti payments and Nepali provincial addresses (Provinces 1–7). 

Following our midterm review, we pivoted from building a single standalone coffee store to building **ShopCraft**, a localized multi-tenant e-commerce engine where **BrewMellow** operates as our flagship pilot store (Tenant #1).

### Core Demonstration Journey
The frozen, verified user journey for the final demonstration is:

$$\text{Storefront } (/s/\text{brewmellow}) \longrightarrow \text{Product Selection} \longrightarrow \text{Single-Screen Checkout} \longrightarrow \text{Khalti Sandbox (or COD)} \longrightarrow \text{Confirmation} \longrightarrow \text{Merchant Console} \longrightarrow \text{Tenant Isolation 404 Guard}$$

1. **Storefront Discovery:** Customer explores single-origin micro-lots with elevation and roast notes at `/s/brewmellow`.
2. **Product Configuration:** Customer selects bag weight (250g / 500g / 1kg) and grind size.
3. **Single-Screen Checkout:** Customer enters verified Nepali address (Province, City, Street, 10-digit Phone).
4. **Payment Processing:** Customer completes payment via **Khalti Sandbox ePayment v2** using official test credentials, OR switches instantly to offline **Cash on Delivery (COD)** fallback.
5. **Customer Confirmation:** Customer receives instantaneous visual invoice and order tracking token.
6. **Merchant Fulfillment:** Roaster opens `/merchant/brewmellow/orders`, inspects order items, and updates order lifecycle (`PAID → PROCESSING → SHIPPED → DELIVERED`).
7. **Tenant Isolation Verification:** Merchant from Store B (`pahadi-honey`) attempts to access Store A's orders or products, receiving an immediate **HTTP 404 Not Found**.

### Transparent Boundaries — What the Final Demo Will NOT Claim
- **Sandbox Currency:** Khalti transactions run in the official Khalti Sandbox environment (`epayment/lookup/` with `pidx`). **No real fiat currency is transferred.**
- **Subscriptions Formally Cut (PR #45):** Shopper recurring subscriptions were formally removed from the MVP scope in PR #45. All purchases across ShopCraft operate strictly as direct one-time retail purchases with Khalti Sandbox v2 and Cash on Delivery fallback.
- **No Third-Party Courier Fleet Dispatch:** Logistics tracking is managed internally through merchant dispatch status transitions rather than live third-party courier GPS APIs.
- **Explicit Scope Cuts:** Recommendation questionnaires, multi-currency conversions, and public marketplace directories are formally dropped per [`mvp-contract.md`](mvp-contract.md).

---

## 2. Current Project Status & Evidence Matrix

**MVP Progress:** Ahead of schedule — Core vertical slice verified in runtime code; 113 backend tests pass across active apps; frontend zero type errors.

| Feature or Behavior | Current Status | Verifiable Evidence | Remaining Work (to Week 11 Freeze) |
|---|---|---|---|
| **Multi-Tenant Isolation (RLS)** | **PASS** | 113 Django tests pass (`test_isolation.py`); HTTP 404 cross-tenant guard | Retest during Week 11 feature freeze |
| **Storefront Discovery (`/s/brewmellow`)** | **PASS** | Deployed live on Vercel over HTTPS; SSR catalog hydration | Polish mobile hero banner contrast |
| **Product Customization & Cart Drawer** | **PASS** | Store-scoped local persistence; variant price recalculation | Add quantity stepper micro-animations |
| **Single-Screen Checkout** | **PASS** | Nepali address validation (10-digit regex, province enum) | Edge-case validation testing |
| **Khalti Sandbox ePayment v2** | **PASS** | Server-side lookup via `epayment/lookup/` with `pidx` verification (Commit `1374b23`) | Add webhook timeout fallback warning |
| **Cash on Delivery (COD) Fallback** | **PASS** | Instant offline checkout with `CONFIRMED` order status | Maintain zero-dependency path |
| **Merchant Fulfillment Queue** | **PASS** | Status machine with 5-second undo toast (Commit `f54333c`) | Add order search by customer phone |
| **Backend System Health Probe** | **PASS** | `/api/health/` returns database connectivity status (200 OK) | Add cache latency metric |
| **Local Clean-Clone Setup** | **PASS** | `README.md` clean setup verified by independent tester Kushan Sunuwar | Package automated seed script |

---

## 3. Architecture Structure: ShopCraft Multi-Tenant Hierarchy

| Store / Tenant | Slug | Domain / Role | Verification Function |
|---|---|---|---|
| **BrewMellow (Store #1)** | `brewmellow` | Artisanal Himalayan Coffee Roastery | Primary customer checkout & merchant fulfillment demonstration |
| **Pahadi Honey (Store #2)** | `pahadi-honey` | Wild Cliff Honey Producer | Cross-tenant security & data isolation test fixture |
| **ShopCraft Platform** | `/` | Multi-Tenant Platform & Merchant Portal | Merchant store provisioning and platform overview |

---

## 4. Milestone Schedule to Final Demo

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     SPRINT 1 (W1-W8)    │    SPRINT 2 (W9-W11)    │    SPRINT 3 (W12-W14)   │      SPRINT 4 (W15)     │
│   Vertical Slice & Demo │   MVP Contract & Freeze │     QA, Mobile & A11y   │   Final Rehearsal & Go  │
├─────────────────────────┼─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Rated 'Exceeds'       │ • Week 9: ShopCraft     │ • Non-author clean      │ • Live 5-minute staged  │
│ • Initial Prototype     │   Pivot formalized,     │   reproduction runs     │   demonstration         │
│ • Architecture Review   │   Khalti Sandbox v2,    │ • WCAG AA audit         │ • Documented fallback   │
│ • Seed initial catalog  │   Tenant Isolation check│ • Stress & latency test │ • Zero-leak repository  │
│                         │ • Week 10: Code & AI    │ • Packaging & handoff   │ • Complete team receipt │
│                         │   Ownership Audit       │   documentation         │   portfolio             │
│                         │ • Week 11: Feature      │                         │                         │
│                         │   Freeze Gate (Nov 12)  │                         │                         │
└─────────────────────────┴─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

### Sprint 2 (Weeks 9–11) — MVP Contract, Scope Cut & Feature Freeze
- **Week 9 (Current — Nov 4):** Author official MVP Contract; deliver Khalti Sandbox ePayment v2 + COD fallback; record end-to-end tenant isolation test; fix roadmap chronology; publish shared report with all 4 student rows and receipts.
- **Week 10 (Nov 5–11):** Conduct thorough Code Ownership & AI-use audit across frontend and backend; prepare individual code defense portfolios.
- **Week 11 (Nov 12 — MVP Feature Freeze Gate):** Lock all feature branches; verify zero regressions; freeze production build.

### Sprint 3 (Weeks 12–14) — Non-Author QA, Mobile Audits & Packaging
- **Week 12 (Nov 13–19):** Full non-author reproduction drill across different OS environments (Windows, macOS, Linux).
- **Week 13 (Nov 20–26):** WCAG 2.1 AA accessibility and mobile viewport stress testing (360px, 390px, 412px).
- **Week 14 (Nov 27–Dec 3):** Final handoff documentation, clean-install verification, and presentation slide deck draft.

### Sprint 4 (Week 15) — Final Demonstration & Course Defense
- **Week 15 (Dec 4–10):** Rehearsed 5-minute timed presentation with live dual-rail demo (Khalti Sandbox + COD backup) and Q&A defense.
