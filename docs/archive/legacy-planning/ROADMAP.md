# BrewMellow — Project Roadmap

## Phase 1: Core E-Commerce Foundation [COMPLETED]
- [x] Himalayan origin discovery pages (`/origins`).
- [x] Subscription customization engine (`/subscribe`).
- [x] Mobile bottom navigation and PWA base configuration.
- [x] Midterm UI polish and story page (`/about`).

## Phase 2: Production Authentication & User System [IN PROGRESS]
- [ ] Django CustomUser model with phone, address, and email authentication.
- [ ] DRF endpoints: `POST /api/auth/register/`, `POST /api/auth/login/`, `GET /api/auth/me/`.
- [ ] Frontend unified checkout form (collects shipping details + password).
- [ ] Dedicated customer login (`/login`) and session persistence.
- [ ] Staff-only admin authentication and dashboard protection.

## Phase 3: Subscription Lifecycle & Order Engine
- [ ] Model Subscription table linked to CustomUser foreign key.
- [ ] Customer self-service APIs: `POST /api/subscriptions/{id}/skip/`, `POST /api/subscriptions/{id}/pause/`.
- [ ] Recurring delivery schedule tracker and order history receipt generator.

## Phase 4: Business Fulfillment & Admin Portal
- [ ] Secure Staff Admin Portal (`/admin-portal`) with live revenue analytics.
- [ ] Order fulfillment status management (Pending, Roasted, Dispatched, Delivered).

## Phase 5: Production Deployment & Real Payment Gateway
- [ ] Production Khalti Merchant API verification and live webhook handling.
- [ ] PostgreSQL migration and containerized deployment.
