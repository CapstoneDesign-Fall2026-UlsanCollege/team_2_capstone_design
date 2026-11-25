# AI Use and Code Ownership Audit — Week 12 Update (ShopCraft)

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — **ShopCraft**  
**Sprint:** Sprint 3 — QA and Handoff (Week 12: Nov 19–25, 2026)  
**Baseline Map Reference:** [`docs/week-10/ai-use-and-code-ownership-audit.md`](../week-10/ai-use-and-code-ownership-audit.md)

> Week 12 work kept feature scope frozen per [`mvp-freeze-record.md`](../week-11/mvp-freeze-record.md) and focused on carried bugfixes, adversarial edge-case test coverage, strict merchant `OWNER`/`STAFF` RBAC enforcement, and live Khalti Sandbox QA.

---

## 1. Responsible AI Use Disclosures (Week 12 Fix Commits & Docs)

| Commit / PR / File | AI Assisted? | What AI Helped With | What Team Reviewed, Changed, & Owned | Verification Proof |
|---|---|---|---|---|
| **Commits `b03f7ca`–`d68d5b9` (`#60`–`#65`)**<br>`stores/api.py`, `orders/models.py`, `OrderDetailSheet.tsx`, `PackingSlipModal.tsx`, `api.ts` | **Yes** (Antigravity / Claude) | Drafted initial guards for out-of-stock/archived checkout rejection (`#60`), `ProductListTable` archive countdown (`#61`), cache invalidation (`#62`), `PRODUCT_CREATE` logging (`#63`), promo `used_count` release (`#64`), and unpaid Khalti vs COD labeling (`#65`). | Verified state-transition edge cases (`0007_order_discount_order_discount_redeemed.py`), reviewed `PackingSlipModal.tsx` discount math & payment badge copy (`Verifying payment` vs `Cash on Delivery`), and confirmed live in `#BR-2026-0004` / `#BR-2026-0005` ([`w12-09`](evidence/screenshots/w12-09-merchant-orders-queue-khalti-verified.png)). | `test_bugfixes.py`, `merchant-status.test.ts` (`34` tests), CI [Run #82](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) |
| **Commit `4464ed7`**<br>`accounts/api.py`, `seed_brewmellow.py`, `OtpInput.tsx` | **Yes** (Antigravity) | Updated seeded BrewMellow owner email to `aayushman1234511@gmail.com` and removed `dev_otp_hint` display across backend/frontend OTP views. | Reviewed production Resend/SMTP delivery flow, updated `EmailOTPAuthTests` to extract OTP from `mail.outbox` rather than API JSON, and verified real Email OTP login live on `https://shopcraft.me`. | `EmailOTPAuthTests`, `test_isolation.py`, CI [Run #84](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45224773179) |
| **Commits `c732ebb`, `f94c99a`, `420dfca`, `067a478`, `f2b4096`**<br>`stores/api.py`, `khalti.py`, `test_edge_cases.py`, `test_rbac.py`, `test_khalti.py`, `MerchantStoreGuard.tsx` | **Yes** (Antigravity) | Proposed checkout/price bounds (`c732ebb`), adversarial suites (`f94c99a`), backend/UI `OWNER`/`STAFF` RBAC (`420dfca`, `067a478`), and HTTP `400` Khalti `User canceled` lookup handling (`f2b4096`) after live retest hit `503`. | Audited `OWNER`/`STAFF` `404`/`403` matrices, probed real `dev.khalti.com/api/v2/epayment/lookup/` behavior returning `HTTP 400` on `User canceled`, blocked `COMPLETED` on non-200 HTTP statuses, and retested live (`w12-10` -> `w12-11`). | `200` backend tests (`test_rbac.py`, `test_edge_cases.py`, `test_khalti.py`), CI [Run #89](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45557766494) |
| **Week 12 QA Package (`docs/week-12/*`)**<br>Reports, checklists, logs & redacted screenshots | **Yes** (Antigravity) | Compiled deterministic SHA-256 verification JSON (`w12-verification-checks.json`), ran browser captures, and structured templates. | Reviewed every claim against actual test outputs/live screenshots; kept pending non-author teammate checks (`@Kushan2191` in `#51`/`#67`, hardware QA in `#52`) explicitly open with zero fabricated results. | [`w12-verification-checks.json`](evidence/w12-verification-checks.json), [`evidence-index.md`](evidence-index.md) |

---

## 2. Current Codebase Area & Support Path Status

The 4 codebase areas, primary stewards, and designated backups defined in [`docs/week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map`](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map) remain **unchanged in ownership**, with strengthened Week 12 automated verification boundaries:

1. **Area 1 — Core Multi-Tenant Backend, RLS & Payments** (`@notyouradhee` · Backup: `@Rohit-coder201`):
   - *Week 12 Boundary Update:* `test_rbac.py` and `test_edge_cases.py` enforce `OWNER` vs `STAFF` API restrictions alongside 11-table PostgreSQL `FORCE RLS` (`199` total backend tests discovered). Live `brewmellow` Khalti Sandbox credentials saved (`w12-06`).
2. **Area 2 — QA, Non-Author Verification & Runbooks** (`@Kushan2191` · Backup: `@jaasly07`):
   - *Week 12 Boundary Update:* Machine-readable SHA-256 verification receipt [`w12-verification-checks.json`](evidence/w12-verification-checks.json) tracks local SQLite (`189` pass / `10` Postgres skipped) vs CI PostgreSQL 16 ([Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139)). Uncoached non-author `User canceled` repeat remains open in `#51` / `#67`.
3. **Area 3 — Storefront UI/UX, Mobile & Accessibility** (`@jaasly07` · Backup: `@Kushan2191`):
   - *Week 12 Boundary Update:* Verified storefront template stability (`PR #66`) across `/s/brewmellow` and `/s/pahadi-honey` (`w12-01`..`w12-04`) plus `SURFACE_ISOLATION_OK`. Physical mobile hardware keyboard audit remains queued for Week 13 (`#52`).
4. **Area 4 — DevOps, Backend Health & State Machine** (`@Rohit-coder201` · Backup: `@notyouradhee`):
   - *Week 12 Boundary Update:* `MerchantStoreGuard.tsx` and `merchant-status.test.ts` (`34` tests) enforce role-aware workspace guards and accurate `Verifying payment` vs `COD` badges (`#65`, `067a478`).
