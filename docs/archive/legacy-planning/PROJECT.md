# BrewMellow — Project Definition

## Vision
BrewMellow is a boutique direct-to-consumer Himalayan specialty coffee subscription platform. It delivers freshly roasted single-origin coffees from Nepal (Gulmi, Ilam, Nuwakot) to subscribers on recurring prepaid delivery cycles.

## Business Context
- **Product Model**: Monthly delivery of specialty coffee. Subscriptions are prepaid in 1, 3, 6, or 12-month commitments with progressive discounts.
- **Target Audience**: Coffee enthusiasts and corporate subscribers in Nepal and abroad seeking traceable Himalayan beans.
- **Payment Infrastructure**: Integration with Khalti digital wallet for domestic payments.

## Architecture & Tech Stack
- **Frontend**: Next.js 16 (App Router, React 19, TypeScript, Tailwind CSS, Lucide Icons, `@ducanh2912/next-pwa`).
- **Backend**: Django 5 + Django REST Framework (Python 3.12).
- **Database**: SQLite (Development) / PostgreSQL (Production).
- **Authentication**: Token-based Authentication with role-based access control (`is_staff` for store management).

## Scope Boundaries
- **In Scope**:
  - Subscription configurator (Origins, Roast, Grind, Weight, Prepaid Plan).
  - Customer checkout with integrated registration and delivery profile.
  - Customer dashboard for subscription management (pause, skip, modify, history).
  - Role-protected Business Admin portal for revenue and order fulfillment.
  - PWA installability and offline support.
- **Out of Scope (Post-MVP)**:
  - Multi-vendor marketplace (single brand only).
  - International recurring credit card processing (Stripe).
