# PR with AI Use Note — Khalti Sandbox v2 & Server Verification Slice

**Author / Owner:** Aditya Kumar Gupta ([`@notyouradhee`](https://github.com/notyouradhee))  
**Stewardship Area:** Area 1: Core Multi-Tenant Backend, RLS & Payments  
**Backup Steward:** Rohit Chhantyal ([`@Rohit-coder201`](https://github.com/Rohit-coder201))  
**Date:** Monday, November 9, 2026 (Week 10)  
**Related Pull Request / Commit:** [Commit `1374b23`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23) · [Commit `cdb1c0e`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/cdb1c0e)  
**Related Issue:** Issue #48 (Khalti Sandbox v2 Gateway & Cash on Delivery Fallback)

---

## 1. What Changed?

- Implemented server-side integration for Khalti Sandbox ePayment v2 in [`backend/orders/api.py`](../../../backend/orders/api.py).
- Created endpoints `initiate_khalti_payment()` and `verify_khalti_payment()`.
- Implemented signature validation against Khalti's `epayment/lookup/` using server-side secret keys (`KHALTI_SECRET_KEY`) stored in `.env`.
- Added an instant **Cash on Delivery (COD)** checkout fallback that requires zero external network calls.
- Enforced PostgreSQL Row-Level Security (RLS) on 11 tables via `backend/core/tenant_context.py` to guarantee tenant isolation during order creation.

*(Note on Scope Boundary: Following PR #45, recurring shopper subscriptions were formally removed from the MVP. All purchases on ShopCraft storefronts are direct one-time retail purchases).*

---

## 2. Why Did We Change It?

- To replace mock payment toggles with a functional Nepal payment gateway operating in sandbox mode.
- To prevent client-side payment tampering: the browser never updates order status to `PAID` directly; status is updated strictly after the server verifies `pidx` and amount with Khalti's lookup API.
- To provide guaranteed checkout continuity via Cash on Delivery when the sandbox gateway experiences latency or downtime.

---

## 3. How Did We Check It?

> We checked this by initiating a sandbox transaction on the live Vercel deployment with test mobile `9800000000` and OTP `987654`.  
> **Expected result:** Payment redirects to Khalti, authorizes, returns with `pidx`, server confirms lookup, and order transitions to `PAID` with invoice token `ORD-2026-SC-001`.  
> **Actual result:** Transaction succeeded; backend logged HTTP 200 from `epayment/lookup/`; database reflected status `PAID`.  
> **Non-Author Peer Check:** Kushan Sunuwar independently ran the checkout flow from an external machine without author assistance ([Evidence Receipt](../../week-10/evidence/kushan-independent-qa-handoff.md)).

---

## 4. AI Use Note

Choose one:
- [ ] No AI was used for this change.
- [ ] AI helped with planning or explanation only.
- [x] AI helped generate or edit code/text.

### Details:
- **What AI helped with:** GitHub Copilot generated initial request payload schemas for the Khalti v2 API (`purchase_order_id`, `purchase_order_name`, `amount` in paisa).
- **What the team reviewed:** Audited the parsing logic to verify that currency conversion ($1\text{ NPR} = 100\text{ paisa}$) is handled strictly as an integer, preventing floating-point rounding errors.
- **What the team changed after review:** 
  1. Replaced client-side status confirmation with server-authoritative lookup using `requests.post()` wrapped in an 8-second timeout.
  2. Added fallback exception handling so gateway timeouts cleanly offer Cash on Delivery without wiping user cart items.
- **Who can explain this change:** Aditya Kumar Gupta (Author) and Rohit Chhantyal (Backup Steward).

---

## 5. Outside-Material Attribution

- **Source / creator:** Khalti Payment Gateway Official Documentation (ePayment v2)
- **Link:** [https://docs.khalti.com/khalti-epayment/](https://docs.khalti.com/khalti-epayment/)
- **License or permission:** Public Developer Sandbox API
- **What we changed or how we used it:** Adapted standard JSON request format for Django Ninja REST API and bound order reference IDs to multi-tenant store slugs.

---

## 6. Evidence Links

- **Issue:** Issue #48 (Payment Boundary & Khalti Gateway Integration)
- **Commits:** [`1374b23`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/1374b23), [`cdb1c0e`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/cdb1c0e)
- **Automated Tests:** 113 backend tests passing (`python manage.py test accounts catalog orders stores`)
- **Non-Author QA Handoff:** [`docs/week-10/evidence/aditya-backend-rls-handoff.md`](../evidence/aditya-backend-rls-handoff.md)
