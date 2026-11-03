# ShopCraft DESIGN.md — The Specialty Coffee & Consumables SaaS Fork of Shopify for Nepal

> **Source of Truth for All Architecture, UI/UX, and Engineering (Antigravity & Stitch Standard)**  
> **Reference Open-Source Repositories:**  
> - **Storefront Reference:** [`Shopify/dawn`](https://github.com/Shopify/dawn) (Shopify's official open-source reference theme)  
> - **Merchant Admin Reference:** [`Shopify/polaris`](https://github.com/Shopify/polaris) ([polaris.shopify.com](https://polaris.shopify.com/) design system)  
> - **Multi-Tenant Architecture:** Inspired by `medusajs/medusa` & `Shopify/hydrogen`  
> - **Local Market Adaptation:** Native Khalti Web Wallet + Cash on Delivery + 7-Province Ward Delivery for Nepal  

---

## 0. Non-Negotiable Core Rules (Stitch & UI-UX Pro Max Standard)

1. **BrewMellow Palette & Typography (Tenant #1 Reference):**
   - **Canvas:** Cream `#F5F2EB`
   - **Primary CTA:** Terracotta `#A3432A`
   - **Body Ink:** Espresso `#1A1512`
   - **Display Font:** `Fraunces` (Editorial serif)
   - **Body Font:** `Plus Jakarta Sans` with fallback `Noto Sans Devanagari`
   - **Monospace Font:** `JetBrains Mono` with `tabular-nums`
2. **One Primary Action per Screen:**
   - Every surface has exactly ONE obvious primary CTA in the thumb zone / primary focal point. Secondary actions are muted or tucked quietly.
3. **Merchant Console Stays Neutral:**
   - `/merchant/[storeSlug]` MUST stay strictly neutral slate/zinc (`#FAFAFA` / `#18181B`). It NEVER inherits tenant brand colors or raw hexes.
4. **Theming via CSS Variables Only:**
   - All storefront components use semantic tokens (`bg-sf-canvas`, `text-sf-ink`, `bg-sf-cta`, etc.). ZERO raw `#hex` in `/s/**` and `components/storefront/**`.
5. **Khalti & Cash on Delivery States:**
   - Cover every state explicitly:
     - `Khalti Redirecting`
     - `Khalti Verifying` (server-side HMAC SHA-256 callback)
     - `Khalti Failed / Cancelled` with instant 1-tap retry
     - `COD Verified` with phone number validation (`^9[78]\d{8}$`)
6. **Anti-AI-Look & Copy Brevity Rules:**
   - **No Walls of Text:** Cut long paragraphs by 70%. Never use 3 paragraphs when 5 punchy words suffice.
   - **Visuals > Words:** Let real interactive widgets, numbers (`Rs. 2,400`), live status tags, and authentic product photography do the talking.
   - **Banned AI Filler Words:** No "seamless", "cutting-edge", "empowering", "robust", "revolutionize", "game-changer", "delve".
   - **Zero Emoji as Icons:** Use real Lucide React icons.
   - **Restrained Motion:** Purposeful micro-interactions (spring drawers, subtle status pulses), zero dizzying spinning 3D animations.

---

## 1. Project Vision & Architecture

ShopCraft is an independent **Multi-Tenant E-Commerce & Subscription SaaS for Nepal** ("Shopify for Nepal"), specifically tailored for repeat consumable merchants: **Specialty Coffee Roasteries, Single-Estate Tea Gardens, High-Altitude Organics, and Artisan Consumable Brands**.

### Three Distinct, Isolated Surfaces:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. SaaS Platform (`/`, `/merchant/new`, `/login`)                           │
│    Shopify.com style: Clean white SaaS landing page, 1-click store claimer, │
│    pricing, merchant registration, and Gmail OTP / Google OAuth.            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Merchant Admin Console (`/merchant/[storeSlug]`)                          │
│    Shopify Polaris style: Neutral admin dashboard for store owners.         │
│    - Setup Guide Checklist (Progress meter, launch steps)                   │
│    - Orders & Dispatch Queue (1-click Pathao / rider packing slips)         │
│    - Products & Grind Variants (Whole bean, Pour-over, Espresso, Tins)      │
│    - Subscription Manager (Active bi-weekly roast subscribers & run cycles) │
│    - Settings (Khalti API keys, delivery zones across 7 provinces)          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. Customer Storefront (`/s/[storeSlug]`)                                   │
│    Shopify Dawn style: Ultra-clean, mobile-first PWA e-commerce storefront. │
│    - Signature Black Announcement Bar (Free valley delivery threshold)       │
│    - Minimalist Brand Header (Logo, category nav, search, live cart bag)   │
│    - Dawn Hero Banner (High-res photography + centered floating card)       │
│    - Sticky Collection Bar (Category chips: Coffee, Tea, Honey, Gear)       │
│    - 1:1 Square Product Cards (Roast tags, tasting notes, dual pricing)     │
│    - Recharge-Style Buy-Box (One-Time vs Subscribe & Save 10%)              │
│    - Sticky Add to Cart Bar on Mobile                                       │
│    - Slide-out Ajax Cart Drawer with delivery meter & 1-page checkout       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Design Tokens & Visual Hierarchy

### A. Customer Storefront (Shopify Dawn Standard)
- **Canvas:** `#FFFFFF` (pure white, zero dirty gray or dark mode in shopper view).
- **Surface:** `#FFFFFF` with `#FAFAFA` subtle hover state.
- **Ink / Headings:** `#121212` (Shopify Dawn primary ink).
- **Secondary Ink:** `#555555` to `#707070` (readable, accessible contrast).
- **Hairline Borders:** `1px solid #E5E5E5` (crisp, precise, zero fuzzy drop shadows).
- **Primary CTA Buttons:** Solid black `#121212` with pure white `#FFFFFF` text, radius `6px`.
- **Secondary CTA Buttons:** Pure white `#FFFFFF` with `1.5px solid #121212` border, black text.
- **Badges:**
  - `Subscription Save 10%`: Solid black `#121212` or Emerald `#065F46` / `#ECFDF5`.
  - `Direct-Trade Origin`: White `#FFFFFF` with `#E5E5E5` border.
- **Typography:** Modern `Plus Jakarta Sans` with fallback `Noto Sans Devanagari`. Monospaced numbers via `JetBrains Mono` with `tabular-nums`.

### B. Merchant Admin (Shopify Polaris Standard)
- **Background:** `#F6F6F7` (Polaris canvas background).
- **Cards & Surfaces:** `#FFFFFF` with `1px solid #E1E3E5` border, radius `8px`.
- **Primary Action:** Solid black `#121212` or Polaris deep `#008060`.
- **Status Badges:**
  - `PROCESSING / UNFULFILLED`: Amber badge (`#FEF3C7` / `#92400E`).
  - `DELIVERED / PAID`: Emerald badge (`#D1FAE5` / `#065F46`).
  - `ACTIVE SUBSCRIPTION`: Blue badge (`#DBEAFE` / `#1E40AF`).
  - `COD CASH DUE`: Rose badge (`#FFE4E6` / `#9F1239`).

---

## 3. Specialty Coffee & Repeat Consumables Niche Specifications

Unlike generic clothing stores, specialty coffee and tea e-commerce requires specific domain models and UX patterns:

### 1. Grind & Size Variant Matrix
Every coffee product requires specific barista options:
- **Grind Selection:**
  - `Whole Bean` (For home grinders / espresso machines)
  - `Pour-Over / Filter` (V60, Chemex, Kalita Wave medium-fine grind)
  - `French Press / Cold Brew` (Coarse grind)
  - `Espresso / Moka Pot` (Fine grind)
- **Size Selection:**
  - `250g Standard Bag`
  - `500g Value Bag`
  - `1kg Roastery Bag`

### 2. Dual Purchase Architecture (Shopify + Recharge Model)
Every consumable item allows shoppers to choose:
- **One-Time Purchase:** Full retail price (e.g. `Rs. 750`).
- **Subscribe & Save 10%:**
  - Discounted price (e.g. `Rs. 675 / delivery`).
  - Delivery Cadence:
    - `Weekly Monday Roast` (Fresh Monday morning dispatch)
    - `Bi-Weekly Fresh Roast` (Every 2 weeks)
    - `Monthly Delivery` (Every 4 weeks)
  - Prepaid Season Pass (Optional): `Prepaid 3 Deliveries (15% off)`.
  - Zero Auto-Debit Barrier: Sends automated SMS/WhatsApp payment reminder link before each scheduled dispatch.

### 3. Courier & Ward-Level Address Resolution (Nepal Logistics)
- **7 Provinces:** Bagmati, Gandaki, Koshi, Lumbini, Madhesh, Karnali, Sudurpashchim.
- **District & Ward Dropdowns:** Kathmandu (Ward 1-32), Lalitpur (Ward 1-29), Bhaktapur.
- **1-Click Packing Slips:** Printable dispatch slip formatted for Pathao, Upaya, and bike couriers featuring:
  - Prominent `KHALTI PAID` (Green) vs `COD CASH TO COLLECT: RS. X,XXX` (Red).
  - Customer Name, Contact Phone, Full Ward & Landmark.
  - Itemized bag count, grind type, and roast date.

---

## 4. Implementation Checklist & Progress Tracking

- [x] Multi-tenant database schema & models (Store, Product, Variant, SellingPlan, Order, Subscription).
- [x] Flagship coffee & tea store seeded in database (`Himalayan Coffee Roasters`).
- [x] SaaS Platform homepage (`/`) with clean Lovable/Stripe design intelligence and store claimer.
- [x] Shopify Dawn Storefront header, hero, collection filters, and 1:1 square product cards.
- [x] Shopify + Recharge dual purchase buy-box (One-Time vs Subscribe & Save 10%).
- [x] Slide-out Ajax Cart Drawer with free delivery meter.
- [x] Shopify Polaris Merchant Dashboard with Setup Guide and Packing Slip generator.
- [x] 1-Page Checkout with Khalti Web Wallet + Cash on Delivery + 7-Province routing.
- [x] Theme system with 4 distinct presets and working Light/Dark toggle.
- [ ] Connect live Gmail SMTP App Password in `backend/.env` for real email dispatch.
- [ ] Connect Google OAuth Client ID for 1-click Google Sign-in.
