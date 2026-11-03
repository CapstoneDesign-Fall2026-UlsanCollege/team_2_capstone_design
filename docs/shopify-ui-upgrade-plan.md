# 🛍️ ShopCraft: Shopify-Grade UI/UX Execution Plan

**Context:** ShopCraft has pivoted from a single-shop model into a full multi-tenant e-commerce and subscription SaaS platform for Nepal ("The Shopify for Nepal"). BrewMellow has been frozen and moved to its own repository.

This plan details 4 high-leverage UI/UX workstreams inspired by Shopify Polaris and Shopify Dawn, tailored specifically for Nepali merchants and mobile shoppers.

---

## 🎯 High-Level Objectives

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            WORKSTREAM ROADMAP                               │
├──────────────┬──────────────────────────────────────────────┬───────────────┤
│ Stream 1     │ Merchant Setup Guide Checklist               │ Console       │
│ Stream 2     │ Storefront "Subscribe & Save" & Cart Meter   │ Storefront    │
│ Stream 3     │ 1-Click Nepali Courier Packing Slip          │ Merchant Ops  │
│ Stream 4     │ Contextual Save Bar & Form Dirty-State       │ Console       │
└──────────────┴──────────────────────────────────────────────┴───────────────┘
```

---

## 📋 Workstream Breakdown

### Workstream 1: Merchant "Path to First Sale" Setup Guide (Shopify Polaris)
* **Target File:** `frontend/src/components/merchant/SetupGuideCard.tsx` + `frontend/src/app/merchant/[storeSlug]/page.tsx`
* **Pattern:** Shopify Polaris Onboarding Checklist.
* **Specification:**
  - Collapsible card at the top of the merchant console overview.
  - Progress bar showing `X of 4 steps completed (Y%)`.
  - Step 1: Store URL claimed (`shopcraft.com.np/s/[storeSlug]`) — `[✓ Done]`.
  - Step 2: Add first product & variants — Links directly to `/merchant/[storeSlug]/products?new=true`.
  - Step 3: Configure delivery rates (Inside Valley vs Outside Valley) — Links to `/merchant/[storeSlug]/settings`.
  - Step 4: Verify payment gateway (Khalti Sandbox or COD) — Links to `/merchant/[storeSlug]/settings#payments`.
  - Can be dismissed or collapsed once all 4 are completed.

---

### Workstream 2: Storefront "Subscribe & Save" Buy-Box & Cart Shipping Meter (Shopify Dawn)
* **Target Files:**
  - `frontend/src/components/storefront/ProductDetailSheet.tsx`
  - `frontend/src/components/storefront/CartDrawer.tsx`
* **Pattern:** High-converting progressive purchase disclosure + Free shipping threshold progress bar.
* **Specification:**
  - **Product Purchase Box**:
    - Segmented selector between **One-Time Purchase** and **Subscribe & Save (X% off)**.
    - Dynamic calculation showing the exact NPR savings per delivery (e.g. *"Save Rs. 85 per delivery"*).
    - Transparent trust assurance: *"No auto-debit. We send a payment reminder link before each delivery."*
  - **Cart Drawer Shipping Meter**:
    - Reads store settings for `inside_valley_rate` and `free_delivery_threshold`.
    - Shows dynamic progress bar:
      - If under threshold: *"Add Rs. 350 more for Free Kathmandu Valley Delivery"*.
      - If threshold reached: *"🎉 You unlocked Free Kathmandu Valley Delivery!"*

---

### Workstream 3: 1-Click Nepali Courier / Packing Slip Generator (Shopify Shipping)
* **Target Files:**
  - `frontend/src/components/merchant/PackingSlipModal.tsx`
  - `frontend/src/components/merchant/OrderDetailSheet.tsx`
* **Pattern:** Standardized e-commerce packing slip adapted to Nepali courier logistics (Pathao, Nepal Can Move, bike delivery).
* **Specification:**
  - "Print Packing Slip" action button on order details.
  - Printable slip formatted for thermal/A4 printing:
    - Shop Name & Merchant Contact.
    - Order # and Date.
    - Customer Full Name and Verified Mobile (`+977-98xxxxxxxx`).
    - Exact Delivery Address: Province, District, Municipality, Ward #, and **Nearest Chowk/Landmark**.
    - Payment Badge:
      - `[✓ KHALTI PAID]` (Do not collect payment).
      - `[⚠️ COD - COLLECT RS. X IN CASH FROM BUYER]`.
    - Itemized order list with quantities and variant details.

---

### Workstream 4: Contextual Save Bar Dirty-State Synchronization (Shopify Polaris)
* **Target Files:**
  - `frontend/src/components/merchant/ContextualSaveBar.tsx`
  - `frontend/src/components/merchant/SettingsForm.tsx`
* **Pattern:** Sticky top bar whenever form changes are uncommitted.
* **Specification:**
  - Sticky header bar pinned to viewport top when inputs are dirty: `Unsaved changes · [Discard] [Save changes]`.
  - Shortcut listener for `⌘S` / `Ctrl+S` to save without clicking.

---

## ⏱️ Execution Order

1. **Step 1:** Build and wire the **Merchant Setup Guide Checklist** into `/merchant/[storeSlug]`.
2. **Step 2:** Upgrade the **Storefront "Subscribe & Save" Buy-Box** and add the **Cart Free Shipping Meter**.
3. **Step 3:** Implement the **1-Click Nepali Courier Packing Slip Generator**.
4. **Step 4:** Verify and polish the **Contextual Save Bar** across merchant settings.
