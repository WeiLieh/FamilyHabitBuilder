-- =============================================================================
-- src/datastore/supabase/migrations/008_remove_thin_slice_sign_up.sql: remove the old one-step sign-up
--
-- What it does: [2026-11-12 SGT] removes the database function sign_up
-- (migration 006, thin slice 1). It created a parent straight away at /start,
-- before the person had agreed to anything. Since pull request 2 of 3, the
-- bot signs people up through the sign-up draft instead (migration 007:
-- start_sign_up, save_sign_up_step, finish_sign_up), so nothing personal
-- reaches the real tables before "I agree" (rule 8.13).
--
-- Why remove it rather than leave it: a function nobody calls is a second,
-- unguarded way in (it skips the draft and the agreement), and old code is
-- tech debt (CLAUDE.md rule 12; review finding P4, 12 Nov). Parents it already
-- created (the owner's own account) are not touched.
--
-- How to apply: Supabase > SQL Editor > a fresh tab > paste this file > Run,
-- once, AFTER migration 007, and only after pull request 2's bot is live on
-- Vercel (the old bot still calls sign_up). After it has run on the real
-- project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T81).
-- =============================================================================

begin;

drop function public.sign_up(bigint, text, text, text, integer, bigint, bigint, jsonb);

commit;
