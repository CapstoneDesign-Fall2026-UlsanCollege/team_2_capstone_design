# ShopCraft Production Setup & Operations Runbook

Target production topology:
- **Storefront & Merchant UI**: Next.js on **Vercel** (`https://shop.<domain>`)
- **Backend API**: Django 5 + Gunicorn (`gthread`) on **Heroku Basic** (`https://api.<domain>`)
- **Database**: **Neon Serverless Postgres** with `FORCE ROW LEVEL SECURITY` (`POOLED` connection at runtime; `DIRECT` connection for migrations only)
- **Transactional Email**: **Resend HTTP API** (`EMAIL_TRANSPORT=resend_api`, default) or standard **SMTP** (`EMAIL_TRANSPORT=smtp`)
- **Payments**: **Cash on Delivery (COD)** + **Khalti** (`SANDBOX` by default; `LIVE` requires explicit opt-in)

---

## 1. Region Co-Location Requirement

Provision **all three compute/data tiers in the same cloud region** so SSR fetches, API calls, and RLS transaction blocks avoid cross-region round-trip latency:

| Service | Recommended Region (US East) | Recommended Region (Asia-Pacific Alt) |
|---|---|---|
| **Neon Postgres Project** | `aws-us-east-1` (N. Virginia) | `aws-ap-southeast-1` (Singapore) |
| **Heroku App** | `us` (Virginia) | `us` (Heroku Common Runtime nearest) |
| **Vercel Functions (`iad1` / Project Function Region)** | `iad1` (Washington, D.C.) | Match Neon/Heroku region |

> Keep Heroku and Neon in the **exact same AWS region** (`us` ↔ `aws-us-east-1`) because every tenant API request executes `SET LOCAL` + SQL queries inside an atomic transaction block.

---

## 2. Environment Variable Reference (Names Only)

Never commit secret values, API keys, OTPs, tokens, real email addresses, or connection strings to Git.

### 2.1 Heroku (`api.<domain>`)

