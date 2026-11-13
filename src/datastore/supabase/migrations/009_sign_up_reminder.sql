-- =============================================================================
-- src/datastore/supabase/migrations/009_sign_up_reminder.sql: the one 24-hour sign-up reminder
--
-- What it does: [2026-11-13] someone who stops part-way through sign-up gets
-- ONE reminder ("You're almost there! … Carry on") 24 hours after their last
-- answer, and never another (owner, Q11b, 12 Nov). This migration gives the
-- database what it needs for that:
--   1. a "reminded" mark on each sign-up draft (sign_up_drafts.reminded_at);
--   2. a function, claim_sign_up_reminders, that the bot's alarm clock calls
--      every 10 minutes (pull request 3c). In one step it finds the drafts due
--      their reminder, marks them, and returns who they are.
--
-- Why "mark, then send" in one step: the alarm clock runs every 10 minutes and
-- two runs can overlap. Marking and returning in a single statement, with the
-- rows locked, means only one run can ever take a given person, like taking a
-- numbered ticket. If Telegram then fails to deliver, the bot logs it and does
-- not try again: one reminder only, so missing one is better than sending two.
--
-- Who is due: not cut down (still active), never reminded, and quiet for at
-- least sign_up_reminder_after_hours (24, from src/settings.ts via the
-- settings version, rule 1.4; refused if the version has no such number,
-- rule 1.3; and refused below 1 hour). The hours of the day it may be sent (7:00 am to 9:30 pm, owner's
-- D7) are the bot's job, not the database's.
--
-- How to apply: Supabase > SQL Editor > a fresh tab > paste this file > Run,
-- once, after migration 008. Nothing changes for anyone until pull request 3c,
-- because nothing calls the function before then. After it has run on the real
-- project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T82 to T90).
-- =============================================================================

begin;

-- 1. The mark: when this person was sent their one reminder (empty = not yet).
--    Saving another step never clears it, so it can only ever happen once.
alter table public.sign_up_drafts add column reminded_at timestamptz;
comment on column public.sign_up_drafts.reminded_at is
  'When the one 24-hour sign-up reminder was claimed for this person (Q11b); empty = not yet. Never cleared.';

-- 2. Find, mark and return the drafts due their reminder, in one statement.
create function public.claim_sign_up_reminders(p_version bigint)
returns table (telegram_id bigint, step text)
language plpgsql security definer set search_path = public, pg_temp as $$
declare after_hours numeric := setting_number(p_version, 'sign_up_reminder_after_hours');
begin
  -- A mistyped 0 (or less) would remind everyone part-way through sign-up at
  -- once: refuse it rather than guess (rule 1.3; review finding, 13 Nov).
  if after_hours < 1 then
    raise exception 'sign_up_reminder_after_hours must be at least 1 hour (settings version %).', p_version;
  end if;
  return query
  with due as (
    select d.id from sign_up_drafts d
    where d.cut_down_at is null
      and d.reminded_at is null
      and d.last_activity_at <= now() - make_interval(hours => after_hours::int)
    for update skip locked  -- a row another run is already taking is left to that run
  )
  update sign_up_drafts d set reminded_at = now()
  from due where d.id = due.id
  returning d.telegram_id, d.step;
end $$;
comment on function public.claim_sign_up_reminders(bigint) is
  'Marks and returns the sign-up drafts due their one reminder: active, never reminded, quiet for sign_up_reminder_after_hours (from the settings version). One step, so overlapping runs never send two (Q11b).';

-- 3. Locks: only our server may run it (as for every other function).
revoke all on function public.claim_sign_up_reminders(bigint) from public, anon, authenticated, service_role;
grant execute on function public.claim_sign_up_reminders(bigint) to service_role;

commit;
