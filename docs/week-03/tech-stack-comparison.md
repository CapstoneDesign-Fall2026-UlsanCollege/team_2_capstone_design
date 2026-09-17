# Tech Stack Comparison

**Team:** Team 2  
**Week:** 3  

## Side-by-Side Comparison

| Question | Stack A: Django + Next.js + PostgreSQL | Stack B: Flask + Vanilla JS + MongoDB |
|---|---|---|
| **What can we build?** | Full PWA with REST API, admin panel, SEO, recurring billing | Lightweight API with basic HTML/JS pages, manual PWA |
| **What do we already know?** | Python, HTML/JS, Git | Python, HTML/JS, MongoDB Atlas (Week 2) |
| **What must we learn?** | Django REST Framework, React/Next.js basics, Neon setup | Flask extensions, manual service workers, MongoDB schema |
| **How to demo by midterm?** | Vercel (free) + DigitalOcean ($200 Student Pack) | Heroku or Render (free tier) |
| **What could go wrong?** | Learning React + Django at the same time | No admin panel, no SEO, code gets messy fast |
| **Simplest first screen?** | Plan selector (3 cards + button) | Plan selector (3 cards + button) |

## Feature Comparison

| Feature | Stack A (Django + Next.js) | Stack B (Flask + Vanilla JS) |
|---|---|---|
| Admin panel | ✅ Free, auto-generated | ❌ Must build from scratch |
| User authentication | ✅ Built-in | ❌ Manual setup with plugins |
| SEO (Google finds us) | ✅ Server-side rendering | ❌ Not supported |
| PWA support | ✅ `next-pwa` plugin | ⚠️ Manual service worker |
| Database fit | ✅ Relational data fits perfectly | ⚠️ Awkward for relational data |
| Security (CSRF, XSS) | ✅ Built-in | ❌ Manual configuration |
| Scales to production? | ✅ Instagram, Pinterest use Django | ⚠️ Painful after ~500 users |
| Code organization | ✅ Component-based, stays clean | ❌ Spaghetti code after 10+ pages |
| Deployment cost | $0 (Vercel + DigitalOcean + Neon) | $0 (Netlify + Heroku + Atlas) |

## Decision

We choose: **Django + Next.js + PostgreSQL (Stack A)**

| Reason | Explanation |
|---|---|
| Free admin panel | Manage users, orders, subscriptions without building separate UI |
| Built-in auth & security | Registration, login, permissions, CSRF/XSS protection — all included |
| SEO ready | Server-side rendering lets Google find our coffee subscription service |
| Data model fits | Users → Subscriptions → Orders → Payments — PostgreSQL handles this naturally |
| Scales to real business | Django is proven at scale (Instagram, Spotify). Can grow from demo to production. |
| Python backend | Our preferred language — team is most comfortable with it |
| Free deployment | GitHub Student Pack covers everything ($200 DigitalOcean + free Vercel + free Neon) |

## Instructor approval / notes

- 
