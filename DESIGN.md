# ShopCraft DESIGN.md (source of truth for all UI work)

ShopCraft: mobile-first multi-tenant e-commerce and subscription SaaS for Nepal.
Stack: Next.js 16 (App Router), Tailwind CSS v4, shadcn/ui, Lucide.
Principle: calm, zero-friction. One obvious primary action per screen, generous whitespace, drawers/sheets instead of page reloads, thumb-friendly. 90%+ of shoppers arrive from Instagram/TikTok in-app browsers on phones.

## 0. Non-negotiables
- Three isolated surfaces: Platform (`/`, `/login`, `/signup`), Console (`/merchant/[storeSlug]`), Storefront (`/s/[storeSlug]`).
- Console is strictly neutral. It NEVER reads `--sf-*` or any store brand color. Only the live preview pane may render inside a scoped `data-store-theme` element or iframe.
- Storefront components use ONLY semantic utilities (`bg-sf-canvas`, `text-sf-ink`, `bg-sf-cta`, etc.). NO hex values in `/s/*` components. Lint-enforce this.
- Cart, session, saved addresses, and cache keys are scoped per tenant. Never leak across stores.
- Currency: integer `Rs. 1,200`, tabular numerals, `Intl.NumberFormat('en-IN')`. Never decimals.
- Payments: Khalti (redirect + server-verified return) and Cash on Delivery. NO auto-debit anywhere.
- Subscriptions are non-recurring: Prepaid 3/6/12 deliveries OR pay-per-delivery renewal links.
- Every font stack includes a Devanagari fallback (`Noto Sans Devanagari` / `Noto Serif Devanagari`).
- **Route-scoped font loading (4G mobile budget):** NEVER load all preset fonts globally in root `app/layout.tsx`. Load fonts per route-group layout (`(platform)`, `merchant`, `s/[storeSlug]` active preset only) and share `Geist Mono` / `JetBrains Mono` so no single page downloads more than 3 font families.

## 1. Anti-"AI look" rules (violations are bugs)
- NO gradients, glow blobs, glassmorphism, backdrop-blur decoration.
- NO shadows for hierarchy. Use 1px hairline borders and surface tone steps.
- NO centered-hero + three-equal-feature-cards + centered-CTA-band template. Left-aligned hero; vary section rhythm and height.
- NO emoji as icons. NO default Inter/Geist-for-everything look. NO italic-serif accent word in headlines.
- NO placeholder data: no "John Doe", no round prices (`Rs. 1,000`), no lorem ipsum. Use realistic Nepali names, real municipalities, odd real prices (`Rs. 1,150`, `Rs. 485`).
- NO fake testimonials, fake logo walls, or stock/AI photos. If proof is missing, omit the section.
- NO marketing words: "seamless", "effortless", "elevate", "unlock", "supercharge", "revolutionize".
- Copy voice: short, concrete, plain, slightly Nepali. Examples: *"Your shop, online, before your chiya cools."* / *"Khalti and cash on delivery, both working on day one."* / *"Done. Your store is live. Share it on Instagram."*
- One local visual motif only (a traced dhaka-weave border used as a divider). One hand-made touch (hand-drawn marigold underline under the live URL). Nothing else decorative.
- Before finishing any screen run: swap-the-logo test, squint test, copy-delete test (remove every sentence that fits any startup), placeholder-data test.

## 2. Tokens

### Platform
```css
:root {
  --sc-paper:#FAFAF7; --sc-surface:#FFFFFF; --sc-ink:#111318;
  --sc-ink-2:#4B5060; --sc-ink-3:#8B90A0; /* ink-3 hints only */
  --sc-line:#E8E8E1; --sc-marigold:#F2A900; --sc-marigold-soft:#FFF4D6;
  --sc-success:#15803D; --sc-danger:#B42318;
}
```
Fonts: headings `Bricolage Grotesque`, body `Geist Sans`, numbers/URL `Geist Mono`. Radius `8px`. Primary button: ink fill, paper text, `48px` tall. Marigold is used ONLY for small live moments (URL cursor, live dot, success check).

