-- =============================================================================
-- src/datastore/supabase/content/2026-10-29_unlock_all_nudges.sql
--
-- What it does: sets "starts unlocked" to yes for the 3 deliberate nudges that
-- started locked (SGE Setting a good example, ITE Incidental teaching, ASD
-- Ask-say-do). Rule 2.2 changed on 29 Oct: unlocks are out of the MVP, so all
-- 9 nudges start unlocked. The "starts unlocked" setting stays in the table,
-- ready for when unlocks return after the MVP.
--
-- Safety: only rows that are still locked are changed; running it twice
-- changes nothing the second time.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run.
-- Expected result: a list of 3 rows (SGE, ITE, ASD), now unlocked.
-- =============================================================================

update public.nudges
set starts_unlocked = true
where code in ('SGE', 'ITE', 'ASD')
  and starts_unlocked = false   -- only if still locked
returning id, code, name, starts_unlocked;
