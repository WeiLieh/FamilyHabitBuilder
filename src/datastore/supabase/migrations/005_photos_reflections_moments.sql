-- =============================================================================
-- src/datastore/supabase/migrations/005_photos_reflections_moments.sql: photos, reflections, moments, Undo
--
-- What it does: [2026-11-11 SGT] the Datastore change agreed with the owner on
-- 11 Nov (Option 1 of the proposal in src/datastore/SPEC.md), for the designs
-- of 9 Nov (Telegram B1 parts 2 and 3, B2):
--   * photos: one table for every photo, from a log or a moment. A photo is
--     added to a log that is already saved (the photo check is an add-on), so
--     the log row never has to change. "Photo-checked" = the log has a photo
--     that passed; otherwise the log is self-reported (rules 6.1, 6.2).
--   * reflections: typed lines that are not habit logs (rule 5.4).
--   * moment_lines: the one line a parent may save from a Wrap Up (rule 7.7).
--   * habit_logs: logs are for today only (rule 5.4); each log says how it was
--     made (logged_via); it can be undone (undone_at, rule 5.8). The photo
--     columns move out to photos.
--   * Undo and delete-a-photo: edits 5, 6 and 7 of rule 8.4.
--   * The connection question becomes its own kind of sent message, and an
--     answer is refused after its window (rule 5.6).
--   * New kinds of event (rule 10.2).
--
-- Why it is built this way:
--   * Add-only stays add-only: new things go in new rows. The only changes to
--     saved rows are the narrow edits, each in an all-or-nothing function that
--     also writes an event.
--   * Numbers are not repeated here (rule 1.4): the Undo window and the answer
--     window are read from the settings version stamped on the event
--     (src/settings.ts, SETTINGS_KEYS_THE_DATABASE_READS). If the version has
--     no such value, the action is refused rather than guessed (rule 1.3).
--   * The 24-hour wait after "Add a moment" is checked by the app only: the
--     database can't see the button tap. The database does refuse a moment for
--     any week but the latest Wrap Up's, and a second photo or line that week.
--   * Everything is in one transaction: if any step fails, nothing changes.
--   * New tables, views and functions get the same lock-down as migration 003.
--   * No real data is lost: no bot exists yet, so habit_logs holds no real rows
--     (the owner checks this before running it).
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once, AFTER
-- migration 004. After it has run on the real project, never edit it (rule B1).
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T20 to T25,
-- T43 to T53, and the table-wide checks T1, T6, T37, T41).
-- =============================================================================

begin;

-- ---- 1. New kinds of event (rule 10.2) ---------------------------------------
insert into public.event_types (name, meaning, metric) values
  ('connection_question_sent',   'The bot sent the weekly connection question (not a nudge, rule 10.2).',    'connection rating (10)'),
  ('connection_question_expired','The connection question expired after its window, unanswered.',          'connection rating (10)'),
  ('reflection_saved',           'A typed line was saved as a reflection, not a habit log (rule 5.4).',      null),
  ('moment_saved',               'A parent saved a moment (a photo or a line) from the Wrap Up (rule 7.7).', null),
  ('self_report_confirmed',      'A parent tapped "Yes, I did it" after an unclear photo (rules 6.1, 6.2).', null),
  ('claude_matching_failed',     'Matching a typed message to a habit failed; nothing was saved (rule 5.1).', null),
  ('photo_added',                'A photo was added to a saved log.',                                        null),
  ('photo_deleted',              'A parent deleted a photo (rule 8.4, edit 6).',                             null),
  ('log_undone',                 'A parent undid a keyboard log within its window (rule 5.8).',              null);

-- ---- 2. The connection question as its own kind of sent message (rule 5.6) ---
alter table public.messages_sent drop constraint messages_sent_kind_check;
alter table public.messages_sent drop constraint messages_sent_check;
alter table public.messages_sent add constraint messages_sent_kind_check
  check (kind in ('nudge', 'wrap_up', 'connection_question'));
-- A nudge message names its nudge, example and slot; the Sunday messages name none.
alter table public.messages_sent add constraint messages_sent_check
  check ((kind = 'nudge' and nudge_id is not null and example_id is not null and slot_minute is not null)
      or (kind in ('wrap_up', 'connection_question') and nudge_id is null and example_id is null and slot_minute is null));
