-- ==============================================================================
-- ShopCraft Neon PostgreSQL Production Role Setup Script
-- File: backend/scripts/neon_roles.sql
--
-- USAGE IN PSQL:
-- Connect as the migration owner role (e.g. neondb_owner) via the DIRECT connection:
--
--   psql "postgresql://<owner_role>:<owner-password>@ep-<endpoint>.us-east-1.aws.neon.tech/<dbname>?sslmode=require"
--
-- Set psql variables (no hardcoded passwords in files):
--   \set owner_role 'neondb_owner'
--   \set runtime_role 'shopcraft_app'
--   \set runtime_password '<runtime-password>'
--
-- Then run this script:
--   \i backend/scripts/neon_roles.sql
--
-- ORDER OF EXECUTION:
-- Phase 1 (Pre-Migration): Create role + alter default privileges (<owner_role>)
-- Phase 2 (Release Phase): heroku run python manage.py migrate (<owner_role>)
-- Phase 3 (Post-Migration Re-Grant): Re-run explicit grants (<owner_role>)
-- Phase 4 (Verification): Run verification queries (<runtime_role> via POOLED)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PHASE 1: PRE-MIGRATION ROLE SETUP (Executed by <owner_role> / superuser)
-- ------------------------------------------------------------------------------

-- 1. Create or update runtime role with NOSUPERUSER and NOBYPASSRLS
-- (Uses format() + \gexec so variables are properly expanded and escaped)
SELECT format(
    $sql$
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = %L) THEN
            EXECUTE format('CREATE ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS', %L, %L);
        ELSE
            EXECUTE format('ALTER ROLE %I WITH NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS', %L);
        END IF;
    END
    $$;
    $sql$,
    :'runtime_role',
    :'runtime_role', :'runtime_password',
    :'runtime_role'
) \gexec

-- 2. Grant schema usage
SELECT format('GRANT USAGE ON SCHEMA public TO %I;', :'runtime_role') \gexec

-- 3. Configure default privileges for future migrations run by <owner_role>
SELECT format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I;', :'owner_role', :'runtime_role') \gexec
SELECT format('ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I;', :'owner_role', :'runtime_role') \gexec

-- ------------------------------------------------------------------------------
-- PHASE 2: RUN MIGRATIONS
-- (Executed by <owner_role> during Heroku release phase via DATABASE_URL_DIRECT)
-- Command: python manage.py migrate --noinput
-- ------------------------------------------------------------------------------

-- ------------------------------------------------------------------------------
-- PHASE 3: POST-MIGRATION RE-GRANT (Executed by <owner_role> / superuser)
-- (Idempotently re-grants permissions on all existing tables/sequences)
-- ------------------------------------------------------------------------------
SELECT format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I;', :'runtime_role') \gexec
SELECT format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I;', :'runtime_role') \gexec

-- ------------------------------------------------------------------------------
-- PHASE 4: POST-DEPLOY VERIFICATION QUERIES
-- (Executed by <runtime_role> via POOLED connection string DATABASE_URL)
-- ------------------------------------------------------------------------------
-- 1. Verify runtime role has NO superuser and NO bypassrls privileges (both 'f'):
-- SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user;
--
-- 2. Verify all tenant tables enforce row level security (all 't | t'):
-- SELECT relname, relrowsecurity, relforcerowsecurity FROM pg_class
-- WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
-- AND relname IN (
--   'stores_storemembership', 'stores_customer', 'stores_merchantauditlog',
--   'catalog_product', 'catalog_variant', 'catalog_discount',
--   'orders_order', 'orders_orderitem', 'orders_orderevent'
-- ) ORDER BY relname;
--
-- 3. Verify two-tenant isolation in an atomic block via pooled URL:
-- BEGIN;
-- SELECT set_config('app.current_store_id', '1', true);
-- SELECT count(*) FROM catalog_product;
-- SELECT set_config('app.current_store_id', '2', true);
-- SELECT count(*) FROM catalog_product;
-- COMMIT;
