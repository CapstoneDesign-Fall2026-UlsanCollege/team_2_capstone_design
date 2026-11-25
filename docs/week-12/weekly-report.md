# Weekly Report — Week 12 (Carry a QA Finding to a Verified Action)

**Team:** Team 2 — **ShopCraft** (Multi-Tenant SaaS Platform for Nepal's Craft Economy)  
**Week:** Week 12 (Sprint 3: QA and Handoff · Class Thu, Nov 19, 2026 · Homework Due Wed, Nov 25, 2026 EOD)  
**Date:** Wednesday, November 25, 2026 *(final Week 12 submission sync on `main` commit [`067a478`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/067a478), following live checks on `fbc79ab` Nov 22 and `4464ed7` Nov 23)*

---

## 1. This Week's Goal

Carry forward Week 11's open live production finding ([`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) — live `brewmellow` checkout Khalti availability) under the locked feature freeze ([`mvp-freeze-record.md`](../week-11/mvp-freeze-record.md)), reproduce and verify the exact gap on `https://shopcraft.me`, land and test bounded reliability fixes (`PR #60`–`#65`), confirm storefront checkout stability across `PR #66`, and keep remaining non-author live checks transparently owned ahead of Wed Nov 25 EOD.

---

## 2. What We Committed to Do

- [x] **Carry Forward One High-Priority Week 11 Target (`#51` -> `#67`):** State expected vs. actual behavior before running checks and reproduce live `/s/brewmellow/checkout` payment status against Week 11 (`8098426`) baseline.
- [x] **Resolve & Verify Bounded Reliability Bugs (`PR #60`–`#65`) & Hardening (`c732ebb`–`067a478`):** Shipped isolated fixes (`#60`–`#65`), checkout/price bounds (`c732ebb`), 13-bug adversarial test suites (`f94c99a`), and strict `OWNER`/`STAFF` RBAC (`420dfca`, `067a478`), expanding tests to **`199` backend tests** and **`13` Vitest files** passing green in CI [Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139).
- [x] **Confirm Scoped All-Clear on Storefront Core Flow (`PR #66` Regression):** Verify `/s/brewmellow`, `/s/pahadi-honey` cart isolation, `AccountSheet` typo hint, and `390x844` phone validation on live `https://shopcraft.me` (`0` console/page errors).
- [x] **Provision Live `brewmellow` Khalti Sandbox Key & Verify Real OTP / Paid Sandbox Flow (`#67`):** Updated `seed_brewmellow.py` owner email (`aayushman1234511@gmail.com`), removed `dev_otp_hint` (`4464ed7`, CI [Run #84](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45224773179)), connected Khalti Sandbox in live BrewMellow settings, and verified real Email OTP login + Order `#BR-2026-0005` **`Khalti Verified` (`PAID`, zero real money)** (`w12-06`..`w12-09`).
- [ ] **Complete Uncoached Non-Author Live Gateway & Cancellation Repeat (`#51` / `#67` before Wed Nov 25 EOD):** Have `@Kushan2191` run an uncoached live Khalti Sandbox + `User canceled` promo-retention check on active `brewmellow` (`https://shopcraft.me`) and post proof in `#51` / `#67`.

---

## 3. Evidence Links

| Evidence | Link |
|---|---|
| **Issue(s)** | [`Issue #67` (Week 12 QA Follow-Through)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`Issue #51` (Live Gateway QA)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`Issue #49` (MVP Freeze Gate)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49) · [`Issue #52` (Mobile Checkout & Hardware QA)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) |
| **PR(s) / Commits** | [`PR #60`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b03f7ca)–[`PR #66` (`fbc79ab`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab) · [`4464ed7`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/4464ed7) · [`c732ebb`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/c732ebb) · [`f94c99a`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f94c99a) · [`420dfca`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/420dfca) · [`067a478` (HEAD)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/067a478) · [CI Run #86 (`45427562139`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139) |
| **Screenshot / Demo** | Before (`w12-01`..[`w12-05` Khalti Unavailable](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png)) · After ([`w12-06` Connected](evidence/screenshots/w12-06-brewmellow-khalti-sandbox-connected.png), [`w12-07` Active Checkout](evidence/screenshots/w12-07-brewmellow-checkout-khalti-active.png), [`w12-08` `#BR-2026-0005` Paid](evidence/screenshots/w12-08-khalti-sandbox-order-br-2026-0005-paid.png), [`w12-09` Merchant Queue](evidence/screenshots/w12-09-merchant-orders-queue-khalti-verified.png)) · [`evidence-index.md`](evidence-index.md) |
| **Test / Check Note** | [`work-checklist.md`](work-checklist.md) · [`qa-checklist.md`](qa-checklist.md) · [`bug-report.md`](bug-report.md) · [`issue-priority-guide.md`](issue-priority-guide.md) · [`peer-test-notes.md`](peer-test-notes.md) · [`w12-verification-checks.json`](evidence/w12-verification-checks.json) · [`w12-backend-tests.txt`](evidence/w12-backend-tests.txt) · [`w12-frontend-checks.txt`](evidence/w12-frontend-checks.txt) |
| **Document Update** | Baseline freeze context retained in [`docs/week-11/mvp-freeze-record.md`](../week-11/mvp-freeze-record.md) and [`docs/week-09/final-demo-roadmap.md`](../week-09/final-demo-roadmap.md) |
| **Current Codebase Area Map / Ownership Audit** | [`ai-use-and-code-ownership-audit.md`](ai-use-and-code-ownership-audit.md) · [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) |

---

## 4. Individual Contribution Entries — One Row Per Student

| Student | What They Did in Week 12 | Evidence Link |
|---|---|---|
| **Aditya Kumar Gupta**<br>([`@notyouradhee`](https://github.com/notyouradhee)) | Kept separate current statuses in [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67): **COD worked continuously**, whereas live Khalti was `Unavailable` (`Nov 18` & `Nov 22` [`w12-05`](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png)) until resolved (`Nov 23` `4464ed7`: saved encrypted Sandbox key in BrewMellow settings [`w12-06`](evidence/screenshots/w12-06-brewmellow-khalti-sandbox-connected.png), verified real Email OTP + live `#BR-2026-0005` **`Khalti Verified`** [`w12-07`](evidence/screenshots/w12-07-brewmellow-checkout-khalti-active.png)–[`w12-09`](evidence/screenshots/w12-09-merchant-orders-queue-khalti-verified.png) with zero secrets committed). Also shipped `#60`–`#65`, `c732ebb`, `f94c99a`, `420dfca`, and `067a478`. | [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`bug-report.md`](bug-report.md) · [`067a478`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/067a478) · [`w12-08`](evidence/screenshots/w12-08-khalti-sandbox-order-br-2026-0005-paid.png) |
| **Kushan Sunuwar**<br>([`@Kushan2191`](https://github.com/Kushan2191)) | Area 2 QA Steward: inherited Week 11 target [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51); tracked live Khalti config blocker (`#67`, prerequisite enabled by `@notyouradhee` on `Nov 23` `4464ed7` / [`w12-06`](evidence/screenshots/w12-06-brewmellow-khalti-sandbox-connected.png)) across [`qa-checklist.md`](qa-checklist.md), [`work-checklist.md`](work-checklist.md), and [`issue-priority-guide.md`](issue-priority-guide.md). **Pending before Wed Nov 25 EOD:** execute uncoached non-author live checkout + `User canceled` promo-release (`PR #64`) + clean-clone check and post proof in `#51` / `#67`. | [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`qa-checklist.md`](qa-checklist.md) · [`issue-priority-guide.md`](issue-priority-guide.md) |
| **Aanchal Chand Thakuri**<br>([`@jaasly07`](https://github.com/jaasly07)) | Area 3 Storefront & Mobile Steward: verified post-`PR #66` storefront regression on **exact build [`fbc79ab`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab)** at live `https://shopcraft.me` (`Nov 22, 2026`) in headless **Chromium emulation across `1440×900` desktop** (`Bag (1)` persistence [`w12-01`](evidence/screenshots/w12-01-brewmellow-template-cart-persistence.png), `AccountSheet` typo hint [`w12-02`](evidence/screenshots/w12-02-storefront-signin-typo-hint.png), `/s/pahadi-honey` `0`-item isolation [`w12-03`](evidence/screenshots/w12-03-pahadi-honey-template-bag-isolation.png)) and **`390×844` mobile** (pre-POST `98412345` rejection [`w12-04`](evidence/screenshots/w12-04-mobile-390-checkout-validation.png)); **explicitly kept distinct from physical-phone keyboard check** open in [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52). | [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) · [`peer-test-notes.md`](peer-test-notes.md) · [`w12-01`](evidence/screenshots/w12-01-brewmellow-template-cart-persistence.png) · [`w12-04`](evidence/screenshots/w12-04-mobile-390-checkout-validation.png) |
| **Rohit Chhantyal**<br>([`@Rohit-coder201`](https://github.com/Rohit-coder201)) | Area 4 DevOps, CI & Merchant Console Steward: merged [`PR #66`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab) (`Run #82`) and co-owned `MerchantStoreGuard.tsx` / `merchant-rbac.test.ts` (`067a478`) plus `PR #65` unpaid Khalti vs COD console labels (`merchant-status.test.ts` `34` tests), keeping CI [Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139) green (`199` backend Postgres `FORCE RLS` + Next.js). **Pending:** uncoached non-Area-4 merchant-console repeat (`@jaasly07` or `@Kushan2191` on live `067a478`/`https://shopcraft.me/merchant/brewmellow/orders`). | [CI Run #86 (`45427562139`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139) · [`067a478`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/067a478) · [`peer-test-notes.md`](peer-test-notes.md) |

---

## 5. Blockers or Risks

| Blocker / Risk | Owner | Next Action |
|---|---|---|
| **1. Uncoached Non-Author Live Khalti Repeat (`#51` / `#67`)** *(Sandbox key now live)* | `@Kushan2191` | Live Khalti Sandbox is now connected (`w12-06`) and `#BR-2026-0005` succeeded (`w12-08`); `@Kushan2191` completes uncoached live `User canceled` promo-release & checkout check before Wed Nov 25 EOD. |
| **2. Pending Non-Area-4 Merchant-Console Confirmation (`PR #65` / `067a478`) & Cross-OS Clean Clone** | `@Kushan2191` / `@jaasly07` | Complete uncoached peer verification outside Area 4 of live `/merchant/brewmellow/orders` (`OrderDetailSheet`/`PackingSlipModal` unpaid Khalti `Verifying payment` vs `COD` & `#BR-2026-0005` status on `067a478`) plus second-OS clean setup and add own comment in `#67`. |
| **3. Physical iOS / Android Hardware Keyboard QA (`#52`)** | `@jaasly07` | Scheduled for Week 13 hardware test pass; `390x844` browser checks do not claim physical iOS Safari behavior. |

---

## 6. Decision Record

| Decision | Why We Chose It | Owner | Evidence / Issue Link |
|---|---|---|---|
| **Elevate Live `brewmellow` Khalti Configuration from `P2` to `P1 (At Risk)`** | Week 12 live reproduction (`Nov 22` on `fbc79ab`) proved `Khalti Unavailable — Not configured by merchant` persisted from Week 11 (`Nov 18`), blocking live E2E verification of gateway cancellation (`#51`) and promo release (`#64`), even though `COD` fallback keeps checkout functional. | `@notyouradhee` & `@Kushan2191` | [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`w12-05`](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png) |
| **Keep Week 11 Scope Frozen; Classify `PR #66` Under Existing Storefront Surface Regression** | Per Week 12 course rules, no new post-freeze features are claimed; theme styling (`PR #66`) was regression-checked across `/s/brewmellow`, `/s/pahadi-honey`, `AccountSheet`, and `390x844` checkout to confirm zero regressions in promised behavior. | `@Rohit-coder201` & `@jaasly07` | [`qa-checklist.md`](qa-checklist.md) · [`w12-01`](evidence/screenshots/w12-01-brewmellow-template-cart-persistence.png) |

---

## 7. Next Week's Bridge Task (Homework -> Week 13 EOD Wed, Nov 25)

- Now that live Khalti Sandbox credentials are configured and verified (`#BR-2026-0005`, `w12-06`..`w12-09`), have non-author `@Kushan2191` run and comment on [`#51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) / [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) with uncoached cancellation + promo release proof before Wed Nov 25 EOD.
- Confirm [`README.md`](../../README.md) clean-clone setup instructions and [`Codebase Area Map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) links require zero steward coaching ahead of Week 13's independent handoff trial.
