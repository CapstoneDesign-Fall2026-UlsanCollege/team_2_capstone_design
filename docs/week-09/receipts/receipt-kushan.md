# Week 9 Contribution Receipt — Kushan Sunuwar

**Student:** Kushan Sunuwar  
**GitHub Login:** `@Kushan2191`  
**Role:** QA Lead / Independent Non-Author Sandbox Tester  
**Team:** Team 2  
**Project:** **ShopCraft** (formerly BrewMellow — Post-Midterm Architectural Pivot)  
**Submission Date:** Wednesday, November 4, 2026

---

## 1. Look Back: Course & Project Reflection

- **01 • LESSON (What did we learn?):**  
  Author-driven testing is inherently biased because the developer subconsciously navigates around edge cases and assumes environment variables are present. Independent testing by a non-author on an external machine is essential to prove that a checkout flow is robust.
- **02 • SOURCE (What event or proof supports it?):**  
  Instructor's Week 8 and Week 9 feedback requiring independent non-author test verification of the Khalti Sandbox flow, rather than developer-asserted passes.
- **03 • ROUTE (What might we change?):**  
  Conducted independent non-author checkout testing from a separate client machine across both desktop and mobile viewports, systematically testing successful Khalti payment, gateway cancellation, and offline Cash on Delivery (COD) across ShopCraft storefronts.
- **04 • QUESTION (What do we need to decide?):**  
  What happens to the customer's cart state if they click 'Cancel' or abort on Khalti's hosted payment gateway?  
  *Decision:* Tested and verified that gateway cancellation safely redirects the customer back to the checkout page with cart contents, quantities, and entered addresses preserved.

---

## 2. Independent Test Execution Record

### Test 1: Khalti Sandbox Successful Checkout Flow
- **Environment:** Google Chrome on separate Windows laptop (non-developer environment).
- **Target URL:** Live Vercel deployment (`https://team-2-capstone-design-one.vercel.app/s/brewmellow/checkout`).
- **Steps:**
  1. Navigated to `/s/brewmellow`, selected *Gulmi Bourbon 250g Whole Bean* (NPR 1,200), and added to cart.
  2. Opened cart drawer, verified quantity stepper, and clicked **Checkout**.
  3. Entered delivery details: Province: Bagmati, City: Kathmandu, Street: Thamel Ward 26, Phone: `9841234567`.
  4. Selected **Khalti Digital Wallet**, clicked **Complete Order (Khalti)**.
  5. System redirected to Khalti Sandbox gateway URL.
  6. Entered official test mobile: `9800000000` and MPIN/OTP: `987654`.
  7. Submitted payment; Khalti redirected to callback endpoint with `pidx`.
- **Expected Result:** Order status changes to `PAID`, confirmation page displays transaction reference and order summary.
- **Actual Result:** **PASS.** Invoice rendered successfully with order token and Khalti reference. Order appeared immediately in merchant queue as `PAID`.

### Test 2: Khalti Gateway Payment Cancellation Edge Case
- **Steps:**
  1. Added *Ilam Typica 500g Pour Over* (NPR 1,800) to cart.
  2. Clicked through to Khalti gateway.
  3. On Khalti's hosted portal, clicked **Cancel / Return to Merchant**.
- **Expected Result:** Application redirects to `/s/brewmellow/checkout` without creating an order; cart remains populated.
- **Actual Result:** **PASS.** Cart drawer restored with Ilam Typica 500g intact; friendly alert displayed ("Payment was cancelled. You can choose another method or retry.").

### Test 3: Cash on Delivery (COD) Offline Resilience Fallback
- **Steps:**
  1. Selected payment method **Cash on Delivery (COD)** on checkout page.
  2. Clicked **Place Order (Cash on Delivery)**.
- **Expected Result:** Order creates immediately without calling external payment APIs; status set to `CONFIRMED / COD_PENDING`.
- **Actual Result:** **PASS.** Zero network delay; order created with status `CONFIRMED`.

---

## 3. Scope Boundaries & Next Steps
- Testing was conducted strictly using Khalti sandbox credentials; no real financial transactions occurred.
- For Week 10, I will own the comprehensive clean-clone installation testing and document non-author reproduction from an empty directory.
