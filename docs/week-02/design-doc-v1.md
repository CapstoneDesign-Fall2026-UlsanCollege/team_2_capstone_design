# Design Doc v1

**Team:** Team 2
**Project name:** BrewMellow: The Himalayan Coffee
**Last updated:** 2026-09-10

## 1. Project purpose

Providing a seamless, automated Progressive Web App (PWA) for people to get high-quality coffee delivered regularly in Nepal, removing the friction of manual ordering while helping local roasters build predictable recurring revenue.

## 2. Target users

- Primary user: Regular coffee drinkers in Nepal.
- Secondary user, if any: Local delivery partners who handle the logistics.

## 3. Smallest useful version

A simple web application where a user can select a subscription tier, enter payment/shipping details, and generate an order ticket for a local delivery partner.

### Rough user flow — 3–5 steps

`Start → Select Coffee Plan → Complete Payment → Generate Delivery Order → Order Visible to Partner`

Evidence / sketch link: ![User Flow Sketch](user-flow-sketch.jpg)

## 4. In scope

- Secure user registration and authentication.
- Coffee subscription tier selection (e.g., Weekly, Bi-weekly, Monthly).
- Automated payment processing integration via Khalti API.
- Customer dashboard for viewing active subscriptions and tracking Upaya deliveries.

## 5. Out of scope

- Complex automated logistics routing (we will rely entirely on Upaya CityCargo).
- An advanced inventory management system for roasters.
- International shipping support (Nepal only).
- Credit card processing (using local Khalti digital wallets only).

## 6. Midterm demo sentence

Our midterm demo will show:

> A user selecting a coffee subscription plan, completing a mock payment, and generating a successful delivery order ticket.

## 7. Final demo sentence

Our final demo will prove:

> That our PWA can successfully manage recurring coffee subscriptions, process monthly Khalti payments automatically, and dispatch delivery requests to the Upaya CityCargo API.

## 8. MVP features

| Feature | Required for MVP? | Owner | Issue link |
|---|---|---|---|
| User Auth | Yes | Rohit-coder201 | [#11](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/11) |
| Subscription Selection | Yes | Kushan2191 | [#7](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/7) |
| Payment Integration | Yes | notyouradhee | [#5](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/5) |

## 9. Risks and unknowns

| Risk / unknown | Why it matters | Plan |
|---|---|---|
| Payment Integration | Need a reliable gateway | Use Khalti API checkout widget |
| Local Delivery Logistics | Unreliable tracking | Partner with Upaya CityCargo API |

## 10. Evidence links

- Planning Issue: [#6 Finalize week 2 report](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/6)
- Weekly Report: [Week 2 Weekly Report](weekly-report.md)
- Demo/proof links: [User Flow Sketch](user-flow-sketch.jpg)
