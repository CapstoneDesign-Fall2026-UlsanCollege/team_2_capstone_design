# Phase 2 UI Specification: Merchant Console & Catalog

**Authority:** `DESIGN.md` §0 (Non-negotiables), §1 (Anti-AI look rules), §2 (Console tokens), §4 (Console surface)  

---

## 1. Visual Token Architecture (`.console`)

All merchant routes are wrapped in `.console`:
```css
.console {
  --background: #FAFAFA;
  --foreground: #18181B;
  --card: #FFFFFF;
  --card-foreground: #18181B;
  --popover: #FFFFFF;
  --popover-foreground: #18181B;
  --primary: #18181B;
  --primary-foreground: #FAFAFA;
  --secondary: #F4F4F5;
  --secondary-foreground: #27272A;
  --muted: #F4F4F5;
  --muted-foreground: #71717A;
  --accent: #F4F4F5;
  --accent-foreground: #18181B;
  --border: #E4E4E7;
  --input: #E4E4E7;
  --ring: #2563EB;
  --destructive: #DC2626;
  --radius: 0.375rem;
  --st-new: #2563EB;
  --st-packed: #D97706;
  --st-shipped: #7C3AED;
  --st-delivered: #16A34A;
  --st-cancelled: #71717A;
}
```

### Style Rules:
- **Base Typography:** 13px base text (`text-[13px]`), font `Geist` + `Geist_Mono`.
- **Density:** Tight Linear-style table rows, 36px–40px control heights, hairline borders (`1px solid var(--border)`).
- **Status Indicators:** Always colored dot + text label (`--st-*`), never color alone.
- **Prices & Quantities:** Tabular figures (`tabular-nums font-mono`). Integer `Rs. 1,250` via `Intl.NumberFormat('en-IN')`. Never decimals.
- **Empty States:** Single useful, slightly funny line (e.g. *"No products here yet. Add your first item before your customers start asking on WhatsApp."*), no floating box illustrations.

---

## 2. Layout & Ergonomics

### Desktop (Viewport $\ge$ 1024px):
- **Sidebar Width:** Exactly 232px fixed left column (`border-r border-[var(--border)] bg-[var(--background)]`).
- **Store Switcher:** Dropdown at the top with active store name and quick link to `/s/[storeSlug]` (Live Store ↗).
- **Navigation Links:** Overview, Products, Orders, Customers, Settings.
- **⌘K Command Palette:** Search products, jump to pages, quick action `+ New Product`.

### Mobile (Viewport $<$ 1024px):
- **Bottom Navigation Bar:** Fixed bottom tabs (`Overview`, `Products`, `Orders`, `Settings`) with safe area padding (`pb-safe`).
- **Floating Action Button (`+`):** Quick bottom-right button to create new product or view live store.
- **Density Adjustment:** Variant table adapts to mobile cards with numeric steppers for stock.

---

## 3. Copywriting Contract

| Element | Copy |
|---------|------|
| Primary Save Action | `Save changes` (or automatic inline save with `Changes saved`) |
| Empty Products State | `No products in your catalog yet. Add your first item to start selling.` |
| Empty Orders State | `No orders placed yet. Share your store link on Instagram to get your first customer.` |
| Khalti Sandbox Pill | `Platform Sandbox Active (Ready for Test Orders)` |
| Khalti Live Pill | `Live Merchant Key Connected` |
| Subscription Preview | `Rs. {amount} per delivery when subscribed ({discount}% off)` |
| Undo Toast | `Product archived · [Undo]` (5-second grace period) |