-- One connection question per parent per Monday-to-Sunday week (rule 8.6).
create unique index messages_one_question_a_week on public.messages_sent (parent_id, (date_trunc('week', for_day::timestamp)))
  where kind = 'connection_question';
comment on table public.messages_sent is 'One message the bot started: a nudge message, the Weekly Wrap Up summary or the connection question. Add only.';
comment on column public.messages_sent.kind is 'nudge, wrap_up or connection_question.';

-- ---- 3. habit_logs: today only, how it was made, Undo; photos move out -------
drop view public.telemetry_habit_logs;
drop function public.save_habit_log(bigint, bigint, date, bigint, text, text, text, text, bigint, bigint, jsonb);
alter table public.habit_logs drop column photo_path, drop column photo_check, drop column recorded_as;
alter table public.habit_logs
  add column logged_via text not null check (logged_via in ('done_button', 'keyboard', 'log_command', 'typed')),
  add column undone_at timestamptz,
  -- A Done-button log always names the nudge message it came from.
  add constraint habit_logs_done_names_message check (logged_via <> 'done_button' or from_message_id is not null);
comment on table public.habit_logs is 'A parent says "I did it", for today only (rule 5.4). Add only, except Undo (rule 8.4, edits 5 and 7). Its photo, if any, is in photos.';
comment on column public.habit_logs.for_day is 'The Singapore day it was done: always the day it was logged (rule 5.4, today only).';
comment on column public.habit_logs.logged_via is 'How it was logged: done_button, keyboard, log_command or typed (rule 5.1). Only keyboard logs can be undone (rule 5.8).';
comment on column public.habit_logs.undone_at is 'When the parent undid it (rule 5.8); empty if not undone. Undone logs never count.';
comment on column public.habit_logs.description is 'Optional "how you felt" line, up to 280 characters. Free text: may mention a child, so never shown to Telemetry. Blanked when the log is undone.';

-- ---- 4. photos: every photo, from a log or a moment ---------------------------
create table public.photos (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  log_id bigint references public.habit_logs (id) on delete cascade,
  moment_week date check (extract(isodow from moment_week) = 1),
  storage_path text not null check (btrim(storage_path) <> ''),
  -- error = the check could not run (an outage): never recorded as failed (rule 1.3).
  check_result text not null check (check_result in ('passed', 'failed', 'error', 'not_checked')),
  created_at timestamptz not null default now(),
  -- Exactly one owner: a log or a moment.
  check ((log_id is null) <> (moment_week is null)),
  -- A log photo is always checked (passed, failed or error); a moment photo never is (B2, question 11).
  check ((log_id is not null and check_result <> 'not_checked') or (moment_week is not null and check_result = 'not_checked'))
);
create unique index photos_one_per_log on public.photos (log_id) where log_id is not null;
create unique index photos_one_moment_a_week on public.photos (parent_id, moment_week) where moment_week is not null;
comment on table public.photos is 'One photo a parent sent, for a log or a moment. Add only, except "delete a photo" and Undo (rule 8.4, edits 6 and 7).';
comment on column public.photos.id is 'A number the database makes up.';
comment on column public.photos.parent_id is 'Which parent.';
comment on column public.photos.log_id is 'The habit log it belongs to; empty for a moment photo.';
comment on column public.photos.moment_week is 'The Monday of the week it was saved as a moment for; empty for a log photo.';
comment on column public.photos.storage_path is 'Where the photo file is in storage. Personal: never shown to Telemetry.';
comment on column public.photos.check_result is 'passed, failed (Claude judged it did not fit), error (the check could not run) or not_checked (a moment photo).';
comment on column public.photos.created_at is 'When the row was added.';

-- ---- 5. reflections and moment_lines -------------------------------------------
create table public.reflections (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  for_day date not null,
  nudge_id bigint references public.nudges (id) on delete restrict,
  source text not null check (source in ('typed', 'typed_no', 'log_command')),
  text text not null check (btrim(text) <> '' and char_length(text) <= 280),
  telegram_update_id bigint unique,
  created_at timestamptz not null default now()
);
create index reflections_by_parent_and_day on public.reflections (parent_id, for_day);
comment on table public.reflections is 'A line a parent wrote that is not a habit log (rule 5.4). Counts under Feelings logged, never toward targets. Add only.';
comment on column public.reflections.id is 'A number the database makes up.';
comment on column public.reflections.parent_id is 'Which parent.';
comment on column public.reflections.for_day is 'The Singapore day it was written (always today).';
comment on column public.reflections.nudge_id is 'The unchosen habit it matched, if any; empty for a family moment.';
comment on column public.reflections.source is 'typed (Claude matched no chosen habit), typed_no (the parent tapped No) or log_command (/log on an unchosen habit, then a line).';
comment on column public.reflections.text is 'The parent''s own words, up to 280 characters. May mention a child: never shown to Telemetry or sent to Claude with the name.';
comment on column public.reflections.telegram_update_id is 'Telegram''s message number; unique, so a resent message is saved once.';
comment on column public.reflections.created_at is 'When the row was added.';

