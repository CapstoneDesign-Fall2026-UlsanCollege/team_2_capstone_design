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

| Issue # | Title & Scope | Affected Area | Defect Severity | Work Priority | Evidence-Based Rationale | Status / Plan | Owner |
|---|---|---|---|---|---|---|---|
| **#48** | Khalti Sandbox v2 Gateway & Signature Verification | Area 1: Backend, RLS & Payments | Major (if down) | **P1 (At Risk)** | Core financial checkout path. Mitigated by instant Cash on Delivery (COD) fallback that requires zero external network calls. | **PASS (Verified)** · Server-authoritative lookup via `epayment/lookup/` with `pidx`. | Aditya Kumar Gupta (`@notyouradhee`) |
| **#49** | Gateway Cancellation Recovery & Clean-Clone Setup | Area 2: QA & Runbooks | Minor | **P2 (Important)** | Ensures cart items, quantities, and addresses are saved when shopper aborts on Khalti portal (`status=User%20canceled`). | **PASS (Verified)** · Session storage recovery verified by non-author Kushan. | Kushan Sunuwar (`@Kushan2191`) |
| **#50** | Mobile Checkout Ergonomics & 7 Provinces Validation | Area 3: Storefront UI/UX & A11y | Minor | **P2 (Important)** | Prevents invalid 8-digit phone numbers from reaching backend; enforces WCAG AA touch targets ($\ge 52\text{px}$) on 360px Android viewports. | **PASS (Verified)** · Chrome 130 DevTools emulation passed across 360px, 390px, 412px. | Aanchal Chand Thakuri (`@jaasly07`) |
| **#51** | Order State Machine & Local Uptime Probe | Area 4: DevOps & State Machine | Minor | **P2 (Important)** | Rejects illegal backward order status jumps (`DELIVERED → PENDING` yields HTTP 400); provides 5-second undo toast for merchant operational recovery. | **PASS (Verified)** · Health probe verified locally (`/api/health/` returning 200 OK in 42ms). | Rohit Chhantyal (`@Rohit-coder201`) |
| **#52** | PostgreSQL Row-Level Security Cross-Tenant Isolation | Area 1: Backend, RLS & Payments | Blocker (if breached) | **P1 (At Risk)** | Guarantees Store Owner A cannot view or manipulate Store Owner B's catalog, customers, or orders (HTTP 404 guard). | **PASS (Verified)** · 6/6 dedicated RLS isolation tests pass (`test_isolation.py`). | Aditya Kumar Gupta (`@notyouradhee`) |
| **#53** | Shopper Recurring Subscriptions Lifecycle | Out of Scope (PR #45) | N/A | **P3 (Defer / Cut)** | Formally removed from MVP scope in PR #45. All purchases across ShopCraft operate strictly as direct one-time retail transactions. | **RETIRED / CUT** · Preserves 100% focus on single-purchase checkout stability. | Entire Team |
