# Week 12 Evidence Index — ShopCraft

**Team:** Team 2 — ShopCraft  
**Week:** 12 — Carry a QA Finding to a Verified Action (Sprint 3: QA and Handoff)  
**Latest Verified Code SHA:** [`067a478`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/067a478) · **Green CI:** [`Run #86 (45427562139)`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139)  
**Period:** November 19–25, 2026

---

## 1. Week 12 Documentation Deliverables

| Document | Purpose | Link |
|---|---|---|
| **Shared Weekly Report** | Team goal, commitments, all 4 student entries, blockers, Decision Record, & Week 13 bridge | [`weekly-report.md`](weekly-report.md) |
| **Week 12 Work Checklist** | Complete 6-section operational checklist aligned with course Week 12 guide | [`work-checklist.md`](work-checklist.md) |
| **QA Checklist** | Inherited Week 11 question, expected vs. actual live checks, automated suite table, & bug summary | [`qa-checklist.md`](qa-checklist.md) |
| **Bug Report (`#51` / `#67`)** | Live `brewmellow` Khalti Sandbox before/after diagnosis + bounded fix triage (`#60`–`#65`, `c732ebb`, `420dfca`) | [`bug-report.md`](bug-report.md) |
| **Issue Priority & Reassessment Guide** | P0–P3 work priority vs. Defect Severity + Nov 22 (`P1`) -> Nov 23 (`#BR-2026-0005` fixed) reassessment | [`issue-priority-guide.md`](issue-priority-guide.md) |
| **Peer Test Notes & Bounds** | Live browser regression, environment boundaries, & pending uncoached teammate repeats | [`peer-test-notes.md`](peer-test-notes.md) |
| **Week 12 AI Use & Ownership Audit** | Disclosed AI usage & human verification across Week 12 fixes, adversarial tests (`f94c99a`), & RBAC (`420dfca`/`067a478`) | [`ai-use-and-code-ownership-audit.md`](ai-use-and-code-ownership-audit.md) |

---

## 2. Automated Logs, CI Runs & Machine-Readable Receipt (`067a478`)

| Artifact | Recorded Result | Link |
|---|---|---|
| **Machine-Readable Receipt (`.json`)** | SHA-256 digests, UTC timestamps, durations, Python `3.13.1` / Node `v24.22.1`, `199` backend + Vitest + CI `#86` | [`evidence/w12-verification-checks.json`](evidence/w12-verification-checks.json) |
| **Django Backend Test Log** | `manage.py test accounts catalog orders stores --verbosity 2`: `199` tests discovered (`189` local SQLite pass, `10` Postgres RLS skipped) | [`evidence/w12-backend-tests.txt`](evidence/w12-backend-tests.txt) |
| **Frontend Checks Log** | `npm test` (`12` files / `130` tests passed; `theme-contrast.test.ts` Windows Node 24 local shebang diagnostic retained), `tsc` `0`, `SURFACE_ISOLATION_OK`, scoped ESLint `0` errors | [`evidence/w12-frontend-checks.txt`](evidence/w12-frontend-checks.txt) |
| **GitHub Actions CI (`067a478`)** | Both `Backend (Django + Postgres FORCE RLS)` (all `199` tests, `0` skipped) and `Frontend (Next.js)` (incl. Vitest + Next build on Ubuntu Node 22) passed **Success** | [`CI Run #86 (45427562139)`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139) |
| **Prior Week 12 Green CI Runs** | Pre-RBAC milestone checks on `fbc79ab` (`Run #82`) and `4464ed7` (`Run #84`) | [`Run #82`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) · [`Run #84`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45224773179) |

---

## 3. Live Deployment Screenshots (`https://shopcraft.me`)

Zero raw secrets, zero private user data, and zero real currency involved across all captures:

| ID | State Captured | Role in Week 12 Loop | File |
|---|---|---|---|
| **W12-01** | `/s/brewmellow` desktop (`1440x900`) template & `Bag (1)` reload persistence (`fbc79ab`) | Regression All-Clear | [`w12-01-brewmellow-template-cart-persistence.png`](evidence/screenshots/w12-01-brewmellow-template-cart-persistence.png) |
| **W12-02** | Storefront `AccountSheet` (`buyer@gmial.com` -> `"Did you mean buyer@gmail.com?"`) (`fbc79ab`) | Regression All-Clear | [`w12-02-storefront-signin-typo-hint.png`](evidence/screenshots/w12-02-storefront-signin-typo-hint.png) |
| **W12-03** | `/s/pahadi-honey` (`1440x900`) distinct store branding & `0`-item bag isolation (`fbc79ab`) | Cross-Tenant Isolation | [`w12-03-pahadi-honey-template-bag-isolation.png`](evidence/screenshots/w12-03-pahadi-honey-template-bag-isolation.png) |
| **W12-04** | `/s/brewmellow/checkout` (`390x844`) pre-POST invalid phone rejection (`98412345`) (`fbc79ab`) | Mobile Validation All-Clear | [`w12-04-mobile-390-checkout-validation.png`](evidence/screenshots/w12-04-mobile-390-checkout-validation.png) |
| **W12-05** | **Before-Fix Reproduction (`Nov 22`):** `Khalti [Unavailable] — Not configured by merchant` + promo input | Baseline Defect Proof | [`w12-05-live-brewmellow-khalti-unavailable-promo.png`](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png) |
| **W12-06** | **Config Fix (`Nov 23`):** BrewMellow Settings `Custom Test Key Connected` (`TEST MODE`, masked `...9fc1`) | Fix Proof | [`w12-06-brewmellow-khalti-sandbox-connected.png`](evidence/screenshots/w12-06-brewmellow-khalti-sandbox-connected.png) |
| **W12-07** | **Checkout Active (`Nov 23`):** `/s/brewmellow/checkout` showing active **Khalti** option (`Pay with Khalti · Rs. 550`) | Retest Initiation Proof | [`w12-07-brewmellow-checkout-khalti-active.png`](evidence/screenshots/w12-07-brewmellow-checkout-khalti-active.png) |
| **W12-08** | **Order Verified (`Nov 23`):** Order `#BR-2026-0005` **`Khalti Verified`** (`Test mode: no real money is charged`) | Retest Completion Proof | [`w12-08-khalti-sandbox-order-br-2026-0005-paid.png`](evidence/screenshots/w12-08-khalti-sandbox-order-br-2026-0005-paid.png) |
| **W12-09** | **Merchant Queue (`Nov 23`):** `/merchant/brewmellow/orders` showing `#BR-2026-0005` (`Khalti verified`) & `#BR-2026-0004` (`Verifying payment`) | End-to-End Fulfillment Proof | [`w12-09-merchant-orders-queue-khalti-verified.png`](evidence/screenshots/w12-09-merchant-orders-queue-khalti-verified.png) |
