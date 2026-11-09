-- =============================================================================
-- src/datastore/supabase/migrations/004_remove_wrap_up_switch.sql: remove the Weekly Wrap Up's own on/off switch
--
-- What it does: [2026-11-09 SGT] the owner decided on 9 Nov (rule 3.12) that
-- there is ONE Pause switch, and it stops every message the bot starts:
-- nudges, the Weekly Wrap Up and the connection question. So the Wrap Up no
-- longer has an on/off switch of its own. This removes:
--   * the column parents.wrap_up_on;
--   * the old settings function that wrote it, replaced by one that changes
--     only paused and the Wrap Up time (narrow edit 1 of rule 8.4);
--   * the column from the Telemetry view telemetry_parents (rebuilt without it).
--
-- Why it is built this way:
--   * Migration 003 has already run on the real project, so it is never
--     edited (rule B1); this new file makes the change instead.
--   * Everything is inside one transaction ("begin" ... "commit"): if any step
--     fails, nothing is changed. Like a bank transfer, all or nothing.
--   * The view depends on the column, so the view goes first and comes back last.
--   * New functions and views start with wide default permissions in Supabase,
--     so the same lock-down as migration 003 is repeated: take everything away,
--     then give our server (service_role) only what it needs.
--   * No data is lost that matters: wrap_up_on was always "on" (nothing sends
--     messages yet), and the Wrap Up time (wrap_up_minute) is kept.
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once, AFTER
-- migration 003. After it has run on the real project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T2, T42).
-- =============================================================================

begin;

-- ---- 1. Take away the view and the old function that use the column ----
drop view public.telemetry_parents;
drop function public.update_parent_settings(bigint, boolean, boolean, integer, bigint, jsonb);

-- ---- 2. Remove the switch itself ----
alter table public.parents drop column wrap_up_on;
comment on table public.parents is 'One parent. The server adds parents and changes only paused and the Wrap Up time, through update_parent_settings (rule 8.4). One Pause switch stops every message the bot starts (rule 3.12).';

-- ---- 3. The new settings function: paused and the Wrap Up time only ----
-- Narrow edit 1 of rule 8.4. It also writes a "settings_changed" event, and
-- refuses a parent who doesn't exist (same as the old one, minus the switch).
create function public.update_parent_settings(p_parent bigint, p_paused boolean, p_wrap_up_minute integer,
                                              p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update parents set paused = p_paused, wrap_up_minute = p_wrap_up_minute where id = p_parent;
  if not found then raise exception 'No parent %', p_parent; end if;
  perform write_event(p_parent, 'settings_changed', p_version, p_variants);
end $$;
comment on function public.update_parent_settings(bigint, boolean, integer, bigint, jsonb) is
  'Change a parent''s paused setting and Wrap Up time, with an event (rule 8.4, edit 1). The one Pause switch stops nudges, the Wrap Up and the connection question (rule 3.12).';

-- ---- 4. The Telemetry view again, without the column (rule 8.11) ----
-- Still no names or Telegram IDs.
create view public.telemetry_parents with (security_invoker = true) as
  select id, signed_up_on, cohort, paused, wrap_up_minute, created_at from public.parents;

-- ---- 5. Lock down, then give our server only what it needs (rules 8.2, 8.4) ----
revoke all on public.telemetry_parents from public, anon, authenticated, service_role;
revoke all on function public.update_parent_settings(bigint, boolean, integer, bigint, jsonb)
  from public, anon, authenticated, service_role;
grant select on public.telemetry_parents to service_role;
grant execute on function public.update_parent_settings(bigint, boolean, integer, bigint, jsonb) to service_role;

commit;
