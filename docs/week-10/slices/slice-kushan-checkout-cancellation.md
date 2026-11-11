# PR with AI Use Note — Gateway Cancellation Recovery & QA Runbook Slice

**Author / Owner:** Kushan Sunuwar ([`@Kushan2191`](https://github.com/Kushan2191))  
**Stewardship Area:** Area 2: QA, Non-Author Verification & Runbooks  
**Backup Steward:** Aanchal Chand Thakuri ([`@jaasly07`](https://github.com/jaasly07))  
**Date:** Monday, November 9, 2026 (Week 10)  
**Related Pull Request / Commit:** [Commit `89b1420`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/89b1420) · [Commit `00ff1b2`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/00ff1b2)  
**Related Issue:** Issue #49 (Independent Non-Author Testing & Payment Recovery Verification)

---

## 1. What Changed?

- Added error recovery handling in [`frontend/src/app/s/[storeSlug]/checkout/page.tsx`](../../../frontend/src/app/s/[storeSlug]/checkout/page.tsx) when shoppers abort payment on external gateways.
- Guaranteed cart state persistence: when a user clicks "Cancel" on Khalti's hosted payment portal, the return handler redirects back to the checkout form with cart items, quantities, and entered shipping address preserved in local session storage.
- Authored the Clean-Clone Development & Verification Runbook in [`README.md`](../../../README.md) to enable completely unassisted reproduction on clean environments.
- Maintained active test suite scripts ensuring all 114 active tests run cleanly without obsolete subscription dependencies.

---

## 2. Why Did We Change It?

- During initial exploratory testing, canceling payment on Khalti wiped the user's cart and forced the shopper to navigate back to the home page and re-add artisanal products from scratch.
- To provide a reliable, frictionless shopping experience for craft marketplace buyers.
- To prove that any evaluator or new teammate can clone the repo and run the entire platform without author intervention.

---

## 3. How Did We Check It?

> We checked this by running non-author tests on Store 1 (`/s/brewmellow`), testing both gateway cancellation recovery and Cash on Delivery fallback:  
> • **Cancellation Recovery:** User cancels on Khalti portal (`status=User%20canceled`). **Expected:** Redirect back to `/s/brewmellow/checkout` with alert *"Payment was canceled. Your cart items have been saved"*; cart items, quantities, and addresses intact. **Actual: PASS.** Zero cart corruption; items preserved in session storage.  
> • **COD Fallback:** User selects "Cash on Delivery" radio and places order. **Expected:** Instant order creation with zero external HTTP calls; status `CONFIRMED`; invoice token generated. **Actual: PASS.** Order created in 68ms with status `CONFIRMED`; inventory decremented.  
> **Non-Author Peer Check:** Aditya Kumar Gupta independently verified the clean-clone runbook on a separate laptop ([Evidence Receipt](../../week-10/evidence/aditya-backend-rls-handoff.md)).

---

## 4. AI Use Note

Choose one:
- [ ] No AI was used for this change.
- [x] AI helped with planning or explanation only.
- [ ] AI helped generate or edit code/text.

### Details:
- **What AI helped with:** Outlined the standard gateway return query parameters (`status=User%20canceled`) used by Khalti's redirect protocol.
- **What the team reviewed:** Verified that session storage persistence does not store sensitive payment tokens or customer credentials.
- **What the team changed after review:** Manually implemented the state restoration logic in Next.js `useSearchParams()` hook and verified reactivity on mobile viewports.
- **Who can explain this change:** Kushan Sunuwar (Author) and Aanchal Chand Thakuri (Backup Steward).

---

## 5. Outside-Material Attribution

- **Source / creator:** Next.js Official Navigation Documentation (`useSearchParams`, `useRouter`)
- **Link:** [https://nextjs.org/docs/app/api-reference/functions/use-search-params](https://nextjs.org/docs/app/api-reference/functions/use-search-params)
- **License or permission:** MIT License
- **What we changed or how we used it:** Standard Next.js client component pattern adapted for tenant-scoped URL routes.

---

## 6. Evidence Links

- **Issue:** Issue #49 (Payment Error Recovery & Clean Clone Runbook)
- **Commits:** [`89b1420`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/89b1420), [`00ff1b2`](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/commit/00ff1b2)
- **Test Evidence:** Documented in [`docs/week-10/evidence/kushan-independent-qa-handoff.md`](../evidence/kushan-independent-qa-handoff.md)
