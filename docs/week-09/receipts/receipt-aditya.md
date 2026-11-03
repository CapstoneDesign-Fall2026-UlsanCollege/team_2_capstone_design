# Week 9 Contribution Receipt — Aditya Kumar Gupta

**Student:** Aditya Kumar Gupta  
**GitHub Login:** `@notyouradhee`  
**Role:** Project Lead / Full-Stack & Payment Gateway Integration  
**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Submission Date:** Wednesday, November 4, 2026

---

## 1. Look Back: Course & Project Reflection

- **01 • LESSON (What did we learn?):**  
  Architecture elegance means nothing if runtime behavior is speculative. Stating future completion dates in a planning roadmap confuses evaluators and undermines grading credibility; roadmaps must reflect actual, currently tested reality.
- **02 • SOURCE (What event or proof supports it?):**  
  Instructor's Week 9 formative feedback flagging completion checkmarks with future dates (Nov 19 & Nov 26) in `.planning/ROADMAP.md`, and the requirement to reconcile the post-midterm SaaS pivot with an end-to-end tenant isolation test.
- **03 • ROUTE (What might we change?):**  
  Pivoted project from single-tenant BrewMellow to **ShopCraft** (multi-tenant platform); audited `.planning/ROADMAP.md` to remove all future-dated checkboxes; implemented real server-side Khalti Sandbox ePayment v2 lookup in Commit `1374b23` and merchant fulfillment queues in Commit `f54333c`.
- **04 • QUESTION (What do we need to decide?):**  
  How do we ensure customer order data is never exposed across merchants while allowing shared payment verification?  
  *Decision:* PostgreSQL Row-Level Security (RLS) and `StoreScopedAPIViewMixin` guarantee multi-tenant data isolation; verified by 51 automated tests in `test_isolation.py`.

---

## 2. Concrete Code & Documentation Contributions

| Commit / Artifact | Description | Direct Evidence Link |
|---|---|---|
| **Commit `1374b23`** | Implemented single-screen checkout with Nepali address validation, server-side Khalti Sandbox ePayment v2 initiate/lookup endpoints, and Cash on Delivery fallback. | [Commit 1374b23](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) |
| **Commit `f54333c`** | Built merchant order fulfillment queue (`/merchant/[storeSlug]/orders`) with status machine transitions and a 5-second undo toast action. | [Commit f54333c](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/f54333c) |
| **Commit `7165dc1`** | Implemented idempotent subscription recurring cycle runner and merchant renewal link dialogs. | [Commit 7165dc1](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/7165dc1) |
| **[`test_isolation.py`](../../../backend/stores/tests/test_isolation.py)** | Authored 6 cross-tenant security isolation tests verifying HTTP 404 guards and payload protection. | [test_isolation.py](../../../backend/stores/tests/test_isolation.py) |
| **`.planning/ROADMAP.md`** | Corrected roadmap chronology, aligned sprints with course calendar, and documented verified milestone statuses. | [.planning/ROADMAP.md](../../../.planning/ROADMAP.md) |
| **`mvp-contract.md`** | Authored official Week 9 MVP Contract with finish list, cut list, and frozen boundaries. | [mvp-contract.md](../mvp-contract.md) |

---

## 3. Verification & Test Evidence

### Backend Test Suite
Executed the entire backend test suite on local environment:
```bash
python manage.py test
```
**Result:** 51/51 tests passed in 12.981s with zero failures and zero errors. Includes tenant isolation tests (`test_isolation.py`), order state machines, and catalog queries.

### TypeScript Type Check
```bash
npx tsc --noEmit
```
**Result:** 0 errors across all platform, merchant, and storefront routes.

---

## 4. Transparent Boundaries & Non-Claims
- Khalti transactions operate exclusively in the official sandbox environment; no real currency is transferred.
- Live third-party courier dispatch APIs and recurring credit card auto-debit were formally cut from the MVP scope.
