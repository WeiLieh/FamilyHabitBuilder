-- =============================================================================
-- src/datastore/supabase/migrations/003_create_datastore_tables.sql: the 14 Datastore tables
--
-- What it does: creates the tables agreed with the owner on 1 Nov 2026 (rules
-- 8.3 to 8.12 in src/datastore/SPEC.md): who each parent is, what happened, the
-- app's look-up settings, and housekeeping. It also creates the small
-- "all or nothing" functions the app uses for anything that touches more than
-- one table, and the Telemetry views that hide personal details.
--
-- Why it is built this way:
--   * Diaries are add-only (rule 8.4): our server may add rows but not edit or
--     delete them, except three narrow edits, each done through a function that
--     also writes an event.
--   * Deleting a parent deletes all their rows automatically (rule 8.5).
--   * The database blocks duplicates, for example a Telegram message that
--     Telegram resends (rule 8.6).
--   * The database checks structure only; tuneable numbers such as "3 a day"
--     stay in code, src/settings.ts (rules 1.4, 8.8).
--
-- How to apply: Supabase > SQL Editor > paste this file > Run, once. After it
-- has run on the real project, never edit it (rule B1): add 004 instead.
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql.
-- =============================================================================

-- ---- A helper: today's date in Singapore (rule 1.2) ------------------------
-- The database server runs in UTC, so "today" must be worked out for Singapore.
create function public.sgt_today() returns date
language sql stable as $$ select (now() at time zone 'Asia/Singapore')::date $$;
comment on function public.sgt_today() is 'Today''s date in Singapore time (rule 1.2).';

-- =============================================================================
-- App look up settings (nothing personal; kept when a parent is deleted)
-- =============================================================================

-- settings_versions: one row = one edition of everyone's everyday values (rule 11.1).
create table public.settings_versions (
  version bigint generated always as identity primary key,
  in_force_from timestamptz not null default now(),
  note text not null check (btrim(note) <> ''),
  settings jsonb not null check (jsonb_typeof(settings) = 'object'),
  -- A code made from the values. The same values always give the same code,
  -- so two copies of the app starting together can't both create a version.
  fingerprint text generated always as (md5(settings::text)) stored unique,
  created_at timestamptz not null default now()
);
comment on table public.settings_versions is 'One edition of everyone''s everyday values (Control). Add only; never edited (rule 11.1).';
comment on column public.settings_versions.version is 'Version number: 1, 2, 3... Every event is stamped with one (rule 11.2).';
comment on column public.settings_versions.in_force_from is 'When this version came into force.';
comment on column public.settings_versions.note is 'Plain-English note, from the pull request that changed the values.';
comment on column public.settings_versions.settings is 'Every value, as a labelled list of name and value pairs.';
comment on column public.settings_versions.fingerprint is 'A code made from the values; unique, so the same values are never saved twice.';
comment on column public.settings_versions.created_at is 'When the row was added.';

-- event_types: one row = one kind of event. A list, so events never use free text.
create table public.event_types (
  id smallint generated always as identity primary key,
  name text not null unique check (name ~ '^[a-z_]+$'),
  meaning text not null check (btrim(meaning) <> ''),
  metric text,
  created_at timestamptz not null default now()
);
comment on table public.event_types is 'The list of kinds of event. The owner adds rows through a reviewed script; the server only reads.';
comment on column public.event_types.id is 'A small number that events point to.';
comment on column public.event_types.name is 'Short name, e.g. nudge_sent.';
comment on column public.event_types.meaning is 'What the event means, in plain English.';
comment on column public.event_types.metric is 'Which of the 10 success metrics it feeds, if any.';
comment on column public.event_types.created_at is 'When the row was added.';

