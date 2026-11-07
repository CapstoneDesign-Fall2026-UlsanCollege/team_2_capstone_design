# ShopCraft Production Setup & Operations Runbook

Target production topology:
- **Storefront & Merchant UI**: Next.js on **Vercel** (`https://shop.<domain>`)
- **Backend API**: Django 5 + Gunicorn (`gthread`) on **Heroku Basic** (`https://api.<domain>`)
- **Database**: **Neon Serverless Postgres** with `FORCE ROW LEVEL SECURITY` (`POOLED` connection at runtime; `DIRECT` connection for migrations only)
- **Transactional Email**: **Resend HTTP API** (`EMAIL_TRANSPORT=resend_api`, default) or standard **SMTP** (`EMAIL_TRANSPORT=smtp`)
- **Payments**: **Cash on Delivery (COD)** + **Khalti** (`SANDBOX` by default; `LIVE` requires explicit opt-in)

---

## 1. Cloud Region Topology

Provision **all three compute and data tiers in the same cloud region** to eliminate cross-region network latency on SSR fetches, API calls, and pooled database transactions:

| Service | Validated Region (US East - Default) | Notes |
|---|---|---|
| **Neon Postgres Project** | `aws-us-east-1` (N. Virginia) | Serverless Postgres compute + pooled endpoint |
| **Heroku App** | `us` (Virginia) | Heroku Common Runtime US |
| **Vercel Functions** | `iad1` (Washington, D.C.) | Set in Vercel Project Settings → Functions → Function Region |

> **Why Europe is omitted**: Heroku Common Runtime `eu` is located strictly in Dublin, Ireland (`eu-west-1`), whereas Neon's European regions are in Frankfurt (`aws-eu-central-1`) and London (`aws-eu-west-2`). Neon has no Dublin region. Cross-region network routing between Heroku (Dublin) and Neon (Frankfurt/London) introduces latency on every atomic `SET LOCAL` round-trip. Therefore, the single validated production pairing is **US East** (`us` ↔ `aws-us-east-1` ↔ `iad1`).

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
| `DB_CONN_MAX_AGE` | Optional | Persistent DB connection lifetime in seconds (default `60`) |
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

All frontend variables must be scoped to **Production only**:

| Variable Name | Scope | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Production | Yes | Browser API origin: `https://api.<domain>` (no trailing slash) |
| `DJANGO_API_ORIGIN` | Production | Yes | Server-side SSR/ISR fetch origin: `https://api.<domain>` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Production | Yes | Same Google OAuth 2.0 Web Client ID as Heroku `GOOGLE_CLIENT_ID` |

> **Preview branches notice**: Vercel preview branch deployments (`*.vercel.app`) cannot log in because session cookies (`SESSION_COOKIE_DOMAIN`) and CORS/CSRF headers are strictly bound to `.<domain>` and `https://shop.<domain>`. Previews are used for visual UI inspection; full authentication and checkout workflows run on production `shop.<domain>`.

---

## 3. DNS Records to Create

Create the following records at your DNS provider for `<domain>`:

| Purpose | Host / Name | Type | Target / Value Pattern |
|---|---|---|---|
| **Backend API (Heroku)** | `api.<domain>` | `CNAME` | `<heroku-generated-dns-target>.herokudns.com` |
| **Frontend App (Vercel)** | `shop.<domain>` | `CNAME` | `cname.vercel-dns.com` |
| **Resend Bounce / Feedback MX** | `send.<domain>` | `MX` | Resend regional feedback MX host (priority `10`) |
| **Resend SPF** | `send.<domain>` | `TXT` | `v=spf1 include:amazonses.com ~all` |
| **Resend DKIM** | `resend._domainkey.<domain>` | `TXT` | Resend-generated DKIM public key (`p=...`) |
| **DMARC Policy (Initial)** | `_dmarc.<domain>` | `TXT` | `v=DMARC1; p=none;` |

> The initial DMARC record uses `v=DMARC1; p=none;` without a `rua` mailbox until a dedicated DMARC monitoring mailbox is established.

---

## 4. Ordered Deployment Runbook

### Step 1: Idempotent Neon PostgreSQL Role Setup & Execution Order

