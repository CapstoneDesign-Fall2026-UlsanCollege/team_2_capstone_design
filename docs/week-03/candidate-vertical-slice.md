# Candidate Vertical Slice

**Team:** Team 2  
**Project:** Coffee Subscription Nepal  
**Week:** 3  

## The Slice

**What is the single path through the app we will build first?**  
A customer browses the landing page, selects a coffee origin, chooses a subscription plan, and successfully completes a test payment using the Khalti API.

**Why this slice?**  
It touches every layer of our tech stack: Next.js (frontend UI) → Django DRF (backend API) → PostgreSQL (storing the order) → Khalti (external payment API). Proving this works means our entire architecture is viable.

## In Scope (Midterm Demo)

- **Frontend:** Landing page, origin/plan selection flow, and checkout page.
- **Backend:** User authentication API, Order creation API, Khalti payment verification API.
- **Database:** Storing users, origins, and completed orders.
- **External:** Khalti sandbox (test environment) integration.

## Out of Scope (For Post-Midterm)

- The customer dashboard (viewing order history).
- Pause / Skip / Cancel subscription logic.
- Automated email notifications to delivery partners.
- Admin panel customizations (we will just use the default Django admin for now).
- Handling holiday delivery logic.

## Risk

**What is the biggest risk to this slice?**  
The integration between our Django backend and the Khalti sandbox API. We need to ensure that when the React frontend sends the Khalti payment token to Django, Django can successfully verify it with Khalti's servers and update the order status in our Neon database.
