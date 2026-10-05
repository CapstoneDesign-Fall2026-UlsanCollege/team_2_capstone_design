# Vertical Slice Plan (Sprint 1)

**Team:** Team 2 (BrewMellow)
**Week:** 5  
**Next demo date:** 2026-10-08

A vertical slice is one small, visible user path through your project. It can be rough, but the path and proof must be concrete.

## What we will show

> By the next demo, a user can select a coffee origin, weight, and delivery plan, then successfully submit an order that is saved to a live Neon PostgreSQL database via a Django backend API, using a simulated "Khalti" payment flow.

## User path and proof

| Step | User does | System shows or does | How we will check it |
|---:|---|---|---|
| 1 | Selects Origin, Weight, and Plan on `/` | Frontend highlights choices and updates total price dynamically | Visual check of Next.js UI |
| 2 | Clicks "Continue to Checkout" | System routes to `/checkout` and displays order summary | Visual check of Next.js Routing |
| 3 | Clicks "Pay with Khalti (Test Mode)" | Frontend sends JSON POST request to Django API | Network tab shows HTTP 201 Created |
| 4 | Waits for confirmation | Backend saves to Neon DB, overrides status to `PAID_TEST`. Frontend shows Success screen | Check Django Admin / database to verify record exists |

## Scope boundary

- **Real in this slice:** Next.js UI styling, React state management, Django REST framework API endpoint, and actual database persistence in Neon PostgreSQL.
- **Simulated:** The Khalti payment gateway is bypassed via a "fake data contract" (`is_fake_payment: true`).
- **Postponed:** User Login/Authentication and Order History dashboards.
- **Small fallback:** If the database connection fails during demo, the frontend will just show a UI "Connection Error" state that we implemented, proving error handling works.

## Stack and supporting design

- **Stack status:** Confirmed (Next.js + Tailwind + Django REST + Neon Postgres)
- **Decision or approval note:** [Architecture and Setup](../week-03/team2-architecture-notes.md)
- **Wireframe notes:** [Wireframes](../week-03/team-2-wireframes.md)
- **Design Doc v1:** [MVP Features](../week-03/team2-mvp-features.md)
- **Architecture sketch:** [Data Flow](../week-03/team2-architecture-notes.md)

## Shared preview or test path

- **Where a teammate can preview or run this slice:** In the `frontend` folder, run `npm run dev`. In the `backend` folder, run `python manage.py runserver`.
- **Setup or access the teammate needs:** Needs `.env` file with Neon database credentials.
- **If unresolved, blocker Issue, owner, and next action:** None.

## Work Issues

| Issue link/title | First owner | Definition of Done / proof |
|---|---|---|
| [#39 Backend Initialization](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/39) | @notyouradhee | Django project running, Neon DB connected |
| [#40 Order API Endpoint](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/40) | @notyouradhee | `POST /api/orders/` successfully writes to Neon DB |
| [#41 Frontend Checkout UI](https://github.com/CapstoneDesign-Fall2026-UlsanCollege/team_2_capstone_design/issues/41) | @notyouradhee | Beautiful UI implemented, POST request integrated |

## Roles this week

- Setup/docs owner: Aditya (@notyouradhee)
- First visible screen/feature owner: Aditya (@notyouradhee)
- Evidence/Weekly Report owner: Aditya (@notyouradhee)

## Risk and next action

| Risk or uncertainty | Owner | Next action | Review date |
|---|---|---|---|
| CORS preventing frontend/backend communication | Aditya | Configure `django-cors-headers` | Resolved (2026-10-05) |

## Weekly Report evidence

- **Weekly Report:** [Week 5 Weekly Report](./weekly-report.md)
- **First visible proof:** PR for UI upgrade and backend integration.
