---
name: project-scope-rules
description: "Explicit feature boundaries and scope guardrails for ShopCraft."
trigger: always_on
---

# Scope Guardrails

1. **Out of scope: subscriptions/recurring billing for shoppers.**
   - All purchases on storefronts are clean one-time purchases (Khalti Web Wallet and Cash on Delivery).
   - Do NOT re-introduce shopper subscription models, recurring cycles, selling plans, interval units, cycle orders, or subscription renewal links.
2. **Merchant Billing vs Shopper Billing:**
   - Merchant SaaS billing plans (Growth Plan and Pro Plan) for store owners paying ShopCraft platform fees are kept in scope.
   - Shopper recurring billing is strictly out of scope.
