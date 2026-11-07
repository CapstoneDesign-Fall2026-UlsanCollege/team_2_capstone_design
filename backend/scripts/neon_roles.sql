-- ==============================================================================
-- ShopCraft Neon PostgreSQL Production Role Setup Script
-- File: backend/scripts/neon_roles.sql
--
-- IMPORTANT:
-- Run these statements using a PostgreSQL client connected as the database
-- migration owner (or neon_superuser), such as psql over Neon's DIRECT connection.
--
-- DO NOT create the runtime application role using the Neon web console.
-- Roles created in the Neon web console inherit from 'neon_superuser', which has
-- BYPASSRLS enabled. By creating the role via explicit SQL with NOBYPASSRLS,
-- we guarantee that PostgreSQL Row-Level Security (RLS) is strictly enforced.
--
-- Replace placeholders before running:
--   <owner_role>        : The migration owner role (e.g. neondb_owner)
--   <runtime_role>      : The runtime application role name (e.g. shopcraft_app)
--   <runtime-password>  : Strong random password for the runtime application role
-- ==============================================================================

-- 1. Create the runtime application role with NOSUPERUSER and NOBYPASSRLS
-- Executed by: <owner_role> (or superuser)
CREATE ROLE <runtime_role> LOGIN PASSWORD '<runtime-password>' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;

-- 2. Grant schema usage to the runtime role
-- Executed by: <owner_role> (or superuser)
GRANT USAGE ON SCHEMA public TO <runtime_role>;

-- 3. Grant DML privileges on all existing tables and sequences
-- Executed by: <owner_role> (or superuser)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO <runtime_role>;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO <runtime_role>;

-- 4. Alter default privileges so future tables and sequences created by migrations
-- (which run as <owner_role>) are automatically accessible to <runtime_role>
-- Executed by: <owner_role>
ALTER DEFAULT PRIVILEGES FOR ROLE <owner_role> IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO <runtime_role>;
ALTER DEFAULT PRIVILEGES FOR ROLE <owner_role> IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO <runtime_role>;