create table public.moment_lines (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  week_starting date not null check (extract(isodow from week_starting) = 1),
  text text not null check (btrim(text) <> '' and char_length(text) <= 280),
  telegram_update_id bigint unique,
  created_at timestamptz not null default now(),
  unique (parent_id, week_starting)
);
comment on table public.moment_lines is 'The one line a parent saved as a moment from a Wrap Up (rule 7.7). One per week. Add only.';
comment on column public.moment_lines.id is 'A number the database makes up.';
comment on column public.moment_lines.parent_id is 'Which parent.';
comment on column public.moment_lines.week_starting is 'The Monday of the week the moment is for.';
comment on column public.moment_lines.text is 'The parent''s own words, up to 280 characters. Never sent to Claude; never shown to Telemetry.';
comment on column public.moment_lines.telegram_update_id is 'Telegram''s message number; unique, so a resent message is saved once.';
comment on column public.moment_lines.created_at is 'When the row was added.';

-- ---- 6. Helpers --------------------------------------------------------------
-- Read a window from the settings version, refusing if it is missing (rule 1.3).
create function public.setting_number(p_version bigint, p_key text) returns numeric
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare n numeric := (select (settings ->> p_key)::numeric from settings_versions where version = p_version);
begin
  if n is null then raise exception 'Settings version % has no % (src/settings.ts, SETTINGS_KEYS_THE_DATABASE_READS).', p_version, p_key; end if;
  return n;
end $$;
comment on function public.setting_number(bigint, text) is 'A number from a settings version, e.g. undo_window_seconds; refuses if missing (rules 1.3, 1.4).';

-- The parent's latest photo consent must be "agreed" (rule 5.5).
create function public.require_photo_consent(p_parent bigint) returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if coalesce((select answer from consents where parent_id = p_parent and topic = 'photos'
               order by created_at desc, id desc limit 1), 'missing') <> 'agreed' then
    raise exception 'No photo consent from this parent, so the photo can''t be saved.';
  end if;
end $$;
comment on function public.require_photo_consent(bigint) is 'Refuses unless the parent''s latest photo consent is agreed (rule 5.5).';

-- A moment can only be for the week of the parent's latest Wrap Up (rule 7.7).
create function public.require_moment_week(p_parent bigint, p_week date) returns void
language plpgsql stable security definer set search_path = public, pg_temp as $$
declare latest date := (select max(date_trunc('week', for_day::timestamp))::date
                        from messages_sent where parent_id = p_parent and kind = 'wrap_up');
begin
  if latest is null or p_week <> latest then
    raise exception 'A moment can only be saved for the week of the latest Wrap Up.';
  end if;
end $$;
comment on function public.require_moment_week(bigint, date) is 'Refuses a moment for any week but the parent''s latest Wrap Up week (rule 7.7).';