### Console (shadcn zinc, wrapped in `.console`)
```css
.console {
  --background:#FAFAFA; --foreground:#18181B; --card:#FFFFFF; --card-foreground:#18181B;
  --popover:#FFFFFF; --popover-foreground:#18181B;
  --primary:#18181B; --primary-foreground:#FAFAFA;
  --secondary:#F4F4F5; --secondary-foreground:#27272A;
  --muted:#F4F4F5; --muted-foreground:#71717A;
  --accent:#F4F4F5; --accent-foreground:#18181B;
  --border:#E4E4E7; --input:#E4E4E7; --ring:#2563EB; --destructive:#DC2626;
  --radius:0.375rem;
  --st-new:#2563EB; --st-packed:#D97706; --st-shipped:#7C3AED;
  --st-delivered:#16A34A; --st-cancelled:#71717A;
}
.console.dark {
  --background:#09090B; --foreground:#FAFAFA; --card:#111113;
  --primary:#FAFAFA; --primary-foreground:#18181B; --muted:#18181B;
  --muted-foreground:#A1A1AA; --border:#27272A;
}
```
Restyle shadcn so it doesn't look like the demo: `13px` base text, tight Linear-style row density, status = colored dot + label (never color alone), prices and order numbers in mono tabular, hairline borders, empty states with one useful slightly funny line (no box illustrations).

### Storefront presets (scoped by `[data-store-theme]`)
```css
@theme inline {
  --color-sf-canvas:var(--sf-canvas); --color-sf-surface:var(--sf-surface);
  --color-sf-ink:var(--sf-ink); --color-sf-muted:var(--sf-muted);
  --color-sf-line:var(--sf-line); --color-sf-cta:var(--sf-cta);
  --color-sf-cta-ink:var(--sf-cta-ink); --color-sf-accent:var(--sf-accent);
  --radius-sf:var(--sf-radius); --font-sf-display:var(--sf-display);
  --font-sf-body:var(--sf-body); --font-sf-mono:var(--sf-mono);
}
[data-store-theme="editorial-warm"] { /* BrewMellow */
  --sf-canvas:#F5F2EB; --sf-surface:#FBF9F4; --sf-ink:#1A1512; --sf-muted:#6B6259;
  --sf-line:#E3DCCF; --sf-cta:#A3432A; --sf-cta-ink:#FFFFFF; --sf-accent:#C99A4B;
  --sf-radius:14px; --sf-display:"Fraunces","Noto Serif Devanagari",serif;
  --sf-body:"Plus Jakarta Sans","Noto Sans Devanagari",sans-serif; --sf-mono:"JetBrains Mono",monospace;
}
[data-store-theme="pahadi-sage"] { /* herbal, skincare, honey */
  --sf-canvas:#F3F7F4; --sf-surface:#FFFFFF; --sf-ink:#10241B; --sf-muted:#5B6F64;
  --sf-line:#D9E5DD; --sf-cta:#1F6F4A; --sf-cta-ink:#FFFFFF; --sf-accent:#E9C46A;
  --sf-radius:22px; --sf-display:"Young Serif","Noto Serif Devanagari",serif;
  --sf-body:"Manrope","Noto Sans Devanagari",sans-serif; --sf-mono:"JetBrains Mono",monospace;
}
[data-store-theme="ktm-bold"] { /* streetwear, accessories, electronics */
  --sf-canvas:#F4F4F0; --sf-surface:#FFFFFF; --sf-ink:#0B0B0B; --sf-muted:#5E5E5A;
  --sf-line:#0B0B0B; --sf-cta:#2B3BFF; --sf-cta-ink:#FFFFFF; --sf-accent:#D7FF3A;
  --sf-radius:4px; --sf-display:"Space Grotesk","Noto Sans Devanagari",sans-serif;
  --sf-body:"Inter","Noto Sans Devanagari",sans-serif; --sf-mono:"JetBrains Mono",monospace;
}
```
Custom merchant colors: auto-derive `--sf-cta-ink`; reject below 4.5:1 contrast against canvas and offer the nearest accessible shade. Merchants can rename up to 5 key labels (e.g. "Add to bag").

