# 🛍️ ShopCraft: Multi-Tenant E-Commerce Platform for Nepal's Craft Economy

[![Live Deployed App](https://img.shields.io/badge/Production-Live%20on%20Vercel-success?style=for-the-badge&logo=vercel)](https://team-2-capstone-design-one.vercel.app)
[![Backend Tests](https://img.shields.io/badge/Django%20Tests-51%2F51%20Passing-brightgreen?style=for-the-badge&logo=django)](backend/stores/tests/test_isolation.py)
[![TypeScript](https://img.shields.io/badge/TypeScript-0%20Errors-blue?style=for-the-badge&logo=typescript)](frontend/)
[![Payment Gateway](https://img.shields.io/badge/Khalti-Sandbox%20v2%20Verified-purple?style=for-the-badge)](docs/week-09/core-demo-evidence-matrix.md)
[![Course](https://img.shields.io/badge/Capstone%20Design-Fall%202026-orange?style=for-the-badge)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege)

Welcome to the official repository of **ShopCraft** (Team 2 Capstone Design, Ulsan College — Fall 2026).

---

## 📌 Executive Summary & Post-Midterm Architectural Pivot

### From Single-Store (BrewMellow) to Multi-Tenant Platform (ShopCraft)
During our Midterm review (where Team 2 was the only team rated **Exceeds** in `Week 8/grades.md`), classroom feedback challenged our team:
> *“Building a bespoke website for a single coffee shop limits senior engineering depth and scalability. Independent craft producers across Nepal (specialty coffee roasters, wild cliff honey harvesters, handloom weavers) lack an accessible, localized e-commerce engine with native digital wallets (Khalti), localized provincial addresses (Provinces 1–7), and enterprise-grade tenant data isolation.”*

In response, we executed a deliberate post-midterm architectural pivot:
1. **Platform Identity:** Renamed the project to **ShopCraft** — a multi-tenant e-commerce SaaS engine built specifically for Nepal's craft economy.
2. **Flagship Store #1 (BrewMellow):** Preserved all coffee research by hosting **BrewMellow** (`/s/brewmellow`) as our flagship pilot tenant, featuring single-origin Himalayan coffees from Gulmi, Ilam, and Nuwakot.
3. **Store #2 (Pahadi Honey):** Seeded **Pahadi Honey** (`/s/pahadi-honey`) to rigorously verify multi-tenant isolation and cross-store data security.
4. **Verified Localized Payments:** Implemented server-side **Khalti Sandbox ePayment v2** (`epayment/lookup/` with `pidx` verification) alongside an instant **Cash on Delivery (COD)** fallback.
5. **Rigorous Data Isolation:** Enforced PostgreSQL Row-Level Security (RLS) and Django `TenantDatabaseContext`, backed by **51 automated backend tests** proving that Store Owner A receives HTTP 404 on Store B's endpoints.

---

## 🏗️ System Architecture & Tenant Hierarchy

ShopCraft operates a unified Next.js + Django full-stack architecture divided into three strictly isolated surfaces:

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                  SHOPCRAFT PLATFORM                    │
                                  │           https://team-2-capstone-design.vercel.app    │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                    ▼                                                                                   ▼
   ┌─────────────────────────────────┐                                                 ┌─────────────────────────────────┐
   │       STOREFRONT SURFACE        │                                                 │    MERCHANT CONSOLE SURFACE     │
   │    Route: /s/[storeSlug]        │                                                 │   Route: /merchant/[storeSlug]  │
   ├─────────────────────────────────┤                                                 ├─────────────────────────────────┤
   │ • Tenant #1: /s/brewmellow      │                                                 │ • Polaris-style operations UI   │
   │   (Himalayan Specialty Coffee)  │                                                 │ • Product & Variant management  │
   │ • Tenant #2: /s/pahadi-honey    │                                                 │ • Real-time order fulfillment   │
   │   (Wild Cliff Honey)            │                                                 │ • 5-second undo transition toast│
   │ • Single-screen localized       │                                                 │ • Encrypted per-store gateway   │
   │   checkout (Provinces 1–7)      │                                                 │   credentials (Khalti keys)     │
   │ • Khalti Sandbox v2 & COD       │                                                 │ • Customer directory & history  │
   └────────────────┬────────────────┘                                                 └────────────────┬────────────────┘
                    │                                                                                   │
                    └─────────────────────────────────────────┬─────────────────────────────────────────┘
                                                              │ REST API + JSON
                                                              ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │                 DJANGO REST BACKEND                    │
                                  │  • TenantDatabaseContext & StoreScopedManager          │
                                  │  • Server-authoritative price & order totals in paisa  │
                                  │  • Idempotent Khalti callback verification with pidx   │
                                  │  • Status state machine (PAID → PROCESSING → SHIPPED)  │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                                                              ▼
                                  ┌────────────────────────────────────────────────────────┐
                                  │             POSTGRESQL / NEON DATABASE                 │
                                  │  • Row-Level Security (RLS) Policies on 11 tables      │
                                  │  • Restricted database role: shopcraft_app             │
                                  │  • Cross-tenant queries blocked at SQL engine level    │
                                  └────────────────────────────────────────────────────────┘
```

---

## 🚀 Key Platform Features

- **Multi-Tenant PostgreSQL Row-Level Security (RLS):** 11 tenant-owned database tables enforce strict isolation via `tenant_isolation_policy`. Cross-store API queries return `HTTP 404 Not Found`.
- **Dual-Rail Checkout (Khalti Sandbox v2 + Cash on Delivery):**
  - **Khalti ePayment v2:** Official sandbox redirect flow using test phone `9800000000` / OTP `987654`; verified server-side via `epayment/lookup/`.
  - **Cash on Delivery (COD):** Zero-network instant offline checkout providing an unbreakable demo fallback.
- **Localized Nepali Address Validation:** Enforces Nepal's 7 Provinces (Bagmati, Gandaki, Koshi, Lumbini, Madhesh, Karnali, Sudurpashchim) with 10-digit mobile number validation.
- **Merchant Operations Console (`/merchant/[storeSlug]`):** Real-time order fulfillment queue, product variant editor, and delivery packing slip generation with 5-second undo toast actions.
- **Automated Test Quality:** 51 Django tests passing (0 failures), 0 TypeScript compilation errors, and zero cross-surface state leakage (`check-surfaces.mjs`).

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | [Next.js 15](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS | Deployed on [Vercel](https://vercel.com/) over HTTPS |
| **Backend** | [Django 5.1](https://www.djangoproject.com/) + Django REST Framework | Python 3.12, modular app architecture |
| **Database** | [PostgreSQL](https://www.postgresql.org/) (Neon Serverless) + SQLite for tests | Enforced PostgreSQL Row-Level Security (RLS) |
| **Payment Gateway** | [Khalti Sandbox ePayment v2](https://docs.khalti.com/) | Server-side initiate & lookup verification |
| **Surface Isolation** | Node.js Custom Guard (`scripts/check-surfaces.mjs`) | Blocks cross-surface state leakage |

---

## 💻 Local Development Setup

### 1. Clone the Repository
```bash
git clone https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design.git
cd team_2_capstone_design
```

### 2. Backend Setup (Django)
```bash
cd backend
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed multi-tenant stores
python manage.py migrate
python manage.py seed_brewmellow

# Start backend server (port 8000)
python manage.py runserver
```

### 3. Frontend Setup (Next.js)
```bash
cd ../frontend
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev
```

---

## 🧪 Verification & Repeatable Smoke Tests

Any evaluator or teammate can independently verify the core system by executing the following commands:

### Test 1: Full Backend Test Suite (51 Passing Tests)
```bash
cd backend
python manage.py test accounts catalog orders subscriptions stores
# Output: Ran 51 tests in 12.525s — OK (failures=0, errors=0)
```

### Test 2: Multi-Tenant Data Isolation Test (HTTP 404 Security Guards)
```bash
cd backend
python manage.py test stores.tests.test_isolation
# Proves Store Owner A probing Store B endpoints receives HTTP 404 on all routes.
```

### Test 3: Frontend TypeScript & Surface Isolation Audit
```bash
cd frontend
npx tsc --noEmit
node scripts/check-surfaces.mjs
# Output: SURFACE_ISOLATION_OK (0 type errors, 0 surface leaks)
```

### Test 4: System Health Probe
```bash
curl http://localhost:8000/api/health/
# Response: {"status": "ok", "database": "connected", "version": "1.0.0-sprint2"}
```

### Test 5: End-to-End User Checkout Journey
1. Open `http://localhost:3000/s/brewmellow` (or the [Live Vercel App](https://team-2-capstone-design-one.vercel.app/s/brewmellow)).
2. Add *Gulmi Bourbon 250g Whole Bean* to the cart.
3. Proceed to Checkout, enter a Nepali delivery address (Bagmati Province, Kathmandu, Phone: `9841234567`).
4. Select **Khalti Digital Wallet** and submit.
5. In the Khalti Sandbox portal, use test phone `9800000000` and OTP `987654`.
6. Confirm payment; verify instant redirection to the order confirmation invoice with status `PAID`.
7. Open `/merchant/brewmellow/orders` to view the new order in the roaster's fulfillment queue.

---

## 📂 Project Documentation & Deliverables

All deliverables and evidence packages are maintained in the repository:

| Week / Milestone | Document | Summary |
|---|---|---|
| **Week 9 (Current)** | [**Weekly Report**](docs/week-09/weekly-report.md) | Shared report with ShopCraft pivot, Look Back quadrants, and individual student rows |
| **Week 9 (Current)** | [**MVP Contract**](docs/week-09/mvp-contract.md) | Official scope cut contract, finish list, cut list, and Week 11 freeze gates |
| **Week 9 (Current)** | [**Final Demo Roadmap**](docs/week-09/final-demo-roadmap.md) | Core journey, tenant hierarchy, and boundaries |
| **Week 9 (Current)** | [**Core Evidence Matrix**](docs/week-09/core-demo-evidence-matrix.md) | Granular PASS / FAIL / NOT TESTED matrix |
| **Week 9 (Current)** | [**Sprint Quality Checks**](docs/week-09/sprint-quality-quick-checks.md) | 51 passing tests, clean typecheck, and surface checks |
| **Week 9 (Current)** | [**Aditya Kumar Gupta Receipt**](docs/week-09/receipts/receipt-aditya.md) | Full-stack, Khalti Sandbox v2, and tenant models |
| **Week 9 (Current)** | [**Kushan Sunuwar Receipt**](docs/week-09/receipts/receipt-kushan.md) | Independent non-author sandbox testing & edge cases |
| **Week 9 (Current)** | [**Aanchal Chand Thakuri Receipt**](docs/week-09/receipts/receipt-aanchal.md) | Mobile viewports (360px/390px) & WCAG AA accessibility |
| **Week 9 (Current)** | [**Rohit Chhantyal Receipt**](docs/week-09/receipts/receipt-rohit.md) | Identity confirmation, backend health probe, and resilience |
| **Sprint Planning** | [**Sprint 2 Roadmap**](.planning/ROADMAP.md) | Updated GSD milestone roadmap with accurate dates |
| **Architecture** | [**Design Document**](DESIGN.md) | Architectural specification and multi-tenant schema |

---

## 👥 Engineering Team & Roles

| Student Name | GitHub Login | Core Responsibility |
|---|---|---|
| **Aditya Kumar Gupta** | [`@notyouradhee`](https://github.com/notyouradhee) | Project Lead, Full-Stack Architecture, Khalti Sandbox ePayment v2, Merchant Queue |
| **Kushan Sunuwar** | [`@Kushan2191`](https://github.com/Kushan2191) | QA Lead, Independent Non-Author Sandbox Testing, Clean Clone Runbook |
| **Aanchal Chand Thakuri** | [`@jaasly07`](https://github.com/jaasly07) | Storefront UI/UX, Mobile Viewport Ergonomics (360px/390px), WCAG AA Contrast |
| **Rohit Chhantyal** | [`@Rohit-coder201`](https://github.com/Rohit-coder201) | DevOps, Backend Health Probe (`/api/health/`), Order Lifecycle State Machine |

---

## ⚖️ Transparent Boundaries & Non-Claims
To maintain absolute engineering integrity:
- **Sandbox Currency:** Khalti transactions run in the official sandbox environment; **no real fiat currency moves**.
- **Scope Cuts:** Recurring card auto-debit, live courier GPS APIs, and AI recommender questionnaires have been formally cut to protect our delivery schedule for the Week 11 MVP Freeze Gate (November 12, 2026).

---
*Built with ❤️ in Nepal for the Ulsan College Capstone Design Course (Fall 2026).*
