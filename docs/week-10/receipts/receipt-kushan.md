# Individual Evidence Receipt — Week 10

**Student:** Kushan Sunuwar ([`@Kushan2191`](https://github.com/Kushan2191))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 10 (Sprint 2: MVP and Freeze)  
**Date:** Monday, November 9, 2026 (Submitted for Wednesday, November 11, 2026 EOD KST Deadline)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Implemented payment gateway cancellation recovery in [`frontend/src/app/s/[storeSlug]/checkout/page.tsx`](../../../frontend/src/app/s/[storeSlug]/checkout/page.tsx) to ensure customer cart items, quantities, and entered addresses are preserved when returning from an aborted Khalti portal session.
- **Roadmap slice / behavior (if relevant):** Gateway Cancellation Recovery Slice.
- **Area I helped steward or hand off (if relevant):** Area 2: QA, Non-Author Verification & Runbooks (Backup: Aanchal Chand Thakuri).
- **Evidence link:** [Commit `89b1420`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/89b1420) · [Slice Note](../slices/slice-kushan-checkout-cancellation.md) · [Handoff Document](../evidence/kushan-independent-qa-handoff.md).
- **How I checked it:** Tested both cancellation recovery and COD fallback without coaching:
  - *Cancellation Recovery:* User cancels on Khalti portal (`status=User%20canceled`). **Expected:** Redirect back to `/checkout` with banner *"Payment was canceled. Your cart items have been saved"*; cart items, quantities, and addresses intact. **Actual: PASS.** Zero cart corruption; items preserved in session storage.
  - *COD Fallback:* User selects "Cash on Delivery" radio and places order. **Expected:** Instant order creation with zero external HTTP calls; status `CONFIRMED`; invoice token generated. **Actual: PASS.** Order created in 68ms with status `CONFIRMED`; inventory decremented.
- **What I learned or changed:** Handling gateway aborts gracefully is essential for e-commerce conversion rates; previously, canceling payment wiped the cart and caused user frustration.

---

## Receipt 2

- **What I did:** Executed independent non-author testing of Aditya's backend payment flow on the live Vercel production deployment and authored the Clean-Clone Setup Runbook in `README.md`.
- **Roadmap slice / behavior (if relevant):** Non-author verification of Khalti Sandbox v2 & Repository Runbook.
- **Area I helped steward or hand off (if relevant):** Area 2: QA, Non-Author Verification & Runbooks.
- **Evidence link:** [Commit `00ff1b2`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/00ff1b2) · [Handoff Document](../evidence/kushan-independent-qa-handoff.md#test-1-khalti-epayment-v2-sandbox-journey).
- **How I checked it:** Tested full checkout journey from product detail through Khalti OTP authorization to order confirmation without consulting the author; verified order status `PAID` in database.
- **What I learned or changed:** Independent peer testing reveals edge cases that original developers overlook because they subconsciously follow happy paths.

---

## Receipt 3, optional

- **What I did:** Audited and verified all 113 automated backend tests across active apps (`accounts catalog orders stores`) ensuring zero broken tests following the removal of subscriptions.
- **Roadmap slice / behavior (if relevant):** Automated test suite health verification.
- **Area I helped steward or hand off (if relevant):** Area 2: QA, Non-Author Verification & Runbooks.
- **Evidence link:** [Audit Test Matrix](../ai-use-and-code-ownership-audit.md#2-codebase-area-map).
- **How I checked it:** Executed `python manage.py test accounts catalog orders stores` in 13.236s (113 passing, 0 failures, 0 errors).
- **What I learned or changed:** Maintaining a clean test suite without dead code from cut features keeps continuous integration fast and trustworthy.
