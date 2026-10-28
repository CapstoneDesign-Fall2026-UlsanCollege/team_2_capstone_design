# Post-Midterm Reset & MVP Gap Analysis — BrewMellow

**Course:** Capstone Design — Fall 2026  
**Team:** Team 2 — BrewMellow  
**Week:** 8 (Midterm Gate)  
**Date:** October 28, 2026  
**Current Live Deployed URL:** [https://team-2-capstone-design-one.vercel.app](https://team-2-capstone-design-one.vercel.app)  
**Repository:** [https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design)

---

## 1. Executive Summary & Review Context

During Week 8, Team 2 delivered our Midterm Presentation for **BrewMellow**—a specialty coffee subscription platform connecting coffee lovers with high-altitude Himalayan micro-lots (Gulmi, Ilam, Nuwakot) in Nepal.

In our Week 7 evaluation, Team 2 received an **Exceeds** evaluation from course staff, recognizing our bounded vertical slice, clean-clone non-author verification, mobile WCAG AA testing, and backend resilience smoke tests. In the Week 8 formative feedback, the instructor emphasized that the Midterm presentation marks the boundary between exploration (Sprint 1) and delivery (Sprint 2):

> *“Week 8 is the Midterm Gate. The presentation has happened; the remaining homework is the short reset that turns the midterm into a realistic Week 9 roadmap... Keep a clear boundary between what was presented, what is currently verified, and what is planned for Week 9.”*

This document formalizes that reset: identifying our two core lessons, executing a transparent MVP gap analysis, and outlining our scope cuts for Sprint 2 (MVP & Freeze).

---

## 2. Core Lessons Learned (Course & Project)

### Course Lesson
- **Context:** Throughout Weeks 1 through 7, student teams frequently felt pressured to present wide, multi-faceted application interfaces with dozens of secondary features (e.g., custom loyalty rewards, social reviews, multi-address books, complex coffee recommendation quizzes).
- **Core Insight:** Rubric evaluations and instructor feedback consistently favored bounded, verifiable proof over unverified UI breadth. A single proven path where edge cases, clean-clone setups, and failure modes are documented carries far greater academic and engineering value.
- **Decision Pattern:**  
  > *We believed* that presenting an expansive feature set would demonstrate stronger progress; *the evidence* proved that reviewers value an honest, verifiable, and bounded vertical slice far more; *therefore our Week 9 decision is* to strictly freeze feature expansion and focus 100% of our Sprint 2 capacity on closing the single remaining happy-path gap: converting our simulated payment boundary into a verified Khalti sandbox transaction flow.

### Project Lesson
- **Context:** In our vertical slice, we successfully built and deployed a production flow from `/origins` to `/checkout`, preserving cart state via URL query parameters and persisting order rows to Neon PostgreSQL.
- **Core Insight:** In our presentation script and slides, we labeled payments as `is_fake_payment=True`. While this honest boundary satisfied Criterion 2 of the rubric, it highlighted the technical reality: our application does not yet move real money, does not verify cryptographic signatures from payment gateways, and cannot trigger real transactional courier fulfillment.
- **Decision Pattern:**  
  > *We believed* that carrying origin selections into `/checkout` via URL parameters and recording an order row in PostgreSQL was sufficient proof of a complete e-commerce subscription slice; *the evidence* showed that because payments remain simulated (`is_fake_payment=True`), orders cannot be treated as real financial transactions; *therefore our Week 9 decision is* to formally define our MVP status as **“Still Has a Gap”** and build a dedicated Khalti Sandbox SDK integration with server-side signature validation before touching any optional secondary features.

---

## 3. Comprehensive MVP Gap Analysis

| Feature Area | Current State (What Demo Proves) | Target MVP State (Week 11 Freeze) | Gap Description | Priority |
|---|---|---|---|---|
| **Origin Selection** | 3 micro-lot cards (Gulmi, Ilam, Nuwakot) with altitude, wash process, notes, and pricing. | Same (Frozen). | None. Feature is complete, responsive, and verified. | Complete |
| **Checkout Routing** | URL query parameters preserve selection (`origin`, `name`, `price`, `weight`) across reloads. | Same (Frozen). | None. Query-param engine verified against state-loss edge cases. | Complete |
| **Defensive Edge Case**| Direct visit to `/checkout` without parameters displays clean empty-cart card with CTA. | Same (Frozen). | None. Defensive fallback verified in production. | Complete |
| **Payment Processing** | Simulated modal with `is_fake_payment=True`. Orders saved with status `CONFIRMED`. | Official Khalti Sandbox SDK integration with server-side transaction verification in NPR. | **CRITICAL GAP:** Payment is mock; real test wallet deduction and webhook verification do not occur. | **P0 (Sprint 2 Focus)** |
| **Order Lifecycle State** | Single static status in database. | Order state machine: `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `ROASTING` $\rightarrow$ `DISPATCHED`. | **GAP:** Order status does not transition based on payment gateway callbacks. | **P0** |
| **Customer Notifications**| Database row created; no email dispatched. | Automated transactional email via SMTP upon confirmed payment. | **GAP:** Customers receive no written confirmation or tracking link outside of web portal. | **P1** |
| **Mobile UX** | 390px viewport audited; 52px CTA buttons; `pb-28` safe-area padding. | Khalti mobile payment sheet tested on iOS Safari & Android Chrome. | **GAP:** Mobile payment sheet redirect and return flow needs verification. | **P1** |
| **Outage Resilience** | Frontend displays alert banner when Django API is offline. Repeatable curl checks in README. | Automated health-check endpoint (`/api/health/`) and Sentry error boundaries. | Minor gap: Error handling works; automated monitoring can be enhanced. | **P2** |

---

## 4. Sprint 2 Scope Cut Contract (What We Will NOT Build)

To protect the delivery of a rock-solid MVP by the Week 11 Freeze Gate (November 12), Team 2 formally cuts or postpones the following non-essential features:

1. **CUT — Multi-tier Subscription Recurrence Engine:**  
   *Reason:* Managing recurring automated monthly credit card rebilling in Nepal requires complex merchant agreements with commercial banks (Nabil/HBL). For our MVP, we operate on a Pay-As-You-Go per-batch subscription model where each roast cycle triggers an explicit Khalti payment.
2. **CUT — Live Third-Party Courier API Tracking:**  
   *Reason:* Domestic logistics couriers in Nepal (e.g., Himalayan Express, Sundar Courier) lack public sandbox developer APIs. We will manage delivery stages through our internal roastery operations console rather than attempting fragile mock integrations.
3. **CUT — Complex AI Taste Profile Matcher:**  
   *Reason:* The core user problem is single-origin transparency and fresh roasting, not an algorithmic recommendation quiz. Terroir descriptions (altitude, processing, cupping notes) are sufficient for specialty coffee enthusiasts.
4. **CUT — Multi-currency Conversion (USD / EUR):**  
   *Reason:* All pricing is strictly denominated in Nepalese Rupees (NPR) to align directly with Khalti's payment gateway.

---

## 5. Focus Milestone Specification: Khalti Sandbox Integration

### Overview
- **Milestone Title:** Milestone 1 &mdash; Khalti Sandbox E-Payment Gateway Integration
- **Target Sprint:** Sprint 2 (Weeks 9–11)
- **Primary Technical Leads:** `notyouradhee` (Aditya Kumar Gupta) & `Rohit-coder201` (Rohit Chhantiyal)
- **QA & Independent Tester:** `Kushan2191` (Kushan Sunuwar)
- **Mobile & UX Auditor:** `jaasly07` (Aanchal Chand Thakuri)

### Technical Specifications
1. **Initiate Payment Endpoint (`POST /api/payments/khalti/initiate/`):**
   - Payload: `purchase_order_id`, `purchase_order_name`, `amount` (in paisa, NPR $\times 100$), `return_url`, `website_url`.
   - Action: Contacts Khalti Sandbox API `https://a.khalti.com/api/v2/epayment/initiate/` using server secret key.
   - Response: Returns `payment_url` and `pidx` (payment index).
2. **Verify Payment Endpoint (`POST /api/payments/khalti/verify/`):**
   - Payload: `pidx`, `transaction_id`, `amount`.
   - Action: Server-side validation against Khalti verification API. Transitions database order status from `PENDING` to `PAID`.
   - Security: Secret keys remain strictly on the backend via environment variables; never exposed to client-side bundles.
3. **Transactional Notification Worker:**
   - Once payment verification returns HTTP 200 `Completed`, the backend queues an asynchronous email dispatch sending a structured order confirmation receipt to the customer's email.

### Acceptance Criteria & Success Signal
- [ ] A clean-clone installation can run checkout against Khalti sandbox.
- [ ] Submitting checkout redirects to Khalti test portal.
- [ ] Paying with test mobile `9800000000` / OTP `1111` redirects cleanly back to `/dashboard` with query param `?status=Completed`.
- [ ] Database order row in Neon PostgreSQL records `status = 'PAID'`, `khalti_pidx`, and `khalti_transaction_id`.
- [ ] Direct navigation to callback URL without valid `pidx` displays an explicit payment cancellation alert.
