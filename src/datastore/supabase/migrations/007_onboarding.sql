-- =============================================================================
-- src/datastore/supabase/migrations/007_onboarding.sql: the database side of the full onboarding
--
-- What it does: [2026-11-12 SGT] everything the owner's onboarding decisions of
-- 12 Nov need from the database (src/telegram-bot/SPEC.md, "Recorded: group A
-- finished"), plus a fix for two taps at the same instant (docs/KNOWN-ISSUES.md):
--   1. A sign-up draft per person: answers are held here, not in the real
--      tables, until the person taps "I agree" (rule 8.13, Option A).
--   2. Invite holds: a code is held for one Telegram account at /start and used
--      only at the agreement; released if the sign-up is never finished (Q10a).
--   3. Children have a first name or nickname; the birth year starts empty;
--      at most 3 children per parent (rule 8.10, Q7b).
--   4. Finishing sign-up turns a draft into the parent, children, picks, times,
--      agreement and used invite, all or nothing.
--   5. The clean-up: after 7 quiet days a draft is cut down to its Telegram ID
--      and last step (the code is released and the stop counted with no ID);
--      after 90 days it is deleted completely (Q11a, 11d, 11e).
--   6. "Start right now" (screen 10): its own kind of sent message and log
--      source, its three events, and the fixed line for each quick behaviour.
--   7. One log per nudge message, and one Not today per parent per day, even
--      if two taps arrive at the same instant.
--   8. [2026-11-12 review fixes] "Delete my data" for a half-finished sign-up,
--      only the expected parts in a draft (size-capped), no two codes differing
--      only in capitals, and a clean-up that locks the rows it changes.
--
-- Why it is built this way: like a shop holding your order at the counter
-- until you pay, nothing personal reaches the real tables before the person
-- agrees; and every multi-step change happens in one all-or-nothing function.
-- The two time windows (7 and 90 days) are read from the settings version, so
-- the numbers live once, in src/settings.ts (rule 1.4).
--
-- How to apply: Supabase > SQL Editor > a fresh tab > paste this file > Run,
-- once, AFTER migration 006. After it has run on the real project, never edit
-- it (rule B1). It refuses to run if any child row already exists (children
-- had no name before), so nothing is guessed (rule 1.3).
-- Tested by: src/datastore/supabase/tests/datastore-tables.test.sql (T57 to T80, T9 rewritten).
-- =============================================================================

begin;

-- ---- 1. Event types for the new things that happen (rule 10.2) --------------
insert into public.event_types (name, meaning, metric) values
  ('start_now_shown',   'The bot showed "Start right now" at the end of sign-up (screen 10; not a nudge).', 'activation (1)'),
  ('start_now_done',    'A parent tapped "I''ve started!" on screen 10.',                                  'activation (1)'),
  ('start_now_not_now', 'A parent tapped "Not now" on screen 10.',                                         'activation (1)');

-- ---- 2. Invite holds (Q10a) --------------------------------------------------
alter table public.invites
  add column held_by_telegram_id bigint,
  add column held_at timestamptz,
  -- Held means both are filled in; free means both are empty.
  add constraint invites_hold_complete check ((held_by_telegram_id is null) = (held_at is null)),
  -- A used code is never held.
  add constraint invites_used_not_held check (used_at is null or held_by_telegram_id is null);
comment on column public.invites.held_by_telegram_id is 'The Telegram account this code is held for during sign-up (Q10a); empty when free or used. Cleared when the draft is cut down.';
comment on column public.invites.held_at is 'When the code was held at /start; empty when free or used.';
-- Codes are matched ignoring capitals and end spaces (Q10g), so two codes that
-- differ only in those are refused: one person's link could otherwise find the
-- other's code (review finding, 12 Nov).
create unique index invites_code_ignoring_case on public.invites (upper(btrim(code)));

-- ---- 3. The sign-up draft and the stop count (rule 8.13) ---------------------
create table public.sign_up_drafts (
  id bigint generated always as identity primary key,
  telegram_id bigint not null unique,
  invite_id bigint references public.invites (id) on delete set null,
  step text not null check (step ~ '^[a-z_]+$'),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  last_activity_at timestamptz not null default now(),
  cut_down_at timestamptz,
  created_at timestamptz not null default now(),
  -- A cut-down draft keeps only its Telegram ID and last step (rule 8.13).
  check (cut_down_at is null or (answers = '{}'::jsonb and invite_id is null))
);
comment on table public.sign_up_drafts is 'One person''s answers during sign-up, held until they agree (rule 8.13). Turned into the real records by finish_sign_up; cut down after 7 quiet days and deleted after 90 by clean_up_sign_ups.';
comment on column public.sign_up_drafts.id is 'A number the database makes up.';
comment on column public.sign_up_drafts.telegram_id is 'Who is signing up: their Telegram account. One draft per account.';
comment on column public.sign_up_drafts.invite_id is 'The invite held for them; empty once the draft is cut down.';
comment on column public.sign_up_drafts.step is 'The last sign-up step they reached, e.g. children or plan. Kept after the cut-down.';
comment on column public.sign_up_drafts.answers is 'Their answers so far: first_name, children, picks, slots. May hold a child''s name: never shown to Telemetry. Emptied at the cut-down.';
comment on column public.sign_up_drafts.last_activity_at is 'When they last answered; the 7-day and 90-day windows count from here.';
comment on column public.sign_up_drafts.cut_down_at is 'When the clean-up cut it down to the Telegram ID and last step; empty while active.';
comment on column public.sign_up_drafts.created_at is 'When the row was added.';

create table public.sign_up_stops (
  id bigint generated always as identity primary key,
  on_day date not null,
  last_step text not null check (last_step ~ '^[a-z_]+$'),
  created_at timestamptz not null default now()
);
comment on table public.sign_up_stops is 'One row per unfinished sign-up, counted at its 7-day cut-down, with no name or ID (Q11e): where people stop during onboarding.';
comment on column public.sign_up_stops.id is 'A number the database makes up.';
comment on column public.sign_up_stops.on_day is 'The Singapore day the sign-up was counted as stopped.';
comment on column public.sign_up_stops.last_step is 'The last step reached, e.g. children or plan.';
comment on column public.sign_up_stops.created_at is 'When the row was added.';

-- ---- 4. Children: a first name, an optional birth year, at most 3 (rule 8.10) --
do $$
begin
  if exists (select 1 from public.children) then
    raise exception 'Some children rows exist without a name: add their names by hand before running migration 007.';
  end if;
end $$;
alter table public.children
  add column first_name text not null check (btrim(first_name) <> ''),
  alter column birth_year drop not null;
comment on column public.children.first_name is 'The child''s first name or nickname, typed by the parent (rule 8.10). Never sent to Claude and never shown to Telemetry.';
comment on column public.children.birth_year is 'Year of birth, asked later in the engagement journey; empty until then (rule 8.10).';

create function public.guard_children_limit() returns trigger language plpgsql as $$
begin
  -- A correction (replaces_id) replaces a child, so it never adds one.
  if new.replaces_id is null and (
    select count(*) from public.children c
    where c.parent_id = new.parent_id
      and not exists (select 1 from public.children r where r.replaces_id = c.id)) >= 3 then
    raise exception 'A parent can have up to 3 children (Q7b).';
  end if;
  return new;
end $$;
create trigger children_up_to_three before insert on public.children for each row execute function public.guard_children_limit();

-- ---- 5. Start right now: its own message kind, log source and lines (Q3) -----
alter table public.messages_sent drop constraint messages_sent_kind_check;
alter table public.messages_sent drop constraint messages_sent_check;
alter table public.messages_sent add constraint messages_sent_kind_check
  check (kind in ('nudge', 'wrap_up', 'connection_question', 'start_now'));
-- A nudge names its nudge, example and slot; a start-now message names only its
-- behaviour (no example, no slot: it is not a nudge); the Sunday messages name none.
alter table public.messages_sent add constraint messages_sent_check
  check ((kind = 'nudge' and nudge_id is not null and example_id is not null and slot_minute is not null)
      or (kind = 'start_now' and nudge_id is not null and example_id is null and slot_minute is null)
      or (kind in ('wrap_up', 'connection_question') and nudge_id is null and example_id is null and slot_minute is null));
-- One start-now message per parent, ever (it is shown once, at sign-up).
create unique index messages_one_start_now on public.messages_sent (parent_id) where kind = 'start_now';
comment on column public.messages_sent.kind is 'nudge, wrap_up, connection_question or start_now (screen 10, not a nudge).';

alter table public.habit_logs drop constraint habit_logs_logged_via_check;
alter table public.habit_logs add constraint habit_logs_logged_via_check
  check (logged_via in ('done_button', 'keyboard', 'log_command', 'typed', 'start_now'));
-- An "I've started" log always names its start-now message.
alter table public.habit_logs add constraint habit_logs_start_now_names_message check (logged_via <> 'start_now' or from_message_id is not null);
-- One (not undone) log per bot message, even if two taps arrive at the same instant (known issue, 12 Nov).
create unique index habit_logs_one_per_message on public.habit_logs (from_message_id) where from_message_id is not null and undone_at is null;
comment on column public.habit_logs.logged_via is 'How it was logged: done_button, keyboard, log_command, typed or start_now (rules 5.1, Q3). Only keyboard logs can be undone (rule 5.8).';

-- A log points at a message the bot sent to the same parent: a start-now log at
-- the start-now message, every other log at a nudge.
create or replace function public.guard_log_message() returns trigger language plpgsql as $$
begin
  if new.from_message_id is not null and not exists (
    select 1 from public.messages_sent m
    where m.id = new.from_message_id and m.parent_id = new.parent_id
      and m.kind = case when new.logged_via = 'start_now' then 'start_now' else 'nudge' end) then
    raise exception 'A log can only point at a message of its own kind sent to the same parent.';
  end if;
  return new;
end $$;

-- The fixed "Start right now" line for each quick behaviour, kept as nudge rows
-- (CLAUDE.md rule 11); {child} is replaced by the child's name. Owner, 12 Nov.
alter table public.nudges add column start_now_line text check (start_now_line is null or btrim(start_now_line) <> '');
comment on column public.nudges.start_now_line is 'The fixed "Start right now" line shown at the end of sign-up (screen 10), quick behaviours only; {child} is replaced by one child''s name. Empty for deliberate behaviours.';
-- By name: the names are as first loaded (src/datastore/supabase/seed/nudges-first-load.csv).
update public.nudges set start_now_line = case name
  when 'Talking with children' then 'Start right now, and get on the scoreboard straight away by talking with {child}. Ask, "What made you laugh today?" and listen to the full answer.'
  when 'Showing affection'     then 'Start right now, and get on the scoreboard straight away by showing {child} some affection. Give {child} a hug!'
  when 'Descriptive praise'    then 'Start right now, and get on the scoreboard straight away by praising {child}. Tell {child} one thing they did well today, and say exactly what they did.'
  when 'Giving attention'      then 'Start right now, and get on the scoreboard straight away by giving {child} your full attention. Put down your phone and listen to {child} for one minute.'
  end
where category = 'quick' and name in ('Talking with children', 'Showing affection', 'Descriptive praise', 'Giving attention');

-- ---- 6. One Not today per parent per Singapore day (known issue, 12 Nov) -----
create unique index events_one_not_today_a_day on public.events (parent_id, ((occurred_at at time zone 'Asia/Singapore')::date))
  where event_type_id = 9;
do $$
begin
  -- The index above names the not_today type by its number: check it is the right one.
  if (select id from public.event_types where name = 'not_today') <> 9 then
    raise exception 'The not_today event type is not number 9: fix events_one_not_today_a_day.';
  end if;
end $$;

-- ---- 7. The sign-up functions ------------------------------------------------

-- /start with a code: hold the code and start (or carry on) this person's draft.
-- Returns the draft's number. Someone with an active draft carries on with it,
-- whatever link they used (Q10e, 10f).
create function public.start_sign_up(p_telegram_id bigint, p_first_name text, p_code text)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare draft bigint; was_cut_down boolean; inv bigint;
begin
  if exists (select 1 from parents where telegram_id = p_telegram_id) then
    raise exception 'This Telegram account has already signed up.';
  end if;
  select id, cut_down_at is not null into draft, was_cut_down from sign_up_drafts where telegram_id = p_telegram_id for update;
  if draft is not null and not was_cut_down then
    return draft;  -- carry on where they stopped (Q10e, 10f)
  end if;
  -- Codes match ignoring capitals and spaces at the ends (Q10g). "for update"
  -- holds the row, so two people can't take one code at the same moment.
  select id into inv from invites
  where upper(btrim(code)) = upper(btrim(p_code)) and used_at is null and held_by_telegram_id is null
  for update;
  if inv is null then raise exception 'This invite code is unknown, used or held for someone else.'; end if;
  update invites set held_by_telegram_id = p_telegram_id, held_at = now() where id = inv;
  if draft is not null then
    -- Coming back after a cut-down: start fresh with this link (T68).
    update sign_up_drafts set invite_id = inv, step = 'name', answers = jsonb_build_object('first_name', p_first_name),
                              last_activity_at = now(), cut_down_at = null
    where id = draft;
    return draft;
  end if;
  insert into sign_up_drafts (telegram_id, invite_id, step, answers)
  values (p_telegram_id, inv, 'name', jsonb_build_object('first_name', p_first_name)) returning id into draft;
  return draft;
end $$;
comment on function public.start_sign_up(bigint, text, text) is 'Sign-up starts: hold the invite for this Telegram account and start or carry on their draft (Q10a, 10e to 10g).';

-- Save the answers so far and the step reached. Refused if there is no active draft.
create function public.save_sign_up_step(p_telegram_id bigint, p_step text, p_answers jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  -- Only the four expected parts, and a size cap: before consent, the draft
  -- holds no more than sign-up needs (review finding, 12 Nov).
  if exists (select 1 from jsonb_object_keys(p_answers) k where k not in ('first_name', 'children', 'picks', 'slots')) then
    raise exception 'A sign-up draft holds only first_name, children, picks and slots.';
  end if;
  if octet_length(p_answers::text) > 4000 then
    raise exception 'These sign-up answers are too big (more than 4,000 bytes).';
  end if;
  update sign_up_drafts set step = p_step, answers = p_answers, last_activity_at = now()
  where telegram_id = p_telegram_id and cut_down_at is null;
  if not found then raise exception 'No sign-up in progress for this Telegram account.'; end if;
end $$;
comment on function public.save_sign_up_step(bigint, text, jsonb) is 'Save a sign-up step''s answers in the draft and note the step reached (rule 8.13).';

-- "I agree": turn the draft into the real records, all or nothing.
create function public.finish_sign_up(p_telegram_id bigint, p_cohort text, p_wrap_up_minute integer, p_wording_version text,
                                      p_update bigint, p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare d record; p bigint; a jsonb; c jsonb; k jsonb; sched text; quick int; deliberate int; n int;
begin
  select * into d from sign_up_drafts where telegram_id = p_telegram_id and cut_down_at is null for update;
  if not found then raise exception 'No sign-up in progress for this Telegram account.'; end if;
  a := d.answers;
  -- Children: 1 to 3, each with a name (Q7b, rule 8.10).
  n := coalesce(jsonb_array_length(a -> 'children'), 0);
  if n < 1 or n > 3 then raise exception 'A sign-up needs 1 to 3 children (Q7b).'; end if;
  -- Picks: up to 2 quick and 1 deliberate, at least 1 (rule 2.1).
  select count(*) filter (where nu.category = 'quick'), count(*) filter (where nu.category = 'deliberate')
    into quick, deliberate
  from jsonb_array_elements(coalesce(a -> 'picks', '[]'::jsonb)) x join nudges nu on nu.id = (x ->> 'nudge_id')::bigint;
  if quick + deliberate < 1 or quick > 2 or deliberate > 1
     or quick + deliberate <> coalesce(jsonb_array_length(a -> 'picks'), 0) then
    raise exception 'A sign-up needs up to 2 quick and 1 deliberate behaviour, at least 1 (rule 2.1).';
  end if;
  -- Times: 1 to 3 for each schedule (rule 3.1; the app also checks 1 hour apart).
  foreach sched in array array['school', 'non_school'] loop
    n := coalesce(jsonb_array_length(a -> 'slots' -> sched), 0);
    if n < 1 or n > 3 then raise exception 'Each schedule needs 1 to 3 times (rule 3.1).'; end if;
  end loop;

  insert into parents (telegram_id, first_name, cohort, wrap_up_minute)
  values (p_telegram_id, a ->> 'first_name', p_cohort, p_wrap_up_minute) returning id into p;
  for c in select * from jsonb_array_elements(a -> 'children') loop
    insert into children (parent_id, first_name) values (p, btrim(c #>> '{}'));
  end loop;
  for k in select * from jsonb_array_elements(a -> 'picks') loop
    insert into picks (parent_id, nudge_id, frequency) values (p, (k ->> 'nudge_id')::bigint, k ->> 'frequency');
    perform write_event(p, 'pick_chosen', p_version, p_variants);
  end loop;
  foreach sched in array array['school', 'non_school'] loop
    insert into slots (parent_id, schedule, start_minute)
    select p, sched, m::smallint from jsonb_array_elements_text(a -> 'slots' -> sched) m;
  end loop;
  insert into consents (parent_id, topic, answer, wording_version) values (p, 'recording', 'agreed', p_wording_version);
  update invites set used_by = p, used_at = now(), held_by_telegram_id = null, held_at = null where id = d.invite_id;
  if not found then raise exception 'The invite held for this sign-up is missing.'; end if;
  perform write_event(p, 'signed_up', p_version, p_variants, p_update);
  delete from sign_up_drafts where id = d.id;
  return p;
end $$;
comment on function public.finish_sign_up(bigint, text, integer, text, bigint, bigint, jsonb) is
  '"I agree": turn the draft into the parent, children, picks, times, recording agreement and used invite, all or nothing (rules 2.1, 3.1, 8.13, 11.9).';

-- The clean-up (run daily): cut down drafts quiet for 7 days, delete records quiet for 90 (Q11).
create function public.clean_up_sign_ups(p_version bigint)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare keep_days numeric := setting_number(p_version, 'sign_up_draft_keep_days');
        record_days numeric := setting_number(p_version, 'sign_up_stopped_keep_days');
begin
  -- One statement, rows locked first: a step saved at the same moment waits,
  -- then finds the draft cut down (review finding, 12 Nov).
  with quiet as (
    select id, step, invite_id from sign_up_drafts
    where cut_down_at is null and last_activity_at < now() - make_interval(days => keep_days::int)
    for update
  ), counted as (
    insert into sign_up_stops (on_day, last_step) select sgt_today(), step from quiet
  ), released as (
    update invites set held_by_telegram_id = null, held_at = null where id in (select invite_id from quiet)
  )
  update sign_up_drafts set answers = '{}'::jsonb, invite_id = null, cut_down_at = now() where id in (select id from quiet);
  delete from sign_up_drafts where last_activity_at < now() - make_interval(days => record_days::int);
end $$;
comment on function public.clean_up_sign_ups(bigint) is 'Cut down sign-up drafts quiet for 7 days (code released, stop counted with no ID) and delete those quiet for 90 (rule 8.13, Q11). The windows come from the settings version (rule 1.4).';

-- "Delete my data" for someone part-way through sign-up (rule 1.5): delete the
-- draft, release its code, and log the deletion with no name or ID.
create function public.delete_sign_up_draft(p_telegram_id bigint)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
declare inv bigint;
begin
  delete from sign_up_drafts where telegram_id = p_telegram_id returning invite_id into inv;
  if not found then raise exception 'No sign-up draft for this Telegram account.'; end if;
  update invites set held_by_telegram_id = null, held_at = null where id = inv;
  insert into deletion_log (on_day, how_many) values (sgt_today(), 1);
end $$;
comment on function public.delete_sign_up_draft(bigint) is '"Delete my data" for a half-finished sign-up: the draft goes, its code is released, the deletion is logged with no ID (rule 1.5).';

-- ---- 8. Start right now: recording the message, the log and Not now ---------
create or replace function public.record_message_sent(p_parent bigint, p_kind text, p_nudge bigint, p_example bigint, p_day date, p_slot integer,
                                                      p_version bigint, p_variants jsonb)
returns bigint language plpgsql security definer set search_path = public, pg_temp as $$
declare m bigint;
begin
  insert into messages_sent (parent_id, kind, nudge_id, example_id, for_day, slot_minute)
  values (p_parent, p_kind, p_nudge, p_example, p_day, p_slot) returning id into m;
  perform write_event(p_parent, case p_kind when 'nudge' then 'nudge_sent' when 'wrap_up' then 'wrap_up_sent'
                                            when 'start_now' then 'start_now_shown' else 'connection_question_sent' end,
                      p_version, p_variants);
  return m;
end $$;

-- Same as migration 005, plus the start_now_done event for an "I've started" log.
create or replace function public.save_habit_log(p_parent bigint, p_nudge bigint, p_day date, p_from_message bigint, p_via text,
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
  if p_via = 'start_now' then perform write_event(p_parent, 'start_now_done', p_version, p_variants); end if;
  return l;
end $$;

create function public.record_start_now_not_now(p_parent bigint, p_update bigint, p_version bigint, p_variants jsonb)
returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  perform write_event(p_parent, 'start_now_not_now', p_version, p_variants, p_update);
end $$;
comment on function public.record_start_now_not_now(bigint, bigint, bigint, jsonb) is 'A parent tapped "Not now" on screen 10 (Q3f).';

-- ---- 9. Permissions: locked, then only what our server needs (rules 8.2, 8.4) --
alter table public.sign_up_drafts enable row level security;
alter table public.sign_up_stops enable row level security;
revoke all on public.sign_up_drafts, public.sign_up_stops from public, anon, authenticated, service_role;
grant select on public.sign_up_drafts, public.sign_up_stops to service_role;
revoke all on function public.guard_children_limit() from public, anon, authenticated, service_role;
revoke all on function public.start_sign_up(bigint, text, text), public.save_sign_up_step(bigint, text, jsonb),
  public.finish_sign_up(bigint, text, integer, text, bigint, bigint, jsonb), public.clean_up_sign_ups(bigint),
  public.record_start_now_not_now(bigint, bigint, bigint, jsonb), public.delete_sign_up_draft(bigint)
  from public, anon, authenticated, service_role;
grant execute on function public.start_sign_up(bigint, text, text), public.save_sign_up_step(bigint, text, jsonb),
  public.finish_sign_up(bigint, text, integer, text, bigint, bigint, jsonb), public.clean_up_sign_ups(bigint),
  public.record_start_now_not_now(bigint, bigint, bigint, jsonb), public.delete_sign_up_draft(bigint)
  to service_role;
revoke all on all sequences in schema public from public, anon, authenticated;

commit;