insert into public.event_types (name, meaning, metric) values
  ('signed_up',          'A parent joined using an invite.',                               'activation (1)'),
  ('pick_chosen',        'A parent chose a behaviour to work on.',                          'adoption (2)'),
  ('pick_stopped',       'A parent stopped working on a behaviour.',                        'adoption (2)'),
  ('slots_replaced',     'A parent changed their nudge times.',                             null),
  ('settings_changed',   'A parent changed paused or their Weekly Wrap Up settings.',       'mute/stop (9)'),
  ('nudge_sent',         'The bot sent a nudge message.',                                   'nudge-to-action (8)'),
  ('wrap_up_sent',       'The bot sent the Weekly Wrap Up (not a nudge, rule 10.2).',       null),
  ('habit_logged',       'A parent logged a behaviour.',                                    'several (3, 6, 7, 8)'),
  ('not_today',          'A parent tapped Not today on a nudge message.',                   'its own event (rule 10.1)'),
  ('muted',              'A parent paused the bot.',                                        'mute/stop (9)'),
  ('too_many_nudges',    'A parent tapped "too many nudges".',                              'mute/stop (9)'),
  ('connection_answered','A parent answered the weekly connection question.',               'connection rating (10)'),
  ('reward_given',       'The app gave a reward.',                                          null);

-- holiday_dates: one row = one school or public holiday (decides the schedule, rule 3.2).
create table public.holiday_dates (
  day date primary key,
  kind text not null check (kind in ('school_holiday', 'public_holiday')),
  name text not null check (btrim(name) <> ''),
  created_at timestamptz not null default now()
);
comment on table public.holiday_dates is 'Singapore school and public holidays. The owner uploads them before launch; the server only reads.';
comment on column public.holiday_dates.day is 'The Singapore date; each date appears once.';
comment on column public.holiday_dates.kind is 'school_holiday (MOE) or public_holiday.';
comment on column public.holiday_dates.name is 'For example Deepavali.';
comment on column public.holiday_dates.created_at is 'When the row was added.';

-- =============================================================================
-- About each parent (personal: deleted with the parent, rule 8.5)
-- =============================================================================

create table public.parents (
  id bigint generated always as identity primary key,
  telegram_id bigint not null unique,
  first_name text not null check (btrim(first_name) <> ''),
  signed_up_on date not null default public.sgt_today(),
  cohort text not null check (cohort ~ '^cohort-[0-9]+$'),
  paused boolean not null default false,
  wrap_up_on boolean not null default true,
  wrap_up_minute smallint not null default 1200 check (wrap_up_minute between 0 and 1439),
  created_at timestamptz not null default now()
);
comment on table public.parents is 'One parent. The server adds parents and changes only paused and the Wrap Up settings, through update_parent_settings (rule 8.4).';
comment on column public.parents.id is 'A number the database makes up; not the parent''s name.';
comment on column public.parents.telegram_id is 'How the bot finds the parent on Telegram; unique.';
comment on column public.parents.first_name is 'For friendly messages.';
comment on column public.parents.signed_up_on is 'Singapore date of sign-up; starts the 5-week count (rules 10.3, 11.11).';
comment on column public.parents.cohort is 'Neutral group label such as cohort-1, never a personal tie (rule 11.11).';
comment on column public.parents.paused is 'Paused (= muted): no nudge messages or Wrap Up.';
comment on column public.parents.wrap_up_on is 'Whether the Weekly Wrap Up is sent (rule 3.12); on by default.';
comment on column public.parents.wrap_up_minute is 'Wrap Up time as minutes after midnight; 1200 = 8:00pm. The allowed range is checked in code.';
comment on column public.parents.created_at is 'When the row was added.';

create table public.children (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  -- Structure only here; the 0 to 25 years range moves with time, so the
  -- saving code checks it (rule 8.10).
  birth_year smallint not null check (birth_year > 1900),
  replaces_id bigint references public.children (id) on delete cascade,
  created_at timestamptz not null default now()
);
comment on table public.children is 'Optional: one child of a parent, birth year only. No name, month or school (rule 8.10).';
comment on column public.children.id is 'A number the database makes up.';
comment on column public.children.parent_id is 'Which parent.';
comment on column public.children.birth_year is 'Year of birth; age is worked out to within one year.';
comment on column public.children.replaces_id is 'If the parent corrected an answer, the row this one replaces; the latest counts.';
comment on column public.children.created_at is 'When the parent told us.';

create table public.consents (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  topic text not null check (topic in ('recording', 'photos', 'experiments')),
  answer text not null check (answer in ('agreed', 'opted_out')),
  wording_version text not null check (btrim(wording_version) <> ''),
  created_at timestamptz not null default now()
);
comment on table public.consents is 'One answer a parent gave about permission. Add only; the latest per topic counts. Opting out of experiments lives here (rule 11.13).';
comment on column public.consents.id is 'A number the database makes up.';
comment on column public.consents.parent_id is 'Which parent.';
comment on column public.consents.topic is 'recording (rule 11.9), photos (rule 5.5) or experiments (opt-out).';
comment on column public.consents.answer is 'agreed or opted_out.';
comment on column public.consents.wording_version is 'Which version of the sentence the parent saw.';
comment on column public.consents.created_at is 'When the parent answered.';

