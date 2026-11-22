# Bug Report — Week 12 Carried QA Finding & Bounded Fix Triage

**Tracker Issues:** [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) (Week 12 Follow-Through) · [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) (Carried from Week 11)  
**Target Environment Tested:** Live [`https://shopcraft.me`](https://shopcraft.me) & commit [`fbc79ab`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab) (Nov 22, 2026)

---

## Primary Carried Bug / Environment Blocker: Live `brewmellow` Khalti Gateway Unavailable in Production

### Summary
What is broken?

> On live production [`https://shopcraft.me/s/brewmellow/checkout`](https://shopcraft.me/s/brewmellow/checkout), the **Khalti** payment radio option remains disabled and displays **`Khalti [Unavailable] — Not configured by merchant`**, preventing end-to-end live verification of Khalti Sandbox payment redirect, cancellation recovery (`status=User%20canceled`), and promo-code release (`PR #64`) against the deployed storefront while **`Cash on Delivery`** works normally.

### Priority — Work Order
- **P-level:** **P1 — At Risk** *(updated from Week 11's `P2` check priority in `#51`)*
- **Roadmap / evidence reason:** Automated mocked tests (`test_khalti.py` and `PromoDiscountKhaltiReleaseBug64Tests`) pass locally and in CI, and Cash on Delivery completes orders cleanly as fallback; however, two independent live browser inspections (Nov 18 and Nov 22) confirmed that `brewmellow` on production cannot run Khalti Sandbox without configuring merchant gateway credentials in the live database. Because live Khalti + COD dual-rail checkout is part of the [Final Demo Roadmap promise](../week-09/final-demo-roadmap.md#1-final-demo-promise), resolving live merchant sandbox configuration moves to **P1**.

### Affected Codebase Area
- **Area / file path / boundary:** Area 1 (Multi-Tenant Store & Payment Settings: `backend/stores/`, `backend/orders/`) & Area 3 Checkout payment card ([`frontend/src/components/storefront/CheckoutForm.tsx`](../../frontend/src/components/storefront/CheckoutForm.tsx#L865-L902)).
- **Current area map link:** [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map).
- **Steward / support partner:** Aditya Kumar Gupta (`@notyouradhee` — Area 1 Steward) & Kushan Sunuwar (`@Kushan2191` — Area 2 Non-Author QA).

### Severity
- [ ] **Blocker:** demo cannot work.
- [x] **Major:** important feature broken *(live Khalti payment path disabled for Store #1; documented COD fallback still works).*
- [ ] **Minor:** annoying but survivable.
- [ ] **Polish:** nice-to-have.

### Steps to Reproduce
1. Open `https://shopcraft.me/s/brewmellow` and add `Gulmi Reserve` (`150g`, `Rs. 450`) to the shopping bag.
2. Navigate to `https://shopcraft.me/s/brewmellow/checkout` (desktop or `390x844` mobile).
3. Scroll to **4. Payment Choice**.

### Expected Result
Both **Khalti** (official Sandbox test mode `9800000000` / OTP `987654`) and **Cash on Delivery** are selectable for Store #1 (`brewmellow`) so a non-author QA tester can verify gateway redirect, `User canceled` return recovery, and promo count release live.

### Actual Result
- **Nov 18 Observation (`8098426`):** Live `/s/brewmellow/checkout` rendered `Khalti Unavailable — Not configured by merchant`.
- **Nov 22 Reproduction (`fbc79ab`):** Reproduced identically on `390x844` mobile checkout — **Khalti** card is grayed out with `Unavailable` / `Not configured by merchant`, while **Cash on Delivery** (`Pay Rs. 550 cash to rider`) is selected and active.

### Proof
- **Nov 22 Live Reproduction Screenshot (`390x844`):** [`w12-05-live-brewmellow-khalti-unavailable-promo.png`](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png)
- **GitHub Issue Tracker:** [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) & [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67)

### Owner / Next Action
- **Owner:** Aditya Kumar Gupta (`@notyouradhee`) to configure Khalti Sandbox credentials in live `brewmellow` merchant settings (keeping **no real fiat money** Sandbox mode enabled), then Kushan Sunuwar (`@Kushan2191`) runs the uncoached non-author live checkout + cancellation recovery check before **Wed Nov 25, 2026 EOD**.
- **Reproduced by / evidence:** Nov 18 & Nov 22 automated browser checks (`w12-05`); awaiting independent teammate live re-run comment in `#51` / `#67`.

---

## Bounded QA Bug Fixes Triaged & Retested in Automated Suites (`Nov 22, 2026`)

| PR / Commit | Bug Summary | Severity | Priority | Affected Area | Fix Verification & Remaining Check |
|---|---|---|---|---|---|
| [`b03f7ca`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b03f7ca) (`#60`) | Checkout quote/place allowed out-of-stock variants and archived products | **Major** | **P1** | Area 1 / Area 3 (`stores/api.py`, `CheckoutForm.tsx`) | Verified via `CheckoutAvailabilityBug60Tests` (4 tests pass in CI `#82` & local SQLite) |
| [`11baf28`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/11baf28) (`#64`) | Discount `used_count` remained consumed if Khalti failed or order was cancelled | **Major** | **P1** | Area 1 (`orders/models.py`, `stores/api.py`) | Verified via `PromoDiscountKhaltiReleaseBug64Tests` (4 tests pass); live checkout repeat pending `#51` merchant key |
| [`d68d5b9`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/d68d5b9) (`#65`) | Merchant order sheet/packing slip did not clearly distinguish unpaid Khalti vs COD or show discount line | **Minor** | **P2** | Area 4 (`OrderDetailSheet.tsx`, `PackingSlipModal.tsx`) | Verified via `merchant-status.test.ts` (`25/25` Vitest); merchant console peer spot-check pending |
| [`326df97`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/326df97) (`#61`) | `ProductListTable` archive countdown effect cancelled its own timer | **Minor** | **P2** | Area 4 (`ProductListTable.tsx`) | Verified via `product-archive.test.ts` (`4/4` Vitest) |
| [`e2141e6`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/e2141e6) (`#62`) | `apiFetch` GET micro-cache returned stale reads immediately after mutations | **Minor** | **P2** | Area 1 / Area 4 (`frontend/src/lib/api.ts`) | Verified via `api.test.ts` (`5/5` Vitest) |
| [`1fbe59b`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1fbe59b) (`#63`) | `MerchantProductListCreateView` skipped `PRODUCT_CREATE` audit log when optional initial price wasn't valid | **Minor** | **P2** | Area 1 (`backend/stores/api.py`) | Verified via `ProductCreateAuditLogBug63Tests` (3 tests pass) |
