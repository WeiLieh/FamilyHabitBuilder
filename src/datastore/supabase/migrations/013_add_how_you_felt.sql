-- =============================================================================
-- Migration 013: "Add how you felt", a line added to a log after it was saved
--
-- What it does, in plain English: [2026-11-24] rule 5.3's optional line
-- ("how did it feel", up to 280 characters) can now be added after the log
-- is saved, as the owner designed on 8 Nov and approved as a database change
-- on 24 Nov (rule 8.4, new narrow edit 15):
--   1. Two new columns on habit_logs: when the parent tapped "Add how you
--      felt" (line_asked_at), and which Telegram message the line came in
--      (line_update_id, so a message Telegram delivers twice is saved once).
--   2. ask_for_line: the tap. Only the parent's own log, not undone, with no
--      line yet. It notes the time; it saves no words.
--   3. add_log_line: the typed line. It goes to the parent's most recently
--      asked log, only within the wait (line_wait_seconds, 10 minutes, read
--      from the settings version), only if that log has no line and isn't
--      undone. The line is set once: it is never rewritten (to change it, the
--      parent deletes it on My page and asks again).
-- An event without the words is written (Telemetry sees that a line was
-- added, never what it says). Run once in Supabase's SQL Editor after 012.
-- Tests: src/datastore/supabase/tests/web-app-access.test.sql (T121 to T123).
-- =============================================================================

alter table public.habit_logs add column line_asked_at timestamptz;
alter table public.habit_logs add column line_update_id bigint unique;
comment on column public.habit_logs.line_asked_at is 'When the parent last tapped "Add how you felt" on this log (rule 5.3); empty if never.';
comment on column public.habit_logs.line_update_id is 'The Telegram message the "how you felt" line came in, so a resent message is saved once.';

insert into public.event_types (name, meaning, metric) values
  ('log_line_added', 'A parent added a "how you felt" line to a saved log (rule 5.3). The words are never in the event.', null);

-- The tap on "Add how you felt". Answers 'asked', or 'has_line' if the log has
-- one already. Another parent's log, or an undone one, is refused.
create function public.ask_for_line(p_parent bigint, p_log bigint)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare g record;
begin
  select parent_id, undone_at, description into g from habit_logs where id = p_log;
  if g.parent_id is distinct from p_parent then raise exception 'That log does not belong to this parent.'; end if;
  if g.undone_at is not null then raise exception 'That log was undone, so it can''t take a line.'; end if;
  if g.description is not null then return 'has_line'; end if;
  update habit_logs set line_asked_at = now() where id = p_log;
  return 'asked';
end $$;

-- The typed line. Answers 'saved', 'duplicate' (this Telegram message was
-- already saved), or 'none' (no log is waiting for a line). Over 280
-- characters is refused by the column's own check.
create function public.add_log_line(p_parent bigint, p_text text, p_update bigint, p_version bigint, p_variants jsonb)
returns text language plpgsql security definer set search_path = public, pg_temp as $$
declare l bigint; wait_seconds numeric := setting_number(p_version, 'line_wait_seconds');
begin
  if exists (select 1 from habit_logs where line_update_id = p_update) then return 'duplicate'; end if;
  if btrim(coalesce(p_text, '')) = '' then raise exception 'A line can''t be empty.'; end if;
  select id into l from habit_logs
   where parent_id = p_parent and undone_at is null and description is null
     and line_asked_at >= now() - make_interval(secs => wait_seconds)
   order by line_asked_at desc, id desc limit 1;
  if l is null then return 'none'; end if;
  update habit_logs set description = p_text, line_update_id = p_update where id = l;
  perform write_event(p_parent, 'log_line_added', p_version, p_variants, p_update);
  return 'saved';
end $$;

-- New functions start locked; only our server (the bot) may use them.
revoke all on function public.ask_for_line(bigint, bigint), public.add_log_line(bigint, text, bigint, bigint, jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.ask_for_line(bigint, bigint), public.add_log_line(bigint, text, bigint, bigint, jsonb) to service_role;
