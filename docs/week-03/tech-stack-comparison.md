# Tech Stack Comparison

**Team:** Team 2  
**Week:** 3  

Compare two possible stacks. Do not research everything. Prefer boring and buildable.

## Stack A

- **Stack name:** Django + Next.js + PostgreSQL
- **What can we build with this?** Full PWA with server-rendered pages, REST API, auto-generated admin panel, recurring billing, and SEO support. Django handles backend logic, Next.js handles the user interface, PostgreSQL stores all relational data.
- **What does the team already know?** Python basics, HTML/JS fundamentals, Git workflow, GitHub Issues and PRs.
- **What must we learn?** Django REST Framework for building APIs, Next.js (React basics) for frontend components, PostgreSQL setup with Neon (cloud database), Celery for background tasks (needed later for recurring billing).
- **How can we demo it by midterm?** Deploy frontend on Vercel (free), backend on DigitalOcean ($200 GitHub Student Pack credits). Demo a user selecting a coffee subscription plan and completing a mock Khalti payment.
- **What could go wrong?** Learning React/Next.js alongside Django may be a lot for the team at once. Managing two separate projects (frontend + backend) adds complexity.
- **Simplest first screen or feature:** Subscription plan selector — a page showing 3 coffee plan cards (Basic, Standard, Premium) with a "Subscribe" button.

## Stack B

- **Stack name:** Flask + Vanilla JS + MongoDB
- **What can we build with this?** Lightweight REST API with simple HTML/CSS/JS pages, basic PWA with manual service worker configuration.
- **What does the team already know?** Python basics, HTML/JS, MongoDB Atlas setup (investigated in Week 2 — Issue #15).
- **What must we learn?** Flask routing and extensions (flask-login, flask-restful, SQLAlchemy), manual service worker setup for PWA, MongoDB document schema design.
- **How can we demo it by midterm?** Deploy on Heroku or Render (free tier). Show the same subscription and payment flow.
- **What could go wrong?** No admin panel — must build from scratch, which could take weeks. No SEO — site is invisible to Google search. Vanilla JS becomes messy spaghetti code as the app grows beyond 5-10 pages. No built-in authentication or security — must install and configure many plugins manually. MongoDB is document-based, which is awkward for our relational data (users → subscriptions → orders → payments).
- **Simplest first screen or feature:** Same — subscription plan selector page.

## Decision

We choose:

> **Django + Next.js + PostgreSQL (Stack A)**

Because:

> 1. **Django gives us critical features for free** — admin panel (manage users, orders, subscriptions without building a separate UI), built-in user authentication (registration, login, permissions), ORM (database management without writing raw SQL), and security protections (CSRF, XSS, SQL injection). With Flask, we would need to build or configure all of these manually.
>
> 2. **Next.js makes our PWA production-ready** — server-side rendering means Google can find our coffee subscription service (SEO). The `next-pwa` plugin handles service workers and install prompts automatically. Component-based React architecture keeps our code organized as the app grows from 3 pages to 30+.
>
> 3. **PostgreSQL fits our data model perfectly** — our data is relational: a User has Subscriptions, each Subscription has Orders, each Order has a Payment. PostgreSQL handles these relationships naturally with foreign keys and joins. MongoDB would force us to nest everything in documents, making queries like "show all unpaid orders from last month" unnecessarily complex.
>
> 4. **This stack scales from capstone to real business** — Django is proven at scale (Instagram, Pinterest, Spotify). PostgreSQL is the industry standard for production apps. We can deploy everything for free using GitHub Student Pack ($200 DigitalOcean credits + free Vercel hosting + free Neon database).
>
> 5. **Python is our preferred language** — the entire backend is in Python, which our team is most comfortable with. The only new language is React/JSX for the frontend, which is assigned to specific team members.

## Instructor approval / notes

- 
