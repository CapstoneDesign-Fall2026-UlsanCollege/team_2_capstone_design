# Candidate Vertical Slice

**Team:** Team 2  
**Project:** BrewMellow: The Himalayan Coffee  
**Week:** 3  

## The Slice

**What is the single path through the app we will build first?**  
Choose one origin → choose weight → choose plan → see an order summary.

**Why this slice?**  
This represents the core value of our application. Proving this works means our React UI correctly manages state across the selection process and can submit a structured order payload to our Django backend and PostgreSQL database.

## In Scope (Midterm Demo)

- **Frontend:** A hardcoded list of origins and plans, local selection state management, and the final order summary screen.
- **Backend:** Order creation API.
- **Database:** Storing completed orders.

## Out of Scope (Postponed)

- User authentication (phone and email login).
- Automated email notifications.
- Pause / Skip / Cancel subscription logic.
- Admin panel customizations and scarcity handling.
- Recommendation systems.
- Live Khalti payments (we will simulate payment or postpone integration until the basic flow is perfectly stable).
- Holiday delivery logic.

## Risk

**What is the biggest risk to this slice?**  
The interaction state management in React. We need to ensure that the chosen origin, weight, and plan correctly persist through the flow and form a valid payload for the Django backend.
