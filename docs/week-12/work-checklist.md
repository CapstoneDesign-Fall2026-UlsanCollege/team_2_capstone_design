# Week 12 Work Checklist — Follow Through on a QA Finding

**Class:** Thursday, November 19, 2026  
**Homework Due:** Wednesday, November 25, 2026, end of day  
**Team:** Team 2 — **ShopCraft**  
**Revision Audited:** [`067a478`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/067a478) · Live [`https://shopcraft.me`](https://shopcraft.me) · Tracker [`Issue #67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67)

> Start from last week's evidence. Carry one priority item to a current result and an owned next action.

---

## 1. Carry One Target Forward from Week 11

- [x] Open the current [Final Demo Roadmap](../week-09/final-demo-roadmap.md), the [Week 11 freeze decision](../week-11/mvp-freeze-record.md), and its verification evidence.
- [x] Open the issue, gap, or bounded QA target selected for Week 11 homework ([`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) / [`Issue #49`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)).
- [x] Choose Week 12's primary carried target from that record: live `https://shopcraft.me/s/brewmellow/checkout` displaying `Khalti Unavailable — Not configured by merchant` while `COD` remained active.
- [x] Trace prior homework & bounded bugfix evidence (`PR #60`–`#65`, `c732ebb`, `f94c99a`, `420dfca`, `067a478`) without breaking the Week 11 feature freeze.
- [x] Focus live verification directly on the carried checkout/gateway uncertainty and post-fix regression rather than repeating unrelated scope.

---

## 2. Define What Today's Check Must Settle

- [x] State exact uncertainty: whether live `/s/brewmellow/checkout` exposes Khalti Sandbox, completes `epayment/lookup/`, and preserves `User canceled` / promo recovery (`PR #64`), or stays blocked on merchant credentials.
- [x] Keep all verification inside the frozen demo promise (Shopper subscriptions remain cut per PR #45; **no real fiat currency moves**).
- [x] Use the shared [`qa-checklist.md`](qa-checklist.md) and [`bug-report.md`](bug-report.md).
- [x] Record starting state, viewport/device, exact steps, expected result, and proof (`w12-01`..`w12-09`) before/at execution.
- [x] Keep Week 11 baseline links (`w11-mvp-freeze-2026-11-18` / `8098426`) distinct so Nov 22 -> Nov 23 -> Nov 24–25 evidence compares cleanly.

---

## 3. Have a Non-Author Reproduce or Retest the Target

- [x] Record initial Nov 22 reproduction (`w12-05`: `Khalti Unavailable` reproduced live) and Nov 23 post-fix live verification (`w12-06`..`w12-09`: Khalti Sandbox key saved encrypted, Order `#BR-2026-0005` verified **`PAID`** via real Khalti Sandbox wallet + `epayment/lookup/`, real Email OTP login verified for `aayushman1234511@gmail.com`).
- [x] **Non-Author Teammate Confirmations Posted:** (1) [`@Kushan2191` (`#67` comment)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67#issuecomment-7154959427) confirmed live Khalti cancellation recovery (`58f1e51` / `f2b4096`). (2) [`@jaasly07` (`#67` comment)](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67#issuecomment-7154989940) confirmed non-Area-4 Merchant Console UI on `/merchant/brewmellow/orders` and [`#52` mobile check](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52#issuecomment-7154971949). *(Agent-run checks remain separated from human comments in `peer-test-notes.md`.)*
- [x] Record local vs. CI verification boundaries honestly (`w12-verification-checks.json`: backend `199` tests pass in CI [Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139); local Vitest diagnostic failure on `theme-contrast.test.ts` preserved alongside Ubuntu Node 22 CI Vitest pass).

---

## 4. Update the Diagnosis and Work Order from Evidence

- [x] Confirmed reproducibility of `Khalti Unavailable` on Nov 22 (`fbc79ab`) before writing any fix claims.
- [x] Updated [`bug-report.md`](bug-report.md) and [`issue-priority-guide.md`](issue-priority-guide.md): elevated from Week 11 `P2` review priority -> **`P1 (At Risk)`** on Nov 22 reproduction -> resolved live gateway configuration on Nov 23 (`#BR-2026-0005` `PAID`), retaining `P1` until `@Kushan2191`'s independent cancellation repeat closes [`Issue #51`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51).
- [x] Kept **Severity** (`Major`) strictly separate from **Work Priority** (`P0`–`P3`).
- [x] Named owners and backup support partners across Areas 1–4.

---

## 5. Choose and Verify the Next Disposition

- [x] Applied live Fix & Retest for BrewMellow merchant Khalti Sandbox configuration (`w12-06`..`w12-09`) and landed bounded bug/RBAC hardening (`#60`–`#65`, `c732ebb`, `f94c99a`, `420dfca`, `067a478`) with green GitHub Actions CI [Run #86](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/actions/runs/45427562139).
- [x] Recorded scoped all-clear on `/s/brewmellow`, `/s/pahadi-honey` cart isolation, `AccountSheet` typo hint, and `390x844` pre-POST validation (`w12-01`..`w12-04`).
- [x] Recorded Week 12 AI-use disclosures & PR review notes in [`ai-use-and-code-ownership-audit.md`](ai-use-and-code-ownership-audit.md).
- [x] Non-author teammate confirmations logged on [`#67`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/67) and [`#52`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52) (`@Kushan2191`, `@jaasly07`, `@Rohit-coder201`); physical iOS keyboard testing (`#52`) and second-OS clean-clone trial stay scheduled for Week 13.

---

## 6. Close the Evidence Loop

- [x] Updated [`weekly-report.md`](weekly-report.md), [`qa-checklist.md`](qa-checklist.md), [`bug-report.md`](bug-report.md), [`peer-test-notes.md`](peer-test-notes.md), [`issue-priority-guide.md`](issue-priority-guide.md), [`evidence-index.md`](evidence-index.md), and [`ai-use-and-code-ownership-audit.md`](ai-use-and-code-ownership-audit.md).
- [x] Linked Week 11 freeze baseline, current [Codebase Area Map](../week-10/ai-use-and-code-ownership-audit.md#2-codebase-area-map), [Final Demo Roadmap](../week-09/final-demo-roadmap.md), GitHub Issues (`#49`, `#51`, `#52`, `#67`), and individual contribution rows for all 4 students.
- [x] Ordered all open work (`#67` / `#51` `P1`/`P2` live peer repeat ahead of `#52` Week 13 hardware & polish) ahead of the Wednesday, November 25 EOD deadline.