create table public.picks (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  -- "restrict": a nudge someone has picked can't be deleted, only retired (rule 8.9).
  nudge_id bigint not null references public.nudges (id) on delete restrict,
  frequency text not null check (frequency ~ '^[a-z_0-9]+$'),
  chosen_at timestamptz not null default now(),
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  check (stopped_at is null or stopped_at >= chosen_at)
);
-- Only one current (not stopped) pick per parent per nudge (rule 8.6).
create unique index picks_one_current on public.picks (parent_id, nudge_id) where stopped_at is null;
comment on table public.picks is 'One behaviour a parent chose. Stopped picks stay as history (rule 8.4).';
comment on column public.picks.id is 'A number the database makes up.';
comment on column public.picks.parent_id is 'Which parent.';
comment on column public.picks.nudge_id is 'The nudge''s ID number (rule 8.9).';
comment on column public.picks.frequency is 'A plain name such as every_day or twice_a_week; the allowed names are checked in code.';
comment on column public.picks.chosen_at is 'When the parent chose it.';
comment on column public.picks.stopped_at is 'When the parent stopped it; empty while still chosen. Filled in once only.';
comment on column public.picks.created_at is 'When the row was added.';

create table public.slots (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  schedule text not null check (schedule in ('school', 'non_school')),
  start_minute smallint not null check (start_minute between 0 and 1439),
  created_at timestamptz not null default now(),
  unique (parent_id, schedule, start_minute)
);
comment on table public.slots is 'One nudge time. Replaced as a set through replace_slots, which also writes an event (rule 8.4).';
comment on column public.slots.id is 'A number the database makes up.';
comment on column public.slots.parent_id is 'Which parent.';
comment on column public.slots.schedule is 'school (school days) or non_school (weekends and holidays).';
comment on column public.slots.start_minute is 'Start as minutes after midnight; 1140 = 7:00pm. The allowed times are checked in code.';
comment on column public.slots.created_at is 'When the row was added.';

-- =============================================================================
-- What happened (personal, add-only diaries)
-- =============================================================================

create table public.messages_sent (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  kind text not null check (kind in ('nudge', 'wrap_up')),
  nudge_id bigint references public.nudges (id) on delete restrict,
  example_id bigint references public.examples (id) on delete restrict,
  for_day date not null,
  slot_minute smallint check (slot_minute between 0 and 1439),
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  -- A nudge message names its nudge, example and slot; a Wrap Up names none.
  check ((kind = 'nudge' and nudge_id is not null and example_id is not null and slot_minute is not null)
      or (kind = 'wrap_up' and nudge_id is null and example_id is null and slot_minute is null))
);
-- One nudge message per parent, day and slot, even if two scheduler runs overlap (rule 8.6).
create unique index messages_one_per_slot on public.messages_sent (parent_id, for_day, slot_minute) where kind = 'nudge';
-- One Weekly Wrap Up per parent per Monday-to-Sunday week (rules 3.12, 8.6).
create unique index messages_one_wrap_up_a_week on public.messages_sent (parent_id, (date_trunc('week', for_day::timestamp))) where kind = 'wrap_up';
create index messages_by_parent_and_time on public.messages_sent (parent_id, sent_at);
comment on table public.messages_sent is 'One message the bot started: a nudge message or the Weekly Wrap Up. Add only.';
comment on column public.messages_sent.id is 'A number the database makes up.';
comment on column public.messages_sent.parent_id is 'Which parent.';
comment on column public.messages_sent.kind is 'nudge or wrap_up.';
comment on column public.messages_sent.nudge_id is 'Which nudge (nudge messages only).';
comment on column public.messages_sent.example_id is 'Which example idea was used (rule 3.13; nudge messages only).';
comment on column public.messages_sent.for_day is 'The Singapore day it was sent for.';
comment on column public.messages_sent.slot_minute is 'The slot it was sent in (nudge messages only).';
comment on column public.messages_sent.sent_at is 'When it was sent.';
comment on column public.messages_sent.created_at is 'When the row was added.';

