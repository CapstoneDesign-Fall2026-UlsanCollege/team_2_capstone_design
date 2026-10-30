# SC-04 Wave 3 Summary: Second Demo Store (Himalayan Artisans) & Legacy Next.js Redirects (Plan 04-03)

**Executed:** 2026-10-31  
**Phase:** SC-04 Subscriptions, SaaS Landing & Production Launch  
**Plan:** 03 of 4  
**Status:** Complete (100%)  
**Commit:** `saas/main`

---

## 1. Executive Summary

Plan 04-03 provisions a second, non-coffee artisanal demo store (**Himalayan Artisans**, slug `himalayan-artisans`) and establishes permanent HTTP 308 redirects from legacy BrewMellow routes to their modern multi-tenant equivalents under `/s/brewmellow/...` and `/merchant/brewmellow/...`.

With Himalayan Artisans live on the database, ShopCraft proves true multi-tenant versatility: Store #1 showcases specialty coffee in an editorial warm aesthetic, while Store #2 showcases high-elevation artisanal orthodox teas, wild herbal tisanes, and mountain spices styled in the organic `pahadi-sage` theme with distinct pricing, shipping rates, selling plans, and orders.

---

## 2. Key Accomplishments

### A. Second Tenant Seeder (`backend/stores/management/commands/seed_himalayan_artisans.py`)
- **Tenant Configuration:**
  - `name`: "Himalayan Artisans"
  - `slug`: "himalayan-artisans"
  - `theme_preset`: "pahadi-sage" (`--sf-canvas: #f4f6f3`, sage brand accents)
  - `tagline`: *"Handcrafted single-estate teas, wild chamomile, and high-altitude spices from eastern Nepal."*
  - Free shipping threshold: Rs. 2,000 (200,000 paisa).
- **Artisanal Product Catalog:**
  1. **Ilam Single-Estate Black Tea** (100g Rs. 450, 250g Rs. 950, 500g Rs. 1,750).
  2. **Organic Himalayan Chamomile** (50g Rs. 350, 100g Rs. 650).
  3. **Wild Turmeric & Mountain Ginger** (100g Rs. 300, 250g Rs. 650).
- **Selling Plans:**
  - `ha-payg`: Monthly delivery pay-per-delivery (0% discount).
  - `ha-3m`: 3 Months Artisan Season (10% discount, prepaid).
  - `ha-6m`: 6 Months Mountain Harvest (15% discount, prepaid).
- **Demo Customers, Orders & Subscriptions:**
  - Seeded initial subscriber (`Prashant Gurung`) with 3M prepaid subscription.

### B. Legacy URL Redirects (`frontend/next.config.ts`)
Configured permanent HTTP 308 redirects preserving backward compatibility with legacy bookmarks and external evaluation links:
- `/origins` & `/origins/:path*` → `/s/brewmellow` (308)
- `/subscribe` → `/s/brewmellow` (308)
- `/checkout` → `/s/brewmellow/checkout` (308)
- `/dashboard` & `/dashboard/:path*` → `/merchant/brewmellow` / `:path*` (308)
- `/admin` & `/admin/:path*` → `/merchant/brewmellow` / `:path*` (308)

---

## 3. Verification & Compliance Evidence

| Check | Tool / Command | Result |
| :--- | :--- | :--- |
| **Seeder Execution** | `python manage.py seed_himalayan_artisans` | Success (Store #2, products, variants, plans & subscriptions) |
| **Catalog API** | `GET /api/stores/himalayan-artisans/catalog/` | 200 OK (Returns 3 products, variants, and plans) |
| **Surface Isolation** | `node scripts/check-surfaces.mjs` | `SURFACE_ISOLATION_OK` |
| **TypeScript Compilation** | `npm run typecheck` | Passed (0 errors) |
| **Production Build** | `npm run build` | Passed with redirects |
