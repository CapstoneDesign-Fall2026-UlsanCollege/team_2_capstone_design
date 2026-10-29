---
phase: "1"
slug: "foundation-auth-tenant-core"
status: approved
shadcn_initialized: false
preset: custom-design-md
created: "2026-10-30"
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for Phase 1 frontend surfaces (`DESIGN.md` is authoritative).

---

## Design System

| Property | Value |
|----------|-------|
| Tool | shadcn/ui (initialized in Phase 1 for `.console` & shared accessible primitives) |
| Preset | Three isolated token scopes defined in `DESIGN.md` §2 (`:root` `--sc-*`, `.console`, `[data-store-theme]` `--sf-*`) |
| Component library | Radix UI primitives (via shadcn/ui) |
| Icon library | `lucide-react` (no emoji icons anywhere) |
| Font | Route-scoped per `DESIGN.md` §0 & §2: Platform (`Bricolage Grotesque`, `Geist Sans`, `Geist Mono` + `Noto Sans Devanagari`); Storefront `editorial-warm` (`Fraunces`, `Plus Jakarta Sans`, `JetBrains Mono` + Devanagari fallbacks); Console (`Geist Sans`, `Geist Mono`) |

---

## Component Inventory

Could not enumerate: `shadcn/ui` is not yet initialized in `frontend/package.json` (`lucide-react@^1.52.0` is installed); Phase 1 initializes `shadcn/ui` primitives (`button`, `input`, `label`, `sheet`, `badge`, `select`, `sonner`) alongside the 3-surface token CSS.

| Component | Import path | Notes |
|-----------|-------------|-------|
| `OtpInput` | `@/components/auth/OtpInput` | 6-cell numeric input (`inputMode="numeric"`, `autoComplete="one-time-code"`), auto-advance & paste support |
| `AddressSheet` | `@/components/account/AddressSheet` | Bottom sheet / drawer with cascading `Province → District → Municipality → Ward` + `^9[78]\d{8}$` validation |
| `Button`, `Input`, `Sheet` | `@/components/ui/*` | Restyled per surface (`1px` hairline borders, zero drop-shadows, `48px` primary CTA height) |

---

## Spacing Scale

Declared values (multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline badges |
| sm | 8px | Input label spacing, tight chips |
| md | 16px | Mobile container horizontal gutter, form field rhythm |
| lg | 24px | Card padding, sheet padding |
| xl | 32px | Auth block vertical rhythm |
| 2xl | 48px | Primary CTA minimum height & major section breaks |
| 3xl | 64px | Desktop page vertical framing |

Exceptions: Console table rows use compact `13px` text and `36px–40px` row height on desktop (`≥44px` tap targets on mobile).

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 15px (Platform/Storefront) / 13px (Console) | 400 | 1.55 |
| Label | 13px | 500 | 1.35 |
| Heading | 22px–28px | 600 | 1.2 |
| Display | 36px–48px | 700 | 1.08 |

All numeric values (OTP cells, `Rs.` prices, wards, phone numbers) use `font-variant-numeric: tabular-nums`.

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FAFAF7` (`--sc-paper`) | Platform `/login`, `/signup`, `/account/addresses` canvas |
| Secondary (30%) | `#FFFFFF` (`--sc-surface`) + `#E8E8E1` (`--sc-line`) | Hairline-bordered cards, inputs, sheets (zero shadows) |
| Accent (10%) | `#F2A900` (`--sc-marigold`) | Live URL underline, OTP active cell focus indicator, verified check dot ONLY |
| Primary CTA | `#111318` (`--sc-ink`) fill / `#FAFAF7` text | Single primary action per screen (`48px` height, `8px` radius) |
| Destructive | `#B42318` (`--sc-danger`) | Inline field validation error text and address delete action |

Accent reserved for: live indicator dot, active OTP cell ring, and marigold hand-drawn URL underline — never full-width button backgrounds or gradients.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA (Email step) | `Send 6-digit code` |
| Primary CTA (OTP step) | `Verify & continue` |
| Empty state heading (Addresses) | `No saved delivery address yet` |
| Empty state body (Addresses) | `Add your chowk and ward once so checkout takes one tap.` |
| Error state (Invalid phone) | `Enter a 10-digit number starting with 98 or 97.` |
| Error state (Invalid/expired OTP) | `That code didn't match or expired. Request a fresh 6-digit code.` |
| Destructive action (Delete address) | `Address removed` (with 5-second `Undo` toast, no blocking confirm modal) |

---

## UI Considerations

Applicable state considerations resolved: 5 covered, 1 backstop, 0 unresolved

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | Saved addresses list | ✅ covered | Empty saved-address list renders the Copywriting Contract empty state and a single 48px "Add delivery address" CTA |
| loading | OTP request / verify & session hydration | ✅ covered | Skeleton placeholders render during session check and button enters disabled pending label without layout shift |
| error | Email, OTP, and `^9[78]\d{8}$` phone inputs | ✅ covered | Validation and expired-OTP errors render inline directly adjacent to the offending field, never as transient toasts |
| populated | Saved addresses radio/card list | ✅ covered | Saved addresses render realistic Nepali Municipality/Ward/Landmark details with default badge and edit/remove actions |
| overflow | Long municipality or street/landmark text on 375px viewport | ✅ covered | Address cards wrap cleanly on 375px width with zero horizontal scroll (`overflow-x` clean) and `dvh` safe-area sheets |
| visual-isolation | Surface CSS token boundaries across `/`, `/merchant/*`, `/s/*` | 🧪 backstop | Automated surface check confirms zero raw hex literals in `frontend/src/app/s/**` and zero `--sf-*` references in `frontend/src/app/merchant/**` |