## 3. Platform surface
- **Hero:** left-aligned. Headline, one sentence, ONE input *"Your store name"*. Live URL ghost `shopcraft.com.np/s/yourname` with hand-drawn marigold underline, auto-slugified as they type. One CTA *"Start free"* carrying `?name=`.
- **Live phone preview:** a real phone-sized storefront component (not a generic static mockup) shows the typed store name. Three preset swatch dots swap `data-store-theme` with a 200ms crossfade, no layout shift. Auto-cycle every 4s until first touch. `prefers-reduced-motion`: instant swap, no autoplay.
- **Auth (passwordless, $0 cost):** Email first (`inputmode="email"`, `autocomplete="email"`), 6-digit Email OTP sent via Resend (`autocomplete="one-time-code"`, auto-advance across cells; console OTP banner in local dev), **Continue with Google** secondary. One primary step per screen. Land directly in the Create Store wizard with `?name=` prefilled (or back in checkout if triggered from a storefront). Validated Nepali mobile (`^9[78]\d{8}$`) is captured at Store Creation and Checkout.

## 4. Console surface
Shell: mobile bottom tabs (`Home`, `Orders`, `Products`, `More`) + floating `+`; desktop `232px` sidebar. Instant local state with a **sticky Contextual Save Bar** (`Unsaved changes · Save` + `⌘S` / `Ctrl+S`) on dirty forms so half-typed values never trigger broken network writes. Undo toasts instead of confirm dialogs. Drawers/sheets, not page navigations.

a) **Create Store wizard:** single page, progressive reveal, completed steps collapse to one line.
   1. **Name & Contact:** large store name input, live slug URL with debounced availability check (inline ✓ or suggestion + pencil to edit slug), merchant phone (`^9[78]\d{8}$`).
   2. **Logo:** drop/paste/camera upload to Cloudinary, visible `Skip`.
   3. **Theme:** three preset cards (`Editorial Warm`, `Pahadi Sage`, `KTM Bold`) with live preview (above on mobile, beside on desktop). Custom accent color hides behind *"Customize"* with 4.5:1 contrast guard.
   Launch → dashboard checklist: add first product, set delivery fees (Inside Kathmandu Valley `Rs.` / Outside Valley `Rs.` + optional free-delivery threshold), connect Khalti (deferred — sandbox fallback works immediately and never blocks launch).

b) **Product + variant editor:** instant local edits + sticky Contextual Save Bar (`⌘S`) and explicit `Draft / Published` toggle.
   - Spreadsheet-style grid: `Variant | Price (Rs.) | In Stock | Subscribe` switch.
   - Quick-add chips (`250g · 500g · 1kg` or `S · M · L`) generate rows. `Tab`/`Enter` moves cells; `Enter` on last row creates a new row copying previous `In Stock` and subscription state.
   - Price field: `Rs.` prefix, `inputmode="numeric"`, live `en-IN` comma formatting, integers only (stored server-side as integer paisa `price_minor`).
   - Subscription: per-variant inline switch + master switch. Turning on reveals ONE inline row: discount % (default 10), plan chips (`Prepaid 3/6/12`, `Pay-per-delivery`), computed preview (*"Rs. 765 per bag when subscribed"*).
   - Mobile: variants render as clean stacked cards.

c) **Order queue:**
   - Tabs with counts: `New · Packed · Shipped · Delivered · All`. Search + one filter chip popover (payment method, subscription, date).
   - Row: order no., customer, item summary, `Rs.` total, payment badge (`Khalti ✓ Paid` / `COD Due`), age. Subscription orders show `↻`.
   - Row tap → right slide-over (desktop) / bottom sheet (mobile): `OrderEvent` timeline, items, address (tap-to-call, copy address, `wa.me` WhatsApp link), payment status.
   - Sticky primary button shows ONLY the next valid state transition: *"Mark as Packed"* → *"Mark Shipped"* (optional courier/tracking note) → *"Mark Delivered"*. COD delivered reads *"Delivered · Collected Rs. 1,450"* and confirms cash receipt.
   - Optimistic UI update + 5s Undo toast. Customer notified by email per transition.

## 5. Storefront surface
**Product detail purchase box (progressive disclosure):**
1. Default: variant chips, price, segmented control **One-time** (selected) | **Subscribe · Save 10%** (shown only when variant allows subscriptions). Never pre-select subscription.
2. On Subscribe: inline expand (`180ms`, no navigation): **Prepay & save** (default) or **Pay each delivery**; plan chips `3 · 6 · 12` (default `3`) showing per-delivery price and total (*"Rs. 765 each · Rs. 2,295"*). One line: *"No auto-charge. Ever. We send a reminder link before each delivery."*
3. CTA label mirrors the choice (*"Add to cart · Rs. 850"* / *"Subscribe · Rs. 2,295"*). Mobile: sticky bottom bar with price + CTA.
4. Cart = slide-over drawer (`sc:{storeSlug}:cart`); line items tagged *"One-time"* or *"↻ 3 deliveries"*. Mixed carts allowed.

