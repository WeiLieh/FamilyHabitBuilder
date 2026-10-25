-- =============================================================================
-- supabase/migrations/002_service_role_read_only.sql: make our server read-only
--
-- Why: after running 001 on the real Supabase project, a check showed that
-- Supabase's defaults had also given our server's role ("service_role") the
-- TRUNCATE (wipe all rows), TRIGGER and REFERENCES permissions on the nudges
-- and examples tables and the combined view. We only want it to READ the two
-- tables (least privilege). See docs/ERROR-LOG.md.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run. Safe to run
-- more than once: it always ends with the same permissions.
-- =============================================================================

-- Take every permission away from our server's role on these three...
revoke all on public.nudges, public.examples, public.nudge_examples_view from service_role;

-- ...then give back only what the app needs: reading the two tables.
grant select on public.nudges, public.examples to service_role;
