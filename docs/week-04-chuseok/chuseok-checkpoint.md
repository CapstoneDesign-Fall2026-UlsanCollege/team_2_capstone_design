# 🍂 Week 4: Chuseok Checkpoint & Midterm Scope

**Team:** Team 2 (Coffee Subscription Nepal)  
**Date:** September 23, 2026  
**Status:** ✅ Completed

*Note: Week 4 is the Chuseok holiday. This document serves as a lightweight checkpoint to solidify our midterm demo goals before we resume heavy development in Week 5.*

---

## 🖼️ 1. Initial UI Sketch

We have finalized the rough wireframes for the core application flow. Our immediate focus will be the user onboarding and selection process.

- **Primary Interface:** [Landing Page Wireframe](../week-03/wireframe-landing-page.jpg)
- **Selection Interfaces:** Origin Selection, Plan Configuration, Checkout

---

## 🎯 2. Midterm Demo Objective

Our midterm demo (Vertical Slice) will prove that our Django/Next.js/Neon architecture successfully connects end-to-end. 

**Our midterm demo will show:**
> A user selecting a Nepali coffee origin, choosing a subscription weight and delivery frequency, picking a valid Monday for delivery, and successfully completing a test checkout through the Khalti API.

---

## 🚧 3. Key Blocker / Risk for Week 5

**Risk:** Khalti Sandbox API Verification 
- **Trigger:** We are relying on the Khalti test environment to validate payments. If their test API behaves differently than documented, or if we cannot parse the verification token in Django, our checkout flow will fail.
- **Action Plan:** Before building the React checkout components, `@notyouradhee` will write an isolated Python script to manually ping the Khalti verification endpoint and confirm the response structure.

---

## 🚀 4. Post-Holiday Immediate Action

When we return from the Chuseok break, our first sprint will begin with:
- **Frontend:** Initializing the Next.js `frontend` directory with Tailwind and `next-pwa`.
- **Backend:** Connecting our initialized Django `backend` directory to the Neon PostgreSQL database.