**Single-screen mobile checkout (one scroll, distraction-free — no store navbar/footer clutter):**
1. Collapsed summary row *"2 items · Rs. 2,400 ▾"*.
2. Contact: phone first (`inputmode="tel"`, `+977` prefix, validate on blur with `^9[78]\d{8}$`, message *"Enter a 10-digit number starting with 98 or 97"*), then full name (authenticated via 6-digit Email OTP / session).
3. Address: saved address cards as radio cards (label, name, *"Ward 5, Kirtipur, Kathmandu, Bagmati"*), most recent pre-selected. *"Add new"* → bottom sheet with cascading selects `Province → District → Municipality → Ward`, auto-advance, plus strongly encouraged *Landmark / Nearest Chowk* field. Delivery fee updates inline automatically (`Kathmandu / Lalitpur / Bhaktapur` = Inside Valley rate; all other districts = Outside Valley rate).
4. Payment: two `72px` tactile cards, **Khalti** (default) and **Cash on Delivery**. Selected = `2px` `--sf-cta` ring + check + `10ms` `navigator.vibrate` (where supported). COD copy: *"Pay Rs. 2,550 in cash to the rider."* If cart contains a prepaid subscription plan, DISABLE COD with inline reason *"Prepaid plans need Khalti"* (never hide the card).
5. Sticky pay bar (safe-area aware): *"Pay with Khalti · Rs. 2,550"* / *"Place order · Rs. 2,550"*.

**Khalti flow:** create pending order server-side with an idempotency key BEFORE redirect → calm full-screen *"Taking you to Khalti…"* → on return show skeleton while server verifies via `epayment/lookup/` (never trust the redirect query string) → success screen. On failure return to checkout with all fields intact and a plain-language reason.

## 6. Micro-interaction rules
- Durations `150–220ms`, `ease-out`; sheets use spring. No layout shift anywhere.
- Touch targets `≥44px`, primary CTAs `≥48px`. Primary actions live in the bottom third of the mobile screen.
- Validation errors appear inline next to the field, never as toasts. Undo over confirm.
- Skeletons, not spinners. Optimistic UI for status changes. Manage focus on sheet open/close.
- Use `dvh`, never `100vh`. Respect safe-area insets and `prefers-reduced-motion`.
- Correct `inputmode` and `autocomplete` on every input.
- Test mobile layouts at `375px` width (Instagram/TikTok in-app browser viewport); Khalti redirect must work cleanly on mobile web.

## 7. Definition of Done (run before declaring any UI task finished)
- [ ] Surface isolation holds: no `--sf-*` in console, no raw hex in `/s/*`.
- [ ] Tokens used exactly as defined above; no invented colors, fonts, or radii; max 3 font families loaded on the route.
- [ ] One obvious primary action per screen; reachable with one thumb on `375px` mobile.
- [ ] Prices are integer `Rs.` (`en-IN`) with tabular numerals; phone validation is `^9[78]\d{8}$`.
- [ ] Section 1 anti-AI-look rules pass, including swap-the-logo, squint, copy-delete, and placeholder-data tests.
- [ ] All data and copy use realistic Nepali names, wards/municipalities, and non-round prices; zero placeholders.
- [ ] Mobile viewport (`375px`) checked first; Devanagari fallback renders cleanly.
- [ ] Any deviation from this file is listed explicitly and was approved by the user.

## 8. P2 Polish Backlog (Week 4 ONLY if ahead of schedule — never block Phases 1–3)
- `⌘K` command palette and `J`/`K` + `Enter` desktop keyboard navigation in Order Queue.
- Swipe-right row gesture on mobile Order Queue.
- Automatic dominant-color extraction from uploaded store logo during onboarding.
- Bulk order selection → printable HTML packing slips.
- Optional Leaflet/map pin drop inside the address bottom sheet.