create table public.habit_logs (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  nudge_id bigint not null references public.nudges (id) on delete restrict,
  for_day date not null,
  logged_at timestamptz not null default now(),
  from_message_id bigint references public.messages_sent (id) on delete cascade,
  description text check (char_length(description) <= 280),
  photo_path text,
  photo_check text not null check (photo_check in ('passed', 'failed', 'none')),
  recorded_as text not null check (recorded_as in ('photo_verified', 'self_reported')),
  telegram_update_id bigint unique,
  created_at timestamptz not null default now(),
  -- A photo goes with a check result, and no photo means "none".
  check ((photo_path is null) = (photo_check = 'none')),
  -- Only a passed photo can make a log photo-verified; a failed one is kept,
  -- but the log is self-reported (rules 1.3, 6.2).
  check (recorded_as = 'self_reported' or photo_check = 'passed')
);
create index habit_logs_by_parent_and_day on public.habit_logs (parent_id, for_day);
comment on table public.habit_logs is 'A parent says "I did it". Add only. "Counts for which week" is worked out in code (src/variable-rewards/week.ts).';
comment on column public.habit_logs.id is 'A number the database makes up.';
comment on column public.habit_logs.parent_id is 'Which parent.';
comment on column public.habit_logs.nudge_id is 'Which behaviour.';
comment on column public.habit_logs.for_day is 'The Singapore day it was done: today or yesterday only (rule 5.4).';
comment on column public.habit_logs.logged_at is 'When the parent told us.';
comment on column public.habit_logs.from_message_id is 'The nudge message the Done tap came from; empty means not from a tap.';
comment on column public.habit_logs.description is 'Optional note, up to 280 characters. Free text: may mention a child, so never shown to Telemetry.';
comment on column public.habit_logs.photo_path is 'Link to the photo in storage, if any. Kept even if the check failed (rule 6.2).';
comment on column public.habit_logs.photo_check is 'passed, failed or none (no photo).';
comment on column public.habit_logs.recorded_as is 'photo_verified or self_reported.';
comment on column public.habit_logs.telegram_update_id is 'Telegram''s message number; unique, so a resent message is saved once.';
comment on column public.habit_logs.created_at is 'When the row was added.';

create table public.connection_answers (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  week_starting date not null check (extract(isodow from week_starting) = 1),
  score smallint not null check (score between 1 and 5),
  telegram_update_id bigint unique,
  created_at timestamptz not null default now(),
  unique (parent_id, week_starting)
);
comment on table public.connection_answers is 'A parent''s weekly 1 to 5 answer to "How connected did you feel with your child?" (metric 10). One per week; the first counts (rule 5.6).';
comment on column public.connection_answers.id is 'A number the database makes up.';
comment on column public.connection_answers.parent_id is 'Which parent.';
comment on column public.connection_answers.week_starting is 'The Monday of the week answered.';
comment on column public.connection_answers.score is '1 to 5.';
comment on column public.connection_answers.telegram_update_id is 'Telegram''s message number; unique.';
comment on column public.connection_answers.created_at is 'When the parent answered.';

create table public.events (
  id bigint generated always as identity primary key,
  parent_id bigint not null references public.parents (id) on delete cascade,
  event_type_id smallint not null references public.event_types (id),
  occurred_at timestamptz not null default now(),
  settings_version bigint not null references public.settings_versions (version),
  -- The experiment stamp: a non-empty list, ["baseline"] in week one (rules 11.2, 11.3).
  variants jsonb not null check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) > 0),
  telegram_update_id bigint unique,
  created_at timestamptz not null default now()
);
create index events_by_type_and_time on public.events (event_type_id, occurred_at);
create index events_by_parent_and_time on public.events (parent_id, occurred_at);
comment on table public.events is 'Anything that happened, for Telemetry. Add only. Every row is stamped with the settings version and experiment groups (rule 11.2).';
comment on column public.events.id is 'A number the database makes up.';
comment on column public.events.parent_id is 'Which parent.';
comment on column public.events.event_type_id is 'What happened, from the event_types list.';
comment on column public.events.occurred_at is 'When it happened.';
comment on column public.events.settings_version is 'The settings version in force; never empty.';
comment on column public.events.variants is 'Experiment groups the parent was in, e.g. ["style-test-1:test"]; ["baseline"] in week one; never empty.';
comment on column public.events.telegram_update_id is 'Telegram''s message number when the event came from Telegram; unique.';
comment on column public.events.created_at is 'When the row was added.';

