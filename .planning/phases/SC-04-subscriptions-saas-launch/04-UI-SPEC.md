---
phase: "04"
slug: "subscriptions-saas-launch"
status: approved
shadcn_initialized: true
preset: platform-neutral
created: "2026-10-31"
---

# Phase 04 — UI Design Contract: Subscriptions, SaaS Landing & Production Launch

> Visual and interaction contract for frontend phase 04 (SaaS Platform, Theme Studio, Subscriptions & Production Launch). Generated and verified according to GSD UI phase specifications (`.agents/gsd-core/templates/UI-SPEC.md` & `gsd-ui-checker`).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn / radix |
| Preset | `platform-neutral` (High-contrast monochrome `#121212` with emerald accent) |
| Component library | radix-ui (`@radix-ui/react-dialog`, `@radix-ui/react-slot`) |
| Icon library | `lucide-react` (SVG icons only, zero emoji icons) |
| Font | `Plus Jakarta Sans` (Body & UI), `Fraunces` (Editorial Display), `JetBrains Mono` (Tabular Numbers & Codes) |

---

## Component Inventory

> What the project's design system actually provides. Enumerated from the installed package and codebase per GSD Dimension 7.

Enumerated by `Get-ChildItem src/components/platform, src/components/merchant` — 18 components — @radix-ui/react-dialog@1.3.1 + lucide-react@1.52.0 — 2026-10-31.

| Component | Import path | Notes |
|-----------|-------------|-------|
| `PlatformNav` | `@/components/platform/PlatformNav` | Minimalist Shopify-grade header with instant domain claimer, theme switcher link, and mobile hamburger |
| `ThemeStudio` | `@/components/platform/ThemeStudio` | Interactive visual theme simulator allowing visitors to switch between Editorial Warm, Pahadi Sage, and KTM Bold with responsive 375px mobile preview |
| `DemoTenantShowcase` | `@/components/platform/DemoTenantShowcase` | Real 3-store showcase grid for Himalayan Coffee, Himalayan Artisans, and KTM Streetwear with direct storefront and console links |
| `ShopifyComparisonTable` | `@/components/platform/ShopifyComparisonTable` | Side-by-side architectural comparison matrix contrasting global Shopify limitations vs ShopCraft Nepal solutions |
| `TrustProofBar` | `@/components/platform/TrustProofBar` | Merchant trust proof elements: zero USD card needed, native Khalti & COD, 7-province Pathao slips |
| `SetupGuideCard` | `@/components/merchant/SetupGuideCard` | Shopify Polaris 4-step merchant onboarding checklist with live progress tracking |
| `OrderQueueTable` | `@/components/merchant/OrderQueueTable` | Merchant orders table with status badges (Khalti Paid, COD Due) and quick dispatch actions |
| `OrderDetailSheet` | `@/components/merchant/OrderDetailSheet` | Slide-over drawer with recipient ward address, contact phone, item breakdown, and delivery notes |
| `PackingSlipModal` | `@/components/merchant/PackingSlipModal` | 1-Click Pathao courier delivery slip generator with printable barcode, recipient phone, and COD collection |
| `ProductListTable` | `@/components/merchant/ProductListTable` | Merchant catalog table with stock status, price in Rs., variants, and subscription flags |
| `ProductSheet` | `@/components/merchant/ProductSheet` | Slide-over product editor for title, description, categories, and image management |
| `VariantGridEditor` | `@/components/merchant/VariantGridEditor` | Matrix editor for grind sizes, bag weights, SKUs, and variant pricing |
| `SellingPlanConfig` | `@/components/merchant/SellingPlanConfig` | Subscription interval and discount percentage configuration |
| `SubscriptionTable` | `@/components/merchant/SubscriptionTable` | Roast club subscriber list with cycle intervals and WhatsApp renewal triggers |
| `SettingsForm` | `@/components/merchant/SettingsForm` | Live store theme customizer (Editorial Warm, Pahadi Sage, KTM Bold), shipping rates, and Khalti keys |
| `ConsoleShell` | `@/components/merchant/ConsoleShell` | Polaris admin shell with store switcher, navigation links, and live store preview shortcut |
| `MerchantSidebar` | `@/components/merchant/MerchantSidebar` | Desktop sidebar with active route indicator and store metadata |
| `MerchantBottomNav` | `@/components/merchant/MerchantBottomNav` | Mobile 375px thumb navigation bar for merchant on-the-go management |

---

## Spacing Scale

Declaring 4px base scale:

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, tag padding |
| sm | 8px | Button gaps, card inner margins |
| md | 16px | Container padding, grid gutters (`gap-4`) |
| lg | 24px | Section padding, modal margins |
| xl | 32px | Major component spacing |
| 2xl | 48px | Primary action buttons, mobile CTA touch targets |
| 3xl | 64px | Page section vertical padding |

Exceptions:
- 44px: Minimum tap target floor for all touch controls (`min-h-[44px] min-w-[44px]`).
- 52px: Store claimer input bar height (`h-13`) for thumb ergonomics.

---

## Typography

| Role | Size | Weight | Line Height | Font Family |
|------|------|--------|-------------|-------------|
| Display | 32px | 700 (Bold) | 1.15 | Plus Jakarta Sans |
| Title | 20px | 700 (Bold) | 1.25 | Plus Jakarta Sans |
| Body | 14px | 400 (Regular) | 1.50 | Plus Jakarta Sans |
| Detail / Mono | 12px | 700 (Bold) / 400 | 1.40 | JetBrains Mono |

---

## Color System (60 / 30 / 10 Rule)

- **60% Dominant (Canvas & Background):** Clean crisp white (`#FFFFFF`) and warm neutral zinc (`#FAFAFA`, `#F6F6F7`).
- **30% Structural (Typography & Borders):** High-contrast black (`#121212`), charcoal (`#1A1A1A`), slate line borders (`#E1E3E5`), and muted text (`#555555`).
- **10% Accent (Interactive State & Brand Signals):**
  - Emerald green (`#008060` / `#059669`) strictly reserved for primary platform CTAs, active badges, and live status signals.
  - Theme accents dynamically reflected inside the Theme Studio preview without bleeding into the platform shell.

---

## Copywriting Contract

| Element | Copy | Forbidden Alternatives |
|---------|------|------------------------|
| Hero CTA | `Start free trial` | "Submit", "Get Started", "Click Here" |
| Domain Claimer Button | `Start free trial` | "Go", "Enter", "Claim" |
| Theme Studio CTA | `Add to Bag • Rs. [Price]` | "Buy", "Purchase" |
| Live Store Links | `Launch Live Storefront ↗` | "View", "Open", "Click Here" |
| Pathao Slip Generator | `Print Pathao Slip` | "Print", "Generate" |
| FAQ Accordion Trigger | Exact question text | "Click to expand", "More info" |

---

## UI Considerations & States

- **Empty States:** When a merchant has zero orders, orders table displays `No orders placed yet. Orders received via Khalti or COD will appear here for fulfillment.` with a link to `View Live Storefront`.
- **Loading Skeletons:** Zero cumulative layout shift (`CLS = 0`). Table rows and metric cards use animated shimmer pulse blocks matching final content dimensions.
- **Error States:** Network failures display discrete toast notifications with `Retry connection` button.
- **Interactive Theme Switcher:** Instant responsive re-theming without page reload, supporting both 375px mobile device frame and desktop frame.
- **Surface Isolation:** Zero raw hex values permitted in `/s/**` and `components/storefront/**`. Platform and merchant console components remain strictly neutral.
