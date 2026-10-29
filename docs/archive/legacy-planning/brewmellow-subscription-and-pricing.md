---
name: coffee-subscription-and-pricing
description: "Rules for coffee subscription UX architecture and mathematical pricing in BrewMellow"
trigger: always_on
---

# Coffee Subscription UX Architecture & Mathematical Pricing Rules

## 1. Coffee Pack Sizes & Tiers
- **150g Trial Pack:** One-time purchase only. Never attach recurring billing, monthly commitment, or multi-month contracts to 150g packs.
- **Recurring Subscription Sizes:** Only 250g (Personal), 500g (Standard / Most Popular), and 1.0 kg (Aficionado).

## 2. Mathematical Pricing Engine
- **No Fractional Multipliers:** Never multiply base catalog prices by unit weight fractions (e.g. `price * 0.5`). This causes pricing math errors.
- **Declarative Price Matrix:** All unit prices must come from an explicit matrix:
  ```typescript
  const ORIGIN_PRICES = {
    gulmi:   { '150g': 450, '250g': 650, '500g': 1200, '1kg': 2200 },
    ilam:    { '150g': 500, '250g': 750, '500g': 1400, '1kg': 2600 },
    nuwakot: { '150g': 400, '250g': 600, '500g': 1100, '1kg': 2000 },
  };
  ```
- **Discount Stacking Order:**
  1. Base monthly subtotal = sum of bag prices in the box for the chosen size.
  2. Multi-bag Bundle Discount: 5% off for Duo (2 bags), 10% off for Trio (3 bags).
  3. Prepay Commitment Discount: 5% for 3 Months, 10% for 6 Months, 15% for 12 Months.

## 3. Subscription UX Architecture (Bean Box / MistoBox Standard)
- **Top Experience Fork:** Split the page into two clear tabs: `[ 150g Trial (One-Time) ]` and `[ Monthly Subscription ]`.
- **Visual Parcel Slots:** Never use generic numeric `[ - 1 + ]` steppers for Duo/Trio bundles. Show interactive parcel slots (`Slot 1`, `Slot 2`, `Slot 3`) with quick-pairing preset chips.
- **Flavor-First Product Cards:** Highlight flavor notes, roast level, altitude, and SCA score.
- **Transparent Sticky Unboxing Receipt:** Display a clear 3-line breakdown showing format, origin pairing, weight per bag, and exact savings.
