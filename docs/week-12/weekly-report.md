# Weekly Report — Week 12 (Carry a QA Finding to a Verified Action)

**Team:** Team 2 — **ShopCraft** (Multi-Tenant SaaS Platform for Nepal's Craft Economy)  
**Week:** Week 12 (Sprint 3: QA and Handoff · Class Thu, Nov 19, 2026 · Homework Due Wed, Nov 25, 2026 EOD)  
**Date:** Sunday, November 22, 2026 (Evaluated on `main` commit [`fbc79ab`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab))

---

## 1. This Week's Goal

Carry forward Week 11's open live production finding ([`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) — live `brewmellow` checkout Khalti availability) under the locked feature freeze ([`mvp-freeze-record.md`](../week-11/mvp-freeze-record.md)), reproduce and verify the exact gap on `https://shopcraft.me`, land and test bounded reliability fixes (`PR #60`–`#65`), confirm storefront checkout stability across `PR #66`, and keep remaining non-author live checks transparently owned ahead of Wed Nov 25 EOD.

---

## 2. What We Committed to Do

- [x] **Carry Forward One High-Priority Week 11 Target (`#51` -> `#67`):** State expected vs. actual behavior before running checks and reproduce live `/s/brewmellow/checkout` payment status against Week 11 (`8098426`) baseline.
- [x] **Resolve & Verify Bounded Reliability Bugs (`PR #60`–`#65`):** Ship isolated fixes for out-of-stock/archived checkout rejection (`#60`), archive timer cleanup (`#61`), `apiFetch` cache invalidation (`#62`), `PRODUCT_CREATE` logging (`#63`), Khalti promo `used_count` release (`#64`), and unpaid Khalti vs COD merchant labeling (`#65`), expanding test coverage to `165` backend + `102` Vitest tests.
- [x] **Confirm Scoped All-Clear on Storefront Core Flow (`PR #66` Regression):** Verify `/s/brewmellow`, `/s/pahadi-honey` cart isolation, `AccountSheet` typo hint, and `390x844` phone validation on live `https://shopcraft.me` (`0` console/page errors).
- [ ] **Complete Live Production Merchant Khalti Key Setup & Non-Author Repeat (`#51` / `#67` before Wed Nov 25 EOD):** Provision Khalti Sandbox key on live `brewmellow` DB settings (`@notyouradhee`) and complete uncoached non-author live checkout/cancel verification (`@Kushan2191`).

---

## 3. Evidence Links

| Evidence | Link |
|---|---|
| **Issue(s)** | [`Issue #67` (Week 12 QA Follow-Through)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`Issue #51` (Live Gateway QA)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`Issue #49` (MVP Freeze Gate)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49) · [`Issue #52` (Mobile Checkout & Hardware QA)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) |
| **PR(s) / Commits** | [`PR #60`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/b03f7ca) · [`PR #61`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/326df97) · [`PR #62`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/e2141e6) · [`PR #63`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1fbe59b) · [`PR #64`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/11baf28) · [`PR #65`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/d68d5b9) · [`PR #66` (`fbc79ab`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab) · [CI Run #82 (`44989840995`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) |
| **Screenshot / Demo** | [`w12-01` Storefront Cart](evidence/screenshots/w12-01-brewmellow-template-cart-persistence.png) · [`w12-02` Account Typo Hint](evidence/screenshots/w12-02-storefront-signin-typo-hint.png) · [`w12-03` Pahadi Honey Isolation](evidence/screenshots/w12-03-pahadi-honey-template-bag-isolation.png) · [`w12-04` 390px Validation](evidence/screenshots/w12-04-mobile-390-checkout-validation.png) · [`w12-05` Live Khalti Unavailable + Promo](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png) |
| **Test / Check Note** | [`qa-checklist.md`](qa-checklist.md) · [`bug-report.md`](bug-report.md) · [`peer-test-notes.md`](peer-test-notes.md) · [`w12-verification-checks.json`](evidence/w12-verification-checks.json) · [`w12-backend-tests.txt`](evidence/w12-backend-tests.txt) · [`w12-frontend-checks.txt`](evidence/w12-frontend-checks.txt) |
| **Document Update** | Baseline freeze context retained in [`docs/week-11/mvp-freeze-record.md`](../week-11/mvp-freeze-record.md) and [`docs/week-09/final-demo-roadmap.md`](../week-09/final-demo-roadmap.md) |
| **Current Codebase Area Map / Ownership Audit** | [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) |

---

## 4. Individual Contribution Entries — One Row Per Student

| Student | What They Did in Week 12 | Evidence Link |
|---|---|---|
| **Aditya Kumar Gupta**<br>([`@notyouradhee`](https://github.com/notyouradhee)) | Fixed out-of-stock/archived checkout (`PR #60`), archive countdown timer (`#61`), API mutation cache invalidation (`#62`), unconditional `PRODUCT_CREATE` logging (`#63`), Khalti promo `used_count` release (`#64`), and unpaid Khalti vs COD labeling (`#65`); ran full automated suite (`165` backend `155` SQLite/`10` Postgres CI Run `#82`, `102/102` Vitest, `0` TS/lint errors) and logged live `brewmellow` Khalti gap triage in `Issue #67` (`w12-verification-checks.json`). **Pending before Wed Nov 25 EOD:** provision live `brewmellow` Khalti sandbox credentials for `#51` retest. | [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`bug-report.md`](bug-report.md) · [`PR #64`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/11baf28) · [`w12-verification-checks.json`](evidence/w12-verification-checks.json) |
| **Kushan Sunuwar**<br>([`@Kushan2191`](https://github.com/Kushan2191)) | Area 2 QA Steward: inherited Week 11 target [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) (Khalti cancellation & COD clean-clone check); structured Week 12 [`qa-checklist.md`](qa-checklist.md) comparing live Nov 22 findings against `8098426`. **Pending before Wed Nov 25 EOD:** execute uncoached non-author live checkout + `User canceled` promo-release verification on `https://shopcraft.me` once live `brewmellow` merchant Khalti credentials are configured, and log clean-clone cross-OS reproduction note in `#51` / `#67`. | [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`qa-checklist.md`](qa-checklist.md) · [`peer-test-notes.md`](peer-test-notes.md) |
| **Aanchal Chand Thakuri**<br>([`@jaasly07`](https://github.com/jaasly07)) | Area 3 Storefront & Mobile Steward: verified post-`PR #66` storefront template regression boundary (`w12-01`..`w12-04`: `Bag (1)` persistence, `AccountSheet` typo hint without crash, `/s/pahadi-honey` `0`-item isolation, `390x844` pre-POST `98412345` validation rejection) and recorded peer boundaries in [`peer-test-notes.md`](peer-test-notes.md); physical device mobile check remains open in [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52). | [`Issue #52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) · [`peer-test-notes.md`](peer-test-notes.md) · [`w12-04`](evidence/screenshots/w12-04-mobile-390-checkout-validation.png) |
| **Rohit Chhantyal**<br>([`@Rohit-coder201`](https://github.com/Rohit-coder201)) | Area 4 DevOps, CI & Merchant Console Steward: integrated/merged [`PR #66`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/fbc79ab) cleanly onto `main` passing GitHub Actions [Run #82](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) (`Backend Postgres FORCE RLS` + `Frontend Vitest 102/102`); co-verified `PR #65` unpaid Khalti vs COD merchant status badge/packing slip changes (`merchant-status.test.ts` `25/25` tests) ahead of clean-install & merchant UI peer confirmation. | [CI Run #82 (`44989840995`)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) · [`PR #65`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/d68d5b9) · [`w12-frontend-checks.txt`](evidence/w12-frontend-checks.txt) |

---

## 5. Blockers or Risks

| Blocker / Risk | Owner | Next Action |
|---|---|---|
| **1. Live `brewmellow` Khalti Unavailable (`Not configured by merchant`)** | `@notyouradhee` (config) / `@Kushan2191` (retest) | Configure Khalti Sandbox credentials in live `brewmellow` settings, repeat uncoached live checkout + `User canceled` promo test, and log proof in `#51` / `#67` before Wed Nov 25 EOD. |
| **2. Pending Non-Author Human Walkthroughs of Nov 22 Bug Fixes (`#60`–`#65`) & Cross-OS Clean Clone** | `@Kushan2191` / `@jaasly07` | Complete uncoached peer checks of `PR #64`/`#65` behavior and second-OS clean setup ahead of Week 13 external handoff trial. |
| **3. Physical iOS / Android Hardware Keyboard QA (`#52`)** | `@jaasly07` | Scheduled for Week 13 hardware test pass; `390x844` browser checks do not claim physical iOS Safari behavior. |

---

## 6. Decision Record

| Decision | Why We Chose It | Owner | Evidence / Issue Link |
|---|---|---|---|
| **Elevate Live `brewmellow` Khalti Configuration from `P2` to `P1 (At Risk)`** | Week 12 live reproduction (`Nov 22` on `fbc79ab`) proved `Khalti Unavailable — Not configured by merchant` persisted from Week 11 (`Nov 18`), blocking live E2E verification of gateway cancellation (`#51`) and promo release (`#64`), even though `COD` fallback keeps checkout functional. | `@notyouradhee` & `@Kushan2191` | [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) · [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [`w12-05`](evidence/screenshots/w12-05-live-brewmellow-khalti-unavailable-promo.png) |
| **Keep Week 11 Scope Frozen; Classify `PR #66` Under Existing Storefront Surface Regression** | Per Week 12 course rules, no new post-freeze features are claimed; theme styling (`PR #66`) was regression-checked across `/s/brewmellow`, `/s/pahadi-honey`, `AccountSheet`, and `390x844` checkout to confirm zero regressions in promised behavior. | `@Rohit-coder201` & `@jaasly07` | [`qa-checklist.md`](qa-checklist.md) · [`w12-01`](evidence/screenshots/w12-01-brewmellow-template-cart-persistence.png) |

---

## 7. Next Week's Bridge Task (Homework -> Week 13 EOD Wed, Nov 25)

- Provision live Khalti Sandbox merchant key on production `brewmellow` and have non-author `@Kushan2191` run and comment on [`#51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) / [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) with live payment cancellation + promo release proof before Wed Nov 25 EOD.
- Confirm [`README.md`](../../README.md) clean-clone setup instructions and [`Codebase Area Map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) links require zero steward coaching ahead of Week 13's independent handoff trial.