> **CRITICAL**: Do **NOT** create the runtime application role using the Neon web console. Roles created in the Neon web console inherit from `neon_superuser`, which possesses the `BYPASSRLS` attribute, completely defeating Row-Level Security. You must create the runtime role via raw SQL executed through Neon's direct connection as the database owner (`<owner_role>`).

The database provisioning lifecycle follows a strict, idempotent 4-phase order:

#### Phase 1: Pre-Migration Role & Default Privileges
**Executed by**: Migration Owner Role (`<owner_role>`, e.g. `neondb_owner`) via **DIRECT** connection URL:
```bash
psql "postgresql://<owner_role>:<owner-password>@ep-<endpoint>.us-east-1.aws.neon.tech/<dbname>?sslmode=require"
```
Pass variables to `backend/scripts/neon_roles.sql` (variables are safely escaped via `format()` and executed via `\gexec` so passwords are never hardcoded):
```sql
\set owner_role 'neondb_owner'
\set runtime_role 'shopcraft_app'
\set runtime_password '<runtime-password>'
\i backend/scripts/neon_roles.sql
```
This idempotently provisions `<runtime_role>` with `NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`, grants schema usage, and sets `ALTER DEFAULT PRIVILEGES` for future tables.

#### Phase 2: Schema Migrations
**Executed by**: Heroku release phase as `<owner_role>` via `DATABASE_URL_DIRECT`:
```bash
python manage.py migrate --noinput
```
Applies all table DDL, RLS policies (excluding `app.bypass_rls`), and composite indexes.

#### Phase 3: Post-Migration Re-Grant
**Executed by**: Migration Owner Role (`<owner_role>`) via **DIRECT** connection:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO shopcraft_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO shopcraft_app;
```
Ensures all tables and sequences created during migrations are explicitly accessible to `<runtime_role>`.

#### Phase 4: Post-Deploy Verification Queries
**Executed by**: Runtime Application Role (`<runtime_role>`, e.g. `shopcraft_app`) via **POOLED** connection (`DATABASE_URL`). Detailed in Step 6.

### Step 2: Back Up Encryption Key in Password Manager

Generate the Fernet encryption key and immediately store it in your team password manager (e.g. 1Password / Bitwarden):
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
> **CAUTION**: If `FIELD_ENCRYPTION_KEY` is lost, all encrypted credentials stored on the `Store` model (such as Khalti keys) become permanently unrecoverable.

### Step 3: Verify Sending Subdomain in Resend

1. Add `send.<domain>` in Resend → **Domains**.
2. Publish the `MX`, `TXT` (`send.<domain>`), `TXT` (`resend._domainkey.<domain>`), and `_dmarc.<domain>` DNS records from Section 3.
3. Wait until Resend marks `send.<domain>` **Verified**, then create a sending-restricted API key for `RESEND_API_KEY` and set `DEFAULT_FROM_EMAIL=auth@send.<domain>`.

### Step 4: Configure Google Cloud OAuth 2.0 Web Client

1. In Google Cloud Console → **APIs & Services → OAuth consent screen**:
   - Configure external user type and brand information.
   - **Publishing status**: Set publishing status to **In production**. (*If left in "Testing" mode, only explicitly whitelisted test accounts can sign in, causing generic authentication failures for all other users*).
2. Under **Credentials → Create Credentials → OAuth client ID (Web application)**:
   - **Authorized JavaScript origins**: `https://shop.<domain>`
   - **Authorized redirect URIs**: Leave empty (GIS popup/button verifies ID tokens server-side via REST API).