-- ---- 7. The all-or-nothing functions -----------------------------------------
-- Save a habit log (for today only) and its event. Returns the new log's
-- number, or nothing if this Telegram message was already saved (rule 8.6).
create function public.save_habit_log(p_parent bigint, p_nudge bigint, p_day date, p_from_message bigint, p_via text,
                                      p_description text, p_update bigint, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare l bigint;
begin
  if p_day <> sgt_today() then
    raise exception 'A log can only be for today (rule 5.4).';
  end if;
  insert into habit_logs (parent_id, nudge_id, for_day, from_message_id, logged_via, description, telegram_update_id)
  values (p_parent, p_nudge, p_day, p_from_message, p_via, p_description, p_update)
  on conflict (telegram_update_id) do nothing returning id into l;
  if l is null then return null; end if;
  perform write_event(p_parent, 'habit_logged', p_version, p_variants, p_update);
  return l;
end $$;

-- Add the photo to a log that is already saved, with its check result.
create function public.add_log_photo(p_parent bigint, p_log bigint, p_path text, p_check text, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare g record; p bigint;
begin
  select parent_id, undone_at into g from habit_logs where id = p_log;
  if g.parent_id is distinct from p_parent then raise exception 'That log does not belong to this parent.'; end if;
  if g.undone_at is not null then raise exception 'That log was undone, so it can''t take a photo.'; end if;
  perform require_photo_consent(p_parent);
  insert into photos (parent_id, log_id, storage_path, check_result) values (p_parent, p_log, p_path, p_check) returning id into p;
  perform write_event(p_parent, 'photo_added', p_version, p_variants);
  return p;
end $$;

-- Save the photo of a moment (never checked, B2 question 11).
create function public.add_moment_photo(p_parent bigint, p_week date, p_path text, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare p bigint;
begin
  perform require_moment_week(p_parent, p_week);
  perform require_photo_consent(p_parent);
  insert into photos (parent_id, moment_week, storage_path, check_result) values (p_parent, p_week, p_path, 'not_checked') returning id into p;
  perform write_event(p_parent, 'moment_saved', p_version, p_variants);
  return p;
end $$;

-- Save the line of a moment. Returns nothing if this Telegram message was already saved.
create function public.save_moment_line(p_parent bigint, p_week date, p_text text, p_update bigint, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare m bigint;
begin
  perform require_moment_week(p_parent, p_week);
  insert into moment_lines (parent_id, week_starting, text, telegram_update_id) values (p_parent, p_week, p_text, p_update)
  on conflict (telegram_update_id) do nothing returning id into m;
  if m is null then return null; end if;
  perform write_event(p_parent, 'moment_saved', p_version, p_variants, p_update);
  return m;
end $$;

-- Save a reflection, for today. Returns nothing if this Telegram message was already saved.
create function public.save_reflection(p_parent bigint, p_nudge bigint, p_source text, p_text text, p_update bigint,
                                       p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare r bigint;
begin
  insert into reflections (parent_id, for_day, nudge_id, source, text, telegram_update_id)
  values (p_parent, sgt_today(), p_nudge, p_source, p_text, p_update)
  on conflict (telegram_update_id) do nothing returning id into r;
  if r is null then return null; end if;
  perform write_event(p_parent, 'reflection_saved', p_version, p_variants, p_update);
  return r;
end $$;

-- Undo a keyboard log within its window (rule 5.8; rule 8.4 edits 5 and 7): the
-- log is kept and marked undone, its line is blanked and its photo row deleted
-- (even a checked one, owner, 11 Nov). The app removes the photo file first (rule 8.5).
create function public.undo_log(p_parent bigint, p_log bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare g record; window_seconds numeric := setting_number(p_version, 'undo_window_seconds');
begin
  select parent_id, logged_via, logged_at, undone_at into g from habit_logs where id = p_log;
  if g.parent_id is distinct from p_parent then raise exception 'That log does not belong to this parent.'; end if;
  if g.undone_at is not null then raise exception 'That log is already undone.'; end if;
  if g.logged_via <> 'keyboard' then raise exception 'Only a keyboard log can be undone (rule 5.8).'; end if;
  if now() > g.logged_at + make_interval(secs => window_seconds) then
    raise exception 'The Undo window has passed (rule 5.8).';
  end if;
  update habit_logs set undone_at = now(), description = null where id = p_log;
  delete from photos where log_id = p_log;
  perform write_event(p_parent, 'log_undone', p_version, p_variants);
end $$;

-- Delete one of the parent's photos (rule 8.4, edit 6). The app removes the
-- file from storage first (rule 8.5), so no copy is kept anywhere.
create function public.delete_photo(p_parent bigint, p_photo bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  delete from photos where id = p_photo and parent_id = p_parent;
  if not found then raise exception 'That photo does not belong to this parent.'; end if;
  perform write_event(p_parent, 'photo_deleted', p_version, p_variants);
end $$;

-- Record a message the bot sent, with its event (now also the connection question).
create or replace function public.record_message_sent(p_parent bigint, p_kind text, p_nudge bigint, p_example bigint, p_day date, p_slot integer,
                                                      p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare m bigint;
begin
  insert into messages_sent (parent_id, kind, nudge_id, example_id, for_day, slot_minute)
  values (p_parent, p_kind, p_nudge, p_example, p_day, p_slot) returning id into m;
  perform write_event(p_parent, case p_kind when 'nudge' then 'nudge_sent' when 'wrap_up' then 'wrap_up_sent'
                                            else 'connection_question_sent' end, p_version, p_variants);
  return m;
end $$;

-- Save the weekly connection answer: only if that week's question was sent, and
-- within its window (rule 5.6). Returns false if this parent already answered
-- this week (the first counts).
create or replace function public.save_connection_answer(p_parent bigint, p_week date, p_score integer, p_update bigint,
                                                         p_version bigint, p_variants jsonb)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare a bigint; asked timestamptz; window_hours numeric := setting_number(p_version, 'connection_answer_window_hours');
begin
  select sent_at into asked from messages_sent
  where parent_id = p_parent and kind = 'connection_question' and date_trunc('week', for_day::timestamp)::date = p_week;
  if asked is null then raise exception 'No connection question was sent to this parent that week.'; end if;
  if now() > asked + make_interval(hours => window_hours::integer) then
    raise exception 'This question has closed (rule 5.6).';
  end if;
  insert into connection_answers (parent_id, week_starting, score, telegram_update_id)
  values (p_parent, p_week, p_score, p_update)
  on conflict do nothing returning id into a;
  if a is null then return false; end if;
  perform write_event(p_parent, 'connection_answered', p_version, p_variants, p_update);
  return true;
end $$;

-- ---- 8. Telemetry views: no text, no storage paths, no Telegram IDs (rule 8.11) ----
create view public.telemetry_habit_logs with (security_invoker = true) as
  select id, parent_id, nudge_id, for_day, logged_at, from_message_id, logged_via, undone_at, created_at from public.habit_logs;
create view public.telemetry_photos with (security_invoker = true) as
  select id, parent_id, log_id, moment_week, check_result, created_at from public.photos;
create view public.telemetry_reflections with (security_invoker = true) as
  select id, parent_id, for_day, nudge_id, source, created_at from public.reflections;
create view public.telemetry_moment_lines with (security_invoker = true) as
  select id, parent_id, week_starting, created_at from public.moment_lines;

-- ---- 9. Lock down, then give our server only what it needs (rules 8.2, 8.4) ----
alter table public.photos enable row level security;
alter table public.reflections enable row level security;
alter table public.moment_lines enable row level security;
revoke all on public.photos, public.reflections, public.moment_lines,
  public.telemetry_habit_logs, public.telemetry_photos, public.telemetry_reflections, public.telemetry_moment_lines
  from public, anon, authenticated, service_role;
revoke all on function public.setting_number(bigint, text), public.require_photo_consent(bigint), public.require_moment_week(bigint, date),
  public.save_habit_log(bigint, bigint, date, bigint, text, text, bigint, bigint, jsonb),
  public.add_log_photo(bigint, bigint, text, text, bigint, jsonb), public.add_moment_photo(bigint, date, text, bigint, jsonb),
  public.save_moment_line(bigint, date, text, bigint, bigint, jsonb), public.save_reflection(bigint, bigint, text, text, bigint, bigint, jsonb),
  public.undo_log(bigint, bigint, bigint, jsonb), public.delete_photo(bigint, bigint, bigint, jsonb),
  public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb),
  public.save_connection_answer(bigint, date, integer, bigint, bigint, jsonb)
  from public, anon, authenticated, service_role;
-- Read the new tables (the app reads its own data); write them only through the functions.
grant select on public.photos, public.reflections, public.moment_lines to service_role;
grant execute on function
  public.save_habit_log(bigint, bigint, date, bigint, text, text, bigint, bigint, jsonb),
  public.add_log_photo(bigint, bigint, text, text, bigint, jsonb), public.add_moment_photo(bigint, date, text, bigint, jsonb),
  public.save_moment_line(bigint, date, text, bigint, bigint, jsonb), public.save_reflection(bigint, bigint, text, text, bigint, bigint, jsonb),
  public.undo_log(bigint, bigint, bigint, jsonb), public.delete_photo(bigint, bigint, bigint, jsonb),
  public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb),
  public.save_connection_answer(bigint, date, integer, bigint, bigint, jsonb)
  to service_role;
-- Telemetry reads the views (for now through our server's role).
grant select on public.telemetry_habit_logs, public.telemetry_photos, public.telemetry_reflections, public.telemetry_moment_lines to service_role;

commit;
