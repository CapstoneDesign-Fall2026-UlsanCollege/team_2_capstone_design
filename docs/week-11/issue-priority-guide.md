# Issue Priority Guide — ShopCraft (Sprint 2 / Week 11)

**Team:** Team 2 — ShopCraft  
**Reference Standard:** Course Issue Priority Guide (`student-starter-kit/docs/issue-priority-guide.md`)  
**Effective Date:** November 12, 2026 (Week 11 MVP Freeze Gate)  

---

## 1. Core Priority Definitions (P0 to P3)

In accordance with course guidelines, our team assigns one **P-level** to each active issue to determine execution order against our Final Demo Roadmap. Each priority level is backed by an evidence-based rationale.

| Priority Level | Meaning | When to Use It | Action Required |
|---|---|---|---|
| **P0 — Blocked** | Showstopper / Core Path Blocker | The promised final demo user journey (`Storefront -> Checkout -> Khalti Sandbox / COD -> Merchant Orders -> Tenant Isolation`) cannot complete. | Address immediately with the smallest recovery step, assign a primary steward and backup, and verify with a non-author test. |
| **P1 — At Risk** | High Risk to Milestone | A required behavior or checkpoint is at risk, but a viable fallback or workaround exists. | Schedule immediately after P0 work, prior to lower-impact improvements. |
| **P2 — Important** | Stability, Usability & Verification | The promised core path is functional; the task meaningfully improves test coverage, deployment reliability, mobile usability, or handoff reproducibility. | Schedule after P0/P1 items during Sprint 3 (Weeks 12–14). |
| **P3 — Defer** | Backlog / Polish / Stretch | Cosmetic polish, micro-animations, or post-freeze ideas with zero risk to the final demo promise. | Keep deferred in backlog until all higher-priority testing and handoff tasks are complete. |

---

## 2. Priority is Strictly Separate from Bug Severity

The team maintains an explicit separation between **Work Priority (P0–P3)** and **Defect Severity**:

* **Severity** describes the intrinsic technical impact of an observed defect:
  * **Blocker:** Total crash, data corruption, or unhandled 500 error on an essential endpoint.
  * **Major:** Significant functional failure where a user cannot complete a primary action, but a documented workaround or fallback exists.
  * **Minor:** Non-blocking UI glitch, unexpected warning message, or non-critical latency.
  * **Polish:** Cosmetic layout inconsistency, styling tweak, or typography refinement.
* **Work Priority (P-Level)** answers: *"What must the team address first to protect the promised final demo journey?"*
  * *Example:* A "Major" third-party courier tracking API failure is classified as **P3 (Defer / Cut)** because logistics dispatch is managed internally via merchant status transitions per our MVP Contract.
  * *Example:* A "Minor" address dropdown keyboard dismiss quirk on 360px mobile viewports is classified as **P2 (Important)** because mobile checkout is a primary demonstration requirement.

---

## 3. Active Issue Priority & Severity Register

The table below classifies our active Week 11 issues based on current runtime and automated test evidence:

