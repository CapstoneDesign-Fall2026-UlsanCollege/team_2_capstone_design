# Phase 4 Context: Subscriptions, SaaS Landing & Production Launch

## 1. Executive Summary

Phase 4 concludes the ShopCraft SaaS platform roadmap ahead of the November 26 hard deadline. It transforms the single-order e-commerce platform into Nepal's first subscription-first multi-tenant operating system by:
1. Enabling dedicated single-variant subscription checkout (prepaid 3/6/12-month commitments with upfront Khalti payment, or pay-per-delivery).
2. Implementing an idempotent recurring cycle runner (`manage.py run_subscription_cycles` and merchant "Run Cycle Now" console button) that generates $0 fulfillment orders for prepaid subscriptions and renewal orders for pay-per-delivery.
3. Providing self-serve subscription lifecycle controls (pause, resume, skip cycle, cancel) in both shopper storefront accounts and the merchant `/merchant/[storeSlug]/subscriptions` dashboard.
4. Launching the public ShopCraft SaaS marketing homepage (`/`) with interactive device mockup, demo store switcher, and "Launch Your Store" onboarding flow.
5. Seeding a second non-coffee artisanal demo store (`himalayan-artisans` or `everest-tea`) with a distinct visual aesthetic (`pahadi-sage`) to prove multi-tenancy in presentations.
6. Setting up clean 301/308 redirects from legacy BrewMellow paths (`/origins`, `/subscribe`, `/checkout`, `/dashboard`, `/admin`) to `/s/brewmellow/...` and validating production cutover.

---

## 2. Applicable Requirements

- **SUBS-01**: Dedicated subscription checkout for eligible variants on prepaid commitments (3/6/12 cycles upfront Khalti) or pay-per-delivery. Creates an active `Subscription` record linked to the customer, variant, selling plan, and originating order.
- **SUBS-02**: Idempotent `manage.py run_subscription_cycles` CLI command and merchant "Run Cycle Now" demo trigger generating $0 fulfillment orders for prepaid subscriptions (decrementing remaining cycles) and renewal orders for pay-per-delivery.
- **SUBS-03**: Shopper and merchant subscription lifecycle management (pause, resume, skip next delivery date, cancel) with immediate state reflection in `/s/[storeSlug]/account` and `/merchant/[storeSlug]/subscriptions`.
- **SUBS-04**: Public ShopCraft SaaS marketing homepage (`/`), second demo store (`himalayan-artisans`), legacy BrewMellow URL redirects, and production cloud cutover.

---

## 3. Architecture & Non-Negotiables

1. **Idempotent Recurring Billing Runner:**
   - The runner must be strictly idempotent: running it multiple times on the same date must NEVER duplicate fulfillment orders or cycle charges.
   - For prepaid plans: creates an `Order` with `order_type="SUBSCRIPTION_CYCLE"`, `subtotal_minor=0`, `total_minor=0`, `status="CONFIRMED"`, `payment_status="PAID"`, and decrements `cycles_remaining`. When `cycles_remaining` reaches 0, transitions subscription status to `COMPLETED`.
   - For pay-per-delivery: creates an `Order` with `order_type="SUBSCRIPTION_CYCLE"`, `status="PENDING_PAYMENT"`, `payment_status="UNPAID"`, and advances `next_delivery_date`.
2. **Subscription State Machine:**
   - Valid statuses: `ACTIVE`, `PAUSED`, `CANCELLED`, `COMPLETED`.
   - `PAUSED` subscriptions are skipped by the runner.
   - `CANCELLED` subscriptions cannot be resumed.
   - `skip_cycle` advances `next_delivery_date` by one delivery interval without generating an order or consuming a cycle.
3. **Multi-Tenant Isolation:**
   - All subscription queries are scoped strictly by `store`. Cross-tenant access to subscriptions returns `HTTP 404`.
4. **Surface Isolation:**
   - Storefront subscription controls adhere to semantic storefront tokens (`bg-sf-*`, `text-sf-*`).
   - Merchant subscription dashboard uses console tokens (`.console`, `bg-[var(--card)]`, etc.).
5. **Marketing Landing (`/`):**
   - High-conversion, mobile-responsive SaaS landing page highlighting Nepal-specific features (Nepali address picker, Khalti sandbox, SMS/email updates, recurring subscription management).
   - Live interactive device frame with a store switcher between `BrewMellow` (editorial warm) and `Himalayan Artisans` (pahadi sage).