3. Copy the Client ID into Heroku `GOOGLE_CLIENT_ID` and Vercel `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

### Step 5: Provision Backend on Heroku Basic & First Migration

1. Create the Heroku app (Basic dyno) **without** Heroku Postgres:
   ```bash
   heroku create <app-name> --region us
   heroku stack:set heroku-24 -a <app-name>
   heroku git:remote -a <app-name>
   heroku domains:add api.<domain> -a <app-name>
   heroku certs:auto:enable -a <app-name>
   ```
2. Point your DNS `CNAME` for `api.<domain>` to the target output by `heroku domains -a <app-name>`.
3. Set all required Heroku config vars from Section 2.1 (`heroku config:set ... -a <app-name>`).
4. Push backend to Heroku:
   - If deploying from `prod/hardening-launch`:
     ```bash
     git subtree push --prefix backend heroku prod/hardening-launch:main
     ```
   - After merging to `main`:
     ```bash
     git subtree push --prefix backend heroku main:main
     ```
   During the release phase, Heroku executes:
   `release: DATABASE_URL=$DATABASE_URL_DIRECT python manage.py migrate --noinput`

### Step 6: Verify Database After First Migrate

Connect via `psql` through the **POOLED** connection URL (`DATABASE_URL`) as the `<runtime_role>` to verify:

1. **Verify Role Attributes**:
   ```sql
   SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;
   ```
   **Expected output**:
   ```
        rolname     | rolsuper | rolbypassrls 
   -----------------+----------+--------------
    <runtime_role>  | f        | f
   ```
   Both `rolsuper` and `rolbypassrls` **must be `f`** (false).

2. **Verify FORCE ROW LEVEL SECURITY on all Tenant Tables**:
   ```sql
   SELECT relname, relrowsecurity, relforcerowsecurity
   FROM pg_class
   WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
     AND relname IN (
       'stores_storemembership',
       'stores_customer',
       'stores_merchantauditlog',
       'catalog_product',
       'catalog_variant',
       'catalog_discount',
       'orders_order',
       'orders_orderitem',
       'orders_orderevent'
     )
   ORDER BY relname;
   ```
   **Expected output**: Every tenant table must show `t | t`:
   ```
            relname          | relrowsecurity | relforcerowsecurity 
   --------------------------+----------------+---------------------
    catalog_discount         | t              | t
    catalog_product          | t              | t
    catalog_variant          | t              | t
    orders_order             | t              | t
    orders_orderevent        | t              | t
    orders_orderitem         | t              | t
    stores_customer          | t              | t
    stores_merchantauditlog  | t              | t
    stores_storemembership   | t              | t
   (9 rows)
   ```
   > **Note on Tenant Tables**: There are **exactly 9 tenant tables** referencing `stores_store(id)`. The table `stores_storepaymentgateway` does not exist because payment gateway configurations (including Khalti API keys) are encrypted directly on the `Store` model. Furthermore, all data migrations in the codebase run safely under `TenantDatabaseContext` or `BypassRLSContext`.

3. **Verify Two-Store RLS Isolation via Pooled Connection**:
   Execute within an explicit transaction block:
   ```sql
   BEGIN;
   SELECT set_config('app.current_store_id', '1', true);
   SELECT count(*) FROM catalog_product; -- Sees only Store 1 products
   SELECT set_config('app.current_store_id', '2', true);
   SELECT count(*) FROM catalog_product; -- Sees only Store 2 products
   COMMIT;
   ```

4. **Verify Health Check & Email Transport**:
   ```bash
   curl -i https://api.<domain>/api/health/
   heroku run python manage.py send_test_email <your-inbox-address> -a <app-name>
   ```

### Step 7: Deploy Frontend on Vercel

1. Import the repository into Vercel with **Root Directory** set to `frontend`.
2. Set `NEXT_PUBLIC_API_BASE_URL`, `DJANGO_API_ORIGIN`, and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` scoped to **Production** only.
3. Attach custom domain `shop.<domain>` in Vercel → **Domains** and configure the `CNAME` record from Section 3.
4. Trigger production deployment.

### Step 8: Configure Rate Limit Cleanup (Heroku Scheduler)

Add the Heroku Scheduler add-on to run daily purging of expired `ActionRateLimit` records:
```bash
heroku addons:create scheduler:standard -a <app-name>
heroku addons:open scheduler -a <app-name>
```
In the Scheduler web UI, add a daily job:
- **Command**: `python manage.py cleanup_rate_limits --hours 24`
- **Schedule**: Daily at 02:00 UTC
- **Dyno Size**: Basic (Free with standard tier)

> Note: `ActionRateLimit` also performs opportunistic cleanup in the request path, so the table remains bounded even if the scheduler runs intermittently.

### Step 9: Verify Client-IP Rate-Limit Resolution (Two-Device Check)

