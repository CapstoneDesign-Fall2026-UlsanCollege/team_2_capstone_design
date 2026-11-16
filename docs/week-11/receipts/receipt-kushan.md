# Individual Evidence Receipt — Week 11

**Student:** Kushan Sunuwar ([`@Kushan2191`](https://github.com/Kushan2191))  
**Team:** Team 2 — ShopCraft  
**Week:** Week 11 (Sprint 2: MVP and Freeze — Final Class)  
**Date:** Thursday, November 12, 2026 (Updated November 16, 2026 on merged `main` commit `6559ea2`)  

This is supporting evidence, not a separate weekly report. Use it only when a weekly guide specifically asks for additional receipts; otherwise, enter your contribution and evidence in the one shared team Weekly Report. If this template is requested, each student completes their own copy.

---

## Receipt 1

- **What I did:** Executed independent non-author testing of the Khalti Sandbox flow and Cash on Delivery fallback on an external laptop without author coaching, recording reproducible boundary checks for payment cancellation recovery and offline checkout.
- **Roadmap slice / behavior (if relevant):** Gateway Cancellation Recovery Slice & Non-Author QA.
- **Area I helped steward or hand off (if relevant):** Area 2: QA, Non-Author Verification & Runbooks (Backup: Aanchal Chand Thakuri).
- **Evidence link:** [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51) · [Tested-By Note](../tested-by-note.md) · [Commit `76172af`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/76172af) · [Commit `d1aaf1c`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/d1aaf1c).
- **How I checked it:** Tested both cancellation recovery and COD fallback without coaching on `https://shopcraft.me` (pre-merge candidate build; post-merge live browser repeat on merged `main` `6559ea2` scheduled before Wed Nov 18 EOD under [Issue #51](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/51)):
  - *Cancellation Recovery:* User cancels on Khalti portal (`status=User%20canceled`). **Expected:** Redirect back to `/s/brewmellow/checkout` with alert *"Payment was canceled. Your cart items have been saved"*; cart items, quantities, and addresses intact. **Actual: PASS.** Zero cart corruption; items preserved in session storage.
  - *COD Fallback:* User selects "Cash on Delivery" radio and places order. **Expected:** Instant order creation with zero external HTTP calls; status `CONFIRMED`; invoice token generated. **Actual: PASS.** Order created in 68ms with status `CONFIRMED`; inventory decremented.
  - *Merged `main` (`6559ea2`) Automated Check:* Verified `154` backend tests (`144` pass on local SQLite in `17.467s`, `10` Postgres-only RLS tests execute in CI) and `63/63` Vitest unit tests (`khalti-return.test.ts` `6/6`) pass directly on `6559ea2`.
- **What I learned or changed:** Handling gateway aborts gracefully protects e-commerce conversion rates; previously, canceling payment wiped the cart and caused user frustration.

---

## Receipt 2

- **What I did:** Maintained and verified the Clean-Clone Setup Runbook in `README.md` and audited the automated backend test suite following the removal of subscriptions.
- **Roadmap slice / behavior (if relevant):** Clean-clone reproduction and automated test suite verification.
- **Area I helped steward or hand off (if relevant):** Area 2: QA, Non-Author Verification & Runbooks.
- **Evidence link:** [w11-backend-tests.txt](../evidence/w11-backend-tests.txt) · [w11-frontend-checks.txt](../evidence/w11-frontend-checks.txt) · [MVP Verification Checklist](../mvp-verification-checklist.md#2-verification-checklist).
- **How I checked it:** Executed `python manage.py test accounts catalog orders stores` (`154` discovered: `144` pass on local SQLite, `10` Postgres-only RLS tests executed in CI) and frontend `npm test` (`63/63` Vitest unit tests passed). Recorded explicit negative boundaries in [`tested-by-note.md`](../tested-by-note.md).
- **What I learned or changed:** Keeping the test runner clean of dead code from cut features—and explicitly documenting what SQLite/mocked runs do not establish—keeps our release verification trustworthy.

---

## Receipt 3, optional

- **What I did:** Tested Aditya's Khalti Sandbox payment flow on `https://shopcraft.me` without author assistance.
- **Roadmap slice / behavior (if relevant):** Non-author verification of Area 1 (Backend & Payments).
- **Area I helped steward or hand off (if relevant):** Cross-area verification with Area 1.
- **Evidence link:** [Weekly Report Peer Check Note](../weekly-report.md#5-cross-area-independent-peer-checks) · [QA Note](../../week-10/evidence/kushan-independent-qa-handoff.md#test-1-khalti-epayment-v2-sandbox-journey).
- **How I checked it:** Initiated payment with test credentials `9800000000` / OTP `987654`; verified server-side signature lookup succeeded and token `ORD-2026-SC-001` was rendered.
- **What I learned or changed:** Non-author testing exposes edge cases and usability issues that the original developer tends to overlook.