| Issue / PR # | Title & Scope | Affected Area | Defect Severity | Work Priority | Evidence-Based Rationale | Status / Plan | Owner |
|---|---|---|---|---|---|---|---|
| **[Issue #49](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/49)** | `[Week 11 Gate]` MVP Verification & Feature-Scope Freeze | All 4 Areas | N/A | **P1 (At Risk)** | Gate controlling final-demo promise stability, freeze lock (`8098426`), and cross-area peer reproduction before Sprint 3. | **OPEN** · Freeze Record, Checklist, `Tested-By Note`, CI Run `#74`, & 7 screenshots complete; pending `#51` live gateway repeat. | All 4 Stewards (`@notyouradhee` lead) |
| **[Issue #50](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/50)** / **[PR #54](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/54)** | `[Area 1]` Harden Khalti Sandbox v2 Verification, Retry Flow & RLS | Area 1: Backend, RLS & Payments | Major (prior to fix) | **P1 (At Risk)** | Core payment verification path (`6559ea2` -> `8098426`) + PostgreSQL `0013` single-policy RLS enforcement. | **CLOSED (Merged)** · `154` backend (`144` SQLite, `10` Postgres CI) + CI `#74` pass cleanly. | Aditya Kumar Gupta (`@notyouradhee`) |
| **[Issue #31](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/31)** | `[Risk]` Verify Khalti Sandbox API Integration | Area 1 / Area 2 | Major (if portal down) | **P1 (At Risk)** | External Khalti sandbox uptime cannot be guaranteed by mocked unit tests (`test_khalti.py`). | **OPEN (Mitigated)** · Zero-network COD fallback (`Issue #51`) preserves order completion. | Aditya Kumar Gupta (`@notyouradhee`) |
| **[Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51)** | `[Area 2]` Non-Author QA: Cancellation Recovery, COD & Clean Clone | Area 2: QA & Runbooks | Minor | **P2 (Important)** | Guarantees cart items/shipping inputs survive aborted Khalti sessions (`status=User%20canceled`) and verifies clean-clone setup. | **OPEN** · Pre-merge check & COD pass; Nov 18 live audit observed `Khalti Unavailable — Not configured by merchant` on prod DB (`brewmellow`); post-merge repeat pending. | Kushan Sunuwar (`@Kushan2191`) |
| **[Issue #52](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/52)** | `[Area 3]` Mobile Checkout (360px/390px/412px), Failure-Path & Surface Guard | Area 3: Storefront UI/UX & A11y | Minor | **P2 (Important)** | Rejects invalid 8-digit phones (`98412345`) before POST; enforces WCAG AA touch targets ($\ge 52\text{px}$) and CSS surface isolation. | **OPEN** · Live `390x844` + Chrome emulation & Vitest (`73/73`) passed; physical iOS hardware keyboard check scheduled for Week 13. | Aanchal Chand Thakuri (`@jaasly07`) |
| **[Issue #53](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/53)** | `[Area 4]` Order State Machine, 5s Undo Toast & Local Health Probe | Area 4: DevOps & State Machine | Minor | **P2 (Important)** | Blocks illegal transitions (`DELIVERED → PENDING`, HTTP 400); keeps local `/api/health/` strictly separate from live `https://shopcraft.me`. | **CLOSED** · Verified by `@jaasly07`; `merchant-status.test.ts` (`19/19`) & CI `#74` pass cleanly. | Rohit Chhantyal (`@Rohit-coder201`) |
| **[Issue #55](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/55)** / **[PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)** | OTP Client Email Validation, Domain Typo Hint & Spam Note | Area 3 / Area 1 | Minor | **P2 (Important)** | Rejects invalid OTP emails pre-POST and hints common domain typos (`gmial.com`, etc.) across `/login` and `AccountSheet`. | **CLOSED (Merged)** · `email-validation.test.ts` + live `/login` verification pass cleanly (`8098426`). | Aditya Kumar Gupta (`@notyouradhee`) |
| **[Issue #56](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/56)** / **[PR #57](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/57)** | `[P1][Bug][Area 3]` StorefrontHeader *"Sign in to your account"* `MouseEvent.trim` Crash | Area 3: Storefront UI/UX | **Major** | **P1 (Recovery)** | Prevented storefront customers from opening `AccountSheet` due to forwarded click `MouseEvent` crashing `.trim()`. | **CLOSED (Merged)** · Fixed via `normalizePrefillEmail` + regression tests (`73/73`) & verified live (`w11-06` -> `w11-07`). | Aanchal Chand Thakuri (`@jaasly07`) & Aditya Kumar Gupta (`@notyouradhee`) |
| **[Issue #36](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/36)** | PWA Install Prompt UI (`next-pwa` prompt polish) | Area 3: Storefront | Polish | **P3 (Defer)** | Service worker shell (`sw.js`) already runs platform-level excluding `/api/*`; custom install prompt UI adds no demo-path reliability. | **DEFERRED (P3)** · Post-freeze backlog only. | Aanchal Chand Thakuri (`@jaasly07`) |
| **[#33](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/33)**, **[#34](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/34)**, **[PR #45](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/pull/45)** | Shopper Recurring Subscriptions & Holiday Delivery Shift | Out of Scope (PR #45) | N/A | **CUT / Closed** | Formally cut from MVP in `PR #45` (`Remove subscriptions`); closed with scope reconciliation comments on Nov 16, 2026. | **CLOSED (Cut)** · Direct one-time retail checkout only. | Entire Team |