1. Temporarily enable salted IP hash logging on Heroku:
   ```bash
   heroku config:set LOG_HASHED_CLIENT_IP=True -a <app-name>
   ```
2. Load `https://shop.<domain>` from **Device A** (Wi-Fi) and **Device B** (cellular LTE/5G) and watch `heroku logs --tail -a <app-name>`.
3. Confirm the two requests log **different** 12-char `client_ip_hash=` values (proving `HTTP_X_FORWARDED_FOR` rightmost router IP resolution is distinguishing clients).
4. Turn the flag back off:
   ```bash
   heroku config:set LOG_HASHED_CLIENT_IP=False -a <app-name>
   ```

---

## 5. Post-Deploy Smoke-Test Checklist (iPhone Safari)

Run all checks in **iPhone Safari** (both regular and private tabs) over cellular / Wi-Fi against `https://shop.<domain>`:

- [ ] **0. Merchant Signup & Shop Creation**:
  - Visit `https://shop.<domain>/merchant` with a new email.
  - Sign in via Email OTP (and separately via Google Sign-In) with an account having no existing store.
  - Tap **Create your shop →** (or visit `/merchant/new`).
  - Enter shop name and custom slug (validated for length 3-60, valid characters, and reserved system routes).
  - Submit creation. Confirm the shop is created, the user is assigned the `OWNER` role, and the merchant dashboard opens.
  - Verify strict cross-store isolation: attempt to navigate to any other store's merchant endpoints and confirm immediate 404 / access denial.
  - Verify that attempting to create more than 3 stores is rejected by the per-user ownership cap.
- [ ] **1. Guest Checkout (Default Path)**: Open `/s/<store-slug>`, add an item to the bag, open checkout without signing in, enter Nepali province/district/10-digit mobile number, and confirm quote calculation succeeds without account prompts blocking checkout.
- [ ] **2. Email OTP Sign-In & Refresh Persistence**: Open Account sheet, request a 6-digit OTP, confirm email arrives from `<Store Name> <auth@send.<domain>>` with zero code in responses, verify the 6-digit code, **perform a full Safari page reload**, and confirm you remain signed in (`sessionid` cookie persisted on `.<domain>`).
- [ ] **3. Google Sign-In**: Sign out, reopen Account sheet, tap **Continue with Google** (confirm GIS script loads lazily on sheet open), complete sign-in, and verify customer session creation. Also test `/login` with a non-merchant Google account and verify `/merchant` grants **zero** store access.
- [ ] **4. Logout**: Trigger Sign Out from the storefront Account sheet / `/s/<store-slug>/account`, refresh, and confirm profile/orders are cleared.
- [ ] **5. Cash on Delivery (COD) Order**: Place a COD order, confirm redirection to the UUID-token tracking page (`/s/<store-slug>/orders/<token>`), and verify order appears in merchant fulfillment queue (`/merchant/<store-slug>/orders`).
- [ ] **6. Khalti Sandbox Order**: Place an order selecting **Khalti**, complete payment on Khalti Sandbox (`test-pay.khalti.com`), verify callback transitions the order to `PAID`, and confirm status updates on the tracking page.

---

## 6. Rollback Plan

### 6.1 Backend Rollback (Heroku)
```bash
heroku releases -a <app-name>
heroku releases:rollback v<PREVIOUS_VERSION> -a <app-name>
```

### 6.2 Frontend Rollback (Vercel)
In Vercel Dashboard → **Deployments**, click **⋯ → Instant Rollback** on the previous production deployment (or run `vercel rollback`).

### 6.3 Database Migration Caution (`DATABASE_URL_DIRECT`)
- `heroku releases:rollback` rolls back application code and config vars, **NOT** PostgreSQL schema changes applied during the release phase.
- Always author additive / expand-contract migrations so version `N-1` code continues running safely against version `N` schema.
- If a schema migration itself must be reversed, run the explicit reverse migration over the **direct** Neon connection *before* rolling back the Heroku release:
  ```bash
  heroku run "DATABASE_URL=\$DATABASE_URL_DIRECT python manage.py migrate <app_label> <previous_migration_name>" -a <app-name>
  ```
