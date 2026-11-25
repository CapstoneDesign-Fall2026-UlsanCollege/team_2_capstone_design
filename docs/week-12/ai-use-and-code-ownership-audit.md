# AI Use and Code Ownership Audit — Week 12 Update (ShopCraft)

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — **ShopCraft**  
**Sprint:** Sprint 3 — QA and Handoff (Week 12: Nov 19–25, 2026)  
**Baseline Map Reference:** [`docs/week-10/ai-use-and-code-ownership-audit.md`](../week-10/ai-use-and-code-ownership-audit.md)

> Week 12 work kept feature scope frozen per [`mvp-freeze-record.md`](../week-11/mvp-freeze-record.md) and focused on carried bugfixes, adversarial edge-case test coverage, strict merchant `OWNER`/`STAFF` RBAC enforcement, and live Khalti Sandbox QA.

---

## 1. Responsible AI Use Disclosures (Week 12 Fix Commits & Docs)

| Commit / PR / File | AI Assisted? | What AI Helped With | What Team Personally Tested, Reviewed, & Owned | Verification Proof |
|---|---|---|---|---|
| **Commits `b03f7ca`–`d68d5b9` (`#60`–`#65`)**<br>`stores/api.py`, `orders/models.py`, `OrderDetailSheet.tsx`, `PackingSlipModal.tsx`, `api.ts` | **Yes** (AI coding assistant) | Drafted boilerplate guard clauses and initial unit-test scaffolding for out-of-stock/archived checkout rejection (`#60`), archive timer (`#61`), cache invalidation (`#62`), `PRODUCT_CREATE` audit logs (`#63`), promo `used_count` release (`#64`), and payment labels (`#65`). | **Team Owned & Tested:** Audited every state-transition edge case (`0007_order_discount_order_discount_redeemed.py`), reviewed `PackingSlipModal.tsx` discount math & `Verifying payment` vs `Cash on Delivery` copy, and personally verified `#BR-2026-0004` / `#BR-2026-0005` on live `/merchant/brewmellow/orders` ([`w12-09`](evidence/screenshots/w12-09-merchant-orders-queue-khalti-verified.png)). | `test_bugfixes.py`, `merchant-status.test.ts` (`34` tests), CI [Run #82](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) |
| **Commit `4464ed7`**<br>`accounts/api.py`, `seed_brewmellow.py`, `OtpInput.tsx` | **Yes** (AI coding assistant) | Helped locate all `dev_otp_hint` references and update `EmailOTPAuthTests` assertions to read `mail.outbox`. | **Team Owned & Live Verified:** Decided production auth hardening scope, configured owner email (`aayushman1234511@gmail.com`), and **personally ran real Email OTP delivery & Khalti Sandbox wallet payment live on `https://shopcraft.me`** (`#BR-2026-0005` `PAID`, `w12-06`–`w12-08`). | `EmailOTPAuthTests`, `test_isolation.py`, CI [Run #84](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45224773179) |
| **Commits `c732ebb`, `f94c99a`, `420dfca`, `067a478`, `f2b4096`**<br>`stores/api.py`, `khalti.py`, `test_edge_cases.py`, `test_rbac.py`, `test_khalti.py`, `MerchantStoreGuard.tsx` | **Yes** (AI coding assistant) | Generated repetitive adversarial test matrices (`f94c99a`) and assisted with lookup parser diff formatting for `khalti.py` (`f2b4096`). | **Team Audited & Live Retested:** Verified every `OWNER`/`STAFF` `404`/`403` permission rule, traced live `HTTP 400 User canceled` Khalti Sandbox behavior, enforced blocking `COMPLETED` on non-`200` HTTP statuses, and retested live (`w12-10` -> `w12-11`). | `200` backend tests (`test_rbac.py`, `test_edge_cases.py`, `test_khalti.py`), CI [Run #89](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45557766494) |
| **Week 12 QA Package (`docs/week-12/*`)**<br>Reports, checklists, logs & redacted screenshots | **Yes** (AI coding assistant) | Formatted markdown tables and generated the deterministic SHA-256 verification JSON log (`w12-verification-checks.json`). | **Team Directed & Reviewed:** Personally executed and reviewed all live tests (`https://shopcraft.me`), edited all doc claims against real outputs, coordinated teammate confirmations on `#67`/`#52`, and kept `#52` hardware keyboard QA open for Week 13. | [`w12-verification-checks.json`](evidence/w12-verification-checks.json), [`evidence-index.md`](evidence-index.md) |

---

## 2. Current Codebase Area & Support Path Status

The 4 codebase areas, primary stewards, and designated backups defined in [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) remain **unchanged in ownership**, with strengthened Week 12 automated verification boundaries:

1. **Area 1 — Core Multi-Tenant Backend, RLS & Payments** (`@notyouradhee` · Backup: `@Rohit-coder201`):
   - *Week 12 Boundary Update:* `test_rbac.py`, `test_edge_cases.py`, and `test_khalti.py` (`HTTP 400` cancel handling `f2b4096`) enforce strict `OWNER` vs `STAFF` and Khalti v2 verification rules alongside 11-table PostgreSQL `FORCE RLS` (`200` total backend tests discovered). Live `brewmellow` Khalti Sandbox credentials saved (`w12-06`).
2. **Area 2 — QA, Non-Author Verification & Runbooks** (`@Kushan2191` · Backup: `@jaasly07`):
   - *Week 12 Boundary Update:* Machine-readable SHA-256 verification receipt [`w12-verification-checks.json`](evidence/w12-verification-checks.json) tracks local SQLite (`190` pass / `10` Postgres skipped) vs CI PostgreSQL 16 ([Run #92](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45562981232)), alongside `@Kushan2191`'s `#67` confirmation.
3. **Area 3 — Storefront UI/UX, Mobile & Accessibility** (`@jaasly07` · Backup: `@Kushan2191`):
   - *Week 12 Boundary Update:* Verified storefront template stability (`PR #66`) across `/s/brewmellow` and `/s/pahadi-honey` (`w12-01`..`w12-04`) plus `SURFACE_ISOLATION_OK`, confirmed by `@jaasly07` in `#52`. Physical mobile hardware keyboard audit remains queued for Week 13 (`#52`).
4. **Area 4 — DevOps, Backend Health & State Machine** (`@Rohit-coder201` · Backup: `@notyouradhee`):
   - *Week 12 Boundary Update:* `MerchantStoreGuard.tsx` and `merchant-status.test.ts` (`34` tests) enforce role-aware workspace guards and accurate `Verifying payment` vs `COD` badges (`#65`, `067a478`), confirmed in [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67#issuecomment-7154989940) and CI [Run #92](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45562981232).