-- =============================================================================
-- Housekeeping
-- =============================================================================

create table public.invites (
  id bigint generated always as identity primary key,
  code text not null unique check (btrim(code) <> ''),
  -- Cleared (not deleted) if that parent deletes their data, so the code stays used.
  used_by bigint references public.parents (id) on delete set null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
comment on table public.invites is 'One invitation code (rule 1.1, invite-only). Each code works once.';
comment on column public.invites.id is 'A number the database makes up.';
comment on column public.invites.code is 'The code the owner gives out; unique.';
comment on column public.invites.used_by is 'The parent who used it; cleared if they delete their data.';
comment on column public.invites.used_at is 'When it was used; empty while unused.';
comment on column public.invites.created_at is 'When the owner created it.';

create table public.deletion_log (
  id bigint generated always as identity primary key,
  on_day date not null,
  how_many integer not null check (how_many > 0),
  created_at timestamptz not null default now()
);
comment on table public.deletion_log is 'Proof that "delete my data" happened, with no name or ID (rule 1.5). Only delete_my_data writes here.';
comment on column public.deletion_log.id is 'A number the database makes up; not a parent ID.';
comment on column public.deletion_log.on_day is 'The Singapore day of the deletion.';
comment on column public.deletion_log.how_many is 'How many parents were deleted.';
comment on column public.deletion_log.created_at is 'When the row was added.';

-- =============================================================================
-- Rule guards that a simple column check can't express
-- =============================================================================

-- A pick's "stopped at" can be filled in once; nothing else about a pick changes.
create function public.guard_pick_update() returns trigger language plpgsql as $$
begin
  if old.stopped_at is not null then
    raise exception 'This pick is already stopped; it can''t be changed.';
  end if;
  if (new.parent_id, new.nudge_id, new.frequency, new.chosen_at) is distinct from (old.parent_id, old.nudge_id, old.frequency, old.chosen_at) then
    raise exception 'Only "stopped at" can be filled in on a pick.';
  end if;
  return new;
end $$;
create trigger picks_stop_once before update on public.picks for each row execute function public.guard_pick_update();

-- A log after a Done tap must point at a nudge message sent to the same parent.
create function public.guard_log_message() returns trigger language plpgsql as $$
begin
  if new.from_message_id is not null and not exists (
    select 1 from public.messages_sent m
    where m.id = new.from_message_id and m.parent_id = new.parent_id and m.kind = 'nudge') then
    raise exception 'A log can only point at a nudge message sent to the same parent.';
  end if;
  return new;
end $$;
create trigger habit_logs_same_parent before insert on public.habit_logs for each row execute function public.guard_log_message();

-- =============================================================================
-- All-or-nothing functions (rule 8.7). Each runs as one step: if any part
-- fails, nothing is saved. They run with the owner's rights ("security
-- definer"), so the server can do these exact things and nothing more.
-- =============================================================================

-- Write one event with its stamp. Used inside the functions below.
create function public.write_event(p_parent bigint, p_type text, p_version bigint, p_variants jsonb, p_update bigint default null)
returns void language plpgsql security definer set search_path = public as $$
declare t smallint := (select id from event_types where name = p_type);
begin
  if t is null then raise exception 'Unknown event type %', p_type; end if;
  insert into events (parent_id, event_type_id, settings_version, variants, telegram_update_id)
  values (p_parent, t, p_version, p_variants, p_update);
end $$;

-- Save a new settings version, or return the existing one if the values are the same.
create function public.record_settings_version(p_note text, p_settings jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare v bigint;
begin
  -- Look first, so version numbers stay 1, 2, 3 without gaps.
  select version into v from settings_versions where fingerprint = md5(p_settings::text);
  if v is not null then return v; end if;
  -- New values: add them. If another copy of the app added the same values a
  -- moment ago, "do nothing" and use that version instead.
  insert into settings_versions (note, settings) values (p_note, p_settings)
  on conflict (fingerprint) do nothing returning version into v;
  if v is null then
    select version into v from settings_versions where fingerprint = md5(p_settings::text);
  end if;
  return v;
end $$;

-- Change a parent's paused and Wrap Up settings (narrow edit 1), with an event.
create function public.update_parent_settings(p_parent bigint, p_paused boolean, p_wrap_up_on boolean, p_wrap_up_minute integer,
                                              p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  update parents set paused = p_paused, wrap_up_on = p_wrap_up_on, wrap_up_minute = p_wrap_up_minute where id = p_parent;
  if not found then raise exception 'No parent %', p_parent; end if;
  perform write_event(p_parent, 'settings_changed', p_version, p_variants);
end $$;

-- Stop a pick (narrow edit 2), with an event.
create function public.stop_pick(p_pick bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare who bigint;
begin
  update picks set stopped_at = now() where id = p_pick returning parent_id into who;
  if who is null then raise exception 'No pick %', p_pick; end if;
  perform write_event(who, 'pick_stopped', p_version, p_variants);
end $$;

-- Replace a parent's slots on one schedule (narrow edit 3), with an event.
create function public.replace_slots(p_parent bigint, p_schedule text, p_minutes integer[], p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from slots where parent_id = p_parent and schedule = p_schedule;
  insert into slots (parent_id, schedule, start_minute) select p_parent, p_schedule, unnest(p_minutes);
  perform write_event(p_parent, 'slots_replaced', p_version, p_variants);
end $$;

-- Record a message the bot sent, with its event.
create function public.record_message_sent(p_parent bigint, p_kind text, p_nudge bigint, p_example bigint, p_day date, p_slot integer,
                                           p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare m bigint;
begin
  insert into messages_sent (parent_id, kind, nudge_id, example_id, for_day, slot_minute)
  values (p_parent, p_kind, p_nudge, p_example, p_day, p_slot) returning id into m;
  perform write_event(p_parent, case p_kind when 'nudge' then 'nudge_sent' else 'wrap_up_sent' end, p_version, p_variants);
  return m;
end $$;

-- Save a habit log and its event. Returns the new log's number, or nothing if
-- this Telegram message was already saved (Telegram resends, rule 8.6).
create function public.save_habit_log(p_parent bigint, p_nudge bigint, p_day date, p_from_message bigint, p_description text,
                                      p_photo_path text, p_photo_check text, p_recorded_as text, p_update bigint,
                                      p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public as $$
declare l bigint;
begin
  if p_day not in (sgt_today(), sgt_today() - 1) then
    raise exception 'A log can only be for today or yesterday (rule 5.4).';
  end if;
  insert into habit_logs (parent_id, nudge_id, for_day, from_message_id, description, photo_path, photo_check, recorded_as, telegram_update_id)
  values (p_parent, p_nudge, p_day, p_from_message, p_description, p_photo_path, p_photo_check, p_recorded_as, p_update)
  on conflict (telegram_update_id) do nothing returning id into l;
  if l is null then return null; end if;
  perform write_event(p_parent, 'habit_logged', p_version, p_variants, p_update);
  return l;
end $$;

-- Save the weekly connection answer. Returns true if saved, false if this
-- parent already answered this week (the first counts, rule 5.6).
create function public.save_connection_answer(p_parent bigint, p_week date, p_score integer, p_update bigint,
                                              p_version bigint, p_variants jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare a bigint;
begin
  insert into connection_answers (parent_id, week_starting, score, telegram_update_id)
  values (p_parent, p_week, p_score, p_update)
  on conflict do nothing returning id into a;
  if a is null then return false; end if;
  perform write_event(p_parent, 'connection_answered', p_version, p_variants, p_update);
  return true;
end $$;

-- Mark an invite as used. Each code works once.
create function public.use_invite(p_code text, p_parent bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  update invites set used_by = p_parent, used_at = now() where code = p_code and used_at is null;
  if not found then raise exception 'This invite code is unknown or already used.'; end if;
end $$;

-- "Delete my data" (rule 1.5): remove the parent and, through the links, every
-- one of their rows; then write one deletion-log row with no name or ID. The
-- app deletes photos and chat memory first (rule 8.5).
create function public.delete_my_data(p_parent bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from parents where id = p_parent;
  if not found then raise exception 'No parent %', p_parent; end if;
  insert into deletion_log (on_day, how_many) values (sgt_today(), 1);
end $$;

-- =============================================================================
-- Telemetry views: no names, Telegram IDs, descriptions or photo links (rule 8.11)
-- =============================================================================
create view public.telemetry_parents with (security_invoker = true) as
  select id, signed_up_on, cohort, paused, wrap_up_on, wrap_up_minute, created_at from public.parents;
create view public.telemetry_children with (security_invoker = true) as
  select id, parent_id, birth_year, replaces_id, created_at from public.children;
create view public.telemetry_habit_logs with (security_invoker = true) as
  select id, parent_id, nudge_id, for_day, logged_at, from_message_id, photo_check, recorded_as, created_at from public.habit_logs;
create view public.telemetry_events with (security_invoker = true) as
  select id, parent_id, event_type_id, occurred_at, settings_version, variants, created_at from public.events;
create view public.telemetry_connection_answers with (security_invoker = true) as
  select id, parent_id, week_starting, score, created_at from public.connection_answers;

-- =============================================================================
-- Permissions: lock everything, then give back only what is needed (rules 8.2, 8.4)
-- =============================================================================
alter table public.parents enable row level security;
alter table public.children enable row level security;
alter table public.consents enable row level security;
alter table public.picks enable row level security;
alter table public.slots enable row level security;
alter table public.habit_logs enable row level security;
alter table public.messages_sent enable row level security;
alter table public.connection_answers enable row level security;
alter table public.events enable row level security;
alter table public.settings_versions enable row level security;
alter table public.event_types enable row level security;
alter table public.holiday_dates enable row level security;
alter table public.invites enable row level security;
alter table public.deletion_log enable row level security;

-- Take everything away from everyone (Supabase gives new tables and functions wide defaults)...
revoke all on public.parents, public.children, public.consents, public.picks, public.slots, public.habit_logs,
  public.messages_sent, public.connection_answers, public.events, public.settings_versions, public.event_types,
  public.holiday_dates, public.invites, public.deletion_log,
  public.telemetry_parents, public.telemetry_children, public.telemetry_habit_logs, public.telemetry_events,
  public.telemetry_connection_answers
  from public, anon, authenticated, service_role;
revoke all on function public.sgt_today(), public.write_event(bigint, text, bigint, jsonb, bigint),
  public.record_settings_version(text, jsonb), public.update_parent_settings(bigint, boolean, boolean, integer, bigint, jsonb),
  public.stop_pick(bigint, bigint, jsonb), public.replace_slots(bigint, text, integer[], bigint, jsonb),
  public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb),
  public.save_habit_log(bigint, bigint, date, bigint, text, text, text, text, bigint, bigint, jsonb),
  public.save_connection_answer(bigint, date, integer, bigint, bigint, jsonb),
  public.use_invite(text, bigint), public.delete_my_data(bigint),
  public.guard_pick_update(), public.guard_log_message()
  from public, anon, authenticated, service_role;

-- ...then give our server only what the app needs.
-- Read every table (the app reads its own data).
grant select on public.parents, public.children, public.consents, public.picks, public.slots, public.habit_logs,
  public.messages_sent, public.connection_answers, public.events, public.settings_versions, public.event_types,
  public.holiday_dates, public.invites, public.deletion_log to service_role;
-- Add rows directly only where one table is touched and nothing else must happen with it.
grant insert on public.parents, public.children, public.consents, public.picks, public.events to service_role;
-- Everything else goes through the all-or-nothing functions.
grant execute on function public.sgt_today(),
  public.record_settings_version(text, jsonb), public.update_parent_settings(bigint, boolean, boolean, integer, bigint, jsonb),
  public.stop_pick(bigint, bigint, jsonb), public.replace_slots(bigint, text, integer[], bigint, jsonb),
  public.record_message_sent(bigint, text, bigint, bigint, date, integer, bigint, jsonb),
  public.save_habit_log(bigint, bigint, date, bigint, text, text, text, text, bigint, bigint, jsonb),
  public.save_connection_answer(bigint, date, integer, bigint, bigint, jsonb),
  public.use_invite(text, bigint), public.delete_my_data(bigint)
  to service_role;
-- Telemetry reads the views (for now through our server's role).
grant select on public.telemetry_parents, public.telemetry_children, public.telemetry_habit_logs, public.telemetry_events,
  public.telemetry_connection_answers to service_role;

-- Row level security is on with no policies, which blocks the public API. Our
-- server's role skips row level security in Supabase, so the permissions above
-- are what limit it; the tests check them.
