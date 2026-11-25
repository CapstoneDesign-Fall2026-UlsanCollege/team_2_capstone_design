# Issue Priority & Reassessment Guide — Week 12 (ShopCraft)

**Team:** Team 2 — ShopCraft  
**Reference Standard:** [Course Issue Priority Guide](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/course-materials/blob/main/student-starter-kit/docs/issue-priority-guide.md)  
**Baseline:** [`docs/week-11/issue-priority-guide.md`](../week-11/issue-priority-guide.md) · **Effective:** November 19–25, 2026

> **Rule Kept Strict:** **Defect Severity** (`Blocker / Major / Minor / Polish`) describes intrinsic impact; **Work Priority (`P0–P3`)** orders execution against the [Final Demo Roadmap](../week-09/final-demo-roadmap.md) and current verification evidence.

---

## 1. Week 12 P-Level Reassessment Summary (`Issue #51` / `Issue #67`)

| Checkpoint / Date | Observed Evidence | Severity | Work Priority | Reason for Priority |
|---|---|---|---|---|
| **Week 11 Freeze (`Nov 18`, `8098426`)** | Live `brewmellow` showed `Khalti Unavailable — Not configured by merchant`, while `COD` worked and mocked/pre-merge Khalti checks passed. | **Major** | **P2 (Important)** | Treated initially as post-merge QA repeat confirmation (`#51`) pending verification on `shopcraft.me`. |
| **Week 12 Repro (`Nov 22`, `fbc79ab`)** | Re-checked `https://shopcraft.me/s/brewmellow/checkout` (`390x844`): `Khalti Unavailable` **reproduced** (`w12-05`). Blocked live end-to-end Khalti + `#64` promo cancel verification. | **Major** | **Elevated to P1 (At Risk)** in [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) | Confirmed production DB lacked active Khalti sandbox config, putting the dual-rail Khalti+COD final demo promise at risk despite active COD fallback. |
| **Week 12 Fix & Live Retest (`Nov 23–25`, `4464ed7` -> `f2b4096`)** | Saved Khalti `TEST (Sandbox)` credentials (`w12-06`) and verified `#BR-2026-0005` **`PAID`** (`w12-08`). Live `User canceled` check on `#BR-2026-0007` caught an undocumented Khalti `HTTP 400` payload bug (`503`, `w12-10`), fixed in `f2b4096` and retested clean (`HTTP 400`, `Payment Failed` + `Retry Payment`, `w12-11`). | **Major** *(resolved)* | **Code & Live Cancel Resolved; `#51`/`#67` Open for Human Peer Repeats** | Both live paid (`#BR-2026-0005`) and live canceled (`#BR-2026-0007`) flows now pass end-to-end; remaining gap is `@Kushan2191` & non-Area-4 teammate confirmation. |

---

## 2. Active Week 12 Issue & Hardening Register

| Issue / Commit | Scope & Area | Defect Severity | Work Priority | Current Status & Next Owner |
|---|---|---|---|---|
| **[Issue #67](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) & [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51)** | Live `brewmellow` Khalti Sandbox activation, `#BR-2026-0005` payment verification, `f2b4096` cancel lookup fix (`w12-11`), & non-author confirmation (`Area 1` / `Area 2`) | **Major** *(resolved Nov 23–25)* | **P1 -> Confirmed** *(Week 13 handoff queued)* | **VERIFIED & LINKED** — `@notyouradhee`, [`@Kushan2191`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67#issuecomment-7154959427), [`@jaasly07`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67#issuecomment-7154989940), & [`@Rohit-coder201`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67#issuecomment-7155006562) logged Week 12 evidence on `#67`. |
| **[Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)** | `[Week 11 Gate]` MVP Verification Checklist & Scope Freeze (`All 4 Areas`) | N/A | **P1 (At Risk)** | **OPEN** — Linked gate waiting on `#51` / `#67` non-author confirmation & team sign-off. |
| **[Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52)** | Mobile Checkout (`360px`/`390px`/`412px`), Surface Isolation & Physical iOS Hardware Check (`Area 3`) | **Minor** | **P2 (Important)** | **OPEN** — Live `390x844` validation verified (`w12-04`); physical hardware keyboard check scheduled for Week 13 (`@jaasly07`). |
| **`PR #60`–`#65` (`b03f7ca`..`d68d5b9`)** | Out-of-stock rejection, archive timer, cache invalidation, `PRODUCT_CREATE` log, promo `used_count` release, unpaid Khalti vs COD UI (`Area 1`/`Area 4`) | **Major / Minor** *(resolved)* | **P1 / P2** | **MERGED & VERIFIED** in CI [Run #82](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/44989840995) & adversarial suite `f94c99a`. |
| **`c732ebb`, `f94c99a`, `420dfca`, `067a478`** | Checkout transaction bounds, 13-bug adversarial tests (`test_edge_cases.py`), strict `OWNER`/`STAFF` RBAC (`test_rbac.py`, `MerchantStoreGuard.tsx`) (`Area 1`/`Area 4`) | **Major** *(proactive hardening)* | **P2 (Important)** | **MERGED & VERIFIED** — `199` backend tests + Next.js build/Vitest green in CI [Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139). |
| **[Issue #31](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31)** | External Khalti Sandbox uptime risk (`Area 1`/`Area 2`) | **Major** *(if gateway unreachable)* | **P1 (Mitigated)** | **OPEN (Mitigated)** — Active `COD` fallback requires zero external network calls. |
| **[Issue #36](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/36)** | PWA Install Prompt UI (`Area 3`) | **Polish** | **P3 (Defer)** | **DEFERRED** — Kept out of freeze work until Sprint 4 only if harmless. |