| Variable Name | Required | Purpose |
|---|---|---|
| `DJANGO_DEBUG` | Yes | Must be `False` in production |
| `DJANGO_SECRET_KEY` | Yes | Strong `>= 32` character random secret (startup fails if missing or insecure) |
| `FIELD_ENCRYPTION_KEY` | Yes | 32-byte URL-safe base64 Fernet key for encrypting per-store gateway keys |
| `DJANGO_ALLOWED_HOSTS` | Yes | Comma-separated host allowlist (e.g., `api.<domain>`) |
| `DATABASE_URL` | Yes | Neon **POOLED** (`-pooler`) connection string using `NOSUPERUSER NOBYPASSRLS` runtime role |
| `DATABASE_URL_DIRECT` | Yes | Neon **DIRECT** (unpooled) connection string used **only** by `Procfile` `release` phase for `migrate` |
| `DB_CONN_MAX_AGE` | Optional | Persistent DB connection lifetime in seconds (default `60`; set `0` if your pooler mode requires transaction-level release) |
| `SESSION_COOKIE_DOMAIN` | Yes | Shared parent domain with leading dot: `.<domain>` |
| `CSRF_COOKIE_DOMAIN` | Yes | Shared parent domain with leading dot: `.<domain>` |
| `SESSION_COOKIE_SAMESITE` | Optional | Defaults to `Lax` |
| `CSRF_COOKIE_SAMESITE` | Optional | Defaults to `Lax` (`CSRF_COOKIE_HTTPONLY` is `False` by design so `shop.<domain>` can read `csrftoken`) |
| `CORS_ALLOWED_ORIGINS` | Yes | `https://shop.<domain>` |
| `CORS_ALLOW_CREDENTIALS` | Yes | `True` |
| `CSRF_TRUSTED_ORIGINS` | Yes | `https://shop.<domain>,https://api.<domain>` |
| `SECURE_SSL_REDIRECT` | Optional | Defaults to `True` when `DJANGO_DEBUG=False` (`/api/health/` is exempt) |
| `SECURE_HSTS_SECONDS` | Optional | Defaults to `86400` (1 day, no `includeSubDomains`, no `preload`; raise after verifying TLS stability) |
| `EMAIL_TRANSPORT` | Yes | `resend_api` (default) or `smtp` |
| `DEFAULT_FROM_EMAIL` | Yes | Verified sender address on subdomain, e.g., `auth@send.<domain>` |
| `RESEND_API_KEY` | Conditional | Required when `EMAIL_TRANSPORT=resend_api` |
| `RESEND_TIMEOUT` | Optional | HTTP timeout in seconds (`<= 5`, default `4.5`) |
| `EMAIL_SEND_ASYNC` | Optional | Defaults to `True` (`transaction.on_commit` + `ThreadPoolExecutor(max_workers=2)`) |
| `EMAIL_HOST` | Conditional | Required when `EMAIL_TRANSPORT=smtp` |
| `EMAIL_PORT` | Conditional | SMTP port (default `587`) |
| `EMAIL_USE_TLS` | Conditional | `True` for STARTTLS (`587`) |
| `EMAIL_USE_SSL` | Conditional | `True` for implicit TLS (`465`); mutually exclusive with `EMAIL_USE_TLS` |
| `EMAIL_HOST_USER` | Conditional | SMTP username when `EMAIL_TRANSPORT=smtp` |
| `EMAIL_HOST_PASSWORD` | Conditional | SMTP password/key when `EMAIL_TRANSPORT=smtp` |
| `EMAIL_TIMEOUT` | Optional | SMTP timeout in seconds (`<= 10`, default `10`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth 2.0 Web Client ID verified server-side as `aud` |
| `KHALTI_LIVE_ENABLED` | Yes | `False` by default (keeps Khalti strictly in Sandbox; set `True` only after live merchant approval) |
| `KHALTI_PLATFORM_SANDBOX_KEY` | Optional | Platform fallback Khalti sandbox secret key when `KHALTI_LIVE_ENABLED=False` |
| `CLOUDINARY_CLOUD_NAME` | Yes | Cloudinary cloud name for merchant media uploads |
| `CLOUDINARY_API_KEY` | Yes | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Yes | Cloudinary API secret |
| `TRUSTED_PROXY_HEADER` | Optional | Defaults to `HTTP_X_FORWARDED_FOR` in production (reads rightmost Heroku router IP) |
| `LOG_HASHED_CLIENT_IP` | Optional | Defaults to `False`; set `True` briefly to compare salted client-IP hashes across two devices, then disable |
| `WEB_CONCURRENCY` | Optional | Gunicorn worker processes on Heroku Basic (default `2`, each with `4` threads) |
| `DJANGO_LOG_LEVEL` | Optional | Root structured log level (default `INFO`) |

### 2.2 Vercel (`shop.<domain>`)

| Variable Name | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Production / Preview | Yes | Browser API origin: `https://api.<domain>` (no trailing slash) |
| `DJANGO_API_ORIGIN` | Production / Preview | Yes | Server-side SSR/ISR fetch origin: `https://api.<domain>` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Production / Preview | Yes | Same Google OAuth 2.0 Web Client ID as Heroku `GOOGLE_CLIENT_ID` |

---

## 3. DNS Records to Create

Create the following records at your DNS provider for `<domain>` (values shown are record types/targets only — copy exact provider targets from Heroku, Vercel, and Resend dashboards):

| Purpose | Host / Name | Type | Target / Value Pattern |
|---|---|---|---|
| **Backend API (Heroku)** | `api.<domain>` | `CNAME` | `<heroku-generated-dns-target>.herokudns.com` |
| **Frontend App (Vercel)** | `shop.<domain>` | `CNAME` | `cname.vercel-dns.com` |
| **Resend Bounce / Feedback MX** | `send.<domain>` | `MX` | Resend regional feedback MX host (priority `10`, from Resend Domain dashboard) |
| **Resend SPF** | `send.<domain>` | `TXT` | `v=spf1 include:amazonses.com ~all` (exact string shown in Resend Domain dashboard) |
| **Resend DKIM** | `resend._domainkey.<domain>` | `TXT` | Resend-generated DKIM public key (`p=...`) |
| **DMARC Policy (Initial)** | `_dmarc.<domain>` | `TXT` | `v=DMARC1; p=none; rua=mailto:dmarc@<domain>; adkim=r; aspf=r;` |

> Start DMARC with `p=none` while monitoring aggregate reports (`rua`), then tighten to `p=quarantine` / `p=reject` once SPF and DKIM alignment is confirmed.

---

## 4. Ordered Deployment Runbook

### Step 1: Prepare Neon Postgres Roles & Connection URLs
1. Create your production Neon project in the same region as Heroku (`aws-us-east-1`). **Do NOT attach the Heroku Postgres add-on.**
2. Create two roles on the production database:
   - **Migration owner role** (used in `DATABASE_URL_DIRECT` via Neon's unpooled endpoint) with schema DDL privileges.
   - **Runtime application role** (used in `DATABASE_URL` via Neon's `-pooler` endpoint) explicitly configured with `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS` and `SELECT, INSERT, UPDATE, DELETE` table privileges + sequence `USAGE, SELECT` privileges (`ALTER DEFAULT PRIVILEGES` for tables created by the migration owner).
3. Verify that `DATABASE_URL` uses the `-pooler` hostname with `?sslmode=require` and `DATABASE_URL_DIRECT` uses the direct (non-pooler) hostname with `?sslmode=require`.

### Step 2: Verify Sending Subdomain in Resend
1. Add `send.<domain>` in Resend → **Domains**.
2. Publish the `MX`, `TXT` (`send.<domain>`), `TXT` (`resend._domainkey.<domain>`), and `_dmarc.<domain>` DNS records from Section 3.
3. Wait until Resend marks `send.<domain>` **Verified**, then create a sending-restricted API key for `RESEND_API_KEY` and set `DEFAULT_FROM_EMAIL=auth@send.<domain>`.

### Step 3: Configure Google Cloud OAuth 2.0 Web Client
1. In Google Cloud Console → **APIs & Services → OAuth consent screen**, configure your external consent screen and brand details.
2. Under **Credentials → Create Credentials → OAuth client ID (Web application)**:
   - **Authorized JavaScript origins**: `https://shop.<domain>`
   - **Authorized redirect URIs**: Leave empty unless needed later (Google Identity Services popup/button verify flow posts the ID token directly to `/api/stores/<slug>/account/google/` and `/api/auth/google/`).
3. Copy the Client ID into both Heroku `GOOGLE_CLIENT_ID` and Vercel `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### Step 4: Provision & Deploy Backend on Heroku Basic
1. Create the Heroku app (Basic dyno) **without** adding Heroku Postgres:
   ```bash
   heroku create <app-name> --region us
   heroku stack:set heroku-24 -a <app-name>
   heroku domains:add api.<domain> -a <app-name>
   heroku certs:auto:enable -a <app-name>
   ```
2. Point your DNS `CNAME` for `api.<domain>` to the target output by `heroku domains -a <app-name>`.
3. Set all required Heroku config vars from Section 2.1 (`heroku config:set ... -a <app-name>`). Keep `KHALTI_LIVE_ENABLED=False` until live Khalti credentials are approved.
4. Push the `backend/` subdirectory to Heroku so `Procfile`, `runtime.txt`, `requirements.txt`, and `manage.py` sit at the slug root:
   ```bash
   git subtree push --prefix backend heroku prod/hardening-launch:main
   ```
   During release, Heroku automatically executes:
   `release: DATABASE_URL=$DATABASE_URL_DIRECT python manage.py migrate --noinput`
   which applies all migrations (including `0008_force_rls_policies` `ENABLE` + `FORCE ROW LEVEL SECURITY` and Section 4 composite indexes) over the direct Neon connection.
5. Verify health and real email transport:
   ```bash
   curl -i https://api.<domain>/api/health/
   heroku run python manage.py send_test_email <your-inbox-address> -a <app-name>
   ```

### Step 5: Deploy Frontend on Vercel
1. Import the repository into Vercel with **Root Directory** set to `frontend`.
2. Set `NEXT_PUBLIC_API_BASE_URL`, `DJANGO_API_ORIGIN`, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` from Section 2.2.
3. Attach custom domain `shop.<domain>` in Vercel → **Domains** and configure the `CNAME` record from Section 3.
4. Trigger a production deployment.

### Step 6: Verify Client-IP Rate-Limit Resolution (Two-Device Check)
1. Temporarily enable salted IP hash logging on Heroku:
   ```bash
   heroku config:set LOG_HASHED_CLIENT_IP=True -a <app-name>
   ```
2. Load `https://shop.<domain>` from **Device A** (e.g., Wi-Fi) and **Device B** (e.g., cellular LTE/5G) and watch `heroku logs --tail -a <app-name>`.
3. Confirm the two requests log **different** 12-char `client_ip_hash=` values (proving `HTTP_X_FORWARDED_FOR` rightmost router IP resolution is distinguishing clients).
4. Immediately turn the flag back off:
   ```bash
   heroku config:set LOG_HASHED_CLIENT_IP=False -a <app-name>
   ```

---

## 5. Post-Deploy Smoke-Test Checklist (iPhone Safari)

Run all checks in **iPhone Safari** (non-private and private tabs) over cellular/Wi-Fi against `https://shop.<domain>` to validate Apple ITP, `SameSite=Lax` parent-domain cookies (`.<domain>`), and mobile ergonomics:

- [ ] **1. Guest Checkout (Default Path)**: Open `/s/<store-slug>`, add an item to the bag, open checkout without signing in, enter a valid Nepali province/district/10-digit mobile number, and confirm quote calculation succeeds without account prompts blocking checkout.
- [ ] **2. Email OTP Sign-In & Refresh Persistence**: Open the Account sheet, request a 6-digit OTP, confirm the email arrives from `<Store Name> <auth@send.<domain>>` with no OTP leaked in browser network responses, verify the 6-digit code, **perform a full Safari page reload**, and confirm you remain signed in (`sessionid` cookie persisted on `.<domain>`).
- [ ] **3. Google Sign-In**: Sign out, reopen the Account sheet, tap **Continue with Google** (confirm GIS script loads lazily on sheet open), complete Google sign-in, and verify customer session creation. Also test `/login` with a non-merchant Google account and verify `/merchant` grants **zero** store access.
- [ ] **4. Logout**: Trigger Sign Out from the storefront Account sheet / `/s/<store-slug>/account`, refresh the page, and confirm `/s/<store-slug>/account` no longer shows authenticated profile/order history.
- [ ] **5. Cash on Delivery (COD) Order**: Place a COD order, confirm redirection to the UUID-token order tracking page (`/s/<store-slug>/orders/<token>`), and verify the order appears in the merchant fulfillment queue (`/merchant/<store-slug>/orders`).
- [ ] **6. Khalti Sandbox Order**: Place an order selecting **Khalti**, complete payment on Khalti Sandbox (`test-pay.khalti.com`), verify callback lookup transitions the order to `PAID`, and confirm status updates on the order tracking page.

---

## 6. Rollback Plan

### 6.1 Backend Rollback (Heroku)
- Inspect recent releases and roll back immediately to the last known-good slug + config:
  ```bash
  heroku releases -a <app-name>
  heroku releases:rollback v<PREVIOUS_VERSION> -a <app-name>
  ```

### 6.2 Frontend Rollback (Vercel)
- In Vercel Dashboard → **Deployments**, click **⋯ → Instant Rollback** on the previous production deployment (or run `vercel rollback` via CLI). Static/ISR assets and serverless bundles switch atomically within seconds.

### 6.3 Database Migration Caution (`DATABASE_URL_DIRECT`)
- **Critical**: `heroku releases:rollback` rolls back application code and config vars, **NOT** PostgreSQL schema changes applied during the `release` phase.
- Always author **additive / expand-contract migrations** (nullable columns, new indexes, non-destructive RLS policy updates) so version `N-1` code continues running safely against version `N` schema during a rollback.
- If a schema migration itself must be reversed, run the explicit reverse migration over the **direct** Neon connection *before* rolling back the Heroku release:
  ```bash
  heroku run "DATABASE_URL=\$DATABASE_URL_DIRECT python manage.py migrate <app_label> <previous_migration_name>" -a <app-name>
  ```
